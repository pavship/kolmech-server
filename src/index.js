const { GraphQLServer } = require('graphql-yoga')
const { Prisma } = require('prisma-binding')
const resolvers = require('./resolvers')
const { getUserId } = require('./utils/auth')
const { report } = require('./rest/report')
const express = require('express')

const db = new Prisma({
  typeDefs: 'src/generated/prisma.graphql', // the auto-generated GraphQL schema of the Prisma API
  // endpoint: process.env.PRISMA_ENDPOINT, // the endpoint of the Prisma API (value set in `.env`)
	endpoint: process.env.PRISMA_ENDPOINT_PROD, // the endpoint of the Prisma API (value set in `.env`)
  // endpoint: process.env.PRISMA_ENDPOINT_LOCAL, // the endpoint of the Prisma API (value set in `.env`)
  debug: false, // log all GraphQL queries & mutations sent to the Prisma API
  // secret: process.env.PRISMA_SECRET, // only needed if specified in `database/prisma.yml`
  secret: process.env.PRISMA_SECRET_PROD, // only needed if specified in `database/prisma.yml`
})

const server = new GraphQLServer({
	typeDefs: './src/schema.graphql',
	resolvers,
	context: req => ({
		...req,
		url: req.request.protocol + '://' + req.request.get('host'),
		userId: getUserId(req),
		db
	}),
	resolverValidationOptions: {
    requireResolversForResolveType: false
  }
})

// server.express.get('/confirm/:token', confirmEmail)
server.express.get('/report', (req, res) => report(req, res, db))

server.express.use('/uploads', express.static('uploads'))

server.start({ tracing: false }, () => console.log('Server is running on http://localhost:4000'))
