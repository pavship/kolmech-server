const opType = {
  async populateOpTypes(_, __, ctx, info) {
		const items = [
			{ name: 'Проработка', opClass: 'SURVEY'},
			{ name: 'Контрольная', opClass: 'MACHINING', laborPrice: 1650 },
			{ name: 'Расточная', opClass: 'MACHINING', laborPrice: 1650 },
			{ name: 'Резка', opClass: 'MACHINING', laborPrice: 1500 },
			{ name: 'Токарная', opClass: 'MACHINING', laborPrice: 1500 },
			{ name: 'Фрезерная', opClass: 'MACHINING', laborPrice: 1650 },
			{ name: 'Хон', opClass: 'MACHINING', laborPrice: 1650 },
		]
		const existing = await ctx.db.query.opTypes({}, '{ id name }')
		const existingNames = existing.map(a => a.name)
		const toCreate = items.filter(a => !existingNames.includes(a.name))
		const toUpdate = items
			.filter(a => existingNames.includes(a.name))
			.map(a => ({
				...a,
				id: existing.find(e => e.name === a.name).id
			}))
		const created = await Promise.all(toCreate.map(item =>
			ctx.db.mutation.createOpType({ data: { ...item } })
		))
		const updated = await Promise.all(toUpdate.map(({ id, ...rest }) =>
			ctx.db.mutation.updateOpType({
				where: { id },
				data: { ...rest }
			})
		))
		return { count: created.length + updated.length }
	},
}

module.exports = { 
	opType
}