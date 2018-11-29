const person = {
	async upsertPerson(_, { input }, ctx, info) {
    const { userId, db } = ctx
    const {
      id,
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
		return db.mutation.upsertPerson({
			where: {
				id: id || 'new'
			},
			create: {
				...planeInput,
			},
			update: {
				...planeInput,
			}
		}, info)
  }
}

module.exports = { person }