const { object, number, string, date } = require('yup')
const { idValidationType } = require('./commonTypes')

const validationSchema = object().shape({
  id: idValidationType.notRequired(),
  accountId: idValidationType
    .when('id', (id, schema) => id
      ? schema.notRequired()
      : schema.required('выберите счет для проведения платежа')
    ),
  articleId: idValidationType
    .when('id', (id, schema) => id
      ? schema.notRequired()
      : schema.required('выберите основание платежа')
    ),
  amount: number()
    .positive('зачение должно быть положительным')
    .when('id', (id, schema) => id
      ? schema.notRequired()
      : schema.required('введите сумму платежа'),
    ),
  // dateLocal: date('неверный формат даты')
  dateLocal: string()
    .when('id', (id, schema) => id
      ? schema.notRequired()
      : schema.required('введите дату и время в формате ГГГГ-ММ-ДДTЧЧ:ММ'),
    ),
    // TODO create proper isValidISODate function to check date
    // .transform(function(value, originalValue) {
    //   return isValidISODate(value) ? value : new Date('');
    // }),
  equipmentId: idValidationType
    .notRequired(),
    // TODO proper conditional validation of equipmentId
    // equipmentId: idValidationType
    //   .when('articleId', (articleId, schema) => 
    //     articles.find(a => a.id === articleId).relations.includes('EQUIPMENT')
    //     ? schema.required('выберите оборудование')
    //     : schema.strip()
    //   ),
  personId: idValidationType
    .notRequired(),
    // TODO I'm disappointed with yup. Schema definition rules are not semantic, need to change to something else!
    // .when('id', (id, schema) => id
    //   ? schema.notRequired()
    //   : schema.required('выберите контрагента')
    // ),
  orgId: idValidationType
    .notRequired(),
  purpose: string()
    .max(250, 'превышено максимальное число символов (250)')
    .notRequired(),
})

module.exports = {
	validationSchema
}