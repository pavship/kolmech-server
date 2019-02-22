const { upload, uploadImgFile, removeUpload } = require('./file')

// const process

const drawing = {
	async createDrawings(_, { modelId, files }, ctx, info) {
    const { userId, db } = ctx
    const modelDrawings = await db.query.drawings({ where: { model: { id: modelId } } }, '{ sortOrder }')
    const nextOrderNumber = modelDrawings.length ? Math.max(...modelDrawings.map(drw => drw.sortOrder)) + 1 : 0
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
          sortOrder: nextOrderNumber + i,   // add drawings to the end of collection
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
  },
  async setDrawingsSortOrder(_, { ids }, ctx, info) {
    const { userId, db } = ctx
    const updated = await Promise.all(ids.map(( id , i) => 
      db.mutation.updateDrawing({
        where: { id },
        data: { sortOrder: i }
      }), '{ id }'))
    return { count: updated.length }
  }
}

module.exports = { drawing }