const { Query } = require('./Query')
const { Subscription } = require('./Subscription')
const { auth } = require('./Mutation/auth')
const { enquiry } = require('./Mutation/enquiry')
const { org } = require('./Mutation/org')
const { order } = require('./Mutation/order')
const { prod } = require('./Mutation/prod')
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
    ...prod,
    ...migration,
    ...mixed
  },
  Subscription,
  AuthPayload,
}
