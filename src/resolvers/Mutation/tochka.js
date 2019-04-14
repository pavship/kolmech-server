const axios = require('axios')
const { toLocalISOString } = require('../../utils/dates')

const headers = {
  'Authorization': `Bearer ${process.env.TOCHKA_API_TOKEN}`,
  'Host': 'enter.tochka.com',
  'Accept': 'application/json',
  'Content-Type': 'application/json'
}

const tochka = {
	async syncWithTochkaPayments(_, __, ctx, info) {
    // function settings
    const mode = 'syncAll' // TODO add 'syncNew' mode
    const requestUrl = 'https://enter.tochka.com/api/v1/statement'
    try {
      const { userId, db } = ctx
      // 1. fetch request_id from tochka
      const requestResponse = await fetch(requestUrl, {
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
      // 2. fetch payments from tochka
      const statementUrl = `https://enter.tochka.com/api/v1/statement/result/${request_id}`
      const statementResponse = await fetch(statementUrl, {
        method: 'GET',
        headers
      })
      console.log('response > ', statementResponse)
      console.log('statementResponse.headers > ', statementResponse.headers)
      const { payments: tochkaPayments } = await statementResponse.json()
      console.log('tochkaPayments > ', JSON.stringify(tochkaPayments,null,2))
      // 3. count number of payments for each day and assign number (like 1,2,3,etc..) to each payment
      paymentDateCounter = {}
      const tochkaPaymentsAugmented = tochkaPayments.map(p => {
        const prevCount = paymentDateCounter[p.payment_date] || 0
        const count = prevCount + 1
        paymentDateCounter[p.payment_date] = count
        return {
          ...p,
          paymentDateNumber: count.toString()
        }
      })
      // 4. get all tochka payments from db
      const [ account ] = await db.query.accounts({
        where: {
          number: process.env.TOCHKA_ACCOUNT_CODE_IP
        }
      }, '{ id }')
      const [ payments, orgs ] = await Promise.all([
        db.query.payments({
          where: {
            account: {
              id: account.id
            }
          }
        }, '{ id dateLocal tochkaId }'),
        db.query.orgs({}, '{ id inn }')
      ])
      // 5. write new payments to db
      //    and also write new counterparties into Org db table
      const handled = await Promise.all(tochkaPaymentsAugmented.map(({
        payment_bank_system_id: tochkaId,
        payment_date,
        payment_amount,
        paymentDateNumber,
        counterparty_inn: inn,
        counterparty_name,
        payment_purpose: purpose,
      }) => {
        const payment = payments.find(p => p.tochkaId === tochkaId)
        if (payment) return
        const org = orgs.find(o => o.inn === inn)
        if (!org) orgs.push({ inn })
        const dateLocal = (payment_date.split('.').reverse().join('-') + 'T00:00:00.000Z')
          .slice(0,-paymentDateNumber.length - 1)
          + paymentDateNumber + 'Z'
        return db.mutation.createPayment({
          data: {
            tochkaId,
            dateLocal,
            amount: Math.abs(parseFloat(payment_amount)),
            isIncome: parseFloat(payment_amount) > 0,
            purpose,
            account: {
              connect: {
                id: account.id
              }
            },
            org: {
              ...org 
                ? {
                  connect: {
                    id: org.id
                  }
                }
                : {
                  create: {
                    inn,
                    name: counterparty_name
                      .replace('ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ','ООО')
                      .replace('Индивидуальный предприниматель','ИП')
                  }
                }
            }
          }
        }, '{ id amount isIncome org { inn name } }')
      }))
      const upserted = handled.filter(c => !!c) //filter out nulls
      // console.log('upserted > ', JSON.stringify(upserted, null, 2))
      return { count: upserted.length }
    } catch (err) {
      console.log('err > ', err)
      throw err
    }
  },
  // async tochkaOrgs (_, __, ctx, info) {
  //   const url = 'https://enter.tochka.com/api/v1/organization/list'
  // }
}

module.exports = {
	tochka
}