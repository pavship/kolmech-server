const { object, number, string } = require('yup')

// const { validationSchema: personValidationSchema } = require('./person')
const { idValidationType } = require('./commonTypes')

const validationSchema = object().shape({
  id: idValidationType.notRequired(),
  // person: personValidationSchema,
  // articleId: string()
  //   .required('выберите основание платежа'),
  articleId: idValidationType
    .when('id', (id, schema) => id
      ? schema.notRequired()
      : schema.required('выберите основание платежа')
    ),
  personId: idValidationType
    .when('id', (id, schema) => id
      ? schema.notRequired()
      : schema.required('выберите основание платежа')
    ),
  amount: number()
    .positive('зачение должно быть положительным')
    .required('введите сумму')
})

module.exports = {
	validationSchema
}