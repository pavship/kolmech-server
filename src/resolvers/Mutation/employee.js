const { person: { upsertPerson } } = require('./person')

const employee = {
	async upsertEmployee(_, { input }, ctx, info) {
    const { userId, db } = ctx
    const {
      id,
      orgId,
      person: personInput,
      ...planeInput
    } = input
    console.log('planeInput > ', planeInput)
    const {
      position
    } = planeInput
    // validation
    const orgExists = await db.exists.Org({ id: orgId })
    if (!orgExists) throw new Error(`Организация отсутствует в базе`)
    let person = null
    if (personInput) {
      person = await upsertPerson(_, { input: personInput }, ctx, '{ id }')
      console.log('person > ', person)
    }
		return db.mutation.upsertEmployee({
			where: {
				id: id || 'new'
			},
			create: {
				...planeInput,
				org: {
					connect: {
						id: orgId
					}
				},
				person: {
					connect: {
						id: person.id
					}
				},
			},
			update: {
				...planeInput,
				...orgId && {
					org: {
						connect: {
							id: orgId
						}
					}
				},
				...personInput && {
					person: {
						connect: {
							id: person.id
						}
					}
				},
			}
		}, info)
  }
}

module.exports = { employee }