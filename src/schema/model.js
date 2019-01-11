const { object, string } = require('yup')

const { idValidationType } = require('./commonTypes')

const validationSchema = object().shape({
  id: idValidationType.notRequired(),
  orgId: idValidationType
		.when('id', (id, schema) => id
			? schema.notRequired()
			: schema.required('Организация не указана')
		),
  name: string().trim().min(4).max(255)
    .when('id', (id, schema) => id
      ? schema.notRequired()
      : schema.required()
    ),
  article: string().trim().min(4).max(10).notRequired(),
})

const formikSchema = {
  name: '',
  article: ''
}

const listSchema = {
  name: {
    label: 'Наименование'
  },
  article: {
    label: 'Артикул'
  }
}

module.exports = {
	validationSchema
}