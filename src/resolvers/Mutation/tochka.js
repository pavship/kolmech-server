const axios = require('axios')
const { toLocalISOString } = require('../../utils/dates')
const { org: { upsertOrgsByInn } } = require('./org')

const baseUrl = 'https://enter.tochka.com/api/v1/statement'

const baseHeaders = {
  'Host': 'enter.tochka.com',
  'Accept': 'application/json',
  'Content-Type': 'application/json'
}

const accounts = [{
  token: process.env.TOCHKA_API_TOKEN,
  account_code: process.env.TOCHKA_ACCOUNT_CODE_IP,
  date_start: '2019-06-01'
},{
  token: process.env.TOCHKA_KFSUPPORT_API_TOKEN,
  account_code: process.env.TOCHKA_KFSUPPORT_ACCOUNT_CODE,
  date_start: '2019-01-01'
}]

const fetchTochkaPayments = async () => {
  const paymentArrs = await Promise.all(accounts.map(async ({
    token,
    account_code,
    date_start
  }, i) => {
    const headers = {
      ...baseHeaders,
      'Authorization': 'Bearer ' + token
    }
    // 1. get request_id
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        account_code,
        bank_code: '044525999',
        date_start,
        date_end: toLocalISOString(new Date).slice(0,10)
      })
    })
    const { request_id } = await res.json()
    // 2. fetch payments from tochka server
    const statementUrl = baseUrl + '/result/' + request_id
    const statementResponse = await fetch(statementUrl, {
      method: 'GET',
      headers
    })
    const statusText = statementResponse.statusText
    if (statusText !== 'OK') throw new Error(`Ошибка сервера Точка. Статус запроса для счета № ${i + 1}: ` + statusText)
    return (await statementResponse.json()).payments
  }))
  const payments = paymentArrs.reduce((payments, arr) => [ ...payments, ...arr ], [])
  // require('fs').writeFileSync('payments.json', JSON.stringify(payments, null, 2))
  console.log('payments[payments.length - 25] > ', payments[payments.length - 25])
  return payments
}

const formatTochkaPayments = async (_, payments, ctx, info) => {
  const { db } = ctx
  const counterparties = payments
    .map(({
      counterparty_inn: inn,
      counterparty_name: tochkaName,
    }) => ({ inn, tochkaName }))
  const inns = counterparties
    .reduce((inns, { inn }) => [
      ...inns,
      ...(!inn || inn === '0' || inns.findIndex(inn1 => inn1 === inn) !== -1) ? [] : [inn]
    ], [])
  const orgs = await upsertOrgsByInn(_, inns, ctx, info)
  const persons = (await db.query.persons({}, '{ id, amoName, amoId }'))
    .filter(({ amoId }) => amoId > 0)
    .map(({ id, amoName }) => ({ id, amoNameLowerCase: amoName.toLowerCase()}))
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
      inn: p.counterparty_inn,
      org: orgs.find(o => p.counterparty_inn === o.inn),
      person: persons.find(pers => p.counterparty_name.toLowerCase().startsWith(pers.amoNameLowerCase)),
      purpose: p.payment_purpose,
      tochkaId: p.payment_bank_system_id,
    }
  })
}

const tochka = {
  async getTochkaPayments(_, __, ctx, info) {
    return await formatTochkaPayments(_, await fetchTochkaPayments(), ctx, info)
  },
	async syncWithTochkaPayments(_, __, ctx, info) {
    const { db } = ctx
    // const mode = 'syncAll' // TODO add 'syncNew' mode
    const accountIds = (await db.query.accounts({
      where: { number_in: [
        process.env.TOCHKA_ACCOUNT_CODE_IP,
        process.env.TOCHKA_KFSUPPORT_ACCOUNT_CODE
      ] }
    }, '{ id }')).map(({ id }) => id )
    const tochkaPayments = (await tochka.getTochkaPayments(_, __, ctx, info))
    console.log('tochkaPayments.length > ', tochkaPayments.length)
    // console.log('tochkaPayments[tochkaPayments.length-25] > ', tochkaPayments[tochkaPayments.length-25])
    console.log('accountIds > ', accountIds)
    const payments = await db.query.payments({
      where: { account: { id_in: accountIds } }
    }, '{ id dateLocal tochkaId }')
    console.log('payments.length > ', payments.length)
    const tochkaIds = payments.map(({ tochkaId }) => tochkaId)
    const toCreate = tochkaPayments
      .filter(p => !tochkaIds.includes(p.tochkaId))
      .map(p => {
        const orgId = p.org && p.org.id
        const personId = p.person && p.person.id
        delete p.org
        delete p.person
        return {
          ...p,
          ...orgId && { org: {
            connect: {
              id: orgId
            }
          }},
          ...personId && { person: {
            connect: {
              id: personId
            }
          }}
        }
      })
      console.log('toCreate.length > ', toCreate.length)

    // const deleted = await db.mutation.deleteManyPayments({
    //   where: { account: { id: accountId } }
    // }, '{ count }')
    // console.log('deleted > ', deleted)

    // await db.mutation.updateAccount({
    //   where: { id: accountId },
    //   data: {
    //     payments: {
    //       ...toCreate.length && {create: toCreate }
    //     }
    //   }
    // }, '{ id }')

    return { count: toCreate.length }
  },
  // async tochkaOrgs (_, __, ctx, info) {
  //   const url = 'https://enter.tochka.com/api/v1/organization/list'
  // }
}

module.exports = {
	tochka
}