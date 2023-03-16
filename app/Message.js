// TYPES - left bit is Information (0) or ACK (1), and right bit is blocking (0) or nonblocking (1)
const T_INFORMATION = 0
const T_ACK = 1
const T_BLOCKING = 0
const T_NONBLOCKING = 2

// IDENTIFIERS
const C_BEGINCONNECTION = 100
const C_CONFIGINFORMATION = 101
const C_KEEPALIVE = 102
const C_DATA = 200

class Message {
    constructor(type, identifier, message) {
        this.type = (type == undefined) ? -1 : type
        this.identifier = (identifier == undefined) ? -1 : identifier
        this.message = (message == undefined) ? "" : message
    }

    get getType() {
        return this.type;
    }
    get getIdentifier() {
        return this.identifier;
    }
    get getMessage() {
        return this.message;
    }
    set setTipo(tipo) {
        this.type = tipo;
    }
    set setIdentifier(identifier) {
        this.identifier = identifier;
    }
    set setMensaje(mensaje) {
        this.message = mensaje;
    }

    toString() {
        return String(this.type) + String(this.identifier) + this.message;
    }
}

exports.Message = Message;

exports.T_INFORMATION = T_INFORMATION
exports.T_ACK = T_ACK
exports.T_BLOCKING = T_BLOCKING
exports.T_NONBLOCKING = T_NONBLOCKING
exports.C_BEGINCONNECTION = C_BEGINCONNECTION
exports.C_CONFIGINFORMATION = C_CONFIGINFORMATION
exports.C_KEEPALIVE = C_KEEPALIVE
exports.C_DATA = C_DATA