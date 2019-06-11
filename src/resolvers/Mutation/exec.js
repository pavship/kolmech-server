const { generateMutationObject } = require('../utils')

const exec = {
  async upsertExec(_, { input }, ctx, info) {
    const { db } = ctx
    console.log('input > ', JSON.stringify(input, null, 2))
    const mutationObj = await generateMutationObject(input, 'exec', ctx)
    console.log('mutationObj > ', JSON.stringify(mutationObj, null, 2))
    if (!input.id) return db.mutation.createExec(mutationObj, info)
      else return db.mutation.updateExec(mutationObj, info)
  },
}

module.exports = { 
	exec
}