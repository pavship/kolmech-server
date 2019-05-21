const { amoConnect } = require('./amo')
const { generateMutationObject } = require('../utils')

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
  async upsertDeal(_, { input }, ctx, info) {
    console.log('input > ', JSON.stringify(input, null, 2))
    const { db } = ctx
    const mutationObj = await generateMutationObject(input, 'deal', ctx)
    console.log('mutationObj > ', JSON.stringify(mutationObj, null, 2))
    if (!input.id) return db.mutation.createDeal(mutationObj, info)
      else return db.mutation.updateDeal(mutationObj, info)

    // return db.mutation.updateDeal({
    //   where: { id: dealId },
    //   data: {
    //     batches: {
    //       upsert: [{
    //         where: { id: batchId || '' },
    //         create: {
		// 					qty: qty || 0,
		// 					model: {
		// 						create: { name },
		// 						connect: { id: modelId || '' }
		// 					}
    //         },
    //         update: {
		// 					qty: qty || 0,
		// 					model: {
		// 						connect: { id: modelId },
		// 						update: { name }
		// 					}
		// 				}
    //       }]
    //     }
    //   }
    // }, info)
  },
}

module.exports = { 
	deal
}