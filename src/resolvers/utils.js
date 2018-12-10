const makeCreateObject = async (input, typeName, ctx) => {
  return await handleObj(input, typeName, ctx)
}

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
    const type = typeof obj[k]
    // NOTE array objects are expected to be called as plural -> <TypeName>s
    if (type === 'object' && Array.isArray(obj[k])) {
      const typeName = k.slice(0, -1)
      return result[k] = await handleArr(obj[k], k, objTypeName, obj.id, ctx)
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
  // Object.keys(obj).forEach(k => {
  //   const type = typeof obj[k]
  //   // NOTE array objects are expected to be called as plural -> <TypeName>s
  //   if (type === 'object' && Array.isArray(obj[k])) {
  //     const typeName = k.slice(0, -1)
  //     return result[k] = await handleArr(obj[k], k, objTypeName, obj.id, ctx)
  //   }
  //   if (type === 'object') {
  //     const method = obj[k].id ? 'update' : 'create'
  //     return result[k] = {
  //       [method]: handleObj(obj[k], k, ctx)
  //     }
  //   }
  //   if (k.endsWith('Id')) {
  //     const typeName = k.slice(0, -2)
  //     return result[typeName] = {
  //       connect: {
  //         id: obj[k]
  //       }
  //     }
  //   }
  //   return result[k] = obj[k]
  // })
  // console.log('result > ', JSON.stringify(result, null, 2))
  return result
}

const handleArr = async (arr, typeName, parentTypeName, parentId, ctx) => {
  const result = {}
  let prevArr = null
  let toDelete = []
  // if parent object exists, get prevArr and compare with new arr
  if (parentId) {
    prevArr = await ctx.db.query[typeName]({ 
      where: {
        [parentTypeName]: {
          id: parentId
        }
      }
    }, '{ id }')
    console.log('prevArr > ', prevArr)
    // TODO delete records with ids absent in new arr
    toDelete = prevArr.filter(r => !arr.map(r => r.id).includes(r.id))
    if (typeName === 'tels')
    // delete tels with erased numbers
      toDelete = [
        ...toDelete,
        ...arr.map(({ id }) => ({ id })).filter(r => r.id && !r.number)
      ]
  }
  console.log('toDelete > ', toDelete)
  // return null
  return ({
    ...toDelete.length && { delete: toDelete }
  })
}

module.exports = { 
  makeCreateObject
}