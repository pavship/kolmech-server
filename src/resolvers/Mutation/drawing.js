const { upload, uploadImgFile, removeUpload } = require('./file')

// const process

const drawing = {
	async createDrawings(_, { modelId, files }, ctx, info) {
    const { userId, db } = ctx
    const modelDrawings = await db.query.drawings({ where: { model: { id: modelId } } }, '{ sortOrder }')
    const lastOrderNumber = modelDrawings.length ? Math.max(...modelDrawings.map(drw => drw.sortOrder)) : 0
    return Promise.all(files.map(async (file, i) => {
      const imageFiles = await uploadImgFile(file, ctx, { 
        toFormat: 'png',
        verions: [{
          imgFor: 'FEED_W792',
          toSize: {
            width: 792
          }
        }]
      })
      return db.mutation.createDrawing({
        data: {
          sortOrder: lastOrderNumber + 1 + i,   // add drawings to the end of collection
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