const { validationSchema } = require('../../schema/payment')
const { generateMutationObject } = require('../utils')
const { migration: { populateAccountsBalances } } = require('./migration')

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
      // if (!validated.id) {
      //   validated.accountId = (await db.query.user({ 
      //     // where: { id: userId }
      //     where: { email: 'pavship.developer@tutamail.com' }
      //   }, ' { account { id} }' )).account.id
      // }
      const mutationObj = await generateMutationObject(validated, 'payment', ctx, { includeUser: true })
      console.log('mutationObj > ', mutationObj)
      if (!input.id) {
        const account = await db.query.account({ where: { id: validated.accountId} }, '{ balance }')
        const article = await db.query.article({ where: { id: validated.articleId} }, '{ isIncome }')
        await db.mutation.updateAccount({
          where: { id: validated.accountId},
          data: { balance: account.balance + (article.isIncome ? 1 : -1 ) * validated.amount }
        })
        return db.mutation.createPayment(mutationObj, info)
      }
      else {
        const result = await db.mutation.updatePayment(mutationObj, info)
        if (input.amount || input.accountId) await populateAccountsBalances(_, _, ctx, '{ id }')
        return result
      }
    } catch (err) {
      console.log('err > ', err)
      throw err
    }
  }
}

module.exports = { payment }