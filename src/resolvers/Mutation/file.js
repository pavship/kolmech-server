const { createWriteStream, promises: fsp } = require('fs')
const cuid = require('cuid')
const sharp = require('sharp')

const storeUpload = async ( stream, path ) => {
  console.log('storeUpload >')
  return new Promise((resolve, reject) =>
    stream
      .pipe(createWriteStream(path))
      .on('finish', resolve)
      .on('error', reject),
  )
}

const removeUpload = path => {
  return fsp.unlink(path)
}

const getExtension = mimetype => {
  const mime = mimetype.startsWith('image/')
    ? mimetype.slice(6)
    : mimetype
  const extension = mime === 'jpeg'
    ? 'jpg'
    : mime
  return extension
}

// write File type record into db
const upsertFile = async (inputObj, ctx, options = {}) => {
  const { userId, db } = ctx
  const {
    createBlank,
    extension
  } = options
  const input = { ...inputObj }
  const { id } = input
  delete input.id
  if (!id) { // create new record
    const { id } = await db.mutation.createFile({ data: input }, '{ id }')
    if (createBlank) return ({ id, path: '' })
    return db.mutation.updateFile({
      where: { id },
      data: {
        path: `uploads/${id}${
          !extension ? ' ' : 
          extension === 'getFromMime' ? '.' + getExtension(input.mimetype) :
          '.' + extension
        }`
      }
    }, '{ id path }')
  }
  else { // update existing record
    return db.mutation.updateFile({
      where: { id },
      data: {
        ...input,
        ...extension && { path: `uploads/${id}${'.' + extension}`}
      }
    }, '{ id path }')
  }
}

const upload = async ( file, ctx, createFileOptions ) => {
  const { stream, filename, mimetype, encoding } = await file
  const { id, path } = await upsertFile({ filename, mimetype, encoding }, ctx, createFileOptions)
  await storeUpload( stream, path )
  return { id, path, filename, mimetype, encoding }
}

const uploadImgFile = async ( file, ctx, minificationConfig ) => {
  sharp.cache(false)
  const {
    toFormat,
    sizes  //: ['w792']
  } = minificationConfig
  const { id, path: oriPath, filename, encoding } = await upload(file, ctx, { extension: 'getFromMime' })
  const { size } = await fsp.stat(oriPath)
  const { width, height } = await sharp(oriPath).metadata()
  await upsertFile({ id, size, width, height, isOri: true }, ctx)
  const minifiedImgs = await Promise.all(sizes.map(async s => {
    const { id } = await upsertFile({ filename, mimetype: `image/${toFormat}`, encoding }, ctx, { createBlank: true })
    const extension = getExtension(toFormat)
    const path = `uploads/${id}${'.' + extension}`
    await sharp(oriPath)
      .limitInputPixels(1000000000)
      .resize({
        width: 792,
        height: 1,
        fit: sharp.fit.outside,
        // withoutEnlargement: true
      })
      .withMetadata()
      .toFormat(toFormat)
      .toFile(path)
    const { size } = await fsp.stat(path)
    const { width, height } = await sharp(path).metadata()
    await upsertFile({ id, size, width, height }, ctx, { extension })
    return { id }
  }))
  return [{ id }, ...minifiedImgs]
}

const file = {
	singleUpload(obj, { file }, ctx) {
    upload(file, ctx)
  },
	multipleUpload (obj, { files }, ctx) {
    Promise.all(files.map(file => upload(file , ctx)))
  },
}

module.exports = { file, upload, uploadImgFile, removeUpload }