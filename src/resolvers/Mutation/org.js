const fetch = require('node-fetch')
const baseURL = 'https://restapi.moedelo.org/kontragents/api/v1/kontragent'
const { getUserId } = require('../../utils')
const { toLocalTimestamp } = require('../../utils/dates')

const org = {
	async createOrg(_, { inn }, ctx, info) {
        const userId = getUserId(ctx)
        // check org with provided INN doesn't exist
        const orgExists = await ctx.db.exists.Org({ inn })
        if (orgExists) throw new Error(`Организация с инн ${inn} уже существует в базе`)
        // Create contractor in the Moedelo
        const url = baseURL + '/inn'
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
        // return {
        //     id: 'new',
        //     inn,
        //     moedeloId,
        //     name
        // }
		return ctx.db.mutation.createOrg({
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
            const url = baseURL + '/' + o.moedeloId
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
            const url = baseURL + '/' + o.moedeloId
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
