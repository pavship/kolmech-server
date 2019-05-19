
const axios = require('axios')
const { amoConnect } = require('./amo')
const { syncDiskFolders } = require('./disk')

const dealStatus = {
	async syncDealStatuses(_, __, ctx, info) {
    const { db } = ctx
    const amo = await amoConnect(ctx)
    const { data: {_embedded: {items: pipelines}}} = await amo.get('/api/v2/pipelines')
    const statusesObj = pipelines['1593157'].statuses
    const statuses = []
    Object.keys(statusesObj).forEach(k => statuses.push(statusesObj[k]))
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
    // UPDATE DISK FOLDERS
    await syncDiskFolders('/Заявки ХОНИНГОВАНИЕ.РУ', statuses)
    return { count: upserted.length }
  },
}

module.exports = { 
	dealStatus
}