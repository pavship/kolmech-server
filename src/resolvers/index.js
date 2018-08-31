const { Query } = require('./Query')
const { Subscription } = require('./Subscription')
const { auth } = require('./Mutation/auth')
const { enquiry } = require('./Mutation/enquiry')
const { org } = require('./Mutation/org')
const { AuthPayload } = require('./AuthPayload')

module.exports = {
  Query,
  Mutation: {
    ...auth,
    ...enquiry,
    ...org
  },
  Subscription,
  AuthPayload,
}
