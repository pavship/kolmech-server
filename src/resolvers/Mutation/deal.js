const { amoConnect } = require('./amo')
const { generateMutationObject } = require('../utils')

const connectDealToOrg = async (_, { dealId, orgId }, ctx, info) => {
  const { db } = ctx
  return db.mutation.updateDeal({
    where: { id: dealId },
    data: {
      org: {
        connect: { id: orgId }
      }
    }
  }, info)
}

const syncDeals = async (_, __, ctx, ___) => {
  const { db } = ctx
  const amo = await amoConnect(ctx)
  const { data: {_embedded: {items: deals}}} = await amo.get('/api/v2/leads')
  // sync orgs
  // console.log('deal > ', deals.find(d => d.company.id === 19793913))
  // console.log('deal > ', deals.find(d => d.id === 18154001))
  const { data } = await amo.get('/api/v2/companies?id=52117159')
  const orgs = await db.query.orgs({}, '{ id amoId name }')
  const { data: {_embedded: {items: companies}}} = await amo.get('/api/v2/companies?id=' +
    deals.map(d => d.company.id).filter(id => !!id).toString())
  // console.log('companies > ', JSON.stringify(companies.slice(0,6), null, 2))
  const syncedOrgs = await Promise.all(companies
    .filter(c => !!c)
    .map(({ id: amoId, name }) => {
      const foundOrg = orgs.find(o => o.amoId === amoId)
      return (foundOrg && foundOrg.name === name)
        ? foundOrg
        : db.mutation.upsertOrg({
            where: { id: (foundOrg && foundOrg.id) || '0' },
            update: { name },
            create: { amoId, name }
          }, '{ id amoId name }')
    }))
  const toDeleteIds = []
  // console.log('toDeleteIds > ', toDeleteIds)
  const oldDeals = (await db.query.deals({}, '{ id amoId org { id } batches { id } }'))
    .forEach(oldDeal => {
      // if (oldDeal.amoId === 18154001) console.log('oldDeal > ', JSON.stringify(oldDeal, null, 2))
      const deal = deals.find(d => d.id === oldDeal.amoId)
      // if (oldDeal.amoId === 18154001) console.log('deal > ', JSON.stringify(deal, null, 2))
      return deal
        ? deal.oldDeal = oldDeal
        : toDeleteIds.push(oldDeal.amoId)
    })
  // delete deals
  await db.mutation.deleteManyDeals({ where: { amoId_in: toDeleteIds } })
  // fetch dealstatuses
  const dealStatusesIdsMap = (await db.query.dealStatuses({}, '{ id amoId }'))
    .reduce((res, { id, amoId }) => ({ ...res, [amoId]: id }), {})
  // upsert deals
  const upserted = await Promise.all(deals.map(({
    id: amoId,
    created_at,
    name,
    status_id: statusAmoId,
    company: { id: companyId },
    oldDeal
  }) => {
    const syncedOrg = !!companyId
      && syncedOrgs.find(o => o.amoId === companyId)
    
    const mutationObj = {
      where: { amoId },
      update: {
        name,
        ...syncedOrg
          ? { org: { connect: { id: syncedOrg.id } } }
          : !!oldDeal && oldDeal.org && { org: { disconnect: true } },
        status: {
          connect: { amoId: statusAmoId }
        }
      },
      create: {
        amoId,
        name,
        date: new Date(created_at*1000),
        ...!!syncedOrg && { org: { connect: { id: syncedOrg.id } }},
        status: {
          connect: { amoId: statusAmoId }
        }
      }
    }
    // if (amoId === 18154001) console.log('mutationObj > ', JSON.stringify(mutationObj, null, 2))
    return db.mutation.upsertDeal(mutationObj, '{ id batches { id } }')
    // const input = {
    //   id: oldDeal && oldDeal.id,
    //   amoId,
    //   date: new Date(created_at*1000),
    //   name,
    //   statusId: dealStatusesIdsMap[statusAmoId],
    //   org: 
    //   // batches: oldDeal && oldDeal.batches.map(({ id }) => ({ id }))
    // }
    // if (amoId === 18154001) console.log('input > ', JSON.stringify(input, null, 2))
    // return upsertDeal(_, { input }, ctx, ___)
  }))
  // console.log('upserted > ', JSON.stringify(upserted, null, 2))
  return { count: upserted.length }
  // return { count: 9999 }
}

const upsertDeal = async (_, { input }, ctx, info) => {
  // console.log('input > ', JSON.stringify(input, null, 2))
  const { db } = ctx
  const mutationObj = await generateMutationObject(input, 'deal', ctx)
  // console.log('mutationObj > ', JSON.stringify(mutationObj, null, 2))
  if (!input.id) return db.mutation.createDeal(mutationObj, info)
    else return db.mutation.updateDeal(mutationObj, info)
}

module.exports = { 
	deal: {
    connectDealToOrg,
    syncDeals,
    upsertDeal
  }
}