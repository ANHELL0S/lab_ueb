import { lab_data } from './lab_data.js'
import { SUPERVISOR, TECHNICAL_ANALYST } from '../../const/roles.const.js'
import { laboratory_Schema, rol_Schema, user_Schema, laboratory_analyst_Schema } from '../../schema/schemes.js'

const labSeeder = async () => {
	let labsCreated = false
	try {
		const existingLabs = await laboratory_Schema.findAll()
		if (existingLabs.length > 0) {
			console.log('Seeder -> Laboratorios ya existen el Seeder no se ejecuta.')
			return
		}

		const analystRole = await rol_Schema.findOne({ where: { type_rol: TECHNICAL_ANALYST } })
		if (!analystRole) throw new Error('No se encontró el rol de analista.')

		for (const lab of lab_data) {
			const userFound = await user_Schema.findOne({ where: { email: lab.analyst_email } })

			if (!userFound) {
				console.warn(`Advertencia: No se encontró un usuario con el correo ${lab.analyst_email}.`)
				continue
			}

			const existingLab = await laboratory_Schema.findOne({ where: { name: lab.name } })

			let newLab
			if (!existingLab) {
				newLab = await laboratory_Schema.create({
					name: lab.name,
					location: lab.location,
					description: lab.description,
				})
				labsCreated = true
			} else {
				newLab = existingLab
			}

			const existingRelation = await laboratory_analyst_Schema.findOne({
				where: {
					id_lab_fk: newLab.id_lab,
					id_analyst_fk: userFound.id_user,
				},
			})

			if (!existingRelation) {
				await laboratory_analyst_Schema.create({
					id_lab_fk: newLab.id_lab,
					id_analyst_fk: userFound.id_user,
				})
			}
		}

		if (labsCreated) console.log('Seeder -> Laboratorios y asignación de supervisores creados exitosamente.')
	} catch (error) {
		console.error('Error al crear laboratorios predeterminados:', error.message)
	}
}

export { labSeeder }
