const crypto = require('crypto')
const clientsRouter = require('express').Router()

const clients = []

const generateId = () => {
    return crypto.randomBytes(64).toString('hex')
}

clientsRouter.get('/identifier', (request, response) => {
    if (!request.session.identifier) {
        request.session.identifier = generateId()
        clients.push({ identifier: request.session.identifier })
    }
    response.status(200).json({ identifier: request.session.identifier })
})

clientsRouter.post('/identifier', (request, response) => {
    const identifier = request.body.identifier

    if (!identifier) return response.status(400).json({ error: 'missing identifier' })

    if (!request.session.identifier) return response.status(200).json({ valid: false })

    if (request.session.identifier === identifier) response.status(200).json({ valid: true })
})

const getClientById = (id) => {
    for (let client of clients) {
        if (client.identifier === id) {
            return client
        }
    }
    return null
}

module.exports = { clientsRouter, getClientById }