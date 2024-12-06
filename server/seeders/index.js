import { labSeeder } from './lab/lab.seeder.js'
import { userSeeder } from './user/user.seeder.js'
import { rolesSeeder } from './role/role.seeder.js'

export const runSeeders = async () => {
	try {
		await rolesSeeder()
		await userSeeder()
		await labSeeder()
	} catch (error) {
		console.error('Error al ejecutar las inyecciones:', error.message)
	}
}
