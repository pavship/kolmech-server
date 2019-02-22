const { validationSchema } = require('../../schema/employee')
const { generateMutationObject } = require('../utils')

const employee = {
	async upsertEmployee(_, { input }, ctx, info) {
		const { userId, db } = ctx
		const validated = await validationSchema.validate(input)
		const commented = {
			// TODO (if needed): following comment is how array of errors can be handled
			// source: https://www.youtube.com/watch?v=JMLTlMAejX4
			// try {
			// 	await schema.validate(input, { abortEarly: false })
			// } catch (err) {
			// 	console.log('err > ', err)
			// }
		}
		// console.log('input > ', JSON.stringify(input, null, 2))
		// console.log('validated > ', JSON.stringify(validated, null, 2))
    const mutationObj = await generateMutationObject(validated, 'employee', ctx)
    // console.log('mutationObj > ', JSON.stringify(mutationObj, null, 2))
    if (!input.id) return db.mutation.createEmployee(mutationObj, info)
      else return db.mutation.updateEmployee(mutationObj, info)
  }
}

module.exports = { employee }