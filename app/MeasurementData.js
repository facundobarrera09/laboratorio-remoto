class MeasurementData {
    constructor(voltageArray, intensityArray) {
        this.size = (voltageArray.length > intensityArray.length) ? voltageArray.length : intensityArray.length;
        this.voltage = voltageArray;
        this.intensity = intensityArray;
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