const logger = require('./logger')

module.exports = (socket, client, dataManager) => {
    if (process.env.ALLOW_ALL === 'true') {
        logger.info('start sending data')
        socket.join('clients')
        socket.emit('access:granted')
        dataManager.on('new_data', (data) => {
            socket.emit('measurement data', data)
        })
        return
    }

    const now = new Date()

    for (let access of client.access) {
        const timeTillStart = access.start.getTime() - now.getTime()
        const timeTillEnd = access.end.getTime() - now.getTime()

        logger.debug(timeTillStart)
        logger.debug(timeTillEnd)

        const emitData = (data) => {
            socket.emit('measurement data', data)
        }

        setTimeout(() => {
            if (socket.connected) {
                logger.info('start sending data')
                socket.join('clients')
                socket.emit('access:granted')
                dataManager.on('new_data', emitData)
            }
        }, (timeTillStart >= 0) ? timeTillStart : 0);

        setTimeout(() => {
            if (socket.connected) {
                logger.info('stop sending data')
                socket.leave('clients')
                socket.emit('access:revoked')
                dataManager.removeListener('new_data', emitData)
            }
        }, timeTillEnd);
    }
}