
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
    const oldStatuses = await db.query.dealStatuses({}, '{ id amoId }')
    // upsert
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
      }, '{ id name }')
    ))
    // delete
    const statusesAmoIds = statuses.map(s => s.id)
    const toDeleteIds = oldStatuses
      .filter(s => !statusesAmoIds.includes(s.amoId))
      .map(s => s.id)
    const deleted = await db.mutation.deleteManyDealStatuses({
      where: {id_in: toDeleteIds}
    }, '{ count }')
    // UPDATE DISK FOLDERS
    await syncDiskFolders('/Заявки ХОНИНГОВАНИЕ.РУ', statuses)
    console.log('upserted > ', JSON.stringify(upserted, null, 2))
    console.log('deleted count > ', JSON.stringify(deleted, null, 2))
    return { statusText: 'OK' }
  },
}

module.exports = { 
	dealStatus
}