const { auth } = require('./auth')
const { parseOrThrow, parsePhone } = require('../../utils/format')

const mixed = {
	async signupAndCreateEnquiry(_, args, ctx, info) {
		console.log('args > ', args)
		const { tel: telInput, country } = args
		const tel = parseOrThrow(parsePhone, telInput, { country })
		console.log('tel > ', tel)
		try {
			const {email, regName: fName} = args
			const password = 'yoyopass'
			const signup = await auth.signup(_, {email, password, fName, lName}, ctx, '{ token }')
			console.log('signup > ', signup)
		} catch (err) {
			console.log(err)
			return null
		}
	},

}

module.exports = { mixed }
