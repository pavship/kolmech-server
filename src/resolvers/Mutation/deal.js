const { amoConnect } = require('./amo')

const deal = {
  async connectDealToOrg(_, { dealId, orgId }, ctx, info) {
    const { db } = ctx
    return db.mutation.updateDeal({
      where: { id: dealId },
      data: {
        org: {
          connect: { id: orgId }
        }
      }
    }, info)
  },
  async syncDeals(_, __, ctx, ___) {
    const { db } = ctx
    const amo = await amoConnect(ctx)
    const { data: {_embedded: {items: deals}}} = await amo.get('/api/v2/leads')
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
  },
  async upsertModelToDeal(_, { name, modelId, dealId }, ctx, info) {
    console.log('name, modelId, dealId > ', name, modelId, dealId)
    const { db } = ctx
    return db.mutation.updateDeal({
      where: { id: dealId },
      data: {
        models: {
          upsert: [{
            where: { id: modelId || '' },
            create: { name },
            update: { name }
          }]
        }
      }
    }, info)
  },
}

module.exports = { 
	deal
}