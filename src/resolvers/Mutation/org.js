const fetch = require('node-fetch')
const moedeloBaseUrl = 'https://restapi.moedelo.org/kontragents/api/v1/kontragent'
const { toLocalTimestamp } = require('../../utils/dates')

const org = {
	async createOrg(_, { inn }, ctx, info) {
		const { userId, db } = ctx
		// if org with provided INN is in db already, then just return it
		const foundOrg = await db.query.org({ where: { inn } }, info)
		if (foundOrg) return foundOrg
		// Create contractor in the Moedelo
		const url = moedeloBaseUrl + '/inn'
		// @ts-ignore
		const response = await fetch(url, {
			method: 'POST',
			body: JSON.stringify({
				"Inn": inn,
				"Type": 2
			}),
			headers: { 
				'md-api-key': process.env.MOEDELO_SECRET,
				'Content-Type': 'application/json'
			}
		})
		const json = await response.json()
		if (!json.Id) throw new Error('МоеДело API error: ' + json.Message)
		const { Id: moedeloId, Name: name, LegalAddress: legalAddress } = json
		return db.mutation.createOrg({
			data: {
				inn,
				moedeloId,
				name,
				legalAddress
			}
		}, info)
	},

	async deleteOrg(_, { id }, ctx, info) {
		const org = await ctx.db.query.org({where: {id}}, '{ id moedeloId }')
		await Promise.all([org].map(async o => {
			const url = moedeloBaseUrl + '/' + o.moedeloId
			// @ts-ignore
			const response = await fetch(url, {
				method: 'DELETE',
				headers: { 
					'md-api-key': process.env.MOEDELO_SECRET,
					'Content-Type': 'application/json'
				}
			})
			// console.log('o.moedeloId > ', o.moedeloId)
			// console.log('response > ', response)
		}))
		return ctx.db.mutation.deleteOrg({ where: { id } }, info)
	},

	// delete all orgs from prisma db and corresponding orgs from MoeDelo
	async deleteAllOrgs(_, __, ctx, info) {
		const orgs = await ctx.db.query.orgs({}, '{ id moedeloId }')
		// calls to MoeDelo API are made sequentially (otherwise not all orgs may be deleted)
		for (let o of orgs) {
			const url = moedeloBaseUrl + '/' + o.moedeloId
			// @ts-ignore
			const response = await fetch(url, {
				method: 'DELETE',
				headers: { 
					'md-api-key': process.env.MOEDELO_SECRET,
					'Content-Type': 'application/json'
				}
			})
			// console.log('o.moedeloId > ', o.moedeloId)
			// console.log('response > ', response)
		}
		return ctx.db.mutation.deleteManyOrgs({ where: { id_in: orgs.map(o => o.id) } }, info)
	},
}

module.exports = { org }
