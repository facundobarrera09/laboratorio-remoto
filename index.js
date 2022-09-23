const express = require('express');
const { Server } = require('socket.io');
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

// Socket.io Server

const io = new Server(server);

io.on('connection', (socket) => {
    socket.on('petition', (petition) => {
        console.log(petition);
    });
});

portConnection.on('new_data', (data) => {
    io.emit('meassurement data', data)
});