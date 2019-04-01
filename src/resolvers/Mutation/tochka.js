
const axios = require('axios')

const tochka = {
  // async login
	async syncWithTochkaPayments(_, __, ctx, info) {
    try {
      const { userId, db } = ctx
      // const url = 'https://enter.tochka.com/api/v1/statement'
      const url = 'https://enter.tochka.com/api/v1/statement/result/044525999.2019-03-31.2019-01-01.40802810301500021080'
      // const url = 'https://enter.tochka.com/api/v1/organization/list'
      const options = {
        method: 'GET',
        // mode: 'cors',
        headers: {
          'Authorization': `Bearer ${process.env.TOCHKA_API_TOKEN}`,
          'Host': 'enter.tochka.com',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        // body: JSON.stringify({
        //   account_code: process.env.TOCHKA_ACCOUNT_CODE_IP,
        //   bank_code: '044525999',
        //   date_start: '2019-01-01',
        //   date_end: '2019-03-31'
        // })
      }
      const response = await fetch(url, options)
      // const response = await axios({
      //   method: 'get',
      //   url: 'https://enter.tochka.com/api/v1/statement'
      // })
      // console.log('response > ', response)
      // console.log('response.headers > ', response.headers)
      const { payments: tochkaPayments } = await response.json()
      // console.log('tochkaPayments > ', JSON.stringify(tochkaPayments,null,2))
      paymentDateCounter = {}
      const tochkaPaymentsAugmented = tochkaPayments.map(p => {
        const prevCount = paymentDateCounter[p.payment_date] || 0
        const count = prevCount + 1
        paymentDateCounter[p.payment_date] = count
        return {
          ...p,
          paymentDateCounter: count.toString()
        }
      })
      const [ account ] = await db.query.accounts({
        where: {
          number: process.env.TOCHKA_ACCOUNT_CODE_IP
        }
      })
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
      const handled = await Promise.all(tochkaPaymentsAugmented.map(({
        payment_bank_system_id: tochkaId,
        payment_date,
        payment_amount,
        paymentDateCounter,
        counterparty_inn: inn,
        counterparty_name,
        payment_purpose: purpose,
      }) => {
        const payment = payments.find(p => p.tochkaId === tochkaId)
        if (payment) return
        const org = orgs.find(o => o.inn === inn)
        if (!org) orgs.push({ inn })
        const dateLocal = (payment_date.split('.').reverse().join('-') + 'T00:00:00.000Z')
          .slice(0,-paymentDateCounter.length - 1)
          + paymentDateCounter + 'Z'
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
      // return { count: 999 }
    } catch (err) {
      console.log('err > ', err)
      throw err
      // throw new Error(err.message + ' ')
    }
  }
}

module.exports = {
	tochka
}