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

	persons(_, __, ctx, info) {
		return ctx.db.query.persons({ orderBy: 'amoName_ASC' }, info)
	},

	articles(_, __, ctx, info) {
		return ctx.db.query.articles({ orderBy: 'rusName_ASC' }, info)
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

	orgEmployees(_, { orgId }, ctx, info) {
		return ctx.db.query.employees({ where: { org: { id: orgId } } }, info)
	},
        
	depts(_, __, ctx, info) {
		return ctx.db.query.depts({ orderBy: 'type_ASC' }, info)
	},
	
	statuses(_, __, ctx, info) {
		return ctx.db.query.statuses({ orderBy: 'stage_ASC' }, info)
	},

	payments(_, __, ctx, info) {
		return ctx.db.query.payments({ orderBy: 'id_DESC' }, info)
	},
        
	model(_, { id }, ctx, info) {
		return ctx.db.query.model({ where: { id } }, info)
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
