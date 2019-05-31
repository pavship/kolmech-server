const axios = require('axios')
const moedeloBaseUrl = 'https://restapi.moedelo.org'

const headers = {
	'md-api-key': process.env.MOEDELO_SECRET,
	'Content-Type': 'application/json'
}

const MoeDelo = axios.create({
	baseUrl: moedeloBaseUrl,
	headers
})

module.exports = {
	MoeDelo,
}