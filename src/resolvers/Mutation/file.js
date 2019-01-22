const { createWriteStream } = require('fs')

const storeUpload = async ({ stream, path }) => {
  return new Promise((resolve, reject) =>
    stream
      .pipe(createWriteStream(path))
      .on('finish', resolve)
      .on('error', reject),
  )
}

const createFile = async ({ filename, mimetype, encoding }, ctx) => {
  const { userId, db } = ctx
  const { id } = await db.mutation.createFile({
    data: { filename, mimetype, encoding }
  }, '{ id }')
  return db.mutation.updateFile({
    where: { id },
    data: {
      path: `uploads/${id}`
    }
  }, '{ id path }')
}

const upload = async ( file, ctx ) => {
  const { stream, filename, mimetype, encoding } = await file
  const { id, path } = await createFile({ filename, mimetype, encoding }, ctx)
  await storeUpload({ stream, path })
  return { id, path, filename, mimetype, encoding }
}

const file = {
	singleUpload(obj, { file }, ctx) {
    upload(file, ctx)
  },
	multipleUpload (obj, { files }, ctx) {
    Promise.all(files.map(file => upload(file , ctx)))
  },
}

module.exports = { file, upload }