
const axios = require('axios')

const baseURL = `https://${process.env.AMO_DOMAIN}.amocrm.ru`

let Amo = null

// const { bot } = require('./telegram')
// console.log('Amo > ', bot)

const amoConnect = async ctx => {
  const { db } = ctx
  // console.log('await db.query.serverDatas({}, { id amoExpiresAt, amoCookie }) > ', await db.query.serverDatas({}, '{ id amoExpiresAt, amoCookie }'))
  let [{ id, amoExpiresAt, amoCookie }] = 
    await db.query.serverDatas({}, '{ id amoExpiresAt, amoCookie }')
  const isExpired = amoExpiresAt < Date.now()/1000
  if (isExpired) {
    const res = await axios.post(
      baseURL + '/private/api/auth.php?type=json',
      {
        USER_LOGIN: process.env.AMO_LOGIN,
        USER_HASH: process.env.AMO_HASH
      }
    )
    if (res.statusText !== 'OK') throw new Error('Amo authorization request failed with res.statusText > ' , res.statusText)
    amoExpiresAt = res.data.response.server_time + 14.5*60
    amoCookie = res.headers['set-cookie']
      .map(c => c.slice(0, c.indexOf(';')))
      .join(';')
    await db.mutation.updateServerData({
      where: { id },
      data: { amoExpiresAt, amoCookie }
    })
  }
  if (Amo === null || isExpired)
    Amo = axios.create({
      baseURL,
      headers: {
        'cookie': amoCookie,
      }
    })
  return Amo
}

const createAmoTask = async(_, { dealId, date }, ctx, info) => {
  console.log('dealId, date > ', dealId, date)
  const amo = await amoConnect(ctx)
  try {
    // const { data } = await Amo.post('/api/v2/tasks/', {
    //   add: [
    //     {
    //        element_id: "20057471" ,
    //        element_type: "2" ,
    //        complete_till_at: "1508706000" ,
    //        task_type: "2" ,
    //        text: "Amo Task Test" ,
    //        created_at: "1508706000" ,
    //        updated_at: "1508706000" ,
    //        responsible_user_id: "3405940" ,
    //        created_by: "3405940"
    //     }
    //  ]
    // },{
    //   headers: {
    //     'Content-Type': 'application/json'
    //   }
    // })
    // console.log('data > ', data)
  } catch (error) {
    console.log('error > ', error)
  }
}

const getAmoCompany = async(_1, { amoId, query }, ctx, info) => {
  try {
    const amo = await amoConnect(ctx)
    const { data: { _embedded }} = await amo.get(`api/v2/companies?${
      amoId ? `id=${amoId}` :
      query ? `query=${query}` : ''
    }`)
    if (!_embedded) return null
    const { items: [ company ] } = _embedded
    let mainContactId = company.contacts.id ? company.contacts.id[0] : ''
    let leads = null
    console.log('company.leads._links > ', company.leads._links)
    if (company.leads.id) {
      const { data } = await amo.get(company.leads._links.self.href.slice(1))
      leads = data._embedded.items
      const mainContacts = leads
        .filter(l => !!l.main_contact.id)
        .map(l => l.main_contact)
        .reduce((res, c) => {
          (res.find(ar => ar[0].id === c.id) || (res[res.length] = [])).push(c)
          return res
        }, [])
        .sort((a, b) => b.length - a.length)
      const mainContact = mainContacts ? mainContacts[0][0] : null
      if (mainContact) mainContactId = mainContact.id
    }
    console.log('mainContactId > ', mainContactId)
    const mainContact = mainContactId ?
      (await amo.get(`api/v2/contacts?id=${mainContactId}`)).data._embedded.items[0]
      : null
    return {
      ...company,
      ...mainContact && { mainContact }
    }
  } catch (err) {
    console.log('getAmoCompany request error > ', err)
    throw err
  }
}

const syncWithAmoContacts = async(_, __, ctx, info) => {
  try {
    const { userId, db } = ctx
    const amo = await amoConnect(ctx)
    const results = await Promise.all([0, 500, 1000, 1500, 2000, 2500, 3000, 3500].map(offset =>
      amo.get('/api/v2/contacts?limit_rows=500&limit_offset=' + offset)
    ))
    const contacts = results
      .filter(({ status }) => status === 200)
      .map(({ data: {_embedded: { items }}}) => items.map(({ id, name }) => ({ id, name })))
      .reduce((contacts, items) => [...contacts, ...items], [])
    const persons = await db.query.persons({
      where: {
        id_not_in: [
          'cjm85kntr00f009385au7tolq', //Admin
          'cjnfcpohm0d4h0724cmtoe8sj', //Server
          'ck5vawx4y013l07974hxx8hdt', //Administrator dev
          //'ck5vipa7100l9063866esnp1n', //Administrator prod - has been added to AmoContacts
        ]
      }
    }, '{ id fName lName amoId amoName }')
    // assign amoIds to existing users 
    // THIS PART USED JUST ONCE FOR MIGRATION PURPOSE
    // Then, every Person except Admin and Server has corresponding contact in AmoCRM
    // const updated = await Promise.all(persons.map(({
    //   id,
    //   fName,
    //   lName
    // }) => {
    //   const contact = contacts.find(c => c.name === fName + ' ' + lName)
    //   console.log('fName lName contact > ', fName, lName, contact)
    //   return db.mutation.updatePerson({ where: { id },
    //     data: {
    //       amoId: contact.id,
    //       amoName: contact.name
    //     }
    //   }, '{ id }')
    // }))

    // THIS PART USED FOR DEBUG
    // for (const { id: amoId, name: amoName } of contacts) {
    //   const person = persons.find(p => p.amoId === amoId)
    //   console.log('person, amoId, amoName > ', person, amoId, amoName)
    //   if (!person) await db.mutation.createPerson({
    //     data: {
    //       amoId,
    //       amoName
    //     }
    //   }, '{ amoId amoName }')
    //   if (person && person.amoName === amoName) continue
    //   if (person) await db.mutation.updatePerson({ where: { amoId },
    //     data: {
    //       amoName
    //     }
    //   }, '{ amoId amoName }')
    // }

    const handled = await Promise.all(contacts.map(({
      id: amoId,
      name: amoName
    }) => {
      const person = persons.find(p => p.amoId === amoId)
      if (!person) return db.mutation.createPerson({
        data: {
          amoId,
          amoName
        }
      }, '{ amoId amoName }')
      if (person.amoName === amoName) return
      return db.mutation.updatePerson({ where: { amoId },
        data: {
          amoName
        }
      }, '{ amoId amoName }')
    }))

    // const upserted = handled.filter(c => !!c) //filter out nulls
    const toDelete = persons.filter(p => !contacts.map(c => c.id).includes(p.amoId))
    const deleted = await db.mutation.deleteManyPersons({
      where: {
        amoId_in: toDelete.map(p => p.amoId)
      }
    })
    // console.log('upserted > ', JSON.stringify(upserted, null, 2))
    // console.log('deleted > ', JSON.stringify(deleted, null, 2))
    return db.query.persons({}, info)
  } catch (err) {
    console.log('err > ', err)
    throw err
  }
}

module.exports = { 
  amo: {
    createAmoTask,
    syncWithAmoContacts
  },
  getAmoCompany,
  amoConnect
}