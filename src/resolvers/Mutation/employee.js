const { lazy, object, string } = require('yup')

const { person: { upsertPerson } } = require('./person')
const { validationSchema } = require('../../schema/employee')
const { makeCreateObject } = require('../utils')

const employee = {
	async upsertEmployee(_, { input }, ctx, info) {
		const { userId, db } = ctx
		const validated = await validationSchema(input).validate(input)
		const commented = {
			// TODO (if needed): following comment is how array of errors can be handled
			// source: https://www.youtube.com/watch?v=JMLTlMAejX4
			// try {
			// 	await schema.validate(input, { abortEarly: false })
			// } catch (err) {
			// 	console.log('err > ', err)
			// }
		}
		console.log('input > ', JSON.stringify(input, null, 2))
		console.log('validated > ', JSON.stringify(validated, null, 2))
		const createObj = await makeCreateObject(validated, 'employee', ctx)
    console.log('createObj > ', JSON.stringify(createObj, null, 2))
    if (!input.id) return db.mutation.createEmployee(createObj, info)
		// const {
    //   id,
    //   orgId,
    //   person: personInput,
    //   ...planeInput
    // } = input
	// 	if (!input.id) return db.mutation.createEmployee({
	// 		data: {
	// 			...planeInput,
  //       org: {
  //         connect: {
  //           id: orgId
  //         }
  //       },
  //       person: {
  //         connect: {
  //           id: person.id
  //         }
  //       }
	// 		}
	// 	}, info)
  },
	// async upsertEmployee(_, { input }, ctx, info) {
  //   const { userId, db } = ctx
    // const {
    //   id,
    //   orgId,
    //   person: personInput,
    //   ...planeInput
    // } = input
  //   const {
  //     position
  //   } = planeInput
  //   // validation
  //   if (!id) {
  //     const orgExists = await db.exists.Org({ id: orgId })
  //     if (!orgExists) throw new Error(`Организация отсутствует в базе`)
  //   }
  //   let person = null
  //   if (personInput) {
  //     if (id && !personInput.id) {
  //       const employee = await db.query.employee( {where: { id } }, '{ person { id } }')
  //       personInput.id = employee.person.id
  //     }
  //     person = await upsertPerson(_, { input: personInput }, ctx, '{ id }')
  //   }
  //   if (!id) return db.mutation.createEmployee({
	// 		data: {
	// 			...planeInput,
  //       org: {
  //         connect: {
  //           id: orgId
  //         }
  //       },
  //       person: {
  //         connect: {
  //           id: person.id
  //         }
  //       }
	// 		}
	// 	}, info)
	// 	return db.mutation.updateEmployee({
	// 		where: { id },
	// 		data: {
	// 			...planeInput,
	// 			...orgId && {
	// 				org: {
	// 					connect: {
	// 						id: orgId
	// 					}
	// 				}
	// 			},
	// 			...input.person && input.person.id && {
	// 				person: {
	// 					connect: {
	// 						id: person.id
	// 					}
	// 				}
	// 			},
	// 		}
	// 	}, info)
  // }
}

module.exports = { employee }