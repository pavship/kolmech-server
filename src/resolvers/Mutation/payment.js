const { validationSchema } = require('../../schema/payment')
const { generateMutationObject } = require('../utils')

const payment = {
	async upsertPayment(_, { input }, ctx, info) {
    try {
      const { userId, db } = ctx
      console.log('input > ', input)
      const validated = await validationSchema.validate(input)
      console.log('validated > ', validated)
      // additionaly validate equipment field TODO implement this within yup schema
      if (validated.articleId) {
        const article = await db.query.article({ where: { id: validated.articleId }}, '{ relations }')
        if (!!validated.equipmentId && !article.relations.includes('EQUIPMENT'))
          throw new Error ('для указанной статьи поле Оборудование не применимо')
      }
      if (validated.personId && validated.orgId)
        throw new Error ('не допускается указывать одновременно два контрагента: ФЛ и Компанию')
      // for new records, connect payment to this user's default account
      if (!validated.id) {
        validated.accountId = (await db.query.user({ 
          where: { id: userId }
        }, ' { account { id} }' )).account.id
      }
      const mutationObj = await generateMutationObject(validated, 'payment', ctx, { includeUser: true })
      console.log('mutationObj > ', mutationObj)
      if (!input.id) return db.mutation.createPayment(mutationObj, info)
        else return db.mutation.updatePayment(mutationObj, info)
    } catch (err) {
      console.log('err > ', err)
      throw err
    }
  }
}

module.exports = { payment }