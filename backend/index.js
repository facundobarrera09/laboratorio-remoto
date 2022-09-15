const express = require('express');
const puerto = process.env.PORT || 3000;
const path = require('path');
const http = require('http');

const { Server } = require("socket.io");

const {SerialPort} = require('serialport');
const {ReadlineParser} = require('@serialport/parser-readline');

function fechaAString(today){
    return today.getDate()+"-"+today.getMonth()+1+"-"+today.getFullYear()
}
function horaAString(today){
    return today.getHours()+":"+today.getMinutes()
}

let enviarDatosAhora = true;
async function enviarDatos(){
    while (true){
        await new Promise(r => setTimeout(r, 100));
        enviarDatosAhora = true;
    }
}

const app = express();
const server = http.createServer(app);
const io = new Server(server);

console.log('path: ' + __dirname);
app.use(express.static(path.join(__dirname, '../public')));
app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/index.html'));
});
/*
const port = new SerialPort({ path: 'COM8', baudRate: 115200 });
const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

enviarDatos();
parser.on('data', (data) => { //Read data
    if (true){
        enviarDatosAhora = false;
        console.log(data);
        var today = new Date();
        io.sockets.emit('temp', {date: fechaAString(today), time: horaAString(today), temp:data}); //emit the datd i.e. {date, time, temp} to all the connected clients.
    }
});*/

server.listen(puerto, () => {
    console.log('Servidor Iniciado en http://localhost:' + puerto);
  });
io.on('connection', (socket) => {
    console.log("Someone connected."); //show a log as a new client connects.
})