const differenceBy = require('lodash/differenceBy')

const order = {
	async upsertOrder(_, { id, enquiryId = '', dateLocal, qty, amount }, ctx, info) {
		const { userId, db } = ctx
		let orgId = ''
		let modelId = ''
		let num = 0
		let fullnum = ''
		// if new
		if (!id) {
			const enquiry = await db.query.enquiry({ where: { id: enquiryId } }, '{ id num org { id } model { id } }')
			if (!enquiry) throw new Error(`Заявка не найдена в базе`)
			orgId = enquiry.org.id
			modelId = enquiry.model.id
			// Automatically assign incremented counter number for the new order of corresponding org
			const lastOrgOrder = await db.query.orders({where: { org: { id: orgId }}, last: 1 }, '{ num }')
			num = (!lastOrgOrder[0] || !lastOrgOrder[0].num) ? 1 : lastOrgOrder[0].num + 1
			fullnum = enquiry.num + '-' + num
		}
		return db.mutation.upsertOrder({
			where: {
				id: id || 'new'
			},
			create: {
				num,
				fullnum,
				dateLocal,
				qty,
				amount,
				enquiry: {
					connect: {
						id: enquiryId
					}
				},
				org: {
					connect: {
						id: orgId
					}
				},
				model: {
					connect: {
						id: modelId
					}
				},
			},
			update: {
				...dateLocal && { dateLocal },
				...qty && { qty },
				...amount && { amount },
			}
		}, info)
	},
	async reserveProds(_, { orderId, prodIds }, ctx, info) {
		const { userId, db } = ctx
    const newProds = await db.query.prods({
      where: {
        id_in: prodIds
      }
    }, '{ id fullnumber }')
    if (newProds.length !== prodIds.length) {
      throw new Error(`Не все изделия найдены в базе. Рзервирование не производилось.`)
		}
		const order = await db.query.order({
			where: { id: orderId }
		}, '{ id prods { id } }')
		if (!order) throw new Error(`Заказ не найден в базе`)
		const oldProds = order.prods
		return db.mutation.updateOrder({
			where: { id: orderId },
			data: {
				prods: {
					disconnect: differenceBy(oldProds, newProds, 'id').map(({ id }) => ({ id })),
					connect: differenceBy(newProds, oldProds, 'id').map(({ id }) => ({ id }))
				}
			}
		}, info)
	}
}

module.exports = { order }
