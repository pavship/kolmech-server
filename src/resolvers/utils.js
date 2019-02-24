const { cloneDeep } = require('lodash')
const { isValidDate } = require('../utils/dates')

const generateMutationObject = async (input, typeName, ctx, { includeUser } = {}) => console.log('includeUser > ', includeUser) || ({
  ...input.id && { where: { id: input.id } },
  data: {
    ...await handleObj(input, typeName, ctx),
    // ...input.id && !!includeUser && { updatedBy: { connect: { id: ctx.userId } } }
    ...!!includeUser && (
        input.id  ? { updatedBy: { connect: { id: ctx.userId } } } :
        !input.id ? { createdBy: { connect: { id: ctx.userId } } } :
        false
      )
  }
})

const formikSchema = {
  person: {
    lName: '',
    fName: '',
    mName: '',
    tels: [{
      number: '',
      country: 'rus',
    }]
  }
}

const handleObj = async (obj = {}, objTypeName, ctx) => {
  const result = {}
  await Promise.all(Object.keys(obj).map(async (k) => {
    // skip 'id' field
    if (k === 'id') return
    const type = typeof obj[k]
    // NOTE array objects are expected to be called as plural -> <TypeName>s
    if (type === 'object' && Array.isArray(obj[k])) {
      const handledArr = await handleArr(obj[k], k, objTypeName, obj.id, ctx)
      return handledArr && (result[k] = handledArr)
    }
    if (type === 'object' && isValidDate(obj[k])) {
      return result[k] = obj[k]
    }
    if (type === 'object') {
      const method = obj[k].id ? 'update' : 'create'
      return result[k] = {
        [method]: await handleObj(obj[k], k, ctx)
      }
    }
    if (k.endsWith('Id')) {
      const typeName = k.slice(0, -2)
      return result[typeName] = {
        connect: {
          id: obj[k]
        }
      }
    }
    return result[k] = obj[k]
  }))
  return result
}

const handleArr = async (arr, typeName, parentTypeName, parentId, ctx) => {
  console.log('new arr > ', arr)
  const arrIds = arr.map(r => r.id)
  // console.log('arrIds > ', arrIds)
  let toDelete = []
  let toUpdate = []
  // if parent object exists, get prevArr and compare with new arr
  if (parentId) {
    const prevArr = await ctx.db.query[typeName]({ 
      where: {
        [parentTypeName]: {
          id: parentId
        }
      }
    }, '{ id }')
    console.log('prevArr > ', prevArr)
    // exceptions' array
    const deleteInsteadUpdateIds = []
    for (let { id } of prevArr) {
      const newVal = cloneDeep(arr.find(r => r.id === id))
      // assign toDelete record if it's not found in the new arr
      if (!newVal) toDelete.push({ id })
        // assign toUpdate record if it's found in the new arr and has any props except 'id'
        else if (Object.keys(newVal).length > 1) toUpdate.push({
          where: { id },
          data: await handleObj(newVal, typeName.slice(0, -1), ctx)
        })
      // exceptions
      if (typeName === 'tels' && newVal && newVal.number === '')
        deleteInsteadUpdateIds.push(newVal.id)
    }
    // prevArr.forEach(({ id }) => {
    //   const newVal = cloneDeep(arr.find(r => r.id === id))
    //   // assign toDelete record if it's not found in the new arr
    //   if (!newVal) toDelete.push({ id })
    //     // assign toUpdate record if it's found in the new arr and has any props except 'id'
    //     else if (Object.keys(newVal).length > 1) toUpdate.push({
    //       where: { id },
    //       data: await handleObj(newVal, typeName.slice(0, -1), ctx)
    //     })
    //   // exceptions
    //   if (typeName === 'tels' && newVal && newVal.number === '')
    //     deleteInsteadUpdateIds.push(newVal.id)
    // })
    console.log('deleteInsteadUpdateIds > ', deleteInsteadUpdateIds)
    // handle exceptions
    console.log('toUpdate > ', toUpdate)
    if (deleteInsteadUpdateIds.length) {
      toUpdate = toUpdate.filter(r => !deleteInsteadUpdateIds.includes(r.where.id))
      toDelete = [
        ...toDelete,
        ...prevArr.filter(r => deleteInsteadUpdateIds.includes(r.id))
      ]
    }
  }
  console.log('toDelete > ', toDelete)
  console.log('toUpdate > ', toUpdate)
  // all records without ids are saved into db
  let toCreate = arr.filter(r => !r.id)
  if (typeName === 'tels')
    // not creating tels with empty numbers
      toCreate = toCreate.filter(r => !!r.number)
  console.log('toCreate > ', toCreate)
  const result = {
    ...toDelete.length && { delete: toDelete },
    ...toUpdate.length && { update: toUpdate },
    ...toCreate.length && { create: toCreate },
  }
  return Object.keys(result).length
    ? result
    : null
}

module.exports = { 
  generateMutationObject
}