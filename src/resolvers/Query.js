const { getUserId } = require('../utils')

const Query = {
	me(_, __, ctx, info) {
        const id = getUserId(ctx)
        return ctx.db.query.user({ where: { id } }, info)
	},

	enquiries(_, __, ctx, info) {
		return ctx.db.query.enquiries({ orderBy: 'id_DESC' }, info)
	},
	
	enquiry(_, { id }, ctx, info) {
		return ctx.db.query.enquiry({ where: { id } }, info)
	},

	orgs(_, __, ctx, info) {
		return ctx.db.query.orgs({ orderBy: 'name_ASC' }, info)
	},
	
	statuses(_, __, ctx, info) {
		// exclude "New" status from result 
		return ctx.db.query.statuses({ where: { id_not: "cjlj173nm000i0959pqsxsbt7" }, orderBy: 'stage_ASC' }, info)
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
}

module.exports = { Query }
