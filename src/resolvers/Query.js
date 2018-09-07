const { getUserId } = require('../utils')
const { GraphQLClient  } = require('graphql-request')

const client = new GraphQLClient( 
    process.env.GQ_ENDPOINT, 
	{ headers: { Authorization: `Bearer ${process.env.GQ_TOKEN}` } }
)

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
		return ctx.db.query.statuses({ orderBy: 'stage_ASC' }, info)
	},
    
	async models(_, __, ctx, info) {
        return ctx.db.query.models({ orderBy: 'name_DESC' }, info)
        // try {
        //     const models = await client.request(`{
        //         allModels {
        //             id
        //             article
        //             name
        //         }
        //     }`)
        //     // console.log('models > ', models)
        //     return models.allModels
            
        // } catch (err) {
        //     console.log('err > ', err)
        // }
	},
}

module.exports = { Query }
