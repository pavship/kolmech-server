const { lazy, object, array, string } = require('yup');

const { validationSchema: telValidationSchema } = require('./tel')
const { idValidationType } = require('./commonTypes')

const validationSchema = object().shape({
	id: idValidationType.notRequired(),
	lName: lazy(val => !val
		? string()
		: string().trim().min(2).max(255)
	),
	fName: string().trim().min(2).max(255)
		.when('id', (id, schema) => id
			? schema.notRequired()
			: schema.required('Пропущено обязательное поле Имя')
		)
  ,
	mName: lazy(val => !val
		? string()
		: string().trim().min(2).max(255)
	),
	tels: array().of(telValidationSchema)
})

module.exports = { 
	validationSchema
}