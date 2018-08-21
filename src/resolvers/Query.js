const { getUserId } = require('../utils')

const Query = {
  enquiries(parent, args, ctx, info) {
    return ctx.db.query.enquiries({ orderBy: 'id_DESC' }, info)
  },
  
  enquiry(_, { id }, ctx, info) {
    return ctx.db.query.enquiry({ where: { id } }, info)
  },

  // drafts(parent, args, ctx, info) {
  //   const id = getUserId(ctx)

  //   const where = {
  //     isPublished: false,
  //     author: {
  //       id
  //     }
  //   }

  //   return ctx.db.query.posts({ where }, info)
  // },

  me(parent, args, ctx, info) {
    const id = getUserId(ctx)
    return ctx.db.query.user({ where: { id } }, info)
  },
}

module.exports = { Query }
