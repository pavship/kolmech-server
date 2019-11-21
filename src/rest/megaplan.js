const axios = require('axios')
const crypto = require('crypto')

const megaplan = async ( method, uri ) => {
  const date = new Date().toUTCString()
  const auth_key = process.env.MEGAPLAN_ACCESS_ID + ':' +
    Buffer.from(
      crypto
        .createHmac('sha1', process.env.MEGAPLAN_SECRET_KEY)
        .update([
          method,
          '',
          'application/x-www-form-urlencoded',
          date,
          process.env.MEGAPLAN_HOST + uri
        ].join('\n') )
        .digest('hex')
    ).toString('base64')
  try {
    const res = await axios.request({
      method: method.toLowerCase(),
      url: 'https://' + process.env.MEGAPLAN_HOST + uri,
      headers: {
        'Date': date,
        'X-Authorization': auth_key,
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
    })
    return res.data
  } catch (err) {
    console.log('megaplan err.response > ', err.response)
  }
}

const megaplanServerTest = async () => {
  console.log('MEGAPLAN_ACCESS_ID > ', process.env.MEGAPLAN_ACCESS_ID)
  console.log('MEGAPLAN_SECRET_KEY > ', process.env.MEGAPLAN_SECRET_KEY)
  console.log('MEGAPLAN_HOST > ', process.env.MEGAPLAN_HOST)
	const { data: { projects } } = await megaplan(
    'GET',
    '/BumsProjectApiV01/Project/list.api'
  )
  console.log('projects > ', projects)
}

module.exports = { 
  megaplan,
  megaplanServerTest
}
