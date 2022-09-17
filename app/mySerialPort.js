const { SerialPort } = require('serialport');

class MySerialPort {
    constructor(path, baudrate) {
        this.path = path;
        this.baudrate = baudrate;

        // Añadir SerialPortMock

        // Inicializar conexion con el puerto serial que se pasó por parametros

        console.log('Initializing serial port');
        this.port = new SerialPort({path: path, baudRate: baudrate}, (err) => {
            if (err) {
                return console.log(err);
            }
        });
    }
};

exports.MySerialPort = MySerialPort;