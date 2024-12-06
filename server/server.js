import http from 'http'
import helmet from 'helmet'
import dotenv from 'dotenv'
import express from 'express'
import routes from './routes.js'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import { db_main } from './config/db.config.js'
import { runSeeders } from './seeders/index.js'
import { setupCors } from './config/cors.config.js'
import { setupSwagger } from './config/swagger.config.js'
import { createRedisClient } from './config/redis.config.js'
import { startServer } from './helpers/start_server.helper.js'
import { isProduction } from './helpers/is_prodcution.helper.js'
import { setupMorgan } from './middlewares/morgan.middleware.js'
import { queueMiddleware } from './middlewares/queue.middleware.js'
import { errorHandler } from './middlewares/errorHandler.middleware.js'

dotenv.config()

// Inicializa la aplicación Express
const app = express()
const server = http.createServer(app)

// Middleware de seguridad y optimización
app.use(helmet())
app.use(compression())

// Middleware de cookies y JSON
app.use(cookieParser())
app.use(express.json({ limit: '10mb' })) // Limita el tamaño de los JSON a 10MB
app.use(errorHandler) // Middleware para manejo de errores

// Configuración de CORS y Morgan (logger)
setupCors(app)
setupMorgan(app)

// Setup Swagger documentation API
isProduction() ? '' : setupSwagger(app)

// Middleware para application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }))

// Rutas de la API con middleware para la cola
app.use('/api/', queueMiddleware, routes)

// Función para eliminar las claves de caché
const deleteCacheKeys = () => {
	const redisClient = createRedisClient()

	redisClient.keys('cache:*', (err, keys) => {
		if (err) {
			console.error('Error al obtener las claves:', err)
			return
		}

		if (keys.length > 0) {
			redisClient.del(keys, (err, response) => {
				if (err) {
					console.error('Error al eliminar claves:', err)
				} else {
					console.log(`Se eliminaron ${response} claves de cache.`)
				}
			})
		}
	})
}

// Sincronización de la base de datos y arranque del servidor
Promise.all([db_main.sync({ force: false })]) // No fuerza la eliminación de tablas en la DB
	.then(() => {
		startServer(server)
		runSeeders()
		deleteCacheKeys() // Llamada correcta a la función de eliminación de claves
		createRedisClient()
	})
	.catch(err => {
		console.error('Error sincronizando con la base de datos:', err)
	})
