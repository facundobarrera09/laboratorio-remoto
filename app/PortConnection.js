const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { EventEmitter } = require('node:events');
const config = require('config');

class PortConnection {
    constructor(path, baudrate) {
        this.path = path;
        this.baudrate = baudrate;
        this.parser = new ReadlineParser({delimiter: '\n'});
        this.connected = false;

        this.emitter = new EventEmitter();
        this.controllerConfig = config.get("SerialPort.config");
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
        //     console.log(data);
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
                    connection.port.write(JSON.stringify(connection.getControllerConfig()));
                }
                break;
            case '2':
                connection.emitter.emit('new_data', data.substring(1));
                break;
            default:
                console.log('SerialPort: Undefined data header');
        }
    }

    on(event, callback) {
        this.emitter.on(event, callback);
    }

    get port() {
        return this.port;
    }
    get connected() {
        return this.connected;
    }
    get attemptingConnection() {
        return this.attemptingConnection;
    }
    get controllerConfig() {
        return this.controllerConfig
    }
    set connected(connected) {
        this.connected = connected;
    }
    set attemptingConnection(attempting_connection) {
        this.attemptingConnection = attempting_connection;
    }
};

exports.PortConnection = PortConnection;