const order = {
	async upsertOrder(_, { id, enquiryId, dateLocal, qty, amount }, ctx, info) {
		if (id) {
			const enquiryExists = await ctx.db.exists.Enquiry({
				id: enquiryId
			})
			if (!enquiryExists) {
				throw new Error(`Заявка не найдена в БД`)
			}
		}
		return ctx.db.mutation.upsertOrder({
			where: {
				id: 'new'
			},
			create: {
				dateLocal,
				qty,
				amount,
				enquiry: {
					connect: {
						id: enquiryId
					}
				}
			},
			update: {
				...dateLocal && { dateLocal },
				...qty && { qty },
				...amount && { amount },
				...enquiryId && {
					enquiry: {
						connect: {
							id: enquiryId
						}
					}
				}
			}
		}, info)
	},

}

module.exports = { order }
