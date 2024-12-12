import { config } from './config.data.js'
import { system_config_Schema } from '../../schema/schemes.js'

const configSeeder = async () => {
	try {
		const existingConfig = await system_config_Schema.findAll()
		if (existingConfig.length > 0) {
			console.log('Seeder -> Configuración ya existe, no se ejecuta.')
			return
		}

		await system_config_Schema.bulkCreate(
			config.map(item => ({
				...item,
			}))
		)

		console.log('Seeder -> Configuración creada exitosamente.')
	} catch (error) {
		console.error('Error al crear configuración predeterminada:', error.message)
	}
}

export { configSeeder }
