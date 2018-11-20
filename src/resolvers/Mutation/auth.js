const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { parseOrThrow, parseFullname } = require('../../utils/format')

const auth = {
	async signup(_, {
		email,
		password,
		fName: fNameArg,
		lName: lNameArg,
		mName: mNameArg,
		regName
	}, ctx, info) {
		let fName = fNameArg
		let lName = lNameArg
		let mName = mNameArg
		if (regName) {
			const [fNameDerived, lNameDerived, mNameDerived] = parseOrThrow(parseFullname, regName)
			fName = fNameArg || fNameDerived
			lName = lNameArg || lNameDerived
			mName = mNameArg || mNameDerived
			console.log('fNameDerived, lNameDerived, mNameDerived > ', fNameDerived, lNameDerived, mNameDerived)
		}
		if (!fName) throw new Error('Не найдено имени для создания записи пользователя')
		const passwordHash = await bcrypt.hash(password, 10)
		const user = await ctx.db.mutation.createUser({
			data: { 
				email, 
				password: passwordHash,
				person: {
					create: {
						fName,
						...lName && { lName },
						...mName && { mName },
						...regName && { regName },
					}
				}
			}
		})
		return {
			token: jwt.sign(
				{ userId: user.id },
				process.env.APP_SECRET,
				{ expiresIn: '15h' }
			),
			// user,
		}
	},

	async login(_, { email, password }, ctx, info) {
		const user = await ctx.db.query.user({ where: { email } }, '{id email password person { fName lName }}')
		if (!user) {
			throw new Error(`No such user found for email: ${email}`)
		}
		const valid = await bcrypt.compare(password, user.password)
		if (!valid) {
			throw new Error('Invalid password')
		}
		console.log(user.person.fName + ' ' + user.person.lName + ' (' + email + ') '  + 'logged in')
		return {
			token: jwt.sign(
				{ userId: user.id },
				process.env.APP_SECRET,
				{ expiresIn: '15h' }
			),
			// user: {
			// 	email: user.email,
			// 	person: {
			// 			fName: user.person.fName
			// 	}
			// }
		}
	},
}

module.exports = { auth }
