const jwt = require('jsonwebtoken')

const unrestrictedOperations = ['Login', 'CreateOrg', 'SignupAndCreateEnquiry']

function getUserId(ctx) {
	// console.log('Object.keys(request) > ', Object.keys(request))
	// console.log('Object.keys(request.headers) > ', Object.keys(request.headers))
	// console.log('Object.keys(request.body) > ', Object.keys(request.body))
	// console.log('request.body.operationName > ', request.body.operationName)
	
	// if (request.body.operationName === 'Login') return null
	const { request } = ctx
	const { operationName } = request.body
	console.log('operationName > ', operationName)
	if (unrestrictedOperations.includes(operationName)) return null

	const Authorization = request.get('Authorization')
	if (Authorization) {
		const token = Authorization.replace('Bearer ', '')
		// @ts-ignore
		const { userId } = jwt.decode(token)
		const jwtArgs = [
			token,
			process.env.APP_SECRET,
			...(userId === process.env.SERVER_USER_ID) ? [{ ignoreExpiration: true }] : []
		]
		// @ts-ignore
		jwt.verify(...jwtArgs)
		return userId
	}

	// console.log('Authorization > ', Authorization)
	throw new AuthError()
	// throw new Error('Not authorized')
	// throw new Error({id: '1', name: 'df', inn: '23'})
}

class AuthError extends Error {
	constructor() {
		super('Not authorized')
	}
}

module.exports = {
	getUserId,
	AuthError
}