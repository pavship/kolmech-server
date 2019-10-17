const { generateMutationObject } = require('../utils')
const fetch = require('node-fetch')
const axios = require('axios')
const { getAmoCompany } = require('./amo')

const moedeloBaseUrl = 'https://restapi.moedelo.org/kontragents/api/v1/kontragent'

const headers = {
	'md-api-key': process.env.MOEDELO_SECRET,
	'Content-Type': 'application/json'
}

const MoeDelo = axios.create({
	baseUrl: moedeloBaseUrl,
	headers
})

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
	// org found in db will be updated acoording to MoeDelo and AmoCRM and then returned
	const foundOrg = await db.query.org({ where: { inn } }, info)
	const foundAmoCompany = await getAmoCompany(_, { query: inn }, ctx, info)
	const orgs = await getMoeDeloOrgs(_, { inn }, ctx, info)
	if (orgs.length > 1) throw new Error(`There are duplicated orgs with inn: ${inn} in MoeDelo`)
	const existingOrg = orgs[0]
	let createdOrg = null
	if (!existingOrg) createdOrg = await createMoeDeloOrg(inn)
	const { moedeloId, name, legalAddress } = existingOrg || createdOrg
	if (foundOrg) return db.mutation.updateOrg({
		where: { id: foundOrg.id },
		data: {
			...foundAmoCompany && { amoId: foundAmoCompany.id },
			moedeloId,
			name: foundAmoCompany ? foundAmoCompany.name : name,
			ulName: name,
			legalAddress,
		}
	}, info)
	return db.mutation.createOrg({
		data: {
			...foundAmoCompany && { amoId: foundAmoCompany.id },
			inn,
			moedeloId,
			name: foundAmoCompany ? foundAmoCompany.name : name,
			ulName: name,
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

const getMoeDeloOrgs = async (_, { inn }, ctx, info) => {
	const url = inn
		? moedeloBaseUrl +'/?pageSize=5000' +'&inn=' + inn
		: moedeloBaseUrl +'/?pageSize=5000'
	const allOrgsResponse = await fetch(url, {
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

const upsertOrg = async (_, { input }, ctx, info) => {
	const { db } = ctx
	console.log('input > ', JSON.stringify(input, null, 2))
	const mutationObj = await generateMutationObject(input, 'org', ctx)
	console.log('mutationObj > ', JSON.stringify(mutationObj, null, 2))
	if (!input.id) return db.mutation.createOrg(mutationObj, info)
		else return db.mutation.updateOrg(mutationObj, info)
}

const upsertOrgsByInn = async (_, inns, ctx, info) => {
	const { userId, db } = ctx
	let moeDeloOrgs = await getMoeDeloOrgs(_, {}, ctx, '{ moedeloId inn name }')
	const existedOrgs = moeDeloOrgs.filter(o => inns.includes(o.inn))
	const newInns = inns.filter(inn => moeDeloOrgs.findIndex(o => o.inn === inn) === -1)
	console.log('newInns > ', newInns)
	const createdOrgs = []
	for (let inn of newInns) {
		createdOrgs.push(await createMoeDeloOrg(inn))
	}
	moeDeloOrgs = [...existedOrgs, ...createdOrgs]
	// moeDeloOrgs = [...existedOrgs]
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

module.exports = {
	MoeDelo,
	org: {
		checkOrgs,
		createOrg,
		deleteOrg,
		deleteAllOrgs,
		getMoeDeloOrgs,
		mergeOrg,
		upsertOrg,
		upsertOrgsByInn,
	}
}
