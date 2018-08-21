const { getUserId } = require('../../utils')

const enquiry = {
  async createEnquiry(_, { dateLocal }, ctx, info) {
    // const userId = getUserId(ctx)
    // Automatically increment counter number for the new enquiry
    const lastEnquiry = await ctx.db.query.enquiries({
        last: 1
    }, '{ num }')
    const num = (!lastEnquiry[0] || !lastEnquiry[0].num) ? 1 : lastEnquiry[0].num + 1
    return ctx.db.mutation.createEnquiry(
      {
        data: {
            num,
            dateLocal
        },
      },
      info,
    )
  },

  deleteAllEnquiries(_, __, ctx, info) {
      return ctx.db.mutation.deleteManyEnquiries({}, info)
  },

  // async createDraft(parent, { title, text }, ctx, info) {
  //   const userId = getUserId(ctx)
  //   return ctx.db.mutation.createPost(
  //     {
  //       data: {
  //         title,
  //         text,
  //         isPublished: false,
  //         author: {
  //           connect: { id: userId },
  //         },
  //       },
  //     },
  //     info
  //   )
  // },

  // async publish(parent, { id }, ctx, info) {
  //   const userId = getUserId(ctx)
  //   const postExists = await ctx.db.exists.Post({
  //     id,
  //     author: { id: userId },
  //   })
  //   if (!postExists) {
  //     throw new Error(`Post not found or you're not the author`)
  //   }

  //   return ctx.db.mutation.updatePost(
  //     {
  //       where: { id },
  //       data: { isPublished: true },
  //     },
  //     info,
  //   )
  // },

  // async deletePost(parent, { id }, ctx, info) {
  //   const userId = getUserId(ctx)
  //   const postExists = await ctx.db.exists.Post({
  //     id,
  //     author: { id: userId },
  //   })
  //   if (!postExists) {
  //     throw new Error(`Post not found or you're not the author`)
  //   }

  //   return ctx.db.mutation.deletePost({ where: { id } })
  // },
}

module.exports = { enquiry }
