const { generateMutationObject } = require('../utils')
const { tel: { upsertTel } } = require('./tel')

const person = {
	async upsertPerson2(_, { input }, ctx, info) {
		const { db } = ctx
    console.log('input > ', JSON.stringify(input, null, 2))
    const mutationObj = await generateMutationObject(input, 'person', ctx)
    console.log('mutationObj > ', JSON.stringify(mutationObj, null, 2))
    if (!input.id) return db.mutation.createPerson(mutationObj, info)
      else return db.mutation.updatePerson(mutationObj, info)
	},
	async upsertPerson(_, { input }, ctx, info) {
    const { userId, db } = ctx
    const {
			id,
			tels,
      ...planeInput
    } = input
    const {
      // position
    } = planeInput || {}
		// validation
		console.log('input > ', input)
		console.log('id > ', id)
		console.log('planeInput > ', planeInput)
		const upsertedPerson = db.mutation.upsertPerson({
			where: {
				id: id || 'new'
			},
			create: {
				...planeInput
			},
			update: {
				...planeInput,
			}
		}, '{ id }')
		console.log('upsertedPerson > ', upsertedPerson)
		if (tels) {
			await Promise.all(tels.map((tel, i) => {
				// first added tel is the default one
				if (!id && i === 0) tel.default = true
				if (!tel.id) tel.personId = upsertedPerson.id
				console.log('tel > ', tel)
				return upsertTel(_, { input: tel }, ctx, '{ id }')
			}))
		}
		return db.query.person({ where: {id: upsertedPerson.id}}, info)
  }
}

module.exports = { 
	person
}