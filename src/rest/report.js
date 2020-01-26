const { getUserId } = require('../utils/auth')
const { megaplan } = require('./megaplan')

const report = async (req, res, db) => {
  try {
    const userId = getUserId(req)
    // const data = db.query.payments({}, `{ id amount }`)
    const results = await Promise.all([0, 100, 200, 300, 400, 500, 600, 700].map(offset =>
      megaplan(
         'GET',
         '/BumsProjectApiV01/Project/list.api?Limit=100&Offset=' + offset
       )
    ))
    const projects = results.reduce((projects, res) => [...projects, ...res.data.projects], [])
    res.send({ projects })
  } catch (err) {
    res.status(500).send({
      message: 'Kolmech server error!'
   })
    console.log('report error > ', err)
  }
}

module.exports = {
  report
}
