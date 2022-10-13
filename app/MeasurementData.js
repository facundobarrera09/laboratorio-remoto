const config = require('config');

class MeasurementData {
    constructor(voltageArray, intensityArray) {
        this.size = (voltageArray.length > intensityArray.length) ? voltageArray.length : intensityArray.length;
        this.voltage = voltageArray;
        this.intensity = intensityArray;
        this.phaseShift = this.calculatePhaseShift(voltageArray, intensityArray);
    }

    // calculatePhaseShift(voltage, intensity) {
    //     let maxValues = { number: 0, max: [0, 0], maxPos: [0, 0] };
    //     let phaseShift = {
    //         values: [],
    //         angle: 0
    //     };

    //     let increasing = false, wasIncreasing = false;
    //     for (let k = 0; k < voltage.length; k++) {
    //         let sum = [];

    //         for (let i = 0; i < (voltage.length-1-k); i++) {
    //             sum[i] = intensity[k+i] * voltage[i];
    //         }

    //         phaseShift.values[k] = sum.reduce((prev, curr) => prev + curr, 0);
    //         phaseShift.values[k] /= 20000;

    //         wasIncreasing = increasing;
    //         if (k != 0) increasing = (phaseShift.values[k] > phaseShift.values[k-1]) 

    //         if (maxValues.number < 2) {
    //             if (increasing && maxValues.max[maxValues.number] < phaseShift.values[k]) {
    //                 maxValues.max[maxValues.number] = phaseShift.values[k];
    //                 maxValues.maxPos[maxValues.number] = k;
    //             }
    //             if (wasIncreasing && !increasing) maxValues.number++;
    //         }
    //     }

    //     let max1 = maxValues.maxPos[0];
    //     let max2 = maxValues.maxPos[1];
    //     phaseShift.angle = parseFloat(((max1/(max2-max1))*360).toFixed(2));
    //     console.log(`max1=${max1}, max2=${max2}`);
    //     console.log('angle: ', phaseShift.angle);

    //     return phaseShift;
    // }

    calculatePhaseShift(voltage, current) {
        let phaseShift;

        let voltagePeaks = this.calculatePeaks(voltage).maxPos;
        let currentPeaks = this.calculatePeaks(current).maxPos;

        let peakDistances = [];
        let averageDistance;

        for (let x = 0; x < ((voltagePeaks.length < currentPeaks.length) ? voltagePeaks.length : currentPeaks.length); x++) {
            peakDistances[x] = voltagePeaks[x] - currentPeaks[x];
        }

        averageDistance = (peakDistances.reduce((prev, curr) => prev + curr, 0)) / peakDistances.length;

        phaseShift = (averageDistance * 90) / 50; // convert from distance to degrees (50 positions equals 90°)
        
        // console.log('volt: ', voltagePeaks);
        // console.log('curr: ',currentPeaks);
        // console.log(peakDistances);
        // console.log(averageDistance);
        // console.log(phaseShift);
        // if (averageDistance < 0) console.log(averageDistance + 180);
        
        return phaseShift;
    }

    // calculatePeaks(array) {
    //     const noise = config.get('Measurements.noise');
    //     let maxValues = { number: 0, max: [0], maxPos: [0] };

    //     let increasing = false, wasIncreasing = false;
    //     for (let k = 5; k < array.length; k++) {
    //         wasIncreasing = increasing;

    //         if (k > 5) increasing =  ( array[k] > (array[k-1] - (noise)) && (array[k] > array[k-5]));
            
    //         // if (k > 5) console.log('k=', array[k],', k-1=', array[k-1], ', k-5=', array[k-5], ', condition1= ', (array[k] > (array[k-1] - (noise))),', condition2= ',(array[k] > array[k-5]));
    //         // if (!wasIncreasing && increasing) console.log('INCREASING');
    //         // if (wasIncreasing && !increasing) console.log('DECREASING. done');

    //         if (increasing && maxValues.max[maxValues.number] < array[k]) {
    //             maxValues.max[maxValues.number] = array[k];
    //             maxValues.maxPos[maxValues.number] = k;
    //             // console.log('max=',array[k],', k=',k);
    //         }

    //         if (wasIncreasing && !increasing) {
    //             if (maxValues.max[maxValues.number] > 80) {
    //                 maxValues.number++;
    //                 maxValues.max[maxValues.number] = 0;
    //             }
    //         }
    //     }

    //     // console.log(maxValues);

    //     // Remove false values
    //     for (let x = 0; x < maxValues.maxPos.length; x++) {
    //         if (maxValues.max[x] == 0) {
    //             maxValues.max.splice(x);
    //             maxValues.maxPos.splice(x);
    //         }
    //         if (x > 0 && (maxValues.maxPos[x] - maxValues.maxPos[x-1]) < 20) {
    //             maxValues.max.splice(x);
    //             maxValues.maxPos.splice(x);
    //         }
    //     }

    //     // console.log(maxValues);

    //     // throw 'e';
    //     return maxValues;
    // }

    calculatePeaks(array) {
        let maxValues = { number: 0, max: [0], maxPos: [0] };

        let isPositive = false, wasPositive = false;
        for (let x = 0; x < array.length; x++) {
            wasPositive = isPositive;
            if (array[x] > 0) {
                isPositive = true;
                if (array[x] > maxValues.max[maxValues.number]) {
                    maxValues.max[maxValues.number] = array[x];
                    maxValues.maxPos[maxValues.number] = x;
                }
            }
            else {
                isPositive = false;
                if (wasPositive && !isPositive) {
                    maxValues.number++;
                    maxValues.max[maxValues.number] = 0;
                }
            }
        }

        // Remove false values
        for (let x = 0; x < maxValues.maxPos.length; x++) {
            if (maxValues.max[x] < 50) {
                maxValues.max.splice(x, 1);
                maxValues.maxPos.splice(x, 1);
                x--;
            }
        }

        return maxValues;
    }

    get getSize() {
        return this.size;
    }
    get getVoltage() {
        return this.voltage;
    }
    get getIntensity() {
        return this.intensity;
    }
}

exports.MeasurementData = MeasurementData;