const { megaplan } = require('../../rest/megaplan')

const mpProjects = async (_, {}, ctx, info) => {
	const { data: { projects } } = await megaplan(
    'GET',
    '/BumsProjectApiV01/Project/list.api'
  )
  return projects
}

module.exports = {
  megaplanQueries: {
		mpProjects
	}
}