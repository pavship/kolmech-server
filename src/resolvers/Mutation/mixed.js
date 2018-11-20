const { auth } = require('./auth')
const { parseOrThrow, parsePhone } = require('../../utils/format')

const mixed = {
	async signupAndCreateEnquiry(_, args, ctx, info) {
		// 1. Validate input
		// 2. Send credentials to email, thus check the email address exists
		// 3. In case something is invalid, reject with explanatory error message
		// 4. Register Enquiry
		// 3. TODO use token to bring client into personal interface
		console.log('args > ', args)
		const { tel: telInput, country } = args
		const tel = parseOrThrow(parsePhone, telInput, { country })
		console.log('tel > ', tel)
		const {email, regName} = args
		const password = 'yoyopass'
		const signup = await auth.signup(_, {email, password, regName}, ctx, '{ token }')
		console.log('signup > ', signup)
	},

}

module.exports = { mixed }
