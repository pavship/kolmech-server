const axios = require('axios')
var JSZip = require('jszip')
var Docxtemplater = require('docxtemplater')
const { toLocalDateString } = require('../../utils/dates')
const { upsertOrgFolder, upsertOrgDealFolder, getResourceDownloadUrl, getResourceUploadUrl } = require('./disk')
const { currency } = require('../../utils/format')

const { writeFileSync } = require('fs')

const baseUrl = 'https://restapi.moedelo.org'
const headers = {
  'md-api-key': process.env.MOEDELO_SECRET,
  'Content-Type': 'application/json'
}

const generateDocx = (template, data) => {
  const zip = new JSZip(template)
  const doc = new Docxtemplater()
    .setOptions({linebreaks:true})
    .loadZip(zip)
    .setData(data)
    // .setOptions({ paragraphLoop:true })
  try { doc.render() }
  catch (error) {
      const { message, name, stack, properties } = error
      console.log(JSON.stringify({error: { message, name, stack, properties }}))
      throw error
  }
  // return buf which is a nodejs buffer, you can either write it to a file or do anything else with it.
  return doc.getZip()
    .generate({
      type: 'nodebuffer',
      compression: "DEFLATE"
	  })
}

const createComOffer = async (_, { dealId, date = toLocalDateString(new Date()) }, ctx, info) => {
	const { db } = ctx
  const { amoId, date: dealDate, batches: dealBatches } = await db.query.deal({ where: { id: dealId }}, `{
    amoId
    date
    batches {
      info
      qty
      warning
      model {
        name
        drawings {
          name
        }
      }
      workpiece {
				hardness
        material
				name
        drawing {
          name
        }
      }
      procs {
        ops {
          dealLabor
          description
          opType {
            name
            laborPrice
						opClass
          }
        }
      }
		}
  }`)
  const genOpTemplateData = ({
    dealLabor=0,
    description='',
    opType
  }, batchNum, num) => ({
    num: batchNum + '.' + num,
    op: opType.name,
    hrs: dealLabor,
    description,
    price: currency(dealLabor*opType.laborPrice)
	})
	const batches = dealBatches.map(({
		info,
		qty,
		warning,
		model,
		procs,
		workpiece
	}, i) => {
		const batchNum = i + 1
		const ops = procs[0]
			&& procs[0].ops.filter(op => op.opType.opClass === 'MACHINING')
			|| []
		const amount = ops.reduce((sum, op) => sum += (op.dealLabor || 0)*op.opType.laborPrice, 0)
		return {
			amount: currency(amount),
			num: batchNum,
			info,
			qty,
			sum: currency(qty*amount),
			sumFloat: qty*amount,
			warning,
			modelName: model.name,
			drwName: model.drawings[0] && model.drawings[0].name,
			wpHardness: workpiece && workpiece.hardness,
			wpName: workpiece && workpiece.name,
			wpMaterial: workpiece && workpiece.material,
			wpDrwName: workpiece && workpiece.drawing && workpiece.drawing.name,
			...ops.length === 1 && {oOp: genOpTemplateData(ops[0], batchNum, 1)}, //onlyOp
			...ops.length > 1 && {
				fOp: genOpTemplateData(ops[0], batchNum, 1), // firstOp
				lOp: genOpTemplateData(ops[ops.length - 1], batchNum, ops.length), // lastOp
			},
			...ops.length > 3 && {
				iOps: ops.slice(1,-1).map((op, i) => genOpTemplateData(op, batchNum, i + 2)) // intermediateOps
			},
		}
	})
  const templateDownloadUrl = await getResourceDownloadUrl('/Шаблоны документов/КП/template.docx')
  const { data: template } = await axios.get( templateDownloadUrl, { responseType: 'arraybuffer'} )
  const zip = new JSZip(template)
  const doc = new Docxtemplater()
    .setOptions({linebreaks:true})
    .loadZip(zip)
    .setData({
      date: date.split('-').reverse().join('.'),
      dealDate: dealDate.split('-').reverse().join('.'),
      amoId,
      batches,
      total: currency(batches.reduce((total, b) => total += b.sumFloat || 0, 0))
    })
    // .setOptions({ paragraphLoop:true })
  try { doc.render() }
  catch (error) {
      const { message, name, stack, properties } = error
      console.log(JSON.stringify({error: { message, name, stack, properties }}))
      throw error
  }
  const buf = doc.getZip()
    .generate({
      type: 'nodebuffer',
      compression: "DEFLATE"
	})
	// upload to yandex.disk
	const dealFolderPath = await upsertOrgDealFolder(dealId, ctx)
	const uploadUrl = await getResourceUploadUrl(`${dealFolderPath}/${date}_КП ХОНИНГОВАНИЕ.РУ_${amoId}.docx`)
	const { data } = await axios.put( uploadUrl, buf )
	console.log('data > ', data)
  // writeFileSync('./co.docx', buf)
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
  return { statusText: 'OK' }
}

const createPostEnvelopeAddressInsert = async (_, { orgId }, ctx, info) => {
  const { db } = ctx
  const { amoId, name } = await db.query.org({ where: { id: orgId }}, '{ amoId name }')
  const date = toLocalDateString(new Date())
  const templateDownloadUrl = await getResourceDownloadUrl('/Шаблоны документов/Корреспонденция/Конверт С4/template_ip.docx')
  const { data: template } = await axios.get( templateDownloadUrl, { responseType: 'arraybuffer'} )
  const docx = generateDocx(template, {
    kontr_short: name,
    // kontr_zip: '140408',
    // kontr_post_address: 'г.Пермь, ул. Глазовская 1-174',
    // kontr_tel: '+7 925 1234567',
    // kontr_manager: 'Аликин Никита',
    // kontr_manager_tel: '+7 925 1234567',
  })
	const orgFolderPath = await upsertOrgFolder(orgId, ctx)
	const uploadUrl = await getResourceUploadUrl(`${orgFolderPath}/${date}_Адресное почтовое вложение_${amoId}.docx`)
	await axios.put( uploadUrl, docx, { responseType: 'arraybuffer'} )
  return { statusText: 'OK' }
}

module.exports = {
	contract: {
    createComOffer,
    createContract,
    createPostEnvelopeAddressInsert
	}
}