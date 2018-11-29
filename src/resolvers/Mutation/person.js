const { tel: { upsertTel } } = require('./tel')

const person = {
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
		// TODO validation
		// if (id) {
    //   const personExists = await db.exists.Person({ id: person.id })
    //   if (!personExists) throw new Error(`Личность отсутствует в базе`)
		// }
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
		if (tels) {
			await Promise.all(tels.map((tel, i) => {
				// first added tel is the default one
				if (!id && i === 0) tel.default = true
				if (!tel.id) tel.personId = upsertedPerson.id
				return upsertTel(_, { input: tel }, ctx, '{ id }')
			}))
		}
		return db.query.person({ where: {id: upsertedPerson.id}}, info)
  }
}

module.exports = { person }