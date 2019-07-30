const { generateMutationObject } = require('../utils')

const appoint = {
  async upsertAppoint(_, { input }, ctx, info) {
    const { db } = ctx
    console.log('input > ', JSON.stringify(input, null, 2))
    const mutationObj = await generateMutationObject(input, 'appoint', ctx)
    console.log('mutationObj > ', JSON.stringify(mutationObj, null, 2))
    if (!input.id) return db.mutation.createAppoint(mutationObj, info)
      else return db.mutation.updateAppoint(mutationObj, info)
  },
}

module.exports = { 
	appoint
}