const { lazy, object, string } = require('yup')
const { validationSchema: personValidationSchema } = require('./person')

const validationSchema = (emp) => object().shape({
  orgId: lazy(() => emp && emp.id
    ? string()
    : string().matches(/^[a-z0-9]{25}$/).required()
  ),
  person: personValidationSchema(emp && emp.person)
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