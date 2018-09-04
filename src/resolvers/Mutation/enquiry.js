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
				events: {
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
										<tr><td></td><td>Статус</td><td><strong>Новая</strong></td></tr>
									</tbody></table>`,
						type: 'CREATE',
						status: {
							connect: {
								id: "cjlj173nm000i0959pqsxsbt7"
							}
						}
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
				events: {
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

	async deleteAllEnquiries(_, __, ctx, info) {
		const enquiries = await ctx.db.query.enquiries({}, '{ id }')
		let count = 0 
		await Promise.all(enquiries.map(async ({ id }) => {
			const response = await ctx.db.mutation.deleteEnquiry({ where: { id } }, '{id}')
			if (response) count++
		}))
		return { count }
	},

	async createEnquiryEvent(_, { enquiryId, htmlText, statusId }, ctx, info) {
        const userId = getUserId(ctx)
        // // TODO make requests either parallel or combined
        // const status = statusId ? await ctx.db.query.status({where: {id: statusId}}, '{ name }') : null
        // const prevStatusEvent = statusId ? await ctx.db.query.events({
        //     where: {
		// 		AND: [{
		// 			enquiry: {
		// 				id: enquiryId
		// 			}
		// 		}, {
		// 			status: {
		// 				id_not: null
		// 			}
		// 		}]
		// 	},
		// 	last: 1
		// }, '{ id status { stage } }') : null
		return ctx.db.mutation.createEvent({
			data: {
				enquiry: {
					connect: {
						id: enquiryId
					}
				},
				htmlText: statusId
							? ` <p><strong>Изменил статус</strong> заявки на <strong>${status.name}</strong></p>`
							: htmlText,
				user: {
					connect: {
						id: userId
					}
				},
				...(statusId && {
					status: {
						connect: {
							id: statusId
						}
					}
				}),
				type: statusId ? 'STATUS' : 'COMMENT',
				datetimeLocal: toLocalTimestamp(new Date())
			}
		}, info )
	},
 
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
