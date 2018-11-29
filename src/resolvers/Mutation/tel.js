const tel = {
	async upsertTel(_, { input }, ctx, info) {
    const { userId, db } = ctx
    const {
			id,
			personId,
      ...planeInput
    } = input
    const {
			number: numberInput,
			country
    } = planeInput
		if (!id && !number) throw new Error('Не указан номер телефона')
		if (personId) {
      const personExists = await db.exists.Person({ id: personId })
      if (!personExists) throw new Error(`Личность для привязки телефона отсутствует в базе`)
		}
		let number = ''
		if (numberInput) {
			if (!country) throw new Error('Не указан код страны телефона')
			number = parseOrThrow(parsePhone, numberInput, { country })
			console.log('number > ', number)
		}
		if (!id) return db.mutation.createTel({
			data: {
				peron: {
					connect: {
						id: personId
					}
				},
				...planeInput
			}
		}, info)
		return db.mutation.updateTel({
			where: { id },
			data: {
				...planeInput,
				...personId && {
					peron: {
						connect: {
							id: personId
						}
					}
				}
			}
		}, info)
  }
}

module.exports = { tel }