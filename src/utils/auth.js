const jwt = require('jsonwebtoken')

function getUserId(ctx) {
	// console.log('Object.keys(ctx.request) > ', Object.keys(ctx.request))
	// console.log('Object.keys(ctx.request.headers) > ', Object.keys(ctx.request.headers))
	// console.log('Object.keys(ctx.request.body) > ', Object.keys(ctx.request.body))
	// console.log('ctx.request.body.operationName > ', ctx.request.body.operationName)
    
	if (ctx.request.body.operationName === 'Login') return null

	const Authorization = ctx.request.get('Authorization')
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

	throw new AuthError()
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