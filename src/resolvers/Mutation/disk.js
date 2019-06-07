
const axios = require('axios')
const qs = require('qs')

const baseURL = 'https://cloud-api.yandex.net/v1/disk/resources'

const Disk = axios.create({
	baseURL,
	headers: {
		'content-type': 'application/json',
		'Authorization': 'OAuth ' + process.env.DOCS_KOLMECH_TOKEN,
	}
})

const getDiskResources = async path => {
	const { data: { _embedded: { items: resources }}} = await Disk.get('?'+
		qs.stringify({ path, limit: 10000 }))
	return resources
}

const getDiskResources2Levels = async path => {
	const level1 = (await getDiskResources(path))
		.filter(r => r.type === 'dir')
		.map(({ name }) => name)
	const level2 = await Promise.all(level1.map(folder => getDiskResources(`${path}/${folder}`)))
	const resources = []
	level2.forEach((rs, i) => {
		rs.filter(r => r.type === 'dir')
			.forEach(r => resources.push({
				name: r.name,
				id: r.name.slice(r.name.lastIndexOf('_') + 1),
				parent: level1[i]
			}))
	})
	return resources
}

const getResourceDownloadUrl = async path => {
	const { data: { href }} = await Disk.get('/download?'+
		qs.stringify({ path }))
	return href
}

const getResourceUploadUrl = async (path, overwrite = true) => {
	const { data: { href }} = await Disk.get('/upload?'+
		qs.stringify({ path, overwrite }))
	return href
}

const getFolderName = async (path, intOrStringId) => {
	const id = intOrStringId.toString()
	const dirFoldersNames = (await getDiskResources(path))
		.filter(r => r.type === 'dir').map(({ name }) => name)
	return dirFoldersNames.find(n => n.slice(-id.length) === id)
}

const createFolder = path => {
	Disk.put('?'+ qs.stringify({ path }))
}

const deleteFolder = (path, permanently = false) => {
	Disk.delete('?'+ qs.stringify({ path, permanently }))
}

const moveFolder = (from, path) => {
	Disk.post('/move?'+
		qs.stringify({ from, path })
	)
}

const upsertOrgFolder = async (orgId, ctx) => {
	const { db } = ctx
	const org = await db.query.org({ where: { id: orgId }}, '{ amoId name }')
	if (!org) throw new Error('Organization was not found in DB')
	const { amoId, name } = org
	const basePath = '/Компании'
	const folderName = `${name}_${amoId}`
	const oldFolderName = await getFolderName(basePath, amoId)
	if (!oldFolderName)
		await createFolder(`${basePath}/${folderName}`)
	else if (oldFolderName !== folderName)
		await moveFolder(`${basePath}/${oldFolderName}`, `${basePath}/${folderName}`)
	return `${basePath}/${folderName}`
}

const upsertOrgDealFolder = async (dealId, ctx) => {
	const { db } = ctx
	const deal = await db.query.deal({ where: { id: dealId }}, '{ amoId name date org { id } }')
	if (!deal) throw new Error('Deal was not found in DB')
	const { amoId, name, date, org } = deal
	const orgFolderPath = await upsertOrgFolder(org.id, ctx)
	const folderName = `${date}_${name}_${amoId}`
	const oldFolderName = await getFolderName(orgFolderPath, amoId)
	if (!oldFolderName)
		await createFolder(`${orgFolderPath}/${folderName}`)
	else if (oldFolderName !== folderName)
		await moveFolder(`${orgFolderPath}/${oldFolderName}`, `${orgFolderPath}/${folderName}`)
	return `${orgFolderPath}/${folderName}`
}

const syncDiskFolders = async (path, folders) => {
	const resourses = (await getDiskResources(path))
	.filter(r => r.type === 'dir')
	.map(({ name }) => {
		const separator1index = name.indexOf('_')
		const separator2index = name.lastIndexOf('_')
		const hasNoPrefix = separator1index === separator2index
		return {
			id: name.slice(separator2index + 1),
			name: name.slice(hasNoPrefix ? 0 : separator1index + 1, separator2index),
			prefix: hasNoPrefix ? '' : name.slice(0, separator1index),
			oldName: name,
			hasNoPrefix
		}
	})
	const results = await Promise.all(folders.map(f => {
		const r = resourses.find(r => r.id == f.id)
		return !!r
			? r.name === f.name
				? null
				: moveFolder(
					`${path}/${r.oldName}`, 
					`${path}/${r.hasNoPrefix ? '' : r.prefix + '_'}${f.name}_${f.id}`
				)
			: createFolder(`${path}/${f.name}_${f.id}`)
	}))
	results.forEach(r => r !== null && console.log('r.statusText > ', r.statusText))
}

const disk = {
	async highlightFolder(_, { orgId, dealId }, ctx, info) {
		const { db } = ctx
		if (orgId) {
			const orgFolderPath = await upsertOrgFolder(orgId, ctx)
			const highlighterPath = `${orgFolderPath}/!folder_highlighter_(used_by_Kolmech_server)`
			await createFolder(highlighterPath)
			setTimeout(async () => {
				await deleteFolder(highlighterPath, true)
			}, 2000)
		}
		if (dealId) {
			const deal = await db.query.deal({ where: { id: dealId }}, '{ amoId name }')
			if (!deal) throw new Error('Deal was not found in DB')
			const basePath = '/Заявки ХОНИНГОВАНИЕ.РУ'
			const resourses = await getDiskResources2Levels(basePath)
			const resourse = resourses.find(r => r.id == deal.amoId)
			if (!resourse) throw new Error('Не найдена папка сделки # ' + deal.amoId)
			const highlighterPath = `${basePath}/${resourse.parent}/${resourse.name}/!folder_highlighter_(used_by_Kolmech_server)`
			await createFolder(highlighterPath)
			setTimeout(async () => {
				await deleteFolder(highlighterPath, true)
			}, 2000)
		}
		return { statusText: 'OK' }
	}
}

module.exports = { 
	disk,
	Disk,
	getDiskResources,
	getResourceDownloadUrl,
	getResourceUploadUrl,
	upsertOrgDealFolder,
	syncDiskFolders
}