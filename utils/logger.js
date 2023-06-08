const logger = {}

logger.error = (...params) => {
    console.error('ERROR:', ...params)
}

logger.debug = (...params) => {
    console.debug('DEBUG:', ...params)
}

logger.info = (...params) => {
    console.log(...params)
}

module.exports = logger