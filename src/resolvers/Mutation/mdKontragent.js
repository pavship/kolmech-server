const { moedelo } = require('../../rest/moedelo')
const { moedelo: { mdKontragents } } = require('../Query/moedelo')

const createMdKontragent = async (_, { inn }, ctx, info) => {
  try {
    if (!inn || ![10, 12].includes(inn.length))
      throw new Error('valid inn should be provided for this mutation')
    const kontragents = await mdKontragents(_, { inn }, ctx, info)
    if (kontragents.length > 0)
      throw new Error(`There are duplicated kontragents with inn: ${inn} in MoeDelo`)
    const { statusText, data } = await moedelo.post('/kontragents/api/v1/kontragent/inn', {
      Inn: inn,
			Type: 3
    })
    if (statusText !== 'Created')
      throw new Error(`Could not post kontragent to Moedelo, statusText > ${statusText}`)
    return data
  } catch (err) {
    console.log('createMdKontragent mutation err > ', err)
    throw err
  }
}



module.exports = {
  mdKontragent: {
		createMdKontragent
	}
}