const { validationSchema } = require('../../schema/model')
const { generateMutationObject } = require('../utils')

const model = {
	async upsertModel(_, { input }, ctx, info) {
		const { userId, db } = ctx
		const validated = await validationSchema.validate(input)
		console.log('input > ', JSON.stringify(input, null, 2))
		console.log('validated > ', JSON.stringify(validated, null, 2))
    const mutationObj = await generateMutationObject(validated, 'model', ctx)
    console.log('mutationObj > ', JSON.stringify(mutationObj, null, 2))
    if (!input.id) return db.mutation.createModel(mutationObj, info)
      else return db.mutation.updateModel(mutationObj, info)
  }
}

module.exports = { model }