const { generateMutationObject } = require('../utils')

const batch = {
  async upsertBatch(_, { input }, ctx, info) {
    const { db } = ctx
    const mutationObj = await generateMutationObject(input, 'batch', ctx)
    if (!input.id) return db.mutation.createBatch(mutationObj, info)
      else return db.mutation.updateBatch(mutationObj, info)
  },
}

module.exports = { 
	batch
}