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
  initialDate: '2019-01-01'
},{
  token: process.env.TOCHKA_KFSUPPORT_API_TOKEN,
  account_code: process.env.TOCHKA_KFSUPPORT_ACCOUNT_CODE,
  initialDate: '2019-07-01'
}]

const getTochkaPayments = async () => {
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
    const res1 = await fetch(statementUrl, {
      method: 'GET',
      headers
    })
    if (res1.statusText !== 'OK')
      throw new Error(`Ошибка сервера Точка. Статус запроса для счета № ${i + 1}: ` + statusText)
    return (await res1.json()).payments
      .map(p => ({ ...p, account_code }))
  }))
  const payments = paymentArrs
    .reduce((payments, arr) => [ ...payments, ...arr ], [])
    .sort(({ x_payment_id: a }, { x_payment_id: b }) => a < b ? -1 : a === b ? 0 : 1)
  // require('fs').writeFileSync('payments.json', JSON.stringify(payments, null, 2))
  return payments
}


const syncWithTochkaPayments = async (_, __, ctx, info) => {
  const { db } = ctx

  // 1. define statement period (to get only recent payments)
  for (let acc of accounts) {
    const lastPayment = (await db.query.payments({
      where: { account: { number: acc.account_code } },
      orderBy: 'dateLocal_ASC',
      last: 1
    }, '{ dateLocal }'))[0]
    acc.date_start = lastPayment && lastPayment.dateLocal > acc.initialDate
      ? lastPayment.dateLocal.slice(0,10)
      : acc.initialDate
    // populate accountId for the final update
    acc.id = (await db.query.accounts({
      where: { number: acc.account_code }
    }, '{ id }'))[0].id
  }
  let dateStart = accounts
    .map(({ date_start }) => date_start )
    .sort()[0]
  accounts.forEach(ac => ac.date_start = dateStart)
  // console.log('accounts > ', accounts)

  // 2. get tochka payments
  const tochkaPayments = await getTochkaPayments()

  // 3. prepare orgs to connect to tochkaPayments
  const inns = tochkaPayments
    .reduce((inns, { counterparty_inn: inn }) => [
      ...inns,
      ...(!inn || inn === '0' || inns.findIndex(inn1 => inn1 === inn) !== -1) ? [] : [inn]
    ], [])
  const orgs = await upsertOrgsByInn(_, inns, ctx, info)

  // 4. prepare all persons to connect to tochkaPayments
  const persons = (await db.query.persons({}, '{ id, amoName, amoId }'))
    .filter(({ amoId }) => amoId > 0)
    .map(({ id, amoName }) => ({ id, amoNameLowerCase: amoName.toLowerCase()}))
  
  // 5. get existing payments to exclude duplicates
  const existingTochkaIds = (
    await db.query.payments({
      where: {
        account: {
          number_in: accounts.map(({ account_code }) => account_code)
        },
        dateLocal_gte: dateStart
      }
    }, '{ tochkaId }')
  ).map(({ tochkaId }) => tochkaId)
  console.log('existingTochkaIds.length > ', existingTochkaIds.length)
  
  // 6. preparedPayments to populate the db
  // count number of payments for each day to generate unique dateLocal value
  const paymentDateCounter = {}
  let count = 0

  const preparedPayments = tochkaPayments
    .map(p => {
      paymentDateCounter[p.payment_date] = count = 
        (paymentDateCounter[p.payment_date] || 0) + 1
      return {
        account_code: p.account_code,
        amount: Math.abs(parseFloat(p.payment_amount)),
        dateLocal: (p.payment_date.split('.').reverse().join('-') + 'T00:00:00.000Z')
          .slice(0, -count.toString().length - 1)
          + count + 'Z',
        isIncome: parseFloat(p.payment_amount) > 0,
        inn: p.counterparty_inn,
        org: orgs.find(o => p.counterparty_inn === o.inn),
        person: persons.find(pers => p.counterparty_name.toLowerCase().startsWith(pers.amoNameLowerCase)),
        purpose: p.payment_purpose,
        tochkaId: p.x_payment_id,
      }
    })
    .filter(p => !existingTochkaIds.includes(p.tochkaId))
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
  // console.log('preparedPayments.length > ', preparedPayments.length)
  // console.log('preparedPayments[0] > ', preparedPayments[0])
  // require('fs').writeFileSync('preparedPayments.json', JSON.stringify(preparedPayments, null, 2))

  // 7. write to db for each account

  const results = await Promise.all(accounts.map(({ id, account_code }) => {
    const toCreate = preparedPayments
      .filter(p => p.account_code === account_code)
      .map(p => { delete p.account_code; return p })
    return db.mutation.updateAccount({
      where: { id },
      data: {
        payments: {
          ...toCreate.length && {create: toCreate }
        }
      }
    }, '{ id }')
  }))
  
  
  // console.log('results > ', results)
  // return { count: 0 }
  // return { count: results
  //   .reduce((payments, arr) => [ ...payments, ...arr ], []).length }
  return { count: preparedPayments.length }
}

module.exports = {
	tochka: {
    getTochkaPayments,
    syncWithTochkaPayments
  }
}