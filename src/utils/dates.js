const isValidDate = date => date instanceof Date && !isNaN(date.valueOf())
const isValidDateString = dateString => isValidDate(new Date(Date.parse(dateString))) && dateString.length === 10
const tz = -10800000 // Moscow GMT+3
const toLocalISOString = date => new Date(date.getTime() - tz).toISOString()
const toLocalDateString = date => toLocalISOString(date).slice(0,10)
const fromLocalISOString = string => new Date(Date.parse(string) + tz)
const toLocalTimestamp = date => new Date(date.getTime() - tz).toISOString().slice(0, 19).replace('T',' ')

module.exports = {
    isValidDate,
    isValidDateString,
    toLocalISOString,
    toLocalDateString,
    fromLocalISOString,
    toLocalTimestamp
}