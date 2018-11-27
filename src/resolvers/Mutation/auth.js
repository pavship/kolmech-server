const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { parseOrThrow, parseFullname, parsePhone } = require('../../utils/format')
const nodemailer = require('nodemailer')
const { serverTransporter } = require('../../utils/mail')

const auth = {
	async signup(_, {
		email,
		password,
		fName: fNameArg,
		lName: lNameArg,
		mName: mNameArg,
		regName,
		tel: telInput,
		country
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
		if (!fName) throw new Error('Введите Ваше полное имя для регистрации')
		let tel = ''
		if (telInput) {
			if (!country) throw new Error('Не указан код страны телефона')
			tel = parseOrThrow(parsePhone, telInput, { country })
			console.log('tel > ', tel)
		}
		const passwordHash = await bcrypt.hash(password, 10)
		const user = await ctx.db.mutation.createUser({
			data: {
				email,
				confirmed: false,
				password: passwordHash,
				person: {
					create: {
						fName,
						...lName && { lName },
						...mName && { mName },
						...regName && { regName },
						...(tel && {
							tels: {
								create: {
									number: tel,
									default: true
								}
							}
						})
					}
				}
			}
		})
		// TODO Send email confirmation link, thus check the email address exists
		const confirmationToken = jwt.sign(
			{ userId: user.id },
			process.env.APP_SECRET
		)
		const confirmationUrl = 'http://localhost:3003/confirm/' + confirmationToken
		// let transporter = nodemailer.createTransport({
		// 	service: '"Yandex"', // no need to set host or port etc.
		// 	auth: {
		// 			user: 'pavship.dev@yandex.ru',
		// 			pass: process.env.EMAIL_PASS,
		// 	}
		// })
		let mailOptions = {
			from: '"honingovanie.ru" <pavship.dev@yandex.ru>', // sender address
			to: 'pavship.developer@tutamail.com', // list of receivers
			subject: 'Подтвердите email @', // Subject line
			// text: 'Hello world?', // plain text body
			html: `<p>Пожалуйста подтвердите свой email, нажав на <a href="${confirmationUrl}">эту ссылку</a>.`
		}
		serverTransporter.sendMail(mailOptions, (error, info) => {
			if (error) {
				console.log(error)
				// In case email is invalid, reject with explanatory error message
				throw new Error('Не удалось отправить почту на указанный email')
			}
			console.log('Message sent: %s', info.messageId);
		})
		const token = jwt.sign(
			{ userId: user.id },
			process.env.APP_SECRET,
			{ expiresIn: '15h' }
		)
		return {
			token,
			person: user.person
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
			)
		}
	},
}

const confirmEmail = async (req, res) => {
	const { token } = req.params
	const { userId } = jwt.verify( token, process.env.APP_SECRET)
	await ctx.db.mutation.updateUser({
		where: {
			id: userId
		},
		data: {
			confirmed: true
		}
	})
	return res.redirect('http://localhost:3001/')
}

module.exports = { auth, confirmEmail }
