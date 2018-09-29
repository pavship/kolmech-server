const order = {
	async upsertOrder(_, { id, enquiryId, dateLocal, qty, amount }, ctx, info) {
		const { userId, db } = ctx
		let orgId = ''
		let num = 0
		// if new
		if (!id) {
			const enquiry = await db.query.enquiry({ where: { id: enquiryId } }, '{ id org { id } }')
			if (!enquiry) throw new Error(`Заявка не найдена в базе`)
			orgId = enquiry.org.id
			// Automatically assign incremented counter number for the new order of corresponding org
			const lastOrgOrder = await db.query.orders({where: { org: { id: orgId }}, last: 1 }, '{ num }')
			num = (!lastOrgOrder[0] || !lastOrgOrder[0].num) ? 1 : lastOrgOrder[0].num + 1
		} 
		return db.mutation.upsertOrder({
			where: {
				id: id || 'new'
			},
			create: {
				num,
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
				}
			},
			update: {
				...dateLocal && { dateLocal },
				...qty && { qty },
				...amount && { amount },
			}
		}, info)
	},

}

module.exports = { order }
