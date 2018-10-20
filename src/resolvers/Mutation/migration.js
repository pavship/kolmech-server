const { GraphQLClient  } = require('graphql-request')

const client = new GraphQLClient( 
	process.env.GQ_ENDPOINT, 
	{
		headers: { Authorization: `Bearer ${process.env.GQ_TOKEN}` }
	}
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
			return { count: updatedStatuses.length }
		} catch (err) {
			console.log(err)
			return null
		}
	},

	async connectEnquiriesToDocsAndStatus(_, __, ctx, info) {
		try {
			const { db } = ctx
			const enquiries = await db.query.enquiries({}, `
				{ 
					id
					num
					events {
						id
						doc {
							id
							type
						}
						status {
							id
							name
						}
					}
				}
			`)
			const updatedEnquiries = await Promise.all(enquiries.map(({ id, num, events }) =>
				db.mutation.updateEnquiry({
					where: { id },
					data: {
						status: {
							connect: {
								id: events.filter(e => !!e.status).pop().status.id
							}
						},
						docs: {
							connect: events
								.filter(e => !!e.doc && e.doc.type === 'CO')
								.map(e => ({ id: e.doc.id }))
						}
					}},
					'{ id status { id } docs { id } }'
				)
			))
			return { count: updatedEnquiries.length }
		} catch (err) {
			console.log(err)
			return null
		}
	}

}

module.exports = { migration }
