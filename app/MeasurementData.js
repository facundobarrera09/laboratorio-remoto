class MeasurementData {
    constructor(voltageArray, intensityArray) {
        this.size = (voltageArray.length > intensityArray.length) ? voltageArray.length : intensityArray.length;
        this.voltage = voltageArray;
        this.intensity = intensityArray;
        this.phaseShift = this.calculatePhaseShift(voltageArray, intensityArray);
    }

    calculatePhaseShift(voltage, intensity) {
        let maxValues = { number: 0, max: [0, 0], maxPos: [0, 0] };
        let phaseShift = {
            values: [],
            angle: 0
        };

        let increasing = false, wasIncreasing = false;
        for (let k = 0; k < voltage.length; k++) {
            let sum = [];

            for (let i = 0; i < (voltage.length-1-k); i++) {
                sum[i] = intensity[k+i] * voltage[i];
            }

            phaseShift.values[k] = sum.reduce((prev, curr) => prev + curr, 0);
            phaseShift.values[k] /= 20000;

            wasIncreasing = increasing;
            if (k != 0) increasing = (phaseShift.values[k] > phaseShift.values[k-1]) 

            if (maxValues.number < 2) {
                if (increasing && maxValues.max[maxValues.number] < phaseShift.values[k]) {
                    maxValues.max[maxValues.number] = phaseShift.values[k];
                    maxValues.maxPos[maxValues.number] = k;
                }
                if (wasIncreasing && !increasing) maxValues.number++;
            }
        }

        let max1 = maxValues.maxPos[0];
        let max2 = maxValues.maxPos[1];
        phaseShift.angle = parseFloat(((max1/(max2-max1))*360).toFixed(2));
        // console.log(`max1=${max1}, max2=${max2}`);
        // console.log('angle: ', phaseShift.angle);

        return phaseShift;
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