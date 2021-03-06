const opType = {
  async populateOpTypes(_, __, ctx, info) {
		const items = [
			{ name: 'Контрольная', opClass: 'MACHINING', laborPrice: 1650, laborCost: 400 },
			{ name: 'Плотницкая', opClass: 'MACHINING', laborPrice: 1600, laborCost: 450 },
			{ name: 'Поставщик', opClass: 'SUPPLIER'},
			{ name: 'Проработка', opClass: 'SURVEY'},
			{ name: 'Разработка', opClass: 'SURVEY'},
			{ name: 'Расточная', opClass: 'MACHINING', laborPrice: 1650, laborCost: 500 },
			{ name: 'Резка', opClass: 'MACHINING', laborPrice: 1500, laborCost: 400 },
			{ name: 'Слесарная', opClass: 'MACHINING', laborPrice: 1250, laborCost: 300 },
			{ name: 'Тех. сопровождение', opClass: 'SURVEY'},
			{ name: 'Токарная', opClass: 'MACHINING', laborPrice: 1500, laborCost: 400 },
			{ name: 'Фрезерная', opClass: 'MACHINING', laborPrice: 1650, laborCost: 400 },
			{ name: 'Хон', opClass: 'MACHINING', laborPrice: 1650, laborCost: 500 },
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