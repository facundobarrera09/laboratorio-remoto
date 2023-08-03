const { getCurrentTurn, getTurnTime } = require('./getCurrentTurn')

module.exports = (laboratory, userTurns) => {
    const access = []

    if (process.env.ALLOW_ALL === 'true') {
        access.push({
            start: new Date(0),
            end: new Date(10000000000000)
        })

        return access
    }

    const today = new Date()
    today.setHours(0,0,0,0)

    const turnDuration = laboratory.turnDurationMinutes
    const currentTurn = getCurrentTurn(turnDuration)

    for (let turn of userTurns) {
        if (!(turn.turn >= currentTurn)) continue
        
        const last = access.at(access.length-1)
        const start = getTurnTime(turn.turn, turnDuration)
        const end = getTurnTime(turn.turn+1, turnDuration)
    
        if (last && last.end.getTime() === start.getTime()) {
            last.end = end
        }
        else {
            access.push({
                start,
                end
            })
        }
    }

    access.sort((a, b) => {
        if (a.start.getTime() < b.start.getTime()) {
            return -1
        }
        if (a.start.getTime() > b.start.getTime()) {
            return 1
        }
        return 0
    })

    return access
}