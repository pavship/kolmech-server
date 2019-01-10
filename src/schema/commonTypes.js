const { string } = require('yup')

const idValidationType = string().matches(/^[a-z0-9]{25}$/)

module.exports = { 
	idValidationType
}