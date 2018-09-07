const { GraphQLClient  } = require('graphql-request')

const client = new GraphQLClient( 
	process.env.GQ_ENDPOINT, 
	{ headers: { Authorization: `Bearer ${process.env.GQ_TOKEN}` } }
)

const migration = {
	async importModels(_, __, ctx, info) {
		try {
			const models = await client.request(`{
				allModels {
					id
					article
					name
				}
			}`)
			if (!models.allModels.length) throw new Error('something wrong with graphcool request')
			let count = 0
			// models.allModels.forEach(({id, article, name}) => {
			for (let {id, article, name} of models.allModels) {
				// const upserted = await ctx.db.mutation.upsertModel({
				const upserted = ctx.db.mutation.upsertModel({
					where: {
					  gqId: id
					},
					create: {
						gqId: id,
						article,
						  name
					},
					update: {
						article,
						name
					}
				}, '{ gqId }')
				count++
			}
			return { count }
		} catch (err) {
			console.log(err)
			return null
		}
	}

}

module.exports = { migration }
