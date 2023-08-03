const path = require('path')
const express = require('express');
const session = require('express-session')
const config = require('config');
const cors = require('cors')
const logger = require('./utils/logger')

const { clientsRouter }  = require('./controller/clients')
const { getClientById }  = require('./controller/clients')

const getToken = require('./utils/getToken')
const getLaboratoryInfo = require('./utils/getLaboratoryInfo')
const getUserTurns = require('./utils/getUserTurns')
const getUserAccess = require('./utils/getUserAccess')

const createSocketAccessTimes = require('./utils/createSocketAccessTimes')

const { Server } = require('socket.io');
const { PortConnection } = require('./app/PortConnection');
const { PetitionManager } = require('./app/PetitionManager');
const { Petition } = require('./app/Petition');
const { DataManager } = require('./app/DataManager');
const { ControllerConfig } = require('./app/ControllerConfig')

const app = express();

// Server
    // Settings
app.set('port', 3000);

    // Middleware
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // support encoded bodies
app.use(session({ secret: config.get('Session.secret'), resave: false, saveUninitialized: false }))

// TODO: asegurarse que si el usuario cierra la cuenta en el gestor ya no pueda acceder al laboratorio
app.get('/main.html', async (req, res, next) => {

    if (process.env.ALLOW_ALL === 'true')
        return next()

    const params = req.query

    logger.debug('accessToken:', req.session.accessToken)
    logger.debug('params:', params)

    if (!req.session.identifier && process.env.ALLOW_ALL !== 'true') return res.redirect('/')

    if (!req.session.accessToken) {
        if (params.error) {
            logger.error(params.error, params.error_description)
            return res.redirect('/denied.html')
        }
        else if (!params.code && process.env.ALLOW_ALL !== 'true') {
            logger.info('redirecting user to http://localhost:3001/authorization')
            return res.redirect(`http://localhost:3001/authorization?response_type=code&client_id=${encodeURIComponent(config.get('Client.id'))}&redirect_uri=${encodeURIComponent(config.get('Client.redirectUri'))}&scope=read&state=1234zyx`)
        }
        else {
            const token = (process.env.ALLOW_ALL !== 'true') ? await getToken(params.code) : 'valid'
            if (token) {
                logger.info('client provided authorization')
                req.session.accessToken = token
                return res.redirect('/main.html')
            }
            else {
                return res.status(403).send({ error: 'unauthorized', description: 'Authorization code may be invalid, try removing it from the query parameters' })
            }
        }
    }
    else {
        let laboratory = undefined, userTurns = undefined

        if (process.env.ALLOW_ALL !== 'true') {
            laboratory = await getLaboratoryInfo(req.session.accessToken)
    
            if (!laboratory) {
                req.session.accessToken = undefined
                res.redirect('/main.html')
            }
    
            userTurns = await getUserTurns(req.session.accessToken, laboratory)
    
            if (!userTurns) {
                req.session.accessToken = undefined
                res.redirect('/main.html')
            }
            
            const userAccess = getUserAccess(laboratory, userTurns)
            req.session.userAccess = userAccess
            
            const client = getClientById(req.session.identifier)
            client.access = userAccess
        }
        
        next()
    }
})
app.get('/test', (req, res) => {
    res.sendFile(__dirname+'/public/test.html');
});
app.get('/webcam', (req, res) => {
    res.sendFile(__dirname+'/public/webcam.html');
});

app.use(express.static('public'))
app.use('/api/clients', clientsRouter)

const server = app.listen(app.get('port'), () => {
    console.log('Server on port ', app.get('port'));
});

// DataManager
const dataManager = new DataManager();
dataManager.start();

// SerialPort

// const portConnection = new PortConnection(config.get('SerialPort.port'), config.get('SerialPort.baudrate'));
// portConnection.connect();

// PetitionManager

// const petitionManager = new PetitionManager(portConnection);
// petitionManager.start();

// Socket.io Server

const io = new Server(server, { allowEIO3: true });

io.use((socket, next) => {
    const type = socket.handshake.query.type
    const identifier = socket.handshake.query.identifier

    if (!type) {
        console.log('Socket.io client failed to connect')
        next(new Error('missing connection type'))
    }
    else {
        if (type === 'client') {
            if (!identifier)
                return next(new Error('missing identifier'))
            else if (!getClientById(identifier)) 
                return next(new Error('client not found'))
        }
        if (type === 'esp') {
            if (socket.handshake.headers.authorization !== 'Bearer valid token') {
                console.log(socket.handshake.headers.authorization)
                socket.emit('connection:error', 'unauthorized');
                socket.disconnect()
                return next(new Error('unauthorized'))
            }
        }
        next()
    }
})

io.on('connection', (socket) => {
    console.log('Received connection from ', socket.handshake.address);
    console.log('Type of connection:', socket.handshake.query.type)
    
    if (socket.handshake.query.type === 'client') {
        const client = getClientById(socket.handshake.query.identifier)
        console.log(client)

        if (process.env.ALLOW_ALL !== 'true') {
            if (!client.access) return socket.disconnect()
            
            if (client.access.length === 0) {
                socket.emit('access:denied')
                socket.disconnect()
            }
            else {
                socket.emit('access:data', client.access)
                createSocketAccessTimes(socket, client, dataManager)
            }
        }
        else {
            createSocketAccessTimes(socket, client, dataManager)
        }
        
        socket.on('petition', (petition_data, callback) => {
            console.log('New petition from ', socket.handshake.address,': ', petition_data);
            let petition = new Petition(socket.handshake.address, petition_data);
            // petitionManager.addPetitionToQueue(petition)// derivar peticion al gestor de peticiones
            callback(10); // retornar la posicion de la peticion en la cola
        });
    }
    else if (socket.handshake.query.type === 'esp') {
        socket.join('esp')

        console.log('auth data:', socket.handshake)

        socket.on('config:get', () => {
            const espConfig = new ControllerConfig(config.get("SerialPort.config"))
            socket.emit('config:set', JSON.stringify(espConfig))
        })

        socket.on('config:error', (data) => {
            console.log('error while configuring esp:', data.error)
        })

        socket.on('meassurement_data:post', (data) => {
            dataManager.insertData(data);
        })
    }
    else if (socket.handshake.query.type === 'webcam') {
        socket.on('start stream', (data, callback) => {
            if (data.password === config.get('Webcam.password')) {
                socket.on('stream', (streamData) => {
                    io.to('clients').emit('stream', streamData);
                });
                callback(true);
            }
            else {
                callback(false);
            }
        });
    }

    socket.on('message', (message) => {
        console.log(socket.in('clients') ? 'client' : 'esp','sent', message)
    })

});

// portConnection.on('new_data', (data) => {
//     dataManager.insertData(data);
// });

simulateData();
async function simulateData() {
    let i = 0;
    let increment = true;

    while (true) {
        let data = {
            voltage: [],
            current: []
        };

        for (let x = 0; x < 500; x++) {
            data["voltage"][x] = 100 * Math.sin( (((2*Math.PI*x)+noise(0,50))/100) + (Math.PI*(0)) ); 
            data["current"][x] = 100 * Math.sin( ((2*Math.PI*x)+noise(0,50))/100 );
        }

        // no noise
        // for (let x = 0; x < 500; x++) {
        //     data["voltage"][x] = 100 * Math.sin( (((2*Math.PI*x))/100) + (Math.PI*(0.5)) ); 
        //     data["current"][x] = 100 * Math.sin( ((2*Math.PI*x))/100 );
        // }

        dataManager.insertData(data);
        await new Promise(r => setTimeout(r, 200));
    }

}

function noise(min, max) {
    return Math.random() * (max - min) + min;
}