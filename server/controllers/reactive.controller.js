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

const reactiveController = {
	async getAllReactives(req, res) {
		const redisClient = createRedisClient()
		const { page = PAGINATION_PAGE, limit = PAGINATION_LIMIT } = req.query
		const offset = (page - 1) * limit
		const cacheKey = `cache:${KEY_REDIS_REACTIVE}:page:${page}:limit:${limit}`

		try {
			const cachedData = await redisClient.get(cacheKey)
			if (cachedData) {
				const parsedData = JSON.parse(cachedData)
				return sendResponse(res, 200, 'Reactivos obtenidos exitosamente.', parsedData)
			}

			const { count, rows } = await reactive_Schema.findAndCountAll({
				include: [
					{
						model: reactiveConsumption_Schema,
					},
				],
				limit: limit,
				offset: offset,
				subQuery: false,
				order: [['createdAt', 'DESC']],
			})

			if (rows.length === 0) return sendResponse(res, 404, 'No se encontraron reactivos.')

			const responseData = {
				totalRecords: count,
				totalPages: Math.ceil(count / limit),
				currentPage: parseInt(page, 10),
				recordsPerPage: parseInt(limit, 10),
				reactives: rows,
			}

			await redisClient.set(cacheKey, JSON.stringify(responseData), 'EX', TIME_KEY_VALID)

			return sendResponse(res, 200, 'Reactivos obtenidos exitosamente.', responseData)
		} catch (error) {
			console.log(error)
			await logEvent('error', 'Error al obtener reactivos.', { error: error.message, stack: error.stack }, null, req)
			return sendResponse(res, 500)
		} finally {
			redisClient.disconnect()
		}
	},

	async getReactiveById(req, res) {
		const { id } = req.params
		return GenericCrudModel.getRecordById({
			model: reactive_Schema,
			keyRedis: KEY_REDIS_REACTIVE,
			id: id,
			res,
			req,
			messageSuccess: 'Reactivo obtenido exitosamente.',
			messageNotFound: 'Reactivo no encontrado.',
			messageError: 'Error la obtener el reactivo.',
		})
	},

	async createReactive(req, res) {
		const t = await db_main.transaction()
		const redisClient = createRedisClient()

		const { user } = req
		const { name, code } = req.body

		try {
			const parsedData = reactive_zod.safeParse(req.body)
			if (!parsedData.success) return sendResponse(res, 400, parsedData.error.errors[0].message)

			const existing_name_lab = await reactive_Schema.findOne({ where: { name: name } })
			if (existing_name_lab) return sendResponse(res, 400, 'Ya existe reactivo con este nombre.')

			const existing_code_lab = await reactive_Schema.findOne({ where: { code: code } })
			if (existing_code_lab) return sendResponse(res, 400, 'Ya existe reactivo con este cófigo.')

			const labData = {
				...req.body,
			}
			const newLab = await reactive_Schema.create(labData, { transaction: t })

			await t.commit()

			const cacheKeys = await redisClient.keys(`cache:${KEY_REDIS_REACTIVE}:page:*`)
			if (cacheKeys.length > 0) await redisClient.del(...cacheKeys)

			await logEvent('info', 'Reactivo creado exitosamente.', { newLab }, user.id, req)
			return sendResponse(res, 201, 'Reactivo creado exitosamente.', newLab)
		} catch (error) {
			await logEvent('error', 'Error al crear el reactivo.', { error: error.message, stack: error.stack }, user.id, req)
			await t.rollback()
			return sendResponse(res, 500)
		}
	},

	async updateReactive(req, res) {
		try {
			const parsedData = reactive_zod.safeParse(req.body)
			if (!parsedData.success) return sendResponse(res, 400, parsedData.error.errors[0].message)

			const { user } = req
			const { id } = req.params
			const { name, code } = req.body

			const reactiveFound = await reactive_Schema.findByPk(id)
			if (!reactiveFound) return sendResponse(res, 404, 'Reactivo no encontrado.')

			// Check for unique values
			const checkDuplicate = async (field, value, errorMessage) => {
				if (value !== reactiveFound[field]) {
					const existingReactive = await reactive_Schema.findOne({
						where: {
							[field]: value,
							id_reactive: { [Op.ne]: reactiveFound.id_reactive },
						},
					})
					if (existingReactive) return sendResponse(res, 400, errorMessage)
				}
			}

			// Validate unique fields
			await checkDuplicate('name', name, 'Ya existe un reactivo con este nombre.')
			await checkDuplicate('code', code, 'Ya existe un reactivo con este código.')

			const labData = {
				...req.body,
			}

			await GenericCrudModel.updateRecord({
				keyRedis: KEY_REDIS_REACTIVE,
				model: reactive_Schema,
				data: labData,
				id_params: id,
				user_id: user.id,
				transaction_db_name: db_main,
				req,
				res,
				messageSuccess: 'Reactivo actualizado exitosamente.',
				messageNotFound: 'Reactivo no encontrado.',
				messageError: 'Error al actualizar el reactivo.',
			})
		} catch (error) {
			return sendResponse(res, 500)
		}
	},

	async deleteReactive(req, res) {
		const { user } = req
		const { id } = req.params

		const userfound = await reactive_Schema.findByPk(id)
		if (!userfound) return sendResponse(res, 404, 'Reactivo no encontrado.')

		await GenericCrudModel.deleteRecord({
			keyRedis: KEY_REDIS_REACTIVE,
			model: reactive_Schema,
			id_params: id,
			user_id: user.id,
			transaction_db_name: db_main,
			req,
			res,
			messageSuccess: 'Reactivo eliminado exitosamente.',
			messageNotFound: 'Reactivo no encontrado.',
			messageError: 'Error al eliminar el reactivo.',
		})
	},
}

export { reactiveController }
