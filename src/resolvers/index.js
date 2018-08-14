const { Query } = require('./Query')
const { Subscription } = require('./Subscription')
const { auth } = require('./Mutation/auth')
const { enquiry } = require('./Mutation/enquiry')
const { AuthPayload } = require('./AuthPayload')

module.exports = {
  Query,
  Mutation: {
    ...auth,
    ...enquiry,
  },
  Subscription,
  AuthPayload,
}
