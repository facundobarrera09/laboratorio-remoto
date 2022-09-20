const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const config = require('config');

class PortConnection {
    constructor(path, baudrate) {
        this.path = path;
        this.baudrate = baudrate;
        this.parser = new ReadlineParser({delimiter: '\n'});
        this.connected = false;
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
        // console.log(data);

        // Codigos del encabezado de la informaciòn del controlador:
        // 0 - ACK
        // 1 - Informacion de administracion
        // 2 - Datos de medicion
        switch (data.at(0)) {
            case '0':
                // ACK
                if (data.search('RECEIVED_CONNECTION') != -1) {
                    connection.setConnected(true);
                    connection.setAttemptingConnection(false);
                    console.log('SerialPort: Connection stablished');
                }
            case '1':
                // Informacion de administracion
                if (data.search('AWAITING_CONNECTION') != -1) {
                    console.log('SerialPort: Attempting connection with controller');
                    connection.port.write(`connect:${config.get('SerialPort.password')}`);
                }
                return;
            case '2':
                return;
            default:
                console.log('SerialPort: Undefined data header');
        }
    }

    getPort() {
        return this.port;
    }
    getConnected() {
        return this.connected;
    }
    getAttemptingConnection() {
        return this.attemptingConnection;
    }
    setConnected(connected) {
        this.connected = connected;
    }
    setAttemptingConnection(attempting_connection) {
        this.attemptingConnection = true;
    }
};

exports.PortConnection = PortConnection;