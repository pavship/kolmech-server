const axios = require('axios')
const { toLocalDateString } = require('../../utils/dates')

const createContract = async (_, { id, date = toLocalDateString(new Date()) }, { db }, info) => {
  const { moedeloId } = await db.query.org({ where: { id }})
  if (!moedeloId) throw new Error('Organizaton is not connected to MoeDelo')
  const res = await axios.post(
    'https://restapi.moedelo.org/contract/api/v1/contract', {
      Number: `${date}/1`,
      DocDate: `${date}T00:00:00+03:00`,
      Status: 1,
      KontragentId: parseInt(moedeloId),
      Direction: 1,
      Kind: 0
    }, {
      headers: {
        'md-api-key': process.env.MOEDELO_SECRET,
        'Content-Type': 'application/json'
      },
    }
  )
  console.log('res > ', res)
  return { statusText: 'OK' }
}

module.exports = {
	contract: {
		createContract
	}
}