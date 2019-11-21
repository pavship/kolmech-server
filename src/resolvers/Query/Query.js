const { GraphQLClient  } = require('graphql-request')
const jwt = require('jsonwebtoken')
const { reportToDeveloper } = require('../../utils/mail')

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

	accounts(_, __, ctx, info) {
		return ctx.db.query.accounts({ orderBy: 'name_ASC' }, info)
	},

	articles(_, __, ctx, info) {
		return ctx.db.query.articles({ orderBy: 'rusName_ASC' }, info)
	},
	
	enquiries(_, __, ctx, info) {
		return ctx.db.query.enquiries({ orderBy: 'num_DESC' }, info)
	},
	
	deal(_, { id }, ctx, info) {
		return ctx.db.query.deal({ where: { id } }, info)
	},

	deals(_, __, ctx, info) {
		return ctx.db.query.deals({
			where: { status: { 'amoId_not_in': [142, 143, 24659131] }},
			orderBy: 'date_ASC'
		}, info)
	},

	deptProds(_, { deptId }, ctx, info) {
		return ctx.db.query.prods({ where: { dept: { id: deptId } } }, info)
	},
	        
	depts(_, __, ctx, info) {
		return ctx.db.query.depts({ orderBy: 'type_ASC' }, info)
	},

	enquiry(_, { id }, ctx, info) {
		return ctx.db.query.enquiry({ where: { id } }, info)
	},

	equipment(_, __, ctx, info) {
		return ctx.db.query.equipment({ where: { id } }, info)
	},
	
	equipments(_, __, ctx, info) {
		return ctx.db.query.equipments({}, info)
	},

	opTypes(_, __, ctx, info) {
		return ctx.db.query.opTypes({ orderBy: 'name_ASC' }, info)
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

	model(_, { id }, ctx, info) {
		return ctx.db.query.model({ where: { id } }, info)
	},

	async models(_, __, ctx, info) {
		return ctx.db.query.models({ orderBy: 'name_ASC' }, info)
	},

	modelProds(_, { modelId }, ctx, info) {
		return ctx.db.query.prods({ where: { model: { id: modelId } } }, info)
	},

	// mpProjects(_, __, ctx, info) {
	// 	return ctx.db.query.mpProjects({ orderBy: 'TimeUpdated_DESC' }, info)
	// },
	
	statuses(_, __, ctx, info) {
		return ctx.db.query.statuses({ orderBy: 'stage_ASC' }, info)
	},

	tasks(_, __, ctx, info) {
		return ctx.db.query.tasks({}, info)
	},

	payments(_, __, ctx, info) {
		return ctx.db.query.payments({ orderBy: 'dateLocal_DESC' }, info)
	},

	persons(_, __, ctx, info) {
		return ctx.db.query.persons({ where: {
			id_not_in: [
				'cjm85kntr00f009385au7tolq', //Admin
				'cjnfcpohm0d4h0724cmtoe8sj', //Server
			]
		}, orderBy: 'amoName_ASC' }, info)
	},

	person(_, { id }, ctx, info) {
		return ctx.db.query.person({ where: { id } }, info)
	},

	task(_, { id }, ctx, info) {
		return ctx.db.query.task({ where: { id } }, info)
	},

}

module.exports = { Query }
