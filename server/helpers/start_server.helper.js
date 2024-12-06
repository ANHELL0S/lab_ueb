import { env } from '../config/env.config.js'
import { isProduction } from '../helpers/is_prodcution.helper.js'

function startServer(app) {
	const PORT = env.PORT
	const allowedOrigins = env.CORS_ORIGINS ? env.CORS_ORIGINS.split(',') : []

	app.listen(PORT, () => {
		console.log(`\n>> Server running in port  -> ${PORT}`)
		isProduction()
			? console.log(`>> Connected db primary    -> ${env.MAIN_DB_NAME}`)
			: console.log(`>> Connected db primary    -> ${env.LOCAL_DB_NAME}`)
		console.log(`>> CORS Origins            -> ${allowedOrigins.join(' - ')}`)
		isProduction() ? '' : console.log(`>> Documentación API 	   -> ${env.URL_API}/api-docs`)
	})
}

export { startServer }
