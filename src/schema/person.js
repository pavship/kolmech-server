const { lazy, object, array, string } = require('yup');
const { validationSchema: telValidationSchema } = require('./tel')

const validationSchema = (person) => object().shape({
	lName: lazy(val => !val
		? string()
		: string().trim().min(2).max(255)
	),
	fName: lazy(() => person && person.id
    ? string().trim().min(2).max(255).notRequired()
    : string().trim().min(2).max(255).required('Пропущено обязательное поле Имя')
  ),
	mName: lazy(val => !val
		? string()
		: string().trim().min(2).max(255)
	),
	tels: array().of(telValidationSchema())
})

module.exports = { 
	validationSchema
}