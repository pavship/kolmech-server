const { getUserId } = require('../../utils')
const { toLocalTimestamp } = require('../../utils/dates')

const enquiry = {
	async createEnquiry(_, { dateLocal, orgId }, ctx, info) {
		const userId = getUserId(ctx)
		const org = await ctx.db.query.org({ where: { id: orgId } }, '{ inn name }')
		if (!org) throw new Error(`Организация не найдена в базе`)
		// Automatically increment counter number for the new enquiry
		const lastEnquiry = await ctx.db.query.enquiries({ last: 1 }, '{ num }')
		const num = (!lastEnquiry[0] || !lastEnquiry[0].num) ? 1 : lastEnquiry[0].num + 1
		return ctx.db.mutation.createEnquiry({
			data: {
				num,
				dateLocal,
				org: {
					connect: {
						id: orgId
					}
				},
				comments: {
					create: [{
						user: {
							connect: {
								id: userId
							}
						},
						datetimeLocal: toLocalTimestamp(new Date()),
						htmlText: `<p><strong>Создал</strong> заявку с параметрами:</p><table><tbody>
										<tr><td></td><td>Номер</td><td><strong>${num}</strong></td></tr> 
										<tr><td></td><td>Дата</td><td><strong>${dateLocal}</strong></td></tr>
										<tr><td></td><td>Организация</td><td><strong>${org.name}</strong> (ИНН: ${org.inn})</td></tr>
									</tbody></table>`,
						type: 'CREATE'
					}]
				}
			}
		}, info)
	},

	async updateEnquiry(_, { input }, ctx, info) {
		const { id, dateLocal, orgId } = input
		const userId = getUserId(ctx)
		const org = orgId ? await ctx.db.query.org({ where: { id: orgId } }, '{ inn name }') : null
		if ( orgId && !org) throw new Error(`Организация не найдена в базе`)
		// const updatedFields = Object.keys(input).filter(f => f !== 'id')
		// const fieldsToGet = updatedFields.reduce((res, f, i) => {
		// 	res += (f === 'orgId') ? (' org { name }') : (' ' + f)
		// 	if (i === updatedFields.length - 1) res += ' }'
		// 	return res
		// }, '{' )
		// console.log('fieldsToGet > ', fieldsToGet)
		// const oldEnquiry = await ctx.db.query.enquiry({
		// 	where: { id }
		// }, fieldsToGet)
		return ctx.db.mutation.updateEnquiry(
		{
			where: { id },
			data: {
				...(dateLocal && { dateLocal }),
				...(orgId && {
						org: {
							connect: {
								id: orgId
							}
						}
					}),
				comments: {
					create: [{
						user: {
							connect: {
								id: userId
							}
						},
						datetimeLocal: toLocalTimestamp(new Date()),
						htmlText: ` <p><strong>Внес изменения</strong> в заявку:</p>
									<table>
										<tbody>
											${dateLocal ? `<tr><td></td><td>Дата</td><td><span>-> </span><strong>${dateLocal}</strong></td></tr>` : ''}
											${orgId ? `<tr><td></td><td>Организация</td><td><span>-> </span><strong>${org.name}</strong> (ИНН: ${org.inn})</td></tr>` : ''}
										</tbody>
									</table>`,
						type: 'UPDATE'
					}]
				}
			},
		}, info )
	},

  deleteAllEnquiries(_, __, ctx, info) {
	  return ctx.db.mutation.deleteManyEnquiries({}, info)
  },

  createEnquiryComment(_, { enquiryId, htmlText }, ctx, info) {
	const userId = getUserId(ctx)
	return ctx.db.mutation.createComment({
		data: {
			enquiry: {
				connect: {
					id: enquiryId
				}
			},
			htmlText,
			user: {
				connect: {
					id: userId
				}
			},
			datetimeLocal: toLocalTimestamp(new Date())
		}
	}, info )
},
 
  // async createDraft(parent, { title, text }, ctx, info) {
  //   const userId = getUserId(ctx)
  //   return ctx.db.mutation.createPost(
  //     {
  //       data: {
  //         title,
  //         text,
  //         isPublished: false,
  //         author: {
  //           connect: { id: userId },
  //         },
  //       },
  //     },
  //     info
  //   )
  // },

  // async publish(parent, { id }, ctx, info) {
  //   const userId = getUserId(ctx)
  //   const postExists = await ctx.db.exists.Post({
  //     id,
  //     author: { id: userId },
  //   })
  //   if (!postExists) {
  //     throw new Error(`Post not found or you're not the author`)
  //   }

  //   return ctx.db.mutation.updatePost(
  //     {
  //       where: { id },
  //       data: { isPublished: true },
  //     },
  //     info,
  //   )
  // },

  // async deletePost(parent, { id }, ctx, info) {
  //   const userId = getUserId(ctx)
  //   const postExists = await ctx.db.exists.Post({
  //     id,
  //     author: { id: userId },
  //   })
  //   if (!postExists) {
  //     throw new Error(`Post not found or you're not the author`)
  //   }

  //   return ctx.db.mutation.deletePost({ where: { id } })
  // },
}

module.exports = { enquiry }
