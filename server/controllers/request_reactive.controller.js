import { Op } from 'sequelize'
import { db_main } from '../config/db.config.js'
import { logEvent } from '../helpers/log.helper.js'
import { GenericCrudModel } from '../models/crud.model.js'
import { createRedisClient } from '../config/redis.config.js'
import { sendResponse } from '../helpers/response_handler.helper.js'
import { request_reactive_zod } from '../validators/reactive.validator.js'
import { PAGINATION_LIMIT, PAGINATION_PAGE } from '../const/pagination.const.js'
import { KEY_REDIS_REQUEST_REACTIVE, TIME_KEY_VALID } from '../const/redis_keys.const.js'
import { reactive_Schema, request_reactive_Schema, user_Schema } from '../schema/schemes.js'

const requestReactiveController = {
	async getAllRequestReactives(req, res) {
		const redisClient = createRedisClient()
		const { page = PAGINATION_PAGE, limit = PAGINATION_LIMIT, description = '' } = req.query
		const offset = (page - 1) * limit
		const cacheKey = `cache:${KEY_REDIS_REQUEST_REACTIVE}:page:${page}:limit:${limit}:description:${description}`

		try {
			const cachedData = await redisClient.get(cacheKey)
			if (cachedData) {
				const parsedData = JSON.parse(cachedData)
				return sendResponse(res, 200, 'Peticiones de de reactivos obtenidos exitosamente.', parsedData)
			}

			const { count, rows } = await request_reactive_Schema.findAndCountAll({
				include: [
					{
						model: reactive_Schema,
					},
					{
						model: user_Schema,
						attributes: { exclude: ['password'] },
					},
				],
				where: {
					...(description && { description: { [Op.iLike]: `%${description}%` } }),
				},
				limit: limit,
				offset: offset,
				subQuery: false,
				distinct: true,
				order: [['createdAt', 'DESC']],
			})

			if (rows.length === 0) return sendResponse(res, 404, 'No se encontraron peticiones de reactivos.')

			const responseData = {
				totalRecords: count,
				totalPages: Math.ceil(count / limit),
				currentPage: parseInt(page, 10),
				recordsPerPage: parseInt(limit, 10),
				request_reactives: rows,
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

	async getRequestReactiveById(req, res) {
		const { id } = req.params
		return GenericCrudModel.getRecordById({
			model: request_reactive_Schema,
			keyRedis: KEY_REDIS_REQUEST_REACTIVE,
			id: id,
			res,
			req,
			messageSuccess: 'Petición de reactivo obtenida exitosamente.',
			messageNotFound: 'Petición de reactivo no encontrado.',
			messageError: 'Error la obtener la petición del reactivo.',
		})
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

	async updateRequestReactive(req, res) {
		try {
			const parsedData = request_reactive_zod.safeParse(req.body)
			if (!parsedData.success) return sendResponse(res, 400, parsedData.error.errors[0].message)

			const { user } = req
			const { id } = req.params

			const labData = {
				...req.body,
			}

			await GenericCrudModel.updateRecord({
				keyRedis: KEY_REDIS_REQUEST_REACTIVE,
				model: request_reactive_Schema,
				data: labData,
				id_params: id,
				user_id: user.id,
				transaction_db_name: db_main,
				req,
				res,
				messageSuccess: 'Petición del reactivo actualizado exitosamente.',
				messageNotFound: 'Petición del reactivo no encontrado.',
				messageError: 'Error al actualizar la petición del reactivo.',
			})
		} catch (error) {
			return sendResponse(res, 500)
		}
	},

	async deleteRequestReactive(req, res) {
		const { user } = req
		const { id } = req.params

		const userfound = await request_reactive_Schema.findByPk(id)
		if (!userfound) return sendResponse(res, 404, 'Reactivo no encontrado.')

		await GenericCrudModel.deleteRecord({
			keyRedis: KEY_REDIS_REQUEST_REACTIVE,
			model: request_reactive_Schema,
			id_params: id,
			user_id: user.id,
			transaction_db_name: db_main,
			req,
			res,
			messageSuccess: 'Petición de reactivo eliminado exitosamente.',
			messageNotFound: 'Petición de reactivo no encontrado.',
			messageError: 'Error al eliminar la peticón de reactivo.',
		})
	},
}

export { requestReactiveController }
