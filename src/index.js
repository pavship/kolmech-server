const { GraphQLServer } = require('graphql-yoga')
const { Prisma } = require('prisma-binding')
const resolvers = require('./resolvers')
// const { GraphQLClient  } = require('graphql-request')

// const client = new GraphQLClient(
// 	'https://api.graph.cool/simple/v1/cjcgfcs363v5p0110vjauvz03', 
// 	{
// 		headers: { Authorization: `Bearer ${process.env.GQ_TOKEN}` }
// 	}
// )

// module.exports = { client } 

const db = new Prisma({
  typeDefs: 'src/generated/prisma.graphql', // the auto-generated GraphQL schema of the Prisma API
  endpoint: process.env.PRISMA_ENDPOINT, // the endpoint of the Prisma API (value set in `.env`)
  debug: false, // log all GraphQL queries & mutations sent to the Prisma API
  secret: process.env.PRISMA_SECRET, // only needed if specified in `database/prisma.yml`
})

const server = new GraphQLServer({
  typeDefs: './src/schema.graphql',
  resolvers,
  context: req => ({ ...req, db }),
})

server.start({ tracing: false }, () => console.log('Server is running on http://localhost:4000'))
