const { validationSchema } = require('../../schema/payment')
const { generateMutationObject } = require('../utils')

const payment = {
	async upsertPayment(_, { input }, ctx, info) {
		const { userId, db } = ctx
		const validated = await validationSchema.validate(input)
		// console.log('input > ', JSON.stringify(input, null, 2))
    // console.log('validated > ', JSON.stringify(validated, null, 2))
    // connect payment to this user's default account
    validated.accountId = (await db.query.user({ 
      where: { id: userId }
    }, ' { account { id} }' )).account.id
    const mutationObj = await generateMutationObject(validated, 'payment', ctx, { includeUser: true })
    // console.log('mutationObj > ', JSON.stringify(mutationObj, null, 2))
    if (!input.id) return db.mutation.createPayment(mutationObj, info)
      else return db.mutation.updatePayment(mutationObj, info)
  }
}

module.exports = { payment }