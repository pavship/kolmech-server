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
    const {
      position
    } = planeInput
    // validation
    if (!id) {
      const orgExists = await db.exists.Org({ id: orgId })
      if (!orgExists) throw new Error(`Организация отсутствует в базе`)
    }
    let person = null
    if (personInput) {
      if (id && !personInput.id) {
        const employee = await db.query.employee( {where: { id } }, '{ person { id } }')
        personInput.id = employee.person.id
      }
      person = await upsertPerson(_, { input: personInput }, ctx, '{ id }')
    }
    if (!id) return db.mutation.createEmployee({
			data: {
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
        }
			}
		}, info)
		return db.mutation.updateEmployee({
			where: { id },
			data: {
				...planeInput,
				...orgId && {
					org: {
						connect: {
							id: orgId
						}
					}
				},
				...input.person && input.person.id && {
					person: {
						connect: {
							id: person.id
						}
					}
				},
			}
		}, info)
		// return db.mutation.upsertEmployee({
		// 	where: {
		// 		id: id || 'new'
		// 	},
		// 	create: {
		// 		...planeInput,
		// 		...orgId && {
		// 			org: {
		// 				connect: {
		// 					id: orgId
		// 				}
		// 			}
		// 		},
		// 		...personInput && {
		// 			person: {
		// 				connect: {
		// 					id: person.id
		// 				}
		// 			}
		// 		},
		// 	},
		// 	update: {
		// 		...planeInput,
		// 		...orgId && {
		// 			org: {
		// 				connect: {
		// 					id: orgId
		// 				}
		// 			}
		// 		},
		// 		...personInput && {
		// 			person: {
		// 				connect: {
		// 					id: person.id
		// 				}
		// 			}
		// 		},
		// 	}
		// }, info)
  }
}

module.exports = { employee }