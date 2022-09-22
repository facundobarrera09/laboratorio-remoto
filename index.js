const express = require('express');
const WebSocketServer = require('websocket').server;
const { PortConnection } = require('./app/PortConnection');
const config = require('config');

const app = express();

// Server
    // Settings
app.set('port', 3000);

    // Middleware
app.use(express.json());
app.use(express.static('public'));

    // Routing

const server = app.listen(app.get('port'), () => {
    console.log('Server on port ', app.get('port'));
});

// SerialPort

const portConnection = new PortConnection(config.get('SerialPort.port'), config.get('SerialPort.baudrate'));
portConnection.connect();

// WebSocket Server

let connections = [];
const webSocket = new WebSocketServer({
    httpServer: server
});

function broadcast(message) {
    connections.forEach(c => c.sendUTF(message));
}

webSocket.on('request', (req) => {
    console.log('Recived connection from ?');
    let connection = req.accept('echo-protocol', req.origin);
    connections.push(connection);
    console.log('Amount of connections: ' + connections.length);
});

portConnection.on('new_data', (data) => {
    broadcast(data);
});