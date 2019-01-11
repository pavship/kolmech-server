const { Query } = require('./Query')
const { Subscription } = require('./Subscription')
const { auth } = require('./Mutation/auth')
const { enquiry } = require('./Mutation/enquiry')
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
  Query,
  Mutation: {
    ...auth,
    ...enquiry,
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
