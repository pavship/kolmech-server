const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const auth = {
	async signup(_, {email, password, fName, lName}, ctx, info) {
		console.log('lName > ', lName)
		const passwordHash = await bcrypt.hash(password, 10)
		const user = await ctx.db.mutation.createUser({
			data: { 
				email, 
				password: passwordHash,
				person: {
					create: {
						fName,
						lName
					}
				}
			}
		})
		return {
			token: jwt.sign({ userId: user.id }, process.env.APP_SECRET),
			user,
		}
	},

	async login(parent, { email, password }, ctx, info) {
		const user = await ctx.db.query.user({ where: { email } })
		if (!user) {
		throw new Error(`No such user found for email: ${email}`)
		}

		const valid = await bcrypt.compare(password, user.password)
		if (!valid) {
		throw new Error('Invalid password')
		}

		return {
		token: jwt.sign({ userId: user.id }, process.env.APP_SECRET),
		user,
		}
	},
}

module.exports = { auth }
