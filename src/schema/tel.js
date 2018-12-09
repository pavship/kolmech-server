const { lazy, object, string } = require('yup');

const validationSchema = () => object().shape({
	country: string().oneOf(['rus', 'notRus']).required(),
	number: lazy(val => !val ? string() : string()
		.transform(val =>
			!val.match(/.*\d.*/)
			? val
			: val.match(/\d+/g).join('')
		) // extract and join digits
		.when('country', {
			is: 'rus',
			then: string().matches(/\d{10}/, 'российский телефонный номер должен содержать 10 цифр'), 									// check number of digits for russia (10)
			otherwise: string().matches(/\d{7,25}/, 'международный телефонный номер должен содержать от 7 до 25 цифр')	// from 7 to 25 for notRus numbers
		})
	)
})

module.exports = {
	validationSchema
}