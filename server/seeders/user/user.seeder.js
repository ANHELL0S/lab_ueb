import { user_data } from './user_data.js'
import { hashPassword } from '../../helpers/bcrypt.helper.js'
import { user_Schema, rol_Schema, user_roles_Schema, user_role_main_Schema } from '../../schema/schemes.js'

const userSeeder = async () => {
	let usersCreated = false

	try {
		// Check if any users already exist in the database
		const existingUsers = await user_Schema.findAll()
		if (existingUsers.length > 0) {
			console.log('Seeder -> Usuarios ya existen el Seeder no se ejecuta.')
			return
		}

		// Obtener todos los roles existentes y mapearlos
		const allRoles = await rol_Schema.findAll()
		const roleMap = allRoles.reduce((map, role) => {
			map[role.type_rol] = role.id_rol
			return map
		}, {})

		// Recorrer los usuarios y asignarles roles
		for (const user of user_data) {
			const hashedPassword = await hashPassword(user.password)

			// Crear el usuario
			const createdUser = await user_Schema.create({
				...user,
				password: hashedPassword,
			})

			// Crear la entrada en la tabla intermedia user_role_main_Schema
			const userRoleMain = await user_role_main_Schema.create({
				id_user_fk: createdUser.id_user,
			})

			// Asignar roles al usuario
			const userRoles = user.roles

			for (const roleName of userRoles) {
				const roleId = roleMap[roleName]
				if (roleId) {
					// Crear un registro en user_roles_Schema, asociando el usuario y el rol
					await user_roles_Schema.create({
						id_user_role_intermediate_fk: userRoleMain.id_user_role_intermediate,
						id_rol_fk: roleId,
					})
				} else {
					console.error(`Rol no encontrado: ${roleName} para el usuario ${user.full_name}`)
				}
			}

			usersCreated = true
		}

		if (usersCreated) console.log('Seeder -> Usuarios y asignación de roles creados exitosamente.')
	} catch (error) {
		console.error('Error al crear usuarios predeterminados:', error.message)
	}
}

export { userSeeder }
