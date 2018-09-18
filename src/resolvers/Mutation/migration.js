const { GraphQLClient  } = require('graphql-request')

const client = new GraphQLClient( 
	process.env.GQ_ENDPOINT, 
	{ headers: { Authorization: `Bearer ${process.env.GQ_TOKEN}` } }
)

const migration = {
	async importModels(_, __, ctx, info) {
		try {
			const models = await client.request(`{
				allModels {
					id
					article
					name
				}
			}`)
			if (!models.allModels.length) throw new Error('something wrong with graphcool request')
			let count = 0
			for (let {id, article, name} of models.allModels) {
				const upserted = await ctx.db.mutation.upsertModel({
					where: {
					  gqId: id
					},
					create: {
						gqId: id,
						article,
						name
					},
					update: {
						article,
						name
					}
				}, '{ gqId }')
				count++
			}
			// add notInTheList item (temporary solution) //TODO implement model creation feature
			const notInTheList = await ctx.db.mutation.upsertModel({
				where: {
				  name: 'Нет в списке'
				},
				create: {
					gqId: null,
					article: null,
					name: 'Нет в списке'
				},
				update: {
					gqId: null,
					article: null,
					name: 'Нет в списке'
				}
			}, '{ gqId }')
			count++
			return { count }
		} catch (err) {
			console.log(err)
			return null
		}
	},

	async seedEnquiryStatuses(_, __, ctx, info) {
		const statuses = [
			{
				"stage": 0,
				"name": "Новая",
				"prev": [],
				"next": ["В работе"]
			},
			{
				"stage": 1,
				"name": "В работе",
				"prev": ["Новая"],
				"next": ["Ждем уточнений", "Выставлено КП", "Нет возможности"]
			},
			{
				"stage": 2,
				"name": "Ждем уточнений",
				"prev": ["В работе"],
				"next": ["Отказ", "Заказ"]
			},
			{
				"stage": 2,
				"name": "Выставлено КП",
				"prev": ["В работе"],
				"next": ["Отказ", "Заказ"]
			},
			{
				"stage": 2,
				"name": "Нет возможности",
				"prev": ["В работе"],
				"next": ["Отказ", "Заказ"]
			},
			{
				"stage": 3,
				"name": "Отказ",
				"prev": ["Ждем уточнений", "Выставлено КП", "Нет возможности"],
				"next": []
			},
			{
				"stage": 3,
				"name": "Заказ",
				"prev": ["Ждем уточнений", "Выставлено КП", "Нет возможности"],
				"next": []
			}
		]
		try {
			const upsertedStatuses = await Promise.all(statuses.map(({ name, stage }) => {
				return ctx.db.mutation.upsertStatus({
					where: {
					  name
					},
					create: {
						name,
						stage
					},
					update: {}
				}, '{ id name }')
			}))
			// console.log('upsertedStatuses > ', upsertedStatuses)
			const updatedStatuses = await Promise.all(upsertedStatuses.map(({ id, name }) => {
				return ctx.db.mutation.updateStatus({
					where: { id },
					data: {
						prev: {
							connect: statuses.find(s => s.name === name).prev.map(name => ({id: upsertedStatuses.find(crS => crS.name === name).id }))
						},
						next: {
							connect: statuses.find(s => s.name === name).next.map(name => ({id: upsertedStatuses.find(crS => crS.name === name).id }))
						}
					}
				}, '{ id name stage prev { id name stage } next { id name stage } }')
			}))
			// console.log('updatedStatuses > ', updatedStatuses)
			return { count: updatedStatuses.length }
		} catch (err) {
			console.log(err)
			return null
		}
	},

	// async getConstants(_, __, ctx, info) {
	// 	try {
	// 		// statuses
	// 		// const coStatusId = 'cjlj2561q00130959gtcqhoew' // commercial offer status
	// 		// export const orderStatusId = 'cjlj2ckgy001i09599l147fot'
	// 		// export const refusalStatusIds = ['cjlj25g4q00170959picodhln', 'cjlj2c004001c0959k6qq42xz']
	// 	} catch (err) {
	// 		console.log(err)
	// 		return null
	// 	}
	// }
}

module.exports = { migration }
