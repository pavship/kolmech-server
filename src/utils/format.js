const curry = require('lodash/curry')
const currency = (num, trailing) => {
	let curNum = (num).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$& ').replace(/\./, ',')
	if (!trailing) curNum = curNum.slice(0,-3)
	return curNum + ' ₽'
}
const parseOrThrow = (func, entity, funcConfig) => {
	const curried = curry(func, 3)
	const err = {}
	const res = func(entity, err, funcConfig)
	if (!res) throw new Error(err.message)
	return res
}
const parseFullname = (fullname, err) => {
	// check for numbers
	const numbers = fullname.match(/\d+/g)
	if (numbers) {
		err.message = 'В ФИО найдены числа'
		return false
	}
	const names = fullname.split(' ').filter(s => s !== '')
	if (names.length > 1) names.splice(0, 2, names[1], names[0])
	return names
}
const parsePhone = (phone, err, config) => {
	const { country } = config
	const numbers = phone.match(/\d+/g)
	if (!numbers) {
		err.message = 'В номере телефона нет чисел'
		return false
	}
	const numberPart = numbers.join('')
	if ( country === 'rus') return ['+7', numberPart].join('')
	if (phone.trim()[0] === '+') return ['+', numberPart].join('')
	return numberPart
}

module.exports = {
	currency,
	parseOrThrow,
	parseFullname,
	parsePhone
}
