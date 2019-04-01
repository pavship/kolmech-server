// this is custom query template file - use as u wish!

const bankPayment = {
	async bankPayments(_, { input }, ctx, info) {
		console.log('bankPayment > ', bankPayment)
		return [{ id: '1' }]
	}
}

module.exports = { bankPayment }