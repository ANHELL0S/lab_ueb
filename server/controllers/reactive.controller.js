import { Op } from 'sequelize'
import moment from 'moment-timezone'
import { db_main } from '../config/db.config.js'
import { logEvent } from '../helpers/log.helper.js'
import { generatePdfTable } from '../libs/pdf_kit.lib.js'
import { GenericCrudModel } from '../models/crud.model.js'
import { createRedisClient } from '../config/redis.config.js'
import { reactive_zod } from '../validators/reactive.validator.js'
import { sendResponse } from '../helpers/response_handler.helper.js'
import { KARDEX_ADJUSTMENT, KARDEX_ENTRY } from '../const/kardex.values.js'
import { PAGINATION_LIMIT, PAGINATION_PAGE } from '../const/pagination.const.js'
import { KEY_REDIS_REACTIVE, TIME_KEY_VALID } from '../const/redis_keys.const.js'
import { kardex_Schema, reactive_Schema, reactiveConsumption_Schema, system_config_Schema } from '../schema/schemes.js'

const reactiveController = {
	async getAllReactives(req, res) {
		const redisClient = createRedisClient()
		const { page = PAGINATION_PAGE, limit = PAGINATION_LIMIT, name = '', code = '' } = req.query
		const offset = (page - 1) * limit
		const cacheKey = `cache:${KEY_REDIS_REACTIVE}:page:${page}:limit:${limit}:name:${name}:code:${code}`

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
				where: {
					...(name && { name: { [Op.iLike]: `%${name}%` } }),
					...(code && { code: { [Op.iLike]: `%${code}%` } }),
				},
				limit: limit,
				offset: offset,
				subQuery: false,
				distinct: true, //FIXME: Esto asegura que los reactivos no se cuenten más de una vez
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
		const { name, code, initial_quantity, unit } = req.body

		try {
			const parsedData = reactive_zod.safeParse(req.body)
			if (!parsedData.success) return sendResponse(res, 400, parsedData.error.errors[0].message)

			// Verificar existencia de reactivos con el mismo nombre o código
			const existing_name_lab = await reactive_Schema.findOne({ where: { name } })
			if (existing_name_lab) return sendResponse(res, 400, 'Ya existe reactivo con este nombre.')

			const existing_code_lab = await reactive_Schema.findOne({ where: { code } })
			if (existing_code_lab) return sendResponse(res, 400, 'Ya existe reactivo con este código.')

			// Crear el nuevo reactivo
			const labData = {
				...req.body,
				current_quantity: initial_quantity,
			}

			const newLab = await reactive_Schema.create(labData, { transaction: t })

			// Registrar la entrada inicial en el kardex
			const kardexData = {
				id_reactive: newLab.id_reactive,
				action_type: KARDEX_ENTRY,
				id_responsible: user.id,
				quantity: initial_quantity,
				unit: unit,
				balance_after_action: initial_quantity,
				notes: 'Registro inicial del reactivo.',
			}

			await kardex_Schema.create(kardexData, { transaction: t })

			// Confirmar la transacción
			await t.commit()

			// Limpiar cachés relevantes
			const cacheKeys = await redisClient.keys(`cache:${KEY_REDIS_REACTIVE}:page:*`)
			if (cacheKeys.length > 0) await redisClient.del(...cacheKeys)

			// Registrar en el log de eventos
			await logEvent('info', 'Reactivo creado exitosamente.', { newLab }, user.id, req)

			return sendResponse(res, 201, 'Reactivo creado exitosamente.', newLab)
		} catch (error) {
			await logEvent('error', 'Error al crear el reactivo.', { error: error.message, stack: error.stack }, user.id, req)
			await t.rollback()
			return sendResponse(res, 500, 'Error interno del servidor.')
		}
	},

	async updateReactive(req, res) {
		const t = await db_main.transaction()
		const redisClient = createRedisClient()

		const { user } = req
		const { id } = req.params
		const { name, code } = req.body

		try {
			const parsedData = reactive_zod.safeParse(req.body)
			if (!parsedData.success) return sendResponse(res, 400, parsedData.error.errors[0].message)

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

			await reactive_Schema.update(labData, {
				where: { id_reactive: id },
				transaction: t,
			})
			const updatedRecord = await reactive_Schema.findByPk(id, { transaction: t })

			// Determine if the quantity has increased or decreased
			const quantityChange = req.body.initial_quantity - reactiveFound.current_quantity
			const balanceAfterAction = reactiveFound.current_quantity + quantityChange

			// Prepare kardex data with the quantity change
			const kardexData = {
				id_reactive: reactiveFound.id_reactive,
				action_type: KARDEX_ADJUSTMENT,
				id_responsible: user.id,
				quantity: req.body.initial_quantity,
				unit: req.body.unit,
				balance_after_action: balanceAfterAction,
				notes:
					req.body.notes || `Se ajustó el reactivo, cantidad: ${req.body.initial_quantity}, unidad: ${req.body.unit}`,
			}

			await kardex_Schema.create(kardexData, { transaction: t })

			// Buscar y eliminar claves específicas relacionadas (páginas, etc.)
			const cacheKeys = await redisClient.keys(`cache:${KEY_REDIS_REACTIVE}:page:*`)
			if (cacheKeys.length > 0) await redisClient.del(...cacheKeys)

			await logEvent('info', 'Reactivo actualizado exitosamente', { updatedRecord: updatedRecord }, user.id, req)

			await t.commit()
			return sendResponse(res, 200, 'Reactivo actualizado exitosamente.', updatedRecord)
		} catch (error) {
			await logEvent(
				'error',
				`Error al actualizar el reactivo.`,
				{ error: error.message, stack: error.stack },
				user.id,
				req
			)
			await t.rollback()
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

			const reactives = await reactive_Schema.findAll({
				where: {
					createdAt: {
						[Op.gte]: startUTC,
						[Op.lte]: endUTC,
					},
				},
				order: [['createdAt', 'ASC']],
			})

			if (!reactives.length)
				return sendResponse(res, 404, 'No se encontraron registros de reactivos para generar el reporte.')

			const title_rows = ['Nombre', 'Código', 'Unidad', 'Cnt Inicial', 'Cnt Actual', 'CAS', 'Expira']
			const rows = reactives.map(item => [
				item.name,
				item.code,
				item.unit,
				item.initial_quantity,
				item.current_quantity,
				item.cas,
				moment(item.expiration_date).tz(timezone).format('DD-MM-YYYY'),
			])

			const totalRows = reactives.length

			const infoU = await system_config_Schema.findOne()
			const institutionData = {
				name: infoU.institution_name,
				address: infoU.address,
				contact: `${infoU.contact_phone} | ${infoU.contact_email}`,
			}

			await logEvent('info', 'Se generó un reporte PDF de reactivos.', null, req.user.id, req)

			const mostConsumed = reactives.reduce((prev, current) =>
				prev.current_quantity < current.current_quantity ? prev : current
			)
			const leastConsumed = reactives.reduce((prev, current) =>
				prev.current_quantity > current.current_quantity ? prev : current
			)

			const formatDate = date => (date ? moment(date).tz(timezone).format('DD-MM-YYYY') : 'No especificado')

			await generatePdfTable(
				{
					institutionData,
					title: 'Reporte de reactivos.',
					header: {
						dateRange: `Fecha de reporte: ${formatDate(startUTC)} - ${formatDate(endUTC)}`,
						totalRows: `Total de registros: ${totalRows}`,
						mostConsumed: `Más consumido: ${mostConsumed.code} (${mostConsumed.current_quantity} ${mostConsumed.unit})`,
						leastConsumed: `Menos consumido: ${leastConsumed.code} (${leastConsumed.current_quantity} ${mostConsumed.unit})`,
					},
					title_rows,
					rows,
					filename: `Reporte_Reactivos_${moment().tz(timezone).format('YYYY-MM-DD_HH-mm')}.pdf`,
				},
				res
			)
		} catch (error) {
			await logEvent(
				'error',
				'Error al generar el reporte PDF de reactivos.',
				{ error: error.message, stack: error.stack },
				req.user.id,
				req
			)
			return sendResponse(res, 500)
		}
	},
}

export { reactiveController }
