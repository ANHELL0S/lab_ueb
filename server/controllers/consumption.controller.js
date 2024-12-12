import { Op } from 'sequelize'
import moment from 'moment-timezone'
import { db_main } from '../config/db.config.js'
import { logEvent } from '../helpers/log.helper.js'
import { KARDEX_RETURN } from '../const/kardex.values.js'
import { generatePdfTable } from '../libs/pdf_kit.lib.js'
import { GenericCrudModel } from '../models/crud.model.js'
import { createRedisClient } from '../config/redis.config.js'
import { sendResponse } from '../helpers/response_handler.helper.js'
import { consumption_reactive_zod } from '../validators/reactive.validator.js'
import { PAGINATION_LIMIT, PAGINATION_PAGE } from '../const/pagination.const.js'
import { TIME_KEY_VALID, KEY_REDIS_CONSUMPTION_REACTIVE } from '../const/redis_keys.const.js'
import {
	user_Schema,
	kardex_Schema,
	reactive_Schema,
	system_config_Schema,
	reactiveConsumption_Schema,
} from '../schema/schemes.js'

const consumptionController = {
	async getAllConsumptions(req, res) {
		const redisClient = createRedisClient()
		const { page = PAGINATION_PAGE, limit = PAGINATION_LIMIT, name_experiment = '' } = req.query
		const offset = (page - 1) * limit
		const cacheKey = `cache:${KEY_REDIS_CONSUMPTION_REACTIVE}:page:${page}:limit:${limit}:name_experiment:${name_experiment}`

		try {
			const cachedData = await redisClient.get(cacheKey)
			if (cachedData) {
				const parsedData = JSON.parse(cachedData)
				return sendResponse(res, 200, 'Registro de consumo de reactivos obtenidos exitosamente.', parsedData)
			}

			const { count, rows } = await reactiveConsumption_Schema.findAndCountAll({
				where: {
					...(name_experiment && { name_experiment: { [Op.iLike]: `%${name_experiment}%` } }),
				},
				limit: limit,
				offset: offset,
				subQuery: false,
				distinct: true,
				order: [['createdAt', 'DESC']],
			})

			if (rows.length === 0) return sendResponse(res, 404, 'No se encontraron registro de consumo de reactivos.')

			const responseData = {
				totalRecords: count,
				totalPages: Math.ceil(count / limit),
				currentPage: parseInt(page, 10),
				recordsPerPage: parseInt(limit, 10),
				consumption: rows,
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

			// Verificar existencia del usuario y el reactivo
			const userFound = await user_Schema.findByPk(user.id)
			const reactiveFound = await reactive_Schema.findByPk(req.body.id_reactive_fk)
			if (!reactiveFound) return sendResponse(res, 404, 'Reactivo no encontrado')

			// Validar que las unidades sean las mismas
			if (reactiveFound.unit !== req.body.unit)
				return sendResponse(res, 400, 'La unidad de consumo y del reactivo no coinciden.')

			// Validar que la cantidad consumida no exceda la cantidad actual
			if (req.body.quantity_consumed > reactiveFound.current_quantity)
				return sendResponse(res, 400, 'La cantidad a consumir excede la cantidad disponible del reactivo.')

			// Preparar datos para el consumo
			const consumptionData = {
				...req.body,
				name_analyst: userFound.full_name,
			}

			// Crear el registro de consumo
			const newConsumption = await reactiveConsumption_Schema.create(consumptionData, { transaction: t })

			// Actualizar la cantidad actual del reactivo
			reactiveFound.current_quantity -= req.body.quantity_consumed
			await reactiveFound.save({ transaction: t })

			// Registrar el consumo en el kardex
			const kardexData = {
				id_reactive: reactiveFound.id_reactive,
				action_type: KARDEX_RETURN,
				id_responsible: user.id,
				quantity: req.body.quantity_consumed,
				unit: req.body.unit,
				balance_after_action: reactiveFound.current_quantity,
				notes:
					req.body.notes ||
					`Se consumió ${req.body.quantity_consumed}/${req.body.unit} en el experimento ${req.body.name_experiment}`,
			}

			await kardex_Schema.create(kardexData, { transaction: t })

			// Confirmar la transacción
			await t.commit()

			// Limpiar cachés relevantes
			const cacheKeys = await redisClient.keys(`cache:${KEY_REDIS_CONSUMPTION_REACTIVE}:page:*`)
			if (cacheKeys.length > 0) await redisClient.del(...cacheKeys)

			// Registrar en el log de eventos
			await logEvent(
				'info',
				'Utilización de reactivo creado exitosamente.',
				{ newConsumption, kardex: kardexData },
				user.id,
				req
			)

			return sendResponse(res, 201, 'Utilización de reactivo creado exitosamente.', newConsumption)
		} catch (error) {
			await logEvent(
				'error',
				'Error al crear el consumo de reactivo.',
				{ error: error.message, stack: error.stack },
				user.id,
				req
			)
			await t.rollback()
			return sendResponse(res, 500, 'Error interno del servidor.')
		}
	},

	async deleteConsumptionsReactive(req, res) {
		const t = await db_main.transaction()
		const redisClient = createRedisClient()

		const { user } = req
		const { id } = req.params

		try {
			const consumptionReactiveFound = await reactiveConsumption_Schema.findByPk(id)
			if (!consumptionReactiveFound) return sendResponse(res, 404, 'Registro de consumo de reactivo no encontrado.')

			const reactive = await reactive_Schema.findByPk(consumptionReactiveFound.id_reactive_fk)
			if (!reactive) return sendResponse(res, 404, 'Reactivo no encontrado.')

			// Validar que las unidades sean las mismas antes de sumar
			if (reactive.unit !== consumptionReactiveFound.unit)
				return sendResponse(res, 400, 'Las unidades del consumo y del reactivo no coinciden.')

			// Actualizar la cantidad actual del reactivo
			reactive.current_quantity += consumptionReactiveFound.quantity_consumed
			await reactive.save({ transaction: t })

			// Eliminar el registro de consumo
			await reactiveConsumption_Schema.destroy({ where: { id_consumption: id }, transaction: t })

			// Confirmar la transacción
			await t.commit()

			// Limpiar la caché
			const cacheKeys = await redisClient.keys(`cache:${KEY_REDIS_CONSUMPTION_REACTIVE}:page:*`)
			if (cacheKeys.length > 0) await redisClient.del(...cacheKeys)

			// Registrar el evento
			await logEvent(
				'info',
				'Registro de consumo de reactivo eliminado exitosamente y cantidad restaurada.',
				{ consumptionReactiveFound },
				user.id,
				req
			)

			return sendResponse(res, 201, 'Registro de consumo de reactivo eliminado exitosamente y cantidad restaurada.')
		} catch (error) {
			await logEvent(
				'error',
				'Error al eliminar el registro de consumo de reactivo.',
				{ error: error.message, stack: error.stack },
				user.id,
				req
			)
			await t.rollback()
			return sendResponse(res, 500, 'Ocurrió un error al eliminar el registro de consumo de reactivo.')
		}
	},

	async generatePdfReport(req, res) {
		try {
			const { startDate, endDate, timezone = 'America/Guayaquil' } = req.query

			const now = moment.tz(timezone)
			const startUTC = startDate
				? moment.tz(startDate, 'YYYY-MM-DD', timezone).startOf('day').utc().toDate()
				: now.clone().startOf('month').utc().toDate()
			const endUTC = endDate
				? moment.tz(endDate, 'YYYY-MM-DD', timezone).endOf('day').utc().toDate()
				: now.clone().endOf('month').utc().toDate()

			const consumptions = await reactiveConsumption_Schema.findAll({
				include: [{ model: reactive_Schema }],
				where: {
					createdAt: {
						[Op.gte]: startUTC,
						[Op.lte]: endUTC,
					},
				},
				order: [['createdAt', 'ASC']],
			})

			if (!consumptions.length)
				return sendResponse(res, 404, 'No se encontraron registros de consumo de reactivos para generar el reporte.')

			const title_rows = ['Código reactivo', 'Analista', 'Experimento', 'Cantidad', 'Unidad', 'Fecha']
			const rows = consumptions.map(item => [
				item.reactive.code,
				item.name_analyst,
				item.name_experiment,
				item.quantity_consumed,
				item.unit,
				moment(item.createdAt).tz(timezone).format('DD-MM-YYYY HH:mm'),
			])

			const totalQuantity = consumptions.reduce((sum, item) => sum + item.quantity_consumed, 0).toFixed(2)
			const totalRows = consumptions.length

			const consumptionMap = consumptions.reduce((acc, item) => {
				acc[item.reactive.code] = (acc[item.reactive.code] || 0) + item.quantity_consumed
				return acc
			}, {})

			const mostConsumedReactiveCode = Object.keys(consumptionMap).reduce((a, b) =>
				consumptionMap[a] > consumptionMap[b] ? a : b
			)
			const leastConsumedReactiveCode = Object.keys(consumptionMap).reduce((a, b) =>
				consumptionMap[a] < consumptionMap[b] ? a : b
			)

			const mostConsumedReactive = consumptions.find(item => item.reactive.code === mostConsumedReactiveCode)
			const leastConsumedReactive = consumptions.find(item => item.reactive.code === leastConsumedReactiveCode)

			const infoU = await system_config_Schema.findOne()
			const institutionData = {
				name: infoU.institution_name,
				address: infoU.address,
				contact: `${infoU.contact_phone} | ${infoU.contact_email}`,
			}

			await logEvent('info', 'Se generó un reporte PDF de consumo de reactivos.', null, req.user.id, req)

			const formatDate = date => (date ? moment(date).tz(timezone).format('DD-MM-YYYY') : 'No especificado')

			await generatePdfTable(
				{
					institutionData,
					title: 'Reporte de consumo de reactivos',
					header: {
						dateRange: `Fecha de reporte: ${formatDate(startUTC)} - ${formatDate(endUTC)}`,
						totalRows: `Total de registros: ${totalRows}`,
						totalQuantity: `Total cantidad consumida: ${totalQuantity}`,
						mostConsumedReactive: mostConsumedReactive
							? `Más consumido: ${mostConsumedReactive.reactive.name} (${mostConsumedReactiveCode}) (${consumptionMap[
									mostConsumedReactiveCode
							  ].toFixed(2)})`
							: 'N/A',
						leastConsumedReactive: leastConsumedReactive
							? `Menos consumido: ${
									leastConsumedReactive.reactive.name
							  } (${leastConsumedReactiveCode}) ( ${consumptionMap[leastConsumedReactiveCode].toFixed(2)})`
							: 'N/A',
					},
					title_rows,
					rows,
					filename: `Reporte_Consumo_Reactivos_${moment().tz(timezone).format('YYYY-MM-DD_HH-mm')}.pdf`,
				},
				res
			)
		} catch (error) {
			await logEvent(
				'error',
				'Error al generar el reporte PDF de consumo de reactivos.',
				{ error: error.message, stack: error.stack },
				req.user.id,
				req
			)
			return sendResponse(res, 500)
		}
	},
}

export { consumptionController }
