const { upload, uploadImgFile, removeUpload } = require('./file')

// const process

const drawing = {
	async createDrawings(_, { modelId, files }, ctx, info) {
    const { userId, db } = ctx
    // console.log('modelId, files > ', modelId, files)
    // const uploadedFiles = await Promise.all(files.map(file => upload(file, ctx)))
    // return Promise.all(uploadedFiles.map(({ id }) =>
    //   db.mutation.createDrawing({
    //     data: {
    //       model: {
    //         connect: {
    //           id: modelId
    //         }
    //       },
    //       file: {
    //         connect: {
    //           id
    //         }
    //       }
    //     }
    //   }, info)
    // ))
    return Promise.all(files.map(async file => {
      const imageFiles = await uploadImgFile(file, ctx, { 
        toFormat: 'png',
        sizes: ['w792']
      })
      return db.mutation.createDrawing({
        data: {
          model: {
            connect: {
              id: modelId
            }
          },
          files: {
            connect: imageFiles
          }
        }
      }, info)
    }))
    // return []
  },
  async deleteDrawings(_, { ids }, ctx, info) {
    const { userId, db } = ctx
    const drawings = await db.query.drawings({ where: { id_in: ids }}, '{ id files { path } }')
    await Promise.all(
      drawings.map(
        ({ files }) => files.map(
          ({ path }) => removeUpload(path)))
      .reduce((res, fns) => res = [...res, ...fns], [])
    )
    const deleted = await Promise.all(drawings.map(({ id }) => 
      db.mutation.deleteDrawing({ where: { id } }), '{ id }'))
    return { count: deleted.length }
  }
}

module.exports = { drawing }