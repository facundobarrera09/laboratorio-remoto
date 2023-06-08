const axios = require('axios')
const logger = require('./logger')

module.exports = async (token) => {
    try {
        const response = await axios
            .get('http://localhost:3001/api/laboratories', {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            })

        return response.data
    }
    catch (error) {
        logger.error(error.name, error.message, error.response.data)
        return null
    }
}