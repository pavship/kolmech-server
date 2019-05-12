const { File } = require('./File')
const { Query } = require('./Query/Query')
const { Subscription } = require('./Subscription')
const { amo } = require('./Mutation/amo')
const { auth } = require('./Mutation/auth')
const { dealStatus } = require('./Mutation/dealStatus')
const { drawing } = require('./Mutation/drawing')
const { enquiry } = require('./Mutation/enquiry')
const { file } = require('./Mutation/file')
const { org } = require('./Mutation/org')
const { order } = require('./Mutation/order')
const { payment } = require('./Mutation/payment')
const { person } = require('./Mutation/person')
const { prod } = require('./Mutation/prod')
const { tel } = require('./Mutation/tel')
const { tochka } = require('./Mutation/tochka')
const { employee } = require('./Mutation/employee')
const { migration } = require('./Mutation/migration')
const { mixed } = require('./Mutation/mixed')
const { model } = require('./Mutation/model')
const { AuthPayload } = require('./AuthPayload')

module.exports = {
  File,
  Query: {
    ...Query, //simple queries collection
  },
  Mutation: {
    ...amo,
    ...auth,
    ...dealStatus,
    ...drawing,
    ...enquiry,
    ...file,
    ...org,
    ...order,
    ...payment,
    ...person,
    ...prod,
    ...tel,
    ...tochka,
    ...employee,
    ...migration,
    ...mixed,
    ...model,
  },
  Subscription,
  AuthPayload,
}
