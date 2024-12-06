import dotenv from 'dotenv'

dotenv.config()

const env = {
	MAIN_DB_HOST: process.env.MAIN_DB_HOST,
	MAIN_DB_PORT: process.env.MAIN_DB_PORT,
	MAIN_DB_NAME: process.env.MAIN_DB_NAME,
	MAIN_DB_USER: process.env.MAIN_DB_USER,
	MAIN_DB_PASSWORD: process.env.MAIN_DB_PASSWORD,

	LOCAL_DB_HOST: process.env.LOCAL_DB_HOST,
	LOCAL_DB_PORT: process.env.LOCAL_DB_PORT,
	LOCAL_DB_NAME: process.env.LOCAL_DB_NAME,
	LOCAL_DB_USER: process.env.LOCAL_DB_USER,
	LOCAL_DB_PASSWORD: process.env.LOCAL_DB_PASSWORD,

	REDIS_HOST: process.env.REDIS_HOST,
	REDIS_PORT: process.env.REDIS_PORT,
	REDIS_PASSWORD: process.env.REDIS_PASSWORD,
	REDIS_DB: process.env.REDIS_DB,

	PORT: process.env.PORT,
	URL_API: process.env.URL_API,
	CORS_ORIGINS: process.env.CORS_ORIGINS,
	URL_MAIN: process.env.URL_MAIN,

	JWT_EXPIRED: process.env.JWT_EXPIRED,
	JWT_REFRESH: process.env.JWT_REFRESH,
	JWT_SECRET: process.env.JWT_SECRET,

	NODE_ENV: process.env.NODE_ENV,

	SMTP_HOST: process.env.SMTP_HOST,
	SMTP_PORT: process.env.SMTP_PORT,
	SMTP_USER: process.env.SMTP_USER,
	SMTP_PASS: process.env.SMTP_PASS,
	DEFAULT_FROM_EMAIL: process.env.DEFAULT_FROM_EMAIL,
}

// Validar las variables críticas
const requiredVariables = Object.keys(env) // Obtener las claves del objeto `env`

requiredVariables.forEach(key => {
	if (!env[key]) {
		console.error(`La variable de entorno ${key} no está definida.`)
		process.exit(1)
	}
})

export { env }
