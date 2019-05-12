
const axios = require('axios')
const { amoConnect } = require('./amo')

const dealStatus = {
	async syncDealStatuses(_, __, ctx, info) {
    const { db } = ctx
    const amo = await amoConnect(ctx)
    const { data: {_embedded: {items: pipelines}}} = await amo.get('/api/v2/pipelines')
    const statusesObj = pipelines['1593157'].statuses
    const statuses = []
    Object.keys(statusesObj).forEach(k => statuses.push(statusesObj[k]))
    console.log('statuses > ', statuses)
    const upserted = await Promise.all(statuses.map(({
      id: amoId,
      name,
      color,
      sort,
    }) =>
      db.mutation.upsertDealStatus({
        where: { amoId },
        update: {
          name,
          color,
          sort
        },
        create: {
          amoId,
          name,
          color,
          sort
        }
      }, '{ id }')
    ))
    return { count: upserted.length }
  },
}

module.exports = { 
	dealStatus
}