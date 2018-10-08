// d.fullnumber = d.melt.toString() + (d.meltShift ? ('.' + d.meltShift.toString() + '-') : '-') + d.number.toString() + '-' + d.year.toString()
const prod = {
	async upsertProd(_, { input }, ctx, info) {
    const { userId, db } = ctx
    const { id, deptId, modelId, ...planeInput} = input
    console.log('input > ', input)
    console.log('planeInput > ', planeInput)
    const {
      fullnumber: iFullnumber,
      hasDefect,
      isSpoiled,
      melt,
      meltShift,
      htmlNote,
      number,
      progress,
      year,
    } = planeInput
    // if new
    let fullnumber = iFullnumber
		if (!id) {
      if (!fullnumber) fullnumber = melt.toString() + (meltShift ? ('.' + meltShift.toString() + '-') : '-') + number.toString() + '-' + year.toString()
      const deptExists = await db.exists.Dept({ id: deptId })
      if (!deptExists) { throw new Error(`Участок не найден в базе`) }
      const modelExists = await db.exists.Model({ id: modelId })
      if (!modelExists) { throw new Error(`Модель не найдена в базе`) }
    }
		return db.mutation.upsertProd({
			where: {
				id: id || 'new'
			},
			create: {
				...planeInput,
				model: {
					connect: {
						id: modelId
					}
				},
				dept: {
					connect: {
						id: deptId
					}
				},
			},
			update: {
				...planeInput,
				...modelId && {
					model: {
						connect: {
							id: modelId
						}
					}
				},
				...deptId && {
					dept: {
						connect: {
							id: deptId
						}
					}
				},
			}
		}, info)
  },
  async moveProds (_, { to, prodIds }, ctx, info) {
    const { userId, db } = ctx
    const deptExists = await db.exists.Dept({ id: to })
    if (!deptExists) { throw new Error(`Участок не найден в базе`) }
    const prods = await ctx.db.query.prods({
      where: {
        id_in: prodIds
      }
    }, '{ id dept { id } }')
    console.log('prods > ', prods)
    if (prods.length !== prodIds.length) {
      throw new Error(`Не все изделия найдены в базе. Перемещение не производилось.`)
    }
    const updatedProds = await Promise.all(prodIds.map(id => {
      return ctx.db.mutation.updateProd({
        where: { id },
        data: {
          dept: {
            connect: {
              id: to
            }
          }
        }
      }, '{ id }')
    }))
    if (updatedProds.length !== prodIds.length) {
        throw new Error(`Возможно, не все изделия были перемещены`)
    }
    return {
      prods,
      to
    }
  }
}

module.exports = { prod }