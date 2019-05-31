const axios = require('axios')

const MoeDelo = axios.create({
	baseUrl: 'https://restapi.moedelo.org/kontragents/api/v1/kontragent',
	headers: {
		'md-api-key': process.env.MOEDELO_SECRET,
		'Content-Type': 'application/json'
	}
})

const orgDetails = async (_, { id }, ctx, info) => {
	const { db } = ctx
	console.log('id > ', id)
	return db.query.org({ where: { id }}, info)
}

module.exports = {
  orgQueries: {
		orgDetails
	}
}