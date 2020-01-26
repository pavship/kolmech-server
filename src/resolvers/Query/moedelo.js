const { moedelo } = require('../../rest/moedelo')

const mdKontragents = async (_, { inn }, ctx, info) => {
  const url =
    '/kontragents/api/v1/kontragent?pageSize=1000000' +
    ( inn ? `&inn=${inn}` : '' )
  try {
    const { statusText, data } = await moedelo.get(url)
    if (statusText !== 'OK')
      throw new Error (`Could not get kontragent from Moedelo, statusText > ${statusText}`)
    return data.ResourceList
  } catch (err) {
    console.log('mdKontragents query err > ', err)
    throw err
  }
}

module.exports = {
  moedelo: {
		mdKontragents
	}
}