const { toLocalTimestamp } = require('../../utils/dates')
const { currency } = require('../../utils/format')

const enquiry = {
	async createEnquiry(_, { dateLocal, orgId, modelId, qty }, ctx, info) {
		const { userId, db } = ctx
		const org = await db.query.org({ where: { id: orgId } }, '{ inn name }')
		const model = await db.query.model({ where: { id: modelId } }, '{ article name }')
		if (!org) throw new Error(`Организация не найдена в базе`)
		// Automatically increment counter number for the new enquiry
		const lastEnquiry = await db.query.enquiries({ last: 1 }, '{ num }')
		const num = (!lastEnquiry[0] || !lastEnquiry[0].num) ? 1 : lastEnquiry[0].num + 1
		const newEnquiryStatus = await db.query.status({ where: { name: "Новая" }}, '{ id }')
		return db.mutation.createEnquiry({
			data: {
				num,
				dateLocal,
				org: {
					connect: {
						id: orgId
					}
				},
				model: {
					connect: {
						id: modelId
					}
				},
				qty,
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
										<tr><td></td><td>Изделие</td><td><strong>${model.name}</strong> (Артикул: ${model.article})</td></tr>
										<tr><td></td><td>Кол-во</td><td><strong>${qty}</strong> шт.</td></tr>
										<tr><td></td><td>Статус</td><td><strong>Новая</strong></td></tr>
									</tbody></table>`.replace(/\t|\n/g, ''),
						type: 'CREATE',
						status: {
							connect: {
								id: newEnquiryStatus.id
							}
						}
					}]
				}
			}
		}, info)
	},

	async updateEnquiry(_, { input }, ctx, info) {
		const { userId, db } = ctx
		const { id, dateLocal, orgId, modelId, qty, htmlNote } = input
		const org = orgId ? await db.query.org({ where: { id: orgId } }, '{ inn name }') : null
		if ( orgId && !org) throw new Error(`Организация не найдена в базе`)
		const model = modelId ? await db.query.model({ where: { id: modelId } }, '{ article name }') : null
		if ( modelId && !model) throw new Error(`Изделие не найдено в базе`)
		// const updatedFields = Object.keys(input).filter(f => f !== 'id')
		// const fieldsToGet = updatedFields.reduce((res, f, i) => {
		// 	res += (f === 'orgId') ? (' org { name }') : (' ' + f)
		// 	if (i === updatedFields.length - 1) res += ' }'
		// 	return res
		// }, '{' )
		// console.log('fieldsToGet > ', fieldsToGet)
		// const oldEnquiry = await db.query.enquiry({
		// 	where: { id }
		// }, fieldsToGet)
		const updatedEnquiry = await db.mutation.updateEnquiry({
			where: { id },
			data: {
				...dateLocal && { dateLocal },
				...(htmlNote || htmlNote === null) && { htmlNote },
				...orgId && {
					org: {
						connect: {
							id: orgId
						}
					}
				},
				...modelId && {
					model: {
						connect: {
							id: modelId
						}
					}
				},
				...qty && { qty },
				events: {
					create: [{
						user: {
							connect: {
								id: userId
							}
						},
						datetimeLocal: toLocalTimestamp(new Date()),
						htmlText:  `<p>Внес <strong>изменения</strong> в заявку:</p>
									<table><tbody>
											${dateLocal ? `<tr><td></td><td>Дата</td><td><span>-> </span><strong>${dateLocal}</strong></td></tr>` : ''}
											${orgId ? `<tr><td></td><td>Организация</td><td><span>-> </span><strong>${org.name}</strong> (ИНН: ${org.inn})</td></tr>` : ''}
											${modelId ? `<tr><td></td><td>Изделие</td><td><span>-> </span><strong>${model.name}</strong> (Артикул: ${model.article})</td></tr>` : ''}
											${qty ? `<tr><td></td><td>Кол-во</td><td><span>-> </span><strong>${qty}</strong> шт.</td></tr>` : ''}
											${htmlNote ? `<tr><td></td><td>Примечания:</td><td>${htmlNote}</td></tr>` : ''}
											${(htmlNote === null) ? `<tr><td></td><td>Примечания</td><td>(удалены)</td></tr>` : ''}
									</tbody></table>`.replace(/\t|\n/g, ''),
						type: 'UPDATE'
					}]
				}
			},
		}, info )
		if (orgId || modelId) {
			await db.mutation.updateManyOrders({
				where: {
					enquiry: {
						id
					}
				},
				data: {
					...orgId && {
						org: {
							connect: {
								id: orgId
							}
						}
					},
					...modelId && {
						model: {
							connect: {
								id: modelId
							}
						}
					}
				}
			}, '{ count }')
		}
		return updatedEnquiry
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

	async createEnquiryEvent(_, { enquiryId, htmlText, statusId, doc }, ctx, info) {
        const { userId, db } = ctx
        // // TODO make requests either parallel or combined
        const status = statusId ? await db.query.status({where: {id: statusId}}, '{ name }') : null
        // const prevStatusEvent = statusId ? await db.query.events({
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
		return db.mutation.createEvent({
			data: {
				enquiry: {
					connect: {
						id: enquiryId
					}
				},
				htmlText: 
					(statusId && !doc ) ?  `<p>Изменил статус заявки на <strong>${status.name}</strong></p>` :
					(statusId && doc )  ?  `<p>Создал <strong>коммерческое предложение</strong> с параметрами:</p><table><tbody>
																			<tr><td></td><td>Дата</td><td><strong>${doc.dateLocal}</strong></td></tr>
																			<tr><td></td><td>Сумма</td><td><strong>${currency(doc.amount, true)}</strong> с НДС</td></tr>
																	</tbody></table>
																	<p>Статус заявки изменен на <strong>${status.name}</strong></p>`.replace(/\t|\n/g, '')
															:   htmlText,
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
				...(doc && {
					doc: {
						create: {
							dateLocal: doc.dateLocal,
							amount: doc.amount,
							type: 'CO',
							nds: true
						}
					}
				}),
				type: statusId ? 'STATUS' : 'COMMENT',
				datetimeLocal: toLocalTimestamp(new Date())
			}
		}, info )
	},
 
	// async deletePost(parent, { id }, ctx, info) {
	//   const { userId, db } = ctx
	//   const postExists = await db.exists.Post({
	//     id,
	//     author: { id: userId },
	//   })
	//   if (!postExists) {
	//     throw new Error(`Post not found or you're not the author`)
	//   }

	//   return db.mutation.deletePost({ where: { id } })
	// },
}

module.exports = { enquiry }
