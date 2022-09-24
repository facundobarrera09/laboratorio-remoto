const express = require('express');
const { Server } = require('socket.io');
const { PortConnection } = require('./app/PortConnection');
const config = require('config');
const { Petition } = require('./app/Petition');
const { PetitionManager } = require('./app/PetitionManager');

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

// PetitionManager

const petitionManager = new PetitionManager(portConnection);
petitionManager.start();

// Socket.io Server

const io = new Server(server);

io.on('connection', (socket) => {
    console.log('Received connection from ', socket.handshake.address);
    socket.on('petition', (petition_data, callback) => {
        console.log('New petition from ', socket.handshake.address,': ', petition_data);
        let petition = new Petition(socket.handshake.address, petition_data);
        petitionManager.addPetitionToQueue(petition)// derivar peticion al gestor de peticiones
        callback(10); // retornar la posicion de la peticion en la cola
    });
});

portConnection.on('new_data', (data) => {
    io.emit('meassurement data', data)
});