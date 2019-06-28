const { File } = require('./File')
const { Query } = require('./Query/Query')
const { orgQueries } = require('./Query/orgQueries')
const { Subscription } = require('./Subscription')
const { amo } = require('./Mutation/amo')
const { auth } = require('./Mutation/auth')
const { batch } = require('./Mutation/batch')
const { contract } = require('./Mutation/contract')
const { deal } = require('./Mutation/deal')
const { dealStatus } = require('./Mutation/dealStatus')
const { disk } = require('./Mutation/disk')
const { drawing } = require('./Mutation/drawing')
const { enquiry } = require('./Mutation/enquiry')
const { file } = require('./Mutation/file')
// const { op } = require('./Mutation/op')
const { opType } = require('./Mutation/opType')
const { org } = require('./Mutation/org')
const { order } = require('./Mutation/order')
const { payment } = require('./Mutation/payment')
const { person } = require('./Mutation/person')
const { prod } = require('./Mutation/prod')
const { task } = require('./Mutation/task')
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
    ...orgQueries
  },
  Mutation: {
    ...amo,
    ...auth,
    ...batch,
    ...contract,
    ...deal,
    ...dealStatus,
    ...disk,
    ...drawing,
    ...enquiry,
    ...file,
    // ...op,
    ...opType,
    ...org,
    ...order,
    ...payment,
    ...person,
    ...prod,
    ...task,
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
