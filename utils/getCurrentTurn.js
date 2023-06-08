const getCurrentTurn = (turnDuration) => {
    const minutesInDay = 24*60
    const now = new Date()

    const totalTurns = minutesInDay / turnDuration
    const nowMinutes = (now.getHours()*60) + now.getMinutes()
    
    return Math.floor((nowMinutes * totalTurns)/minutesInDay)
}

const getTurnTime = (turn, turnDuration) => {
    const startingTimeMinutes = turn*turnDuration

    const hours = Math.floor(startingTimeMinutes / 60)
    const minutes = startingTimeMinutes % 60

    const time = new Date()
    time.setHours(hours)
    time.setMinutes(minutes)
    time.setSeconds(0)

    return time
}

module.exports = { getCurrentTurn, getTurnTime }