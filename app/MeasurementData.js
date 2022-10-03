class MeasurementData {
    constructor(voltageArray, intensityArray) {
        this.size = (voltageArray.length > intensityArray.length) ? voltageArray.length : intensityArray.length;
        this.voltage = voltageArray;
        this.intensity = intensityArray;
        this.phaseShift = this.calculatePhaseShift(voltageArray, intensityArray);
    }

    calculatePhaseShift(voltage, intensity) {
        let phaseShift = [];

        for (let k = 0; k < voltage.length; k++) {
            let sum = [];

            for (let i = 0; i < (voltage.length-1-k); i++) {
                sum[i] = intensity[k+i] * voltage[i];
            }

            phaseShift[k] = sum.reduce((prev, curr) => prev + curr, 0);
        }

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