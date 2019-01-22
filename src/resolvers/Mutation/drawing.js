const { upload } = require('./file')

const drawing = {
	async createDrawings(_, { modelId, files }, ctx, info) {
    const { userId, db } = ctx
    console.log('modelId, files > ', modelId, files)
    const uploadedFiles = await Promise.all(files.map(file => upload(file, ctx)))
    return Promise.all(uploadedFiles.map(({ id }) =>
      db.mutation.createDrawing({
        data: {
          model: {
            connect: {
              id: modelId
            }
          },
          file: {
            connect: {
              id
            }
          }
        }
      }, info)
    ))
  }
}

module.exports = { drawing }