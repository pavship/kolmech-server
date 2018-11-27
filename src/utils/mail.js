const nodemailer = require('nodemailer')

const serverTransporter = nodemailer.createTransport({
  service: '"Yandex"', // no need to set host or port etc.
  auth: {
      user: 'pavship.dev@yandex.ru',
      pass: process.env.EMAIL_PASS,
  }
})
const devTransporter = nodemailer.createTransport({
  service: '"Yandex"', // no need to set host or port etc.
  auth: {
      user: 'pavship.dev@yandex.ru',
      pass: process.env.EMAIL_PASS,
  }
})
const sendServerMail = options => {
  const mailOptions = {
    from: '"honingovanie.ru" <pavship.dev@yandex.ru>', // sender address
    ...options
  }
  serverTransporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error)
      // In case email is invalid, reject with explanatory error message
      throw new Error('Не удалось отправить почту на указанный email')
    }
    console.log('Message sent: %s', info.messageId);
  })
}
const reportToDeveloper = err => {
  const mailOptions = {
    from: '"kolmech-server" <pavship.dev@yandex.ru>',
    to: 'pavship.dev@yandex.ru',
    subject: 'Error report',
    html: `<pre>${JSON.stringify(err, null, 2)}</pre>`
  }
  devTransporter.sendMail(mailOptions, (error, info) => {
    if (error) console.log(error)
      else console.log('Report sent: %s', info.messageId)
  })
}

module.exports = {
	serverTransporter,
  sendServerMail,
  reportToDeveloper
}
