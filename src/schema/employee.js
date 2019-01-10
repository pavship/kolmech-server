const { lazy, object, string } = require('yup')

const { validationSchema: personValidationSchema } = require('./person')
const { idValidationType } = require('./commonTypes')

const validationSchema = object().shape({
  id: idValidationType.notRequired(),
  orgId: idValidationType
		.when('id', (id, schema) => id
			? schema.notRequired()
			: schema.required()
		),
  person: personValidationSchema
})

const formikSchema = {
  person: {
    lName: '',
    fName: '',
    mName: '',
    tels: [{
      number: '',
      country: 'rus',
    }]
  }
}

const listSchema = {
  person: {
    lName: {
      label: 'Фамилия'
    },
    fName: {
      label: 'Имя'
    },
    mName: {
      label: 'Отчество'
    },
    tels: [{
      label: 'Телефон',
      type: 'tel'
    }]
  }
}

module.exports = { 
	validationSchema
}