const cuid = require('cuid')
const { createWriteStream } = require('fs')

const storeUpload = async ({ stream, filename }) => {
  const id = cuid()
  const path = `uploads/${id}`

  return new Promise((resolve, reject) =>
    stream
      .pipe(createWriteStream(path))
      .on('finish', () => resolve({ id, path }))
      .on('error', reject),
  )
}

const processUpload = async upload => {
  const { stream, filename, mimetype, encoding } = await upload
  const { id, path } = await storeUpload({ stream, filename })
  return { id, filename, mimetype, encoding, path }
}

const file = {
	singleUpload(obj, { file }) {
    processUpload(file)
  },
	multipleUpload (obj, { files }) {
    Promise.all(files.map(processUpload))
  },
}

module.exports = { file }