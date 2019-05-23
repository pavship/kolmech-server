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
    // sync orgs
    console.log('deals > ', deals.find(d => d.company.id === 52117159))
    const { data } = await amo.get('/api/v2/companies?id=52117159')
    console.log('data > ', data, !data, data === '', data.trim() === '')
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
    const oldDeals = await db.query.deals({}, '{ amoId org { id } }')
    // write deals
    const upserted = await Promise.all(deals.map(({
      id: amoId,
      created_at,
      name,
      status_id: statusId,
      company: { id: companyId }
    }) => {
      const oldDeal = oldDeals.find(d => d.amoId === amoId)
      const syncedOrg = !!companyId
        && syncedOrgs.find(o => o.amoId === companyId)
        console.log(' amoId, syncedOrg> ', amoId, syncedOrg)
      return db.mutation.upsertDeal({
        where: { amoId },
        update: {
          name,
          ...syncedOrg
            ? { org: { connect: { id: syncedOrg.id } } }
            : !!oldDeal.org && { org: { disconnect: true } },
          status: {
            connect: { amoId: statusId }
          }
        },
        create: {
          amoId,
          name,
          date: new Date(created_at*1000),
          ...!!syncedOrg && { org: { connect: { id: syncedOrg.id } }},
          status: {
            connect: { amoId: statusId }
          }
        }
      }, '{ id }')
      }
    ))
    return { count: upserted.length }
  },
  async upsertDeal(_, { input }, ctx, info) {
    // console.log('input > ', JSON.stringify(input, null, 2))
    const { db } = ctx
    const mutationObj = await generateMutationObject(input, 'deal', ctx)
    // console.log('mutationObj > ', JSON.stringify(mutationObj, null, 2))
    if (!input.id) return db.mutation.createDeal(mutationObj, info)
      else return db.mutation.updateDeal(mutationObj, info)
  },
}

module.exports = { 
	deal
}