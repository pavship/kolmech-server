const { GraphQLClient  } = require('graphql-request')
const jwt = require('jsonwebtoken')
const { reportToDeveloper } = require('../utils/mail')

const client = new GraphQLClient( 
	process.env.GQ_ENDPOINT, 
	{ headers: { Authorization: `Bearer ${process.env.GQ_TOKEN}` } }
)

const Query = {
	me(_, __, ctx, info) {
		const { userId, db } = ctx
		return db.query.user({ where: { id: userId } }, info)
	},
	
	async confirmEmail(_, { token }, ctx, info) {
		try {
			const { userId } = jwt.verify( token, process.env.APP_SECRET)
			const updatedUser = await ctx.db.mutation.updateUser({
				where: {
					id: userId
				},
				data: {
					confirmed: true
				}
			})
			return {
				email: updatedUser.email
			}
		} catch (err) {
			reportToDeveloper(err)
			throw err
		}
	},

	enquiries(_, __, ctx, info) {
		return ctx.db.query.enquiries({ orderBy: 'num_DESC' }, info)
	},
	
	enquiry(_, { id }, ctx, info) {
		return ctx.db.query.enquiry({ where: { id } }, info)
	},
        
	order(_, { id }, ctx, info) {
		return ctx.db.query.order({ where: { id } }, info)
	},
        
	orgs(_, __, ctx, info) {
		return ctx.db.query.orgs({ orderBy: 'name_ASC' }, info)
	},
        
	depts(_, __, ctx, info) {
		return ctx.db.query.depts({ orderBy: 'type_ASC' }, info)
	},
	
	statuses(_, __, ctx, info) {
		return ctx.db.query.statuses({ orderBy: 'stage_ASC' }, info)
	},
    
	async models(_, __, ctx, info) {
		return ctx.db.query.models({ orderBy: 'name_ASC' }, info)
	},

	modelProds(_, { modelId }, ctx, info) {
		return ctx.db.query.prods({ where: { model: { id: modelId } } }, info)
	},

	deptProds(_, { deptId }, ctx, info) {
		return ctx.db.query.prods({ where: { dept: { id: deptId } } }, info)
	},
}

module.exports = { Query }
