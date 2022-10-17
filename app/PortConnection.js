const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { EventEmitter } = require('node:events');
const { controllerConfig, ControllerConfig } = require('./ControllerConfig');
const config = require('config');

// libreria esp : https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json

class PortConnection {
    constructor(path, baudrate) {
        this.path = path;
        this.baudrate = baudrate;
        this.parser = new ReadlineParser({delimiter: '\n'});
        this.connected = false;

        this.emitter = new EventEmitter();
        this.controllerConfig = new ControllerConfig(config.get("SerialPort.config"));
    }

    connect() {
        // Inicializar conexion con el puerto serial que se pasó por parametros
        this.attemptingConnection = true;

        console.log('SerialPort: Initializing serial port');
        this.port = new SerialPort({path: this.path, baudRate: this.baudrate}, (err) => {
            if (err) {
                this.connected = false;
                return console.log('SerialPort: ' + err);
            }
        });

        this.port.pipe(this.parser);
        this.parser.on('data', (data) => {
            this.handleIncommingInfo(this, data);
        });
    }

    handleIncommingInfo(connection, data) {
        // if (data.at(0) != '2') {
        //     console.log('Received data from controller: ',data);
        // }

        // Codigos del encabezado de la informaciòn del controlador:
        // 0 - ACK
        // 1 - Informacion de administracion
        // 2 - Datos de medicion
        switch (data.at(0)) {
            case '0':
                // ACK
                if (data.search('RECEIVED_CONNECTION') != -1) {
                    connection.connected = true;
                    connection.attemptingConnection = false;
                    console.log('SerialPort: Connection stablished');
                }
                if (data.search('RECEIVED_CONFIG') != -1) {
                    console.log('SerialPort: Controller received config')
                }
                break;
            case '1':
                // Informacion de administracion
                if (data.search('AWAITING_CONNECTION') != -1) {
                    console.log('SerialPort: Attempting connection with controller');
                    connection.port.write(`CONNECT:${config.get('SerialPort.password')}`);
                }
                if (data.search('AWAITING_CONFIG') != -1) {
                    console.log('SerialPort: Sending configuration');
                    connection.updateControllerConfig();
                }
                break;
            case '2':
                let dataPackage = {};
                let voltageArray = {};
                let currentArray = {};

                voltageArray['begin'] = 9;
                voltageArray['end'] = data.search('CURRENT');
                voltageArray['arrayString'] = data.substring(voltageArray.begin, voltageArray.end);

                currentArray['begin'] = data.search('CURRENT') + 8;
                currentArray['end'] = data.length - 1;
                currentArray['arrayString'] = data.substring(currentArray.begin, currentArray.end);

                dataPackage['voltage'] = (voltageArray.arrayString).split(',');
                dataPackage['voltage'] = dataPackage['voltage'].map((v) => parseInt(v, 10));
                dataPackage['current'] = (currentArray.arrayString).split(',');
                dataPackage['current'] = dataPackage['current'].map((v) => parseInt(v, 10));
                dataPackage['size'] = dataPackage.voltage.length;

                connection.emitter.emit('new_data', dataPackage);
                break;

            default:
                console.log('SerialPort: Undefined data header');
        }
    }

    updateControllerConfig(newConfig) {
        if (newConfig == undefined) newConfig = this.controllerConfig;

        this.controllerConfig.updateConfig(newConfig);

        //console.log('SerialPort: Updating controller config with ', JSON.stringify(this.controllerConfig));

        if (this.connected) {
            this.port.write(JSON.stringify(this.controllerConfig));
        }
    }

    on(event, callback) {
        this.emitter.on(event, callback);
    }

    get getPort() {
        return this.port;
    }
    get getConnected() {
        return this.connected;
    }
    get getAttemptingConnection() {
        return this.attemptingConnection;
    }
    get getControllerConfig() {
        return this.controllerConfig
    }
    set setPort(port) {
        this.port = port;
    }
    set setConnected(connected) {
        this.connected = connected;
    }
    set setAttemptingConnection(attemptingConnection) {
        this.attemptingConnection = attemptingConnection;
    }
    set setControllerConfig(controllerConfig) {
        this.controllerConfig = controllerConfig;
    }
};

exports.PortConnection = PortConnection;