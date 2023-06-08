const config = require('config')
const axios = require('axios')
const logger = require('./logger')
const encodeBase64 = require('./encodeBase64')

module.exports = async (authorizationCode) => {
    try {
        const response = await axios
            .post('http://localhost:3001/token', {
                grant_type: 'authorization_code',
                code: authorizationCode,
                redirect_uri: config.get('Client.redirectUri')
            },{
                headers: {
                    'Authorization': 'Basic ' + encodeBase64(`${config.get('Client.id')}:${config.get('Client.secret')}`),
                    'Content-Type': 'application/json'
                }
            })

        try {
            return response.data.access_token
        }
        catch(error) {
            logger.error('access token not found in response')
        }
    }
    catch (error) {
        logger.error(error.response.data)
    }

    return null
}