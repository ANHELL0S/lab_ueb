import { env } from './env.config.js'
import { Sequelize } from 'sequelize'
import { isProduction } from '../helpers/is_prodcution.helper.js'

const db_main = new Sequelize(
	isProduction() ? env.MAIN_DB_NAME : env.LOCAL_DB_NAME,
	isProduction() ? env.MAIN_DB_USER : env.LOCAL_DB_USER,
	isProduction() ? env.MAIN_DB_PASSWORD : env.LOCAL_DB_PASSWORD,
	{
		host: isProduction() ? env.MAIN_DB_HOST : env.LOCAL_DB_HOST,
		port: isProduction() ? env.MAIN_DB_PORT : env.LOCAL_DB_PORT,
		dialect: 'postgres',
		timezone: '+00:00',
		logging: false,
		dialectOptions: {
			useUTC: true,
		},
		pool: {
			max: 100, // Maximum simultaneous connections
			min: 0,
			acquire: 30000, // Wait time to acquire a connection
			idle: 10000, // Close inactive connections
		},
		/*
		...(isProduction() && {
			dialectOptions: {
				ssl: {
					require: true,
					rejectUnauthorized: false,
				},
			},
		}),
		*/
	}
)

export { db_main }
