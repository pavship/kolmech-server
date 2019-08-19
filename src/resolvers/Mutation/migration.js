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
	},

	// 2019-01-12 I desided to store order's fullnumber of format "<enquiry.num>-<order.num>" in the fullnumber field
	async populateOrderFullnums(_, __, ctx, info) {
		try {
			const { db } = ctx
			const orders = await db.query.orders({}, '{ id num enquiry { id num }}')
			// 1. Write string fullnumber into temporary column
			const updated = await Promise.all(orders.map(({ id, num, enquiry }) =>
				db.mutation.updateOrder({ 
					where: { id },
					data: {
						fullnum: enquiry.num + '-' + num
					}
				})
			))
			return { count: updated.length }
		} catch (err) {
			console.log(err)
			return null
		}
	},

	async populatePaymentArticles(_, __, ctx, info) {
		const articles = [
			{ name: 'administrative', rusName: 'Административные расходы'},
			{ name: 'commercial', rusName: 'Коммерческие расходы'},
			{ name: 'consumables', rusName: 'Расходники', relations: { set: ['EQUIPMENT'] }},
			{ name: 'hh', rusName: 'Подбор персонала'},
			{ name: 'lend', rusName: 'Займ (Выдача)', isLoan: true},
			{ name: 'loan', rusName: 'Займ (Получение)', isLoan: true, isIncome: true},
			{ name: 'maintainance', rusName: 'ТО Оборудования', relations: { set: ['EQUIPMENT'] }},
			{ name: 'modernization', rusName: 'Модернизация оборудования', relations: { set: ['EQUIPMENT'] }},
			{ name: 'nonCoreRevenue', rusName: 'Выручка (Неосновная деятельность)', isIncome: true},
			{ name: 'otherExpenses', rusName: 'Прочие расходы'},
			{ name: 'repair', rusName: 'Ремонт оборудования', relations: { set: ['EQUIPMENT'] }},
			{ name: 'revenue', rusName: 'Выручка (Основная деятельность)', isIncome: true},
			{ name: 'tools', rusName: 'Оснастка/Инструмент', relations: { set: ['EQUIPMENT'] }},
			{ name: 'transport', rusName: 'Транспорт'},
			{ name: 'salary', rusName: 'ЗП'},
			{ name: 'training', rusName: 'Обучение персонала'},
		]
		const existing = await ctx.db.query.articles({}, '{ id name }')
		const existingNames = existing.map(a => a.name)
		const toCreate = articles.filter(a => !existingNames.includes(a.name))
		const toUpdate = articles
			.filter(a => existingNames.includes(a.name))
			.map(a => ({
				...a,
				id: existing.find(e => e.name === a.name).id
			}))
		const created = await Promise.all(toCreate.map(({ name, rusName, isLoan, isIncome, relations }) =>
			ctx.db.mutation.createArticle({
				data: { name, rusName, isLoan, isIncome, relations }
			})
		))
		const updated = await Promise.all(toUpdate.map(({ id, ...rest }) =>
			ctx.db.mutation.updateArticle({
				where: { id },
				data: { ...rest }
			})
		))
		return { count: created.length + updated.length }
	},

	async populatePaymentAccounts(_, __, ctx, info) {
		const { db } = ctx
		const [ sm ] = await db.query.users({
			where: { id: process.env.SENIOR_MANAGER_USER_ID }},
			'{ id person { amoName } }'
		)
		const [ director ] = await db.query.users({
			where: { id: process.env.DIRECTOR_USER_ID }},
			'{ id person { amoName } }'
		)
		const smLName = sm.person.amoName.split(' ')[1]
		const directorLName = director.person.amoName.split(' ')[1]
		const accounts = [
			{ name: smLName},
			{ name: directorLName},
		]
		const existing = await ctx.db.query.accounts({}, '{ id name }')
		const existingNames = existing.map(a => a.name)
		const toCreate = accounts.filter(a => !existingNames.includes(a.name))
		const created = await Promise.all(toCreate.map(({ name }) =>
			ctx.db.mutation.createAccount({
				data: { name }
			}, '{ id name }')
		))
		const allAccounts = [...existing, ...created]
		// assign default accounts to users
		await ctx.db.mutation.updateUser({where: { id: sm.id },
			data: { account: { connect: {id: allAccounts.find(a => a.name === smLName).id}} }
		})
		await ctx.db.mutation.updateUser({where: { id: director.id },
			data: { account: { connect: {id: allAccounts.find(a => a.name === directorLName).id}} }
		})
		return { count: created.length }
		// Playground query
		// createAccount(data: {
		// 	name: "Точка ИП",
		// 	number: process.env.TOCHKA_ACCOUNT_CODE_IP
		// }) { id }
	},

	async populateEquipment(_, __, ctx, info) {
		const equipment = [
			{ name: 'TOS SUI 63-80'},
			{ name: 'Sunnen HTH-4000S'},
			{ name: 'ГРФ'},
		]
		const existing = await ctx.db.query.equipments({}, '{ id name }')
		const existingNames = existing.map(e => e.name)
		const toCreate = equipment.filter(e => !existingNames.includes(e.name))
		const toUpdate = equipment
			.filter(e => existingNames.includes(e.name))
			.map(e => ({
				...e,
				id: existing.find(exi => exi.name === e.name).id
			}))
		const created = await Promise.all(toCreate.map(e =>
			ctx.db.mutation.createEquipment({ data: e })
		))
		const updated = await Promise.all(toUpdate.map(({ id, ...rest }) =>
			ctx.db.mutation.updateEquipment({
				where: { id },
				data: { ...rest }
			})
		))
		return { count: created.length + updated.length }
	},

}

module.exports = { migration }
