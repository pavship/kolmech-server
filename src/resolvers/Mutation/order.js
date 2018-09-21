const fetch = require('node-fetch')
const baseURL = 'https://restapi.moedelo.org/kontragents/api/v1/kontragent'
const { toLocalTimestamp } = require('../../utils/dates')

const order = {
	async upsertOrder(_, { id, enquiryId, dateLocal, num, amount }, ctx, info) {
		if (id) {
			const enquiryExists = await ctx.db.exists.Enquiry({
				id: enquiryId
			})
			if (!enquiryExists) {
				throw new Error(`Post not found or you're not the author`)
			}
		}
		ctx.db.mutation.upsertOrder({
			where: {
				id
			},
			create: {
				dateLocal,
				num,
				amount,
				enquiry: {
					connect: {
						id: enquiryId
					}
				}
			},
			update: {
				...dateLocal && { dateLocal },
				...num && { num },
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
