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
import { TIME_KEY_VALID, KEY_REDIS_CONSUMPTION_REACTIVE, KEY_REDIS_KARDEX } from '../const/redis_keys.const.js'
import {
	user_Schema,
	kardex_Schema,
	reactive_Schema,
	system_config_Schema,
	reactiveConsumption_Schema,
} from '../schema/schemes.js'

const kardexController = {
	async getAllKardex(req, res) {
		const redisClient = createRedisClient()
		const { page = PAGINATION_PAGE, limit = PAGINATION_LIMIT } = req.query
		const offset = (page - 1) * limit
		const cacheKey = `cache:${KEY_REDIS_KARDEX}:page:${page}:limit:${limit}`

		try {
			const cachedData = await redisClient.get(cacheKey)
			if (cachedData) {
				const parsedData = JSON.parse(cachedData)
				return sendResponse(res, 200, 'Registro de kardex obtenidos exitosamente.', parsedData)
			}

			const { count, rows } = await kardex_Schema.findAndCountAll({
				include: [
					{
						model: reactive_Schema,
					},
				],
				limit: limit,
				offset: offset,
				subQuery: false,
				distinct: true,
				order: [['createdAt', 'DESC']],
			})

			if (rows.length === 0) return sendResponse(res, 404, 'No se encontraron registro de kardex.')

			const responseData = {
				totalRecords: count,
				totalPages: Math.ceil(count / limit),
				currentPage: parseInt(page, 10),
				recordsPerPage: parseInt(limit, 10),
				kardex: rows,
			}

			await redisClient.set(cacheKey, JSON.stringify(responseData), 'EX', TIME_KEY_VALID)

			return sendResponse(res, 200, 'Registro de kardex obtenidos exitosamente.', responseData)
		} catch (error) {
			await logEvent(
				'error',
				'Error al obtener los registos del kardex.',
				{ error: error.message, stack: error.stack },
				null,
				req
			)
			return sendResponse(res, 500)
		} finally {
			redisClient.disconnect()
		}
	},

	async getKardexById(req, res) {
		return GenericCrudModel.getRecordById({
			model: kardex_Schema,
			keyRedis: KEY_REDIS_KARDEX,
			id: req.params.id,
			res,
			req,
			messageSuccess: 'Registro de kardex obtenido exitosamente.',
			messageNotFound: 'Registro de kardex no encontrado.',
			messageError: 'Error la obtener el registro de kardex.',
		})
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

			const kardexFound = await kardex_Schema.findAll({
				include: [{ model: reactive_Schema }, { model: user_Schema }],
				where: {
					createdAt: {
						[Op.gte]: startUTC,
						[Op.lte]: endUTC,
					},
				},
				order: [['createdAt', 'ASC']],
			})

			if (!kardexFound.length) {
				return sendResponse(res, 404, 'No se encontraron registros de kardex para generar el reporte.')
			}

			const KARDEX_TRANSLATIONS = {
				adjustment: 'ajuste',
				entry: 'entrada',
				return: 'salida',
			}

			const title_rows = ['Cod reactivo', 'Acción', 'Responsable', 'Cantidad', 'Unidad', 'Balance', 'Nota', 'Fecha']
			const rows = kardexFound.map(item => [
				item.reactive.code,
				KARDEX_TRANSLATIONS[item.action_type],
				item.user.full_name,
				item.quantity,
				item.unit,
				item.balance_after_action,
				item.notes,
				moment(item.createdAt).tz(timezone).format('DD-MM-YYYY HH:mm'),
			])

			const actionCounts = kardexFound.reduce((acc, item) => {
				acc[item.action_type] = (acc[item.action_type] || 0) + 1
				return acc
			}, {})

			const totalRows = kardexFound.length

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
					title: 'Reporte de kardex.',
					header: {
						dateRange: `Fecha de reporte: ${formatDate(startUTC)} - ${formatDate(endUTC)}`,
						totalRows: `Total de registros: ${totalRows}`,
						actionSummary: `Acciones: ${Object.entries(actionCounts)
							.map(([action, count]) => `${KARDEX_TRANSLATIONS[action]}: ${count}`)
							.join(', ')}`,
					},
					title_rows,
					rows,
					filename: `Reporte_Kardex_${moment().tz(timezone).format('YYYY-MM-DD_HH-mm')}.pdf`,
				},
				res
			)
		} catch (error) {
			console.log(error)
			await logEvent(
				'error',
				'Error al generar el reporte PDF de kardex.',
				{ error: error.message, stack: error.stack },
				req.user.id,
				req
			)
			return sendResponse(res, 500)
		}
	},
}

export { kardexController }
