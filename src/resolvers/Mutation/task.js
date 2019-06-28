const { generateMutationObject } = require('../utils')

const upsertTask = async (_, { input }, ctx, info) => {
  const { db } = ctx
  console.log('input > ', JSON.stringify(input, null, 2))
  const mutationObj = await generateMutationObject(input, 'task', ctx)
  console.log('mutationObj > ', JSON.stringify(mutationObj, null, 2))
  if (!input.id) return db.mutation.createTask(mutationObj, info)
    else return db.mutation.updateTask(mutationObj, info)
}

module.exports = { 
	task: {
    upsertTask
  }
}