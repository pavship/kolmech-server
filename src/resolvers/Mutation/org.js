const fetch = require('node-fetch')
const moedeloBaseUrl = 'https://restapi.moedelo.org/kontragents/api/v1/kontragent'

const headers = {
	'md-api-key': process.env.MOEDELO_SECRET,
	'Content-Type': 'application/json'
}

const createMoeDeloOrg = async inn => {
	const createOrgUrl = moedeloBaseUrl + '/inn'
	// @ts-ignore
	createOrgResponse = await fetch(createOrgUrl, {
		method: 'POST',
		body: JSON.stringify({
			"Inn": inn,
			"Type": 1
		}),
		headers
	})
	const statusText = createOrgResponse.statusText
	if (statusText !== 'Created') throw new Error('Ошибка сервера МоеДело. Статус запроса createMoeDeloOrg: ' + statusText)
	const { Id: moedeloId, Name: name, LegalAddress: legalAddress } = await createOrgResponse.json()
	return {
		inn,
		legalAddress,
		moedeloId,
		name,
	}
}

const org = {
	async checkOrgs(_, __, ctx, info) {
		const orgs = await ctx.db.query.orgs({}, '{ id inn moedeloId }')
		const moeDeloOrgs = await org.getMoeDeloOrgs(_, __, ctx, info)
		const sortedOrgs = moeDeloOrgs.sort((a, b) => a.inn < b.inn)
		const orgsByInn = sortedOrgs.reduce((res, o, i) => {
			if (i === 0) return [[o]]
			const curInn = res[res.length-1][0].inn
			o.inn === curInn
				? res[res.length - 1].push(o)
				: res[res.length] = [o]
			return res
		}, [])
		toDelete = orgsByInn
			.map(orgs => orgs.sort((a, b) => a.moedeloId < b.moedeloId))
			.map(orgs => {
				return orgs.length === 1
					? []
					: orgs.slice(1)
					// .map(o => o.moedeloId)
			})
			.reduce((res, arr) => [...res, ...arr])
		console.log('toDelete > ', toDelete)
		
		console.log('sortedOrgs > ', sortedOrgs)
		// console.log('excessOrgs > ', excessOrgs)
	},
	async createOrg(_, { inn }, ctx, info) {
		const { userId, db } = ctx
		// if org with provided INN is in db already, then just return it
		const foundOrg = await db.query.org({ where: { inn } }, info)
		// if (foundOrg) return foundOrg
		// Check if contractor exists in the Moedelo
		// @ts-ignore
		// const orgs = await org.getMoeDeloOrgs(_, {}, ctx, '{ id inn name }')
		// const existingOrg = orgs.find(o => o.Inn === inn)
		const existingOrg = null
		let createdOrg = null
		if (!existingOrg) {
			// Create contractor in the Moedelo
			const createOrgUrl = moedeloBaseUrl + '/inn'
			// @ts-ignore
			createOrgResponse = await fetch(createOrgUrl, {
				method: 'POST',
				body: JSON.stringify({
					"Inn": inn,
					"Type": 1
				}),
				headers
			})
			const statusText = createOrgResponse.statusText
			if (statusText !== 'OK') throw new Error('Ошибка сервера МоеДело. Статус запроса: ' + statusText)
			const createdOrg = await createOrgResponse.json()
			console.log('got org > ', createdOrg)
		}
		const { Id: moedeloId, Name: name, LegalAddress: legalAddress } = existingOrg || createdOrg
		if (foundOrg) return db.mutation.updateOrg({
			where: { id: foundOrg.id },
			data: {
				moedeloId,
				name,
				legalAddress
			}
		}, info)
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
				headers
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
				headers
			})
			// console.log('o.moedeloId > ', o.moedeloId)
			// console.log('response > ', response)
		}
		return ctx.db.mutation.deleteManyOrgs({ where: { id_in: orgs.map(o => o.id) } }, info)
	},
	async getMoeDeloOrgs(_, __, ctx, info) {
		const allOrgsResponse = await fetch(moedeloBaseUrl, {
			method: 'GET',
			headers
		})
		const statusText = allOrgsResponse.statusText
		if (statusText !== 'OK') throw new Error('Ошибка сервера МоеДело. Статус запроса: ' + statusText)
		const { ResourceList: orgs } = await allOrgsResponse.json()
		console.log('got orgs > ', orgs.length || orgs)
		return orgs.map(({
			Id: moedeloId,
			Inn: inn,
			LegalAddress: legalAddress,
			Name: name,
		}) => ({
			inn,
			legalAddress,
			moedeloId,
			name,
		}))
	},
	async upsertOrgsByInn(_, inns, ctx, info) {
		const { userId, db } = ctx
		console.log('inns > ', inns)
		let moeDeloOrgs = await org.getMoeDeloOrgs(_, {}, ctx, '{ moedeloId inn name }')
		console.log('moeDeloOrgs > ', moeDeloOrgs)
		const existedOrgs = moeDeloOrgs.filter(o => inns.includes(o.inn))
		const createdOrgs = []
		console.log('inns.filter(inn => moeDeloOrgs.findIndex(o => o.inn === inn) === -1) > ', inns.filter(inn => moeDeloOrgs.findIndex(o => o.inn === inn) === -1))
		for (let inn of inns.filter(inn => moeDeloOrgs.findIndex(o => o.inn === inn) === -1)) {
			createdOrgs.push(await createMoeDeloOrg(inn))
		}
		moeDeloOrgs = [...existedOrgs, ...createdOrgs]
		console.log('moeDeloOrgs > ', moeDeloOrgs)
		return await Promise.all(moeDeloOrgs.map(({
			inn,
			legalAddress,
			moedeloId,
			name,
		}) => 
			db.mutation.upsertOrg({
				where: { inn },
				create: {
					inn,
					legalAddress,
					moedeloId,
					name,
				},
				update: {
					legalAddress,
					moedeloId,
					name,
				}
			})
		))
	}
}

module.exports = { org }
