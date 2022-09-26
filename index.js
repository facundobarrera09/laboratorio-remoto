const express = require('express');
const { Server } = require('socket.io');
const { PortConnection } = require('./app/PortConnection');
const config = require('config');
const { Petition } = require('./app/Petition');
const { PetitionManager } = require('./app/PetitionManager');
const NodeWebcam = require( "node-webcam" );
const fs = require('fs');
const { application } = require('express');

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

// Webcam

    // Default options
var opts = {

    //Picture related

    width: 1280,

    height: 720,

    quality: 100,

    // Number of frames to capture
    // More the frames, longer it takes to capture
    // Use higher framerate for quality. Ex: 60

    frames: 30,


    //Delay in seconds to take shot
    //if the platform supports miliseconds
    //use a float (0.1)
    //Currently only on windows

    delay: 0,


    //Save shots in memory

    saveShots: false,


    // [jpeg, png] support varies
    // Webcam.OutputTypes

    output: "jpeg",


    //Which camera to use
    //Use Webcam.list() for results
    //false for default device

    device: false,


    // [location, buffer, base64]
    // Webcam.CallbackReturnTypes

    callbackReturn: "location",


    //Logging

    verbose: false

};

var Webcam = NodeWebcam.create(opts);

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

    socket.on('request webcam', () => {
        console.log('Webcam: requested Webcam picture');

        setInterval( () => {
            Webcam.capture( "test_picture", function( err, imagePath ) {
                //const buffer = ArrayBuffer.from(data);
                if (err) {
                    return console.log('error');
                }
                console.log(imagePath);
                fs.readFile(imagePath, function(err, data){
                    // socket.emit('imageConversionByClient', { image: true, buffer: data });
                    // socket.emit('imageConversionByServer', "data:image/png;base64,"+ data.toString("base64"));
                    socket.emit('webcam image', 'data:image/jpg;base64,' + data.toString('base64'));
                });
            } );
        }, 100);
    });
});

portConnection.on('new_data', (data) => {
    io.emit('meassurement data', data)
});

//imitateData();
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
