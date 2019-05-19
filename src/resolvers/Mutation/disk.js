
const axios = require('axios')
const qs = require('qs')

const baseURL = 'https://cloud-api.yandex.net/v1/disk/resources'

const disk = axios.create({
	baseURL,
	headers: {
		'content-type': 'application/json',
		'Authorization': 'OAuth ' + process.env.DOCS_KOLMECH_TOKEN,
	}
})

const getDiskResources = async path => {
	const { data: { _embedded: { items: resources }}} = await disk.get('?'+
		qs.stringify({ path, limit: 10000 }))
	return resources
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
				: disk.post('/move?'+
						qs.stringify({
							from: `${path}/${r.oldName}`,
							path: `${path}/${r.hasNoPrefix ? '' : r.prefix + '_'}` +
								`${f.name}_${f.id}`,
						})
					)
			: disk.put('?'+
					qs.stringify({
						path: `${path}/${f.name}_${f.id}`,
					})
				)
	}))
	results.forEach(r => r !== null && console.log('r.statusText > ', r.statusText))
	// console.log('results > ', results)
}

module.exports = { 
  disk,
	getDiskResources,
	syncDiskFolders
}