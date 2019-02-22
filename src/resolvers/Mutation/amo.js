
const AmoCRM = require( 'amocrm-js' );

const crm = new AmoCRM({
  domain: process.env.AMO_DOMAIN,
  auth: {
    login: process.env.AMO_LOGIN,
    hash: process.env.AMO_HASH
  }
})

crm.connect()

const amo = {
  // async login
	async syncWithAmoContacts(_, __, ctx, info) {
    try {
      const { userId, db } = ctx
  
      // const res = await crm.request.get( '/api/v2/leads' )
  
      const res = await crm.request.get( '/api/v2/contacts' )
      const contacts = res._embedded.items.map(({ id, name }) => ({ id, name }))
      // console.log('contacts > ', JSON.stringify(contacts, null, 2))
  
      const persons = await db.query.persons({
        where: {
          id_not_in: [
            'cjm85kntr00f009385au7tolq', //Admin
            'cjnfcpohm0d4h0724cmtoe8sj', //Server
          ]
        }
      // }, '{ id amoId fName lName }')
      }, '{ amoId amoName }')
  
      // assign amoIds to existing users 
      // just once for migration purpose
      // Then, every Person except Admin and Server has corresponding contact in AmoCRM
      // const updated = await Promise.all(persons.map(({
      //   id,
      //   fName,
      //   lName
      // }) => {
      //   const contact = contacts.find(c => c.name === fName + ' ' + lName)
      //   return db.mutation.updatePerson({ where: { id },
      //     data: {
      //       amoId: contact.id,
      //       amoName: contact.name
      //     }
      //   }, '{ id }')
      // }))
  
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
      const upserted = handled.filter(c => !!c) //filter out nulls
      const toDelete = persons.filter(p => !contacts.map(c => c.id).includes(p.amoId))
      const deleted = await db.mutation.deleteManyPersons({
        where: {
          amoId_in: toDelete.map(p => p.amoId)
        }
      })
  
      console.log('upserted > ', JSON.stringify(upserted, null, 2))
      console.log('deleted > ', JSON.stringify(deleted, null, 2))
  
      // return { count: -1 }
      return { count: upserted.length + deleted.count }
      
    } catch (err) {
      console.log('err > ', err)
      throw new Error(err.message)
    }
  }
}

module.exports = { 
	amo
}