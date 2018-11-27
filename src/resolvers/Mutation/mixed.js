const { auth } = require('./auth')
const { string, object } = require('yup')
const generatePassword = require('password-generator')

const mixed = {
	async signupAndCreateEnquiry(_, args, ctx, info) {
		// 1. Validate input
		console.log('args > ', args)
		const {
			email,
			regName,
			tel,
			country
		} = args
		// const schema = yup.object().shape({
		// 	name: yup.string().required(),
		// 	age: yup
		// 		.number()
		// 		.required()
		// 		.positive()
		// 		.integer(),
		// 	email: yup.string().email(),
		// 	website: yup.string().url(),
		// 	createdOn: yup.date().default(function() {
		// 		return new Date();
		// 	}),
		// });


		// 2. In case something is invalid, reject with explanatory error message
		// 3. Create user
		const password = generatePassword(8, false)
		console.log('password > ', password)
		await auth.signup(_, {email, password, regName, tel, country}, ctx, '{}')
		// 6. Register Enquiry
		// 7. TODO use token to bring client into personal interface
		

		// console.log('signup > ', signup)

		return null
	},

}

module.exports = { mixed }
