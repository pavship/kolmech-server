const { megaplan } = require('../../rest/megaplan')

const mpProjects = async (_, {}, ctx, info) => {
  const results = await Promise.all([0, 100, 200, 300, 400, 500, 600, 700].map(offset =>
    megaplan(
      'GET',
      '/BumsProjectApiV01/Project/list.api?Limit=100&Offset=' + offset
    )
  ))
  return results.reduce((projects, res) => [...projects, ...res.data.projects], [])
}

module.exports = {
  megaplan: {
		mpProjects
	}
}