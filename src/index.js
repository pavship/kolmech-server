const { GraphQLServer } = require('graphql-yoga')
const { Prisma } = require('prisma-binding')
const resolvers = require('./resolvers')
const { getUserId } = require('./utils/auth')

const db = new Prisma({
  typeDefs: 'src/generated/prisma.graphql', // the auto-generated GraphQL schema of the Prisma API
  endpoint: process.env.PRISMA_ENDPOINT, // the endpoint of the Prisma API (value set in `.env`)
//   endpoint: process.env.PRISMA_ENDPOINT_PROD, // the endpoint of the Prisma API (value set in `.env`)
  debug: false, // log all GraphQL queries & mutations sent to the Prisma API
  secret: process.env.PRISMA_SECRET, // only needed if specified in `database/prisma.yml`
//   secret: process.env.PRISMA_SECRET_PROD, // only needed if specified in `database/prisma.yml`
})

const server = new GraphQLServer({
	typeDefs: './src/schema.graphql',
	resolvers,
	context: req => ({
		...req,
		userId: getUserId(req),
		db
	})
})

server.start({ tracing: false }, () => console.log('Server is running on http://localhost:4000'))
