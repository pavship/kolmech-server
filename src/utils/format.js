const currency = (num, trailing) => {
    let curNum = (num).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$& ').replace(/\./, ',')
    if (!trailing) curNum = curNum.slice(0,-3)
    return curNum + ' ₽'
}

module.exports = {
    currency
}
