const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

class MySerialPort {
    constructor(path, baudrate, start) {
        this.path = path;
        this.baudrate = baudrate;
        this.parser = new ReadlineParser({delimiter: '\n'})
        this.connected = false;

        this.connect(path, baudrate, start);
    }

    connect(path, baudrate) {
        // Inicializar conexion con el puerto serial que se pasó por parametros

        console.log('SerialPort: Initializing serial port');
        this.port = new SerialPort({path: path, baudRate: baudrate}, (err) => {
            if (err) {
                this.connected = false;
                return console.log('SerialPort: ' + err);
            }

            this.port.pipe(this.parser);
            this.parser.on('data', this.handleInfo);

            this.connected = true;
            console.log('SerialPort: Connection stablished');
        });
    }

    handleInfo(data) {
        // Codigos del encabezado de la informaciòn del controlador:
        // 0 - ACK
        // 1 - Informacion de administracion
        // 2 - Datos de medicion
        switch (data.at(0)) {
            case '0':
                // ACK
            case '1':
                // Informacion de administracion
            case '2':
                //dgramSocket.write(Buffer.from(data, 1));
                return;
            default:
                throw 'SerialPort: Undefined data header';
        }
    }
};

exports.MySerialPort = MySerialPort;