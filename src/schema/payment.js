const { object, number, string, date } = require('yup')

// const { validationSchema: personValidationSchema } = require('./person')
const { idValidationType } = require('./commonTypes')

const validationSchema = object().shape({
  id: idValidationType.notRequired(),
  dateLocal: date('неверный формат даты')
    .required('введите дату и время в формате ГГГГ-ММ-ДДTЧЧ:ММ'),
    // TODO create proper isValidISODate function to check date
    // .transform(function(value, originalValue) {
    //   return isValidISODate(value) ? value : new Date('');
    // }),
  // person: personValidationSchema,
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