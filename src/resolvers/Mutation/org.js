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

const checkOrgs = async (_, __, ctx, info) => {
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
		})
		.reduce((res, arr) => [...res, ...arr])
}

const createOrg = async (_, { inn }, ctx, info) => {
	const { db } = ctx
	// org found in db will be updated from MoeDelo server and then returned
	const foundOrg = await db.query.org({ where: { inn } }, info)
	// Check if contractor exists in the Moedelo
	// @ts-ignore
	const orgs = await getMoeDeloOrgs(_, {}, ctx, info)
	const existingOrg = orgs.find(o => o.inn === inn)
	let createdOrg = null
	if (!existingOrg) createdOrg = await createMoeDeloOrg(inn)
	const { moedeloId, name, legalAddress } = existingOrg || createdOrg
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
}

const deleteOrg = async (_, { id }, ctx, info) => {
	const org = await ctx.db.query.org({where: {id}}, '{ id moedeloId }')
	await Promise.all([org].map(async o => {
		const url = moedeloBaseUrl + '/' + o.moedeloId
		// @ts-ignore
		const response = await fetch(url, {
			method: 'DELETE',
			headers
		})
	}))
	return ctx.db.mutation.deleteOrg({ where: { id } }, info)
}

// delete all orgs from prisma db and corresponding orgs from MoeDelo
const deleteAllOrgs = async (_, __, ctx, info) => {
	const orgs = await ctx.db.query.orgs({}, '{ id moedeloId }')
	// calls to MoeDelo API are made sequentially (otherwise not all orgs may be deleted)
	for (let o of orgs) {
		const url = moedeloBaseUrl + '/' + o.moedeloId
		// @ts-ignore
		const response = await fetch(url, {
			method: 'DELETE',
			headers
		})
	}
	return ctx.db.mutation.deleteManyOrgs({ where: { id_in: orgs.map(o => o.id) } }, info)
}

const getMoeDeloOrgs = async (_, __, ctx, info) => {
	const allOrgsResponse = await fetch(moedeloBaseUrl, {
		method: 'GET',
		headers
	})
	const statusText = allOrgsResponse.statusText
	if (statusText !== 'OK') throw new Error('Ошибка сервера МоеДело. Статус запроса: ' + statusText)
	const { ResourceList: orgs } = await allOrgsResponse.json()
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
}

const mergeOrg = async (_, { id, inn }, ctx, info) => {
	const { db } = ctx
	const org = await db.query.org({ where: { id }}, '{ id name amoId deals { id } }')
	if (!org) throw new Error('Organization not found in DB')
	const orgToMerge = await createOrg(_, { inn }, ctx, '{ id name }')
	const deals = org.deals.map(({ id }) => ({ id }))
	await db.mutation.updateOrg({
		where: { id },
		data: { deals: { disconnect: deals } }
	})
	await db.mutation.deleteOrg({ where: { id }})
	return db.mutation.updateOrg({
		where: { id: orgToMerge.id },
		data: {
			amoId: org.amoId,
			name: org.name,
			ulName: orgToMerge.name,
			deals: { connect: deals }
		}
	}, info)
}

const upsertOrgsByInn = async (_, inns, ctx, info) => {
	const { userId, db } = ctx
	let moeDeloOrgs = await org.getMoeDeloOrgs(_, {}, ctx, '{ moedeloId inn name }')
	const existedOrgs = moeDeloOrgs.filter(o => inns.includes(o.inn))
	const createdOrgs = []
	for (let inn of inns.filter(inn => moeDeloOrgs.findIndex(o => o.inn === inn) === -1)) {
		createdOrgs.push(await createMoeDeloOrg(inn))
	}
	moeDeloOrgs = [...existedOrgs, ...createdOrgs]
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

module.exports = { org: {
	checkOrgs,
	createOrg,
	deleteOrg,
	deleteAllOrgs,
	getMoeDeloOrgs,
	mergeOrg,
	upsertOrgsByInn,
}}
