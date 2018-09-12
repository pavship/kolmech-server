const currency = (num) => num.toString().replace(/\d(?=(\d{3})+\.)/g, '$& ').replace(/\./, ',') + ' '

module.exports = {
    currency
}
