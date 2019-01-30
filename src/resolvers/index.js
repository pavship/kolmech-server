const { File } = require('./File')
const { Query } = require('./Query')
const { Subscription } = require('./Subscription')
const { auth } = require('./Mutation/auth')
const { drawing } = require('./Mutation/drawing')
const { enquiry } = require('./Mutation/enquiry')
const { file } = require('./Mutation/file')
const { org } = require('./Mutation/org')
const { order } = require('./Mutation/order')
const { person } = require('./Mutation/person')
const { prod } = require('./Mutation/prod')
const { tel } = require('./Mutation/tel')
const { employee } = require('./Mutation/employee')
const { migration } = require('./Mutation/migration')
const { mixed } = require('./Mutation/mixed')
const { model } = require('./Mutation/model')
const { AuthPayload } = require('./AuthPayload')

module.exports = {
  File,
  Query,
  Mutation: {
    ...auth,
    ...drawing,
    ...enquiry,
    ...file,
    ...org,
    ...order,
    ...person,
    ...prod,
    ...tel,
    ...employee,
    ...migration,
    ...mixed,
    ...model,
  },
  Subscription,
  AuthPayload,
}
