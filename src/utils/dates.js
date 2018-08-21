const tz = -10800000 // Moscow GMT+3
const toLocalISOString = (date) => new Date(date.getTime() - tz).toISOString()
const toLocalTimestamp = (date) => new Date(date.getTime() - tz).toISOString().slice(0, 19).replace('T',' ')

module.exports = {
    toLocalISOString,
    toLocalTimestamp
}