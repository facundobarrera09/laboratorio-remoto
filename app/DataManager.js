const { EventEmitter } = require('node:events');
const { MeasurementData } = require('./MeasurementData');

class DataManager {
    constructor() {
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
        let data = new MeasurementData(newData.voltage, newData.intensity);
        this.emitter.emit('new_data', data);
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