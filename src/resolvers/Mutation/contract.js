const axios = require('axios')
var JSZip = require('jszip')
var Docxtemplater = require('docxtemplater')
const { toLocalDateString } = require('../../utils/dates')
const { getResourceDownloadUrl } = require('./disk')

const { writeFileSync } = require('fs')

// const toArray = require('stream-to-array')

// const createBuffer = async ( stream ) => {
//   const parts = await toArray(stream)
//   const buffers = parts.map(part => Buffer.from(part))
//   return Buffer.concat(buffers)
//}

const baseUrl = 'https://restapi.moedelo.org'
const headers = {
  'md-api-key': process.env.MOEDELO_SECRET,
  'Content-Type': 'application/json'
}

const createContract = async (_, { id, date = toLocalDateString(new Date()) }, { db }, info) => {
  const { moedeloId } = await db.query.org({ where: { id }})
  console.log('moedeloId > ', moedeloId)
  if (!moedeloId) throw new Error('Organizaton is not connected to MoeDelo')
  // const res = await axios.post(
  //   baseUrl + '/contract/api/v1/contract', {
  //     Number: `${date}/1`,
  //     DocDate: `${date}T00:00:00+03:00`,
  //     Status: 1,
  //     KontragentId: parseInt(moedeloId),
  //     Direction: 1,
  //     Kind: 0
  //   }, {
  //     headers
  //   }
  // )
  const { data } = await axios.get(
    baseUrl + '/kontragents/api/v1/kontragent/' + moedeloId, {
      headers
    }
  )
  console.log('data > ', data)
  const templateDownloadUrl = await getResourceDownloadUrl('/Шаблоны документов/Договор подряда (для клиентов)/Шаблоны для МоеДело/2019-05-09_Шаблон договора ИП ШПС на мехобработку.docx')
  const { data: template } = await axios.get( templateDownloadUrl, { responseType: 'arraybuffer'} )

  var zip = new JSZip(template)
  var doc = new Docxtemplater()
  doc.loadZip(zip)
  //set the templateVariables
  doc.setData({
      number: `${date}/1`,
      date: date.split('-').reverse().join('.')
  })
  try {
      // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
      doc.render()
  }
  catch (error) {
      var e = {
          message: error.message,
          name: error.name,
          stack: error.stack,
          properties: error.properties,
      }
      console.log(JSON.stringify({error: e}))
      // The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
      throw error
  }
  var buf = doc.getZip()
    .generate({
      type: 'nodebuffer',
      compression: "DEFLATE"
    })
  // buf is a nodejs buffer, you can either write it to a file or do anything else with it.
  writeFileSync('./output.docx', buf)

  console.log('res > ', res)
  return { statusText: 'OK' }
}

module.exports = {
	contract: {
		createContract
	}
}