import { db_main } from '../config/db.config.js'
import { logEvent } from '../helpers/log.helper.js'
import { GenericCrudModel } from '../models/crud.model.js'
import { createRedisClient } from '../config/redis.config.js'
import { sendResponse } from '../helpers/response_handler.helper.js'
import { consumption_reactive_zod } from '../validators/reactive.validator.js'
import { PAGINATION_LIMIT, PAGINATION_PAGE } from '../const/pagination.const.js'
import { TIME_KEY_VALID, KEY_REDIS_CONSUMPTION_REACTIVE } from '../const/redis_keys.const.js'
import { user_Schema, reactive_Schema, reactiveConsumption_Schema } from '../schema/schemes.js'

const consumptionController = {
	async getAllConsumptions(req, res) {
		const redisClient = createRedisClient()
		const { page = PAGINATION_PAGE, limit = PAGINATION_LIMIT } = req.query
		const offset = (page - 1) * limit
		const cacheKey = `cache:${KEY_REDIS_CONSUMPTION_REACTIVE}:page:${page}:limit:${limit}`

		try {
			const cachedData = await redisClient.get(cacheKey)
			if (cachedData) {
				const parsedData = JSON.parse(cachedData)
				return sendResponse(res, 200, 'Registro de consumo de reactivos obtenidos exitosamente.', parsedData)
			}

			const { count, rows } = await reactiveConsumption_Schema.findAndCountAll({
				limit: limit,
				offset: offset,
				subQuery: false,
				order: [['createdAt', 'DESC']],
			})

			if (rows.length === 0) return sendResponse(res, 404, 'No se encontraron registro de consumo de reactivos.')

			const responseData = {
				totalRecords: count,
				totalPages: Math.ceil(count / limit),
				currentPage: parseInt(page, 10),
				recordsPerPage: parseInt(limit, 10),
				reactives: rows,
			}

			await redisClient.set(cacheKey, JSON.stringify(responseData), 'EX', TIME_KEY_VALID)

			return sendResponse(res, 200, 'Registro de consumo de reactivos obtenidos exitosamente.', responseData)
		} catch (error) {
			await logEvent(
				'error',
				'Error al obtener los consumo de registo de reactivos.',
				{ error: error.message, stack: error.stack },
				null,
				req
			)
			return sendResponse(res, 500)
		} finally {
			redisClient.disconnect()
		}
	},

	async getConsumptionsById(req, res) {
		const { id } = req.params
		return GenericCrudModel.getRecordById({
			model: reactiveConsumption_Schema,
			keyRedis: KEY_REDIS_CONSUMPTION_REACTIVE,
			id: id,
			res,
			req,
			messageSuccess: 'Consumo de reactivo obtenido exitosamente.',
			messageNotFound: 'Consumo de reactivo no encontrado.',
			messageError: 'Error la obtener el consumo del reactivo.',
		})
	},

	async createConsumptionsReactive(req, res) {
		const t = await db_main.transaction()
		const redisClient = createRedisClient()

		const { user } = req

		try {
			const parsedData = consumption_reactive_zod.safeParse(req.body)
			if (!parsedData.success) return sendResponse(res, 400, parsedData.error.errors[0].message)

			const userFound = await user_Schema.findByPk(user.id)
			const reactiveFound = await reactive_Schema.findByPk(req.body.id_reactive_fk)
			if (!reactiveFound) return sendResponse(res, 404, 'Reactivo no encontrado')
			const consumptionData = {
				...req.body,
				name_analyst: userFound.full_name,
			}
			const newConsumption = await reactiveConsumption_Schema.create(consumptionData, { transaction: t })

			await t.commit()

			const cacheKeys = await redisClient.keys(`cache:${KEY_REDIS_CONSUMPTION_REACTIVE}:page:*`)
			if (cacheKeys.length > 0) await redisClient.del(...cacheKeys)

			await logEvent('info', 'Utilización de reactivo creado exitosamente.', { newConsumption }, user.id, req)
			return sendResponse(res, 201, 'Utilización de reactivo creado exitosamente.', newConsumption)
		} catch (error) {
			console.log(error)
			await logEvent('error', 'Error al crear el reactivo.', { error: error.message, stack: error.stack }, user.id, req)
			await t.rollback()
			return sendResponse(res, 500)
		}
	},

	async deleteConsumptionsReactive(req, res) {
		const t = await db_main.transaction()
		const redisClient = createRedisClient()

		const { user } = req
		const { id } = req.params

		try {
			const consumptionReactiveFound = await reactive_Schema.findByPk(id)
			if (!consumptionReactiveFound) return sendResponse(res, 404, 'Registro de consumo de reactivo no encontrado.')

			const newConsumption = await reactiveConsumption_Schema.destroy(id, { transaction: t })

			await t.commit()

			const cacheKeys = await redisClient.keys(`cache:${KEY_REDIS_CONSUMPTION_REACTIVE}:page:*`)
			if (cacheKeys.length > 0) await redisClient.del(...cacheKeys)

			await logEvent(
				'info',
				'Registro de consumo de reactivo eliminado exitosamente.',
				{ newConsumption },
				user.id,
				req
			)
			return sendResponse(res, 201, 'Registro de consumo de reactivo eliminado exitosamente.', newConsumption)
		} catch (error) {
			await logEvent(
				'error',
				'Error al eliminar el registro de consumo de reactiuvo.',
				{ error: error.message, stack: error.stack },
				user.id,
				req
			)
			await t.rollback()
			return sendResponse(res, 500)
		}
	},
}

export { consumptionController }
