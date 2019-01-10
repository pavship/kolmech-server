const { lazy, object, string } = require('yup')

const { idValidationType } = require('./commonTypes')

const validationSchema = object().shape({
	id: idValidationType.notRequired(),
	country: string()
		.oneOf(['rus', 'notRus'])
		.when('id', (id, schema) => id
			? schema.notRequired()
			: schema.default('rus')
		),
	number: lazy(val => !val
		? string()
		: string()
			.transform(val => val.match(/.*\d.*/) //if value contains digits
				? val.match(/\d+/g).join('') // extract and join digits
				: val // else pass value through
			)
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