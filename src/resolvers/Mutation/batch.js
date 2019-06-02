const { generateMutationObject } = require('../utils')

const batch = {
  async upsertBatch(_, { input }, ctx, info) {
    const { db } = ctx
    console.log('input > ', JSON.stringify(input, null, 2))
    const mutationObj = await generateMutationObject(input, 'batch', ctx)
    console.log('mutationObj > ', JSON.stringify(mutationObj, null, 2))
    if (!input.id) return db.mutation.createBatch(mutationObj, info)
      else return db.mutation.updateBatch(mutationObj, info)
  },
}

module.exports = { 
	batch
}