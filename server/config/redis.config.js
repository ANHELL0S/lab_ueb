import Redis from 'ioredis'
import { env } from './env.config.js'

function createRedisClient() {
	const redisClient = new Redis({
		host: env.REDIS_HOST,
		port: env.REDIS_PORT,
		password: env.REDIS_PASSWORD,
		db: env.REDIS_DB,
	})

	redisClient.on('connect', () => console.log('>> Conexión a Redis establecida\n'))
	redisClient.on('error', err => console.error('>> Error en la conexión a Redis:', err))

	return redisClient
}

export { createRedisClient }
