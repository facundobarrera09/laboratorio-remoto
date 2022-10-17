const { EventEmitter } = require('node:events');
const { MeasurementData } = require('./MeasurementData');

class DataManager {
    constructor() {
        this.dataAccumulator = [];

        this.executingManager = false;
        this.emitters = [];

        this.emitter = new EventEmitter();
    }

    start() {
        if (!this.executingManager) {
            this.executingManager = true;
            this.emitter.on('new_data', (data) => {this.broadcastData(this, data)});
        }
    }

    insertData(newData) {
        let data = new MeasurementData(newData.voltage, newData.current);
        data.phaseShift.angle = this.calculateAccumulation(data.phaseShift.values);
        this.emitter.emit('new_data', data);
    }

    calculateAccumulation(array) {
        this.dataAccumulator.push(array);
        if (this.dataAccumulator.length > 10) this.dataAccumulator.shift();

        let accumulation = this.dataAccumulator[0];

        for (let x = 1; x < this.dataAccumulator.length; x++) {
            for (let y = 0; y < this.dataAccumulator[0].length; y++) {
                accumulation[y] += this.dataAccumulator[x][y];
            }
        }

        return MeasurementData.calculateAngle(accumulation);        
    }

    addEmitter(emitter) {
        this.emitters.push(emitter);
    }

    broadcastData(manager, data) {
        if (manager.emitters) {
            manager.emitters.forEach(e => e.emit('measurement data', data));
        }
    }
};

exports.DataManager = DataManager;