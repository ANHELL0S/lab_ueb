import { reactive_Schema, reactiveConsumption_Schema, request_reactive_Schema } from '../schema/schemes.js'
import { Op } from 'sequelize'
import { db_main } from '../config/db.config.js'
import { logEvent } from '../helpers/log.helper.js'
import { GenericCrudModel } from '../models/crud.model.js'
import { createRedisClient } from '../config/redis.config.js'
import { sendResponse } from '../helpers/response_handler.helper.js'
import {
	KEY_REDIS_CONSUMPTION_REACTIVE,
	KEY_REDIS_REACTIVE,
	KEY_REDIS_REQUEST_REACTIVE,
	TIME_KEY_VALID,
} from '../const/redis_keys.const.js'
import { PAGINATION_LIMIT, PAGINATION_PAGE } from '../const/pagination.const.js'
import { reactive_zod, request_reactive_zod } from '../validators/reactive.validator.js'

const requestReactiveController = {
	async getAllRequestReactives(req, res) {
		const redisClient = createRedisClient()
		const { page = PAGINATION_PAGE, limit = PAGINATION_LIMIT } = req.query
		const offset = (page - 1) * limit
		const cacheKey = `cache:${KEY_REDIS_REQUEST_REACTIVE}:page:${page}:limit:${limit}`

		try {
			const cachedData = await redisClient.get(cacheKey)
			if (cachedData) {
				const parsedData = JSON.parse(cachedData)
				return sendResponse(res, 200, 'Peticiones de de reactivos obtenidos exitosamente.', parsedData)
			}

			const { count, rows } = await request_reactive_Schema.findAndCountAll({
				limit: limit,
				offset: offset,
				subQuery: false,
				order: [['createdAt', 'DESC']],
			})

			if (rows.length === 0) return sendResponse(res, 404, 'No se encontraron peticiones de reactivos.')

			const responseData = {
				totalRecords: count,
				totalPages: Math.ceil(count / limit),
				currentPage: parseInt(page, 10),
				recordsPerPage: parseInt(limit, 10),
				labs: rows,
			}

			await redisClient.set(cacheKey, JSON.stringify(responseData), 'EX', TIME_KEY_VALID)

			return sendResponse(res, 200, 'Peticiones de de reactivos obtenidos exitosamente.', responseData)
		} catch (error) {
			await logEvent(
				'error',
				'Error al obtener peticiones de de reactivos.',
				{ error: error.message, stack: error.stack },
				null,
				req
			)
			return sendResponse(res, 500)
		} finally {
			redisClient.disconnect()
		}
	},

	async createRequestReactive(req, res) {
		const t = await db_main.transaction()
		const redisClient = createRedisClient()

		const { user } = req

		try {
			const parsedData = request_reactive_zod.safeParse(req.body)
			if (!parsedData.success) return sendResponse(res, 400, parsedData.error.errors[0].message)

			const requestReactiveData = {
				...req.body,
				id_supervisor_fk: user.id,
			}
			const newRequestReactive = await request_reactive_Schema.create(requestReactiveData, { transaction: t })
			await t.commit()

			const cacheKeys = await redisClient.keys(`cache:${KEY_REDIS_REQUEST_REACTIVE}:page:*`)
			if (cacheKeys.length > 0) await redisClient.del(...cacheKeys)

			await logEvent('info', 'Petición de reactivo creado exitosamente.', { newRequestReactive }, user.id, req)
			return sendResponse(res, 201, 'Petición de reactivo creado exitosamente.', newRequestReactive)
		} catch (error) {
			await logEvent(
				'error',
				'Error al crear la petición del reactivo.',
				{ error: error.message, stack: error.stack },
				user.id,
				req
			)
			await t.rollback()
			return sendResponse(res, 500)
		}
	},
}

export { requestReactiveController }
