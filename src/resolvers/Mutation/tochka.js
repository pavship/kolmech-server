const axios = require('axios')
const { toLocalISOString } = require('../../utils/dates')
const { org: { createOrg, getMoeDeloOrgs, upsertOrgsByInn } } = require('./org')

const headers = {
  'Authorization': `Bearer ${process.env.TOCHKA_API_TOKEN}`,
  'Host': 'enter.tochka.com',
  'Accept': 'application/json',
  'Content-Type': 'application/json'
}

const fetchTochkaPayments = async () => {
  const baseUrl = 'https://enter.tochka.com/api/v1/statement'
    // 1. get request_id
    const requestResponse = await fetch(baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        account_code: process.env.TOCHKA_ACCOUNT_CODE_IP,
        bank_code: '044525999',
        date_start: '2019-01-01',
        date_end: toLocalISOString(new Date).slice(0,10)
      })
    })
    const { request_id } = await requestResponse.json()
    // 2. fetch payments from tochka server
    const statementUrl = baseUrl + '/result/' + request_id
    const statementResponse = await fetch(statementUrl, {
      method: 'GET',
      headers
    })
    const statusText = statementResponse.statusText
		if (statusText !== 'OK') throw new Error('Ошибка сервера Точка. Статус запроса fetchTochkaPayments: ' + statusText)
    const { payments } = await statementResponse.json()
    return payments
}

const formatTochkaPayments = async (_, payments, ctx, info) => {
  const inns = payments.map(({ counterparty_inn: inn }) => inn)
    .reduce((res, p) => [...res, ...res.includes(p) ? [] : [p]], [])
  const orgs = await upsertOrgsByInn(_, inns, ctx, info)
  // count number of payments for each day to generate unique dateLocal
  paymentDateCounter = {}
  return payments.map(p => {
    paymentDateCounter[p.payment_date] = count = 
      (paymentDateCounter[p.payment_date] || 0) + 1
    return {
      amount: Math.abs(parseFloat(p.payment_amount)),
      dateLocal: (p.payment_date.split('.').reverse().join('-') + 'T00:00:00.000Z')
        .slice(0, -count.toString().length - 1)
        + count + 'Z',
      isIncome: parseFloat(p.payment_amount) > 0,
      orgId: orgs.find(o => p.counterparty_inn === o.inn).id,
      purpose: p.payment_purpose,
      tochkaId: p.payment_bank_system_id,
    }
  })
}

const tochka = {
  async getTochkaPayments(_, __, ctx, info) {
    const fetchedPayments = await fetchTochkaPayments()
    return await formatTochkaPayments(_, fetchedPayments, ctx, info)
  },
	async syncWithTochkaPayments(_, __, ctx, info) {
    const { userId, db } = ctx
    const mode = 'syncAll' // TODO add 'syncNew' mode
    const accountId = (await db.query.accounts({
      where: { number: process.env.TOCHKA_ACCOUNT_CODE_IP }
    }, '{ id }'))[0].id
    const tochkaPayments = (await tochka.getTochkaPayments(_, __, ctx, info))
    const payments = await db.query.payments({
      where: { account: { id: accountId } }
    }, '{ id dateLocal tochkaId }')
    const tochkaIds = payments.map(({ tochkaId }) => tochkaId)
    // const toCreate = tochkaPayments.map( p => {
    const toCreate = tochkaPayments.filter(p => !tochkaIds.includes(p.tochkaId)).map( p => {
      const orgId = p.orgId
      delete p.orgId
      return {
        ...p,
        org: {
          connect: {
            id: orgId
          }
        }
      }
    })
    // const deleted = await db.mutation.deleteManyPayments({
    //   where: { account: { id: accountId } }
    // }, '{ count }')
    // console.log('deleted > ', deleted)
    await db.mutation.updateAccount({
      where: { id: accountId },
      data: {
        payments: {
          ...toCreate.length && {create: toCreate }
        }
      }
    }, '{ id }')
    return { count: toCreate.length }
  },
  // async tochkaOrgs (_, __, ctx, info) {
  //   const url = 'https://enter.tochka.com/api/v1/organization/list'
  // }
}

module.exports = {
	tochka
}