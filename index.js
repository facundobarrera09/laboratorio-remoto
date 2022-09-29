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
app.get('/test', (req, res) => {
    res.sendFile(__dirname+'/public/test.html');
});
app.get('/webcam', (req, res) => {
    res.sendFile(__dirname+'/public/webcam.html');
});

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

    socket.on('start stream', (data, callback) => {
        if (data.password === config.get('Webcam.password')) {
            console.log('Received webcam connection');
            socket.on('stream', (streamData) => {
                socket.broadcast.emit('stream', streamData);
            });
            callback(true);
        }
        else {
            callback(false);
        }
    });
});

// portConnection.on('new_data', (data) => {
//     io.emit('meassurement data', data)
// });

imitateData();
async function imitateData() {
    let i = 0;
    let increment = true;

    while (true) {
        if (increment) {
            i++;
            if (i >= 20) {
                increment = false;
            }
        }
        else {
            i--;
            if (i <= 0) {
                increment = true;
            }
        }

        io.emit('meassurement data', i*i)
        await new Promise(r => setTimeout(r, ));
    }

}
