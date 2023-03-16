const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { EventEmitter } = require('node:events');
const { controllerConfig, ControllerConfig } = require('./ControllerConfig');
const config = require('config');

const { Message, C_CONFIGINFORMATION, T_INFORMATION, T_NONBLOCKING, C_BEGINCONNECTION, T_ACK, T_BLOCKING, C_DATA } = require('./Message');

// libreria esp : https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json

const KEEPALIVE_TIMEOUT = 7000;
const ACK_TIMEOUT = 3000;

class PortConnection {
    constructor(path, baudrate) {
        this.path = path;
        this.baudrate = baudrate;
        this.parser = new ReadlineParser({delimiter: '\n'});

        this.attemptingConnection = false;
        this.attemptingSynchronization = false;

        this.connected = false;
        this.synchronized = false;

        this.connectionInterval;
        this.keepAliveInterval;

        this.ackTimeout;

        this.emitter = new EventEmitter();
        this.controllerConfig = new ControllerConfig(config.get("SerialPort.config"));
    }

    connect() {
        if (!this.connected) {
            // Inicializar conexion con el puerto serial que se pasó por parametros
            console.log('SerialPort: Initializing SerialPort');
            this.attemptingConnection = true;

            this.connectionInterval = setInterval(() => {
                if (this.attemptingConnection) {
                    console.log("SerialPort: Attempting connection");

                    this.port = new SerialPort({path: this.path, baudRate: this.baudrate}, (err) => {
                        if (err) {
                            console.log("SerialPort: Attempt to connect failed");
                            this.connected = false;

                            return console.log('SerialPort: ' + err);
                        }
                        else {
                            console.log("SerialPort: Connected to device");
    
                            clearInterval(this.connectionInterval);
                            this.attemptingConnection = false;
                            this.connected = true;
    
                            console.log("SerialPort: Attempting synchronization");

                            this.attemptingSynchronization = true;
    
                            this.port.pipe(this.parser);
                            this.parser.on('data', (data) => {
                                this.handleIncommingInfo(this, data);
                            });
                        }
                    });
                }
                else {
                    console.log("SerialPort: Unable to connect, stopping service");
                    clearInterval(this.connectionInterval);
                }
            },
            3000)
        } 
    }

    disconnect() {
        console.log('SerialPort: Connection aborted');

        delete this.port;
        this.attemptingConnection = false;
        this.attemptingSynchronization = false;
        this.connected = false;
        this.synchronized = false;
    }

    desynchronise() {
        console.log('SerialPort: Desynchronized, '+this.type);

        this.attemptingSynchronization = false;
        this.synchronized = false;
    }

    handleIncommingInfo(connection, data) {
        console.log();
        console.log('------------DEBUG-----------');
        console.log('connected='+this.connected);
        console.log('attemptingConnection='+this.attemptingConnection);
        console.log('synchonized='+this.synchronized);
        console.log('attemptingSynchronization='+this.attemptingSynchronization);
        console.log('----------------------------');
        console.log();

        let message = new Message(Number(data.substring(0,1)), Number(data.substring(1,4)), data.substring(4));
        let response;
        console.log("Received: " + data);

        if (message.type == (T_ACK|T_NONBLOCKING)) {
            clearTimeout(connection.ackTimeout);
        }

        switch (message.identifier) {
            case C_BEGINCONNECTION:
                if (message.type == (T_INFORMATION|T_NONBLOCKING)) {
                    connection.synchronized = false;

                    if (connection.attemptingSynchronization) {
                        response = new Message(T_INFORMATION|T_BLOCKING, C_BEGINCONNECTION, 'ACCEPT CONNECTION');
                        connection.send(connection, response, () => {
                            console.log('SerialPort: Desynchronized from BEGINCONNECTION');
                            connection.attemptingSynchronization = false;
                            connection.synchronized = false;
                        });

                        connection.attemptingSynchronization = false;
                    }
                }
                if (message.type == (T_ACK|T_NONBLOCKING)) {
                    console.log('SerialPort: Synchronized with device');
                    connection.synchronized = true;
                }
                break;

            case C_CONFIGINFORMATION:
                if (connection.synchronized) {
                    if (message.type == (T_INFORMATION|T_BLOCKING)) {
                        response = new Message(T_ACK|T_BLOCKING, C_CONFIGINFORMATION, JSON.stringify(this.controllerConfig));
                        connection.send(connection, response, () => {
                            console.log('SerialPort: Desynchronized from CONFIGINFORMATION, connection='+connection);
                            connection.attemptingSynchronization = false;
                            connection.synchronized = false;
                        });
                    }
                    if (message.type == (T_INFORMATION|T_NONBLOCKING)) {
                        if (message.getMessage().search('ERROR') != -1) {
                            console.log('SerialPort: ERROR, desynchronising: ' + message);
                            connection.desynchronise();
                        }
                    }
                }
                break;

            case C_DATA:
                if (this.synchronized) {
                    let dataPackage = {};
                    let voltageArray = {};
                    let currentArray = {};

                    voltageArray['begin'] = 8;
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
                    console.log(dataPackage);
                }
                break;

            default:
                console.log('SerialPort: Undefined data header');
                break;
        }
    }

    send(connection, message, callback) {
        if (callback == undefined) callback = connection.disconnect;

        if ((message.type & T_BLOCKING) == T_BLOCKING) {
            connection.ackTimeout = setTimeout(callback, ACK_TIMEOUT);
        }

        console.log("Sending: " +  String(message));
        connection.port.write(String(message));
    }

    updateControllerConfig(newConfig) {
        if (newConfig == undefined) newConfig = this.controllerConfig;

        this.controllerConfig.updateConfig(newConfig);

        //console.log('SerialPort: Updating controller config with ', JSON.stringify(this.controllerConfig));

        if (this.synchronized) {
            let response = new Message(T_INFORMATION|T_BLOCKING, C_CONFIGINFORMATION, JSON.stringify(this.controllerConfig));
            connection.send(connection, response, () => {
                console.log('SerialPort: Desynchronized from updateControllerConfig');
                connection.attemptingSynchronization = false;
                connection.synchronized = false;
            });
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
    get getSynchronized() {
        return this.synchronized;
    }
    get getAttemptingConnection() {
        return this.attemptingConnection;
    }
    get getAttemptingSynchronization() {
        return this.attemptingSynchronization;
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
    set setSynchronized(synchronized) {
        this.synchronized = synchronized;
    }
    set setAttemptingConnection(attemptingConnection) {
        this.attemptingConnection = attemptingConnection;
    }
    set setAttemptingSynchronization(attemptingSynchronization) {
        this.attemptingSynchronization = this.attemptingSynchronization;
    }
    set setControllerConfig(controllerConfig) {
        this.controllerConfig = controllerConfig;
    }
};

exports.PortConnection = PortConnection;