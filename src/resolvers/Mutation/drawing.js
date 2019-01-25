const { upload, removeUpload } = require('./file')

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
    await Promise.all(files.map(async file => {
      const receivedFile = await file
      console.log('receivedFile > ', receivedFile)
      const { id } = await upload(file, ctx, { createMinifiedImage: 'w720' })
      // const [{ id }] = await Promise.all([
      //   upload(file, ctx, { image: 'w720' })
      // ])
      // return db.mutation.createDrawing({
      //   data: {
      //     model: {
      //       connect: {
      //         id: modelId
      //       }
      //     },
      //     file: {
      //       connect: {
      //         id
      //       }
      //     }
      //   }
      // }, info)
    }))
    return null
  },
  async deleteDrawings(_, { ids }, ctx, info) {
    const { userId, db } = ctx
    const drawings = await db.query.drawings({ where: { id_in: ids }}, '{ id file { path } }')
    await Promise.all(drawings.map(({ file: { path } }) => removeUpload(path)))
    const deleted = Promise.all(drawings.map(({ id }) => 
      db.mutation.deleteDrawing({ where: { id } }), '{ id }'))
    console.log('deleted > ', deleted)
    // return db.mutation.deleteManyDrawings({ where: { id_in: ids } })
    return {count: 0}
  }
}

module.exports = { drawing }