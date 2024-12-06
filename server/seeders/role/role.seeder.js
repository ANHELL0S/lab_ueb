import { roles } from './role.data.js'
import { rol_Schema } from '../../schema/schemes.js'

const rolesSeeder = async () => {
	let rolesCreated = false

	try {
		// Check if any roles already exist in the database
		const existingRoles = await rol_Schema.findAll()
		if (existingRoles.length > 0) {
			console.log('Seeder -> Roles ya existen el Seeder no se ejecuta.')
			return
		}

		// Recorrer los roles y verificar si ya existen
		for (const role of roles) {
			const existingRole = await rol_Schema.findOne({ where: { type_rol: role.type_rol } })
			if (!existingRole) {
				await rol_Schema.create(role)
				rolesCreated = true
			}
		}

		if (rolesCreated) console.log('Seeder -> Roles creados exitosamente.')
	} catch (error) {
		console.error('Error al crear roles predeterminados:', error.message)
	}
}

export { rolesSeeder }
