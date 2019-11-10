// @ts-nocheck
const crypto = require('crypto')
const axios = require('axios')

const mpRequest = async (method, uri) => {
  // const date = 'Sun, 10 Nov 2019 22:05:35 +0300'
  const date = new Date().toUTCString()
  // console.log('date > ', date)
  
  // const method = 'GET'
  // const uri = '/BumsProjectApiV01/Project/list.api'
  // const uri = '/BumsTaskApiV01/Task/card.api'
  // const uri = '/BumsProjectApiV01/Project/card.api'
  // const uri = '/BumsProjectApiV01/Project/create.api'
  
  const auth_key = process.env.MEGAPLAN_ACCESS_ID + ':' +
    new Buffer.from(
      crypto
        .createHmac('sha1', process.env.MEGAPLAN_SECRET_KEY)
        .update([
          method,
          '',
          '',
          // 'application/x-www-form-urlencoded',
          date,
          'mp54489646.megaplan.ru' + uri
        ].join('\n') )
        .digest('hex')
    ).toString('base64')
  // console.log('auth_key > ', auth_key)
  try {
    const res = await axios.get('https://mp54489646.megaplan.ru' + uri, {
      headers: {
        'Date': date,
        'X-Authorization': auth_key,
        'Accept': 'application/json',
      },
    })
    // console.log('res > ', res)
    return res
  } catch (err) {
    console.log('err.response > ', err.response)
    throw err
  }
}

module.exports = { 
	mpRequest
}