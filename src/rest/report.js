const { getUserId } = require('../utils/auth')
const { megaplan } = require('./megaplan')

const report = async (req, res, db) => {
  try {
    const userId = getUserId(req)
    // const data = db.query.payments({}, `{ id amount }`)
    const { data: { projects } } = await megaplan(
      'GET',
      '/BumsProjectApiV01/Project/list.api'
    )
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
