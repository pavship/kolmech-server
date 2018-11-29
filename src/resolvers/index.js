const { Query } = require('./Query')
const { Subscription } = require('./Subscription')
const { auth } = require('./Mutation/auth')
const { enquiry } = require('./Mutation/enquiry')
const { org } = require('./Mutation/org')
const { order } = require('./Mutation/order')
const { person } = require('./Mutation/person')
const { prod } = require('./Mutation/prod')
const { employee } = require('./Mutation/employee')
const { migration } = require('./Mutation/migration')
const { mixed } = require('./Mutation/mixed')
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
    ...employee,
    ...migration,
    ...mixed
  },
  Subscription,
  AuthPayload,
}
