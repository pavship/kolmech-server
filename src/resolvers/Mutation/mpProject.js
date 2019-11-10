const { mpRequest } = require('./megaplan')
const pullAllWith = require('lodash/pullAllWith')
const intersectionBy = require('lodash/intersectionBy')
const differenceBy = require('lodash/differenceBy')

const getMpProjects = async (_, { }, ctx, info) => {
  const { data: { data: { projects } } } = await mpRequest('GET', '/BumsProjectApiV01/Project/list.api')
  return projects.map(({
    Id,
    Name,
    Status,
    SuperProject,
    TimeUpdated
  }) => ({
    mpId: Id,
    Name,
    Status,
    SuperProjectId: SuperProject ? SuperProject.Id : null,
    TimeUpdated
  }))
}

const populateMpProjects = async (_, { projects }, ctx, info) => {
  const { db } = ctx
  const existing = await db.query.mpProjects({}, '{ mpId TimeUpdated }')
  // console.log('projects.length1 (megaplan total) > ', projects.length)
  pullAllWith(projects, existing, (p, e) => p.mpId === e.mpId && p.TimeUpdated === e.TimeUpdated)
  // console.log('projects.length2 (without untouched) > ', projects.length)
  // console.log('toUpdate.length > ', intersectionBy(projects, existing, 'mpId').length)
  // console.log('toCreate.length > ', differenceBy(projects, existing, 'mpId').length)
  await Promise.all([
    ...intersectionBy(projects, existing, 'mpId').map(p =>
      db.mutation.updateMpProject({ where: { mpId: p.mpId }, data: p })
    ),
    ...differenceBy(projects, existing, 'mpId').map(p =>
      db.mutation.createMpProject({ data: p })
    ),
  ])
  return null
}

const syncMpProjects = async (_, { }, ctx, info) => {
  const projects = await getMpProjects(_, { }, ctx, info)
  await populateMpProjects(_, { projects }, ctx, info)
  return { statusText: 'OK' }

  // console.log('input > ', JSON.stringify(input, null, 2))
  // const { db } = ctx
  // const mutationObj = await generateMutationObject(input, 'deal', ctx)
  // console.log('mutationObj > ', JSON.stringify(mutationObj, null, 2))
  // if (!input.id) return db.mutation.createDeal(mutationObj, info)
  //   else return db.mutation.updateDeal(mutationObj, info)
}

module.exports = { 
	mpProject: {
    syncMpProjects
  }
}