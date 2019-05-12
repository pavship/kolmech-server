const { amoConnect } = require('./amo')

const deal = {
  async syncDeals(_, __, ctx, ___) {
    const { db } = ctx
    const amo = await amoConnect(ctx)
    const { data: {_embedded: {items: deals}}} = await amo.get('/api/v2/leads')
    console.log('deals > ', deals)
    const upserted = await Promise.all(deals.map(({
      id: amoId,
      created_at,
      name,
      status_id: statusId,
    }) =>
      db.mutation.upsertDeal({
        where: { amoId },
        update: {
          name,
          date: new Date(created_at*1000),
          status: {
            connect: {
              amoId: statusId
            }
          }
        },
        create: {
          amoId,
          name,
          date: new Date(created_at*1000),
          status: {
            connect: {
              amoId: statusId
            }
          }
        }
      }, '{ id }')
    ))
    return { count: upserted.length }
  }
}

module.exports = { 
	deal
}