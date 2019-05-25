
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
const base = '/Компании'

const getFolderName = async (path, anyTypeId) => {
	const id = anyTypeId.toString()
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
	// console.log('folders > ', folders)
	// console.log('resourses > ', resourses)
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
	async highlightFolder(_, { orgId }, ctx, info) {
		const { db } = ctx
		if (orgId) {
			const org = await db.query.org({ where: { id: orgId }}, '{ amoId name }')
			if (!org) throw new Error('Organization was not found in DB')
			const { amoId, name } = org
			const basePath = '/Компании'
			const folderName = `${name}_${amoId}`
			const oldFolderName = await getFolderName(basePath, amoId)
			if (!oldFolderName) await createFolder(`${basePath}/${folderName}`)
			else if (oldFolderName !== folderName)
				await moveFolder(`${basePath}/${oldFolderName}`, `${basePath}/${folderName}`)
			else {
				const highlighterPath = `${basePath}/${folderName}/!folder_highlighter_(used_by_Kolmech_server)`
				await createFolder(highlighterPath)
				setTimeout(async () => {
					await deleteFolder(highlighterPath, true)
				}, 2000)
			}
		}
		return { statusText: 'normal' }
	}
}

module.exports = { 
	disk,
	Disk,
	getDiskResources,
	syncDiskFolders
}