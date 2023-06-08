const axios = require('axios')
const logger = require('./logger')

module.exports = async (token, laboratory) => {
    try {
        const today = new Date()
        today.setHours(0,0,0,0)

        const response = await axios
            .get(`http://localhost:3001/api/turns?date=${today.toISOString().slice(0,10)}`, {
                headers: {
                    'Authorization': 'Bearer ' + token,
                }
            })
            
        return response.data.reservedTurns
    }
    catch(error) {
        logger.error(error.name, error.message, error.response.data)
        return null
    }
}