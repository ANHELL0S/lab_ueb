import { Op } from 'sequelize'
import moment from 'moment-timezone'
import { db_main } from '../config/db.config.js'
import { logEvent } from '../helpers/log.helper.js'
import { sample_Schema } from '../schema/schemes.js'
import { generatePdfTable } from '../libs/pdf_kit.lib.js'
import { GenericCrudModel } from '../models/crud.model.js'
import { createRedisClient } from '../config/redis.config.js'
import { sample_zod } from '../validators/sample.validator.js'
import { sendResponse } from '../helpers/response_handler.helper.js'
import { PAGINATION_LIMIT, PAGINATION_PAGE } from '../const/pagination.const.js'
import { KEY_REDIS_SAMPLE, TIME_KEY_VALID } from '../const/redis_keys.const.js'

const sampleController = {
	async getAllSample(req, res) {
		const redisClient = createRedisClient()
		const { page = PAGINATION_PAGE, limit = PAGINATION_LIMIT, applicant_name = '' } = req.query
		const offset = (page - 1) * limit
		const cacheKey = `cache:${KEY_REDIS_SAMPLE}:page:${page}:limit:${limit}:applicant_name:${applicant_name}`

		try {
			const cachedData = await redisClient.get(cacheKey)
			if (cachedData) {
				const parsedData = JSON.parse(cachedData)
				return sendResponse(res, 200, 'Muestras obtenidas exitosamente.', parsedData)
			}

			const { count, rows } = await sample_Schema.findAndCountAll({
				where: {
					...(applicant_name && { applicant_name: { [Op.iLike]: `%${applicant_name}%` } }),
				},
				limit: limit,
				offset: offset,
				subQuery: false,
				distinct: true,
				order: [['createdAt', 'DESC']],
			})

			if (rows.length === 0) return sendResponse(res, 404, 'No se encontraron muestras.')

			const responseData = {
				totalRecords: count,
				totalPages: Math.ceil(count / limit),
				currentPage: parseInt(page, 10),
				recordsPerPage: parseInt(limit, 10),
				samples: rows,
			}

			await redisClient.set(cacheKey, JSON.stringify(responseData), 'EX', TIME_KEY_VALID)

			return sendResponse(res, 200, 'Muestras obtenidos exitosamente.', responseData)
		} catch (error) {
			await logEvent('error', 'Error al obtener las muestras.', { error: error.message, stack: error.stack }, null, req)
			return sendResponse(res, 500)
		} finally {
			redisClient.disconnect()
		}
	},

	async getSampleById(req, res) {
		const { id } = req.params
		return GenericCrudModel.getRecordById({
			model: sample_Schema,
			keyRedis: KEY_REDIS_SAMPLE,
			id: id,
			res,
			req,
			messageSuccess: 'Muestra obtenido exitosamente.',
			messageNotFound: 'Muestra no encontrado.',
			messageError: 'Error la obtener la muestra.',
		})
	},

	async createSample(req, res) {
		const t = await db_main.transaction()
		const redisClient = createRedisClient()

		const { user } = req

		try {
			const parsedData = sample_zod.safeParse(req.body)
			if (!parsedData.success) return sendResponse(res, 400, parsedData.error.errors[0].message)

			const existing_code_sample_lab = await sample_Schema.findOne({ where: { sample_code: req.body.sample_code } })
			if (existing_code_sample_lab) return sendResponse(res, 400, 'Ya existe una muestra con el mismo código.')

			const sampleData = {
				...req.body,
				id_analyst_fk: user.id,
			}

			const newLab = await sample_Schema.create(sampleData, { transaction: t })

			await t.commit()

			const cacheKeys = await redisClient.keys(`cache:${KEY_REDIS_SAMPLE}:page:*`)
			if (cacheKeys.length > 0) await redisClient.del(...cacheKeys)

			await logEvent('info', 'Muestra creada exitosamente.', { newLab }, user.id, req)
			return sendResponse(res, 201, 'Muestra creada exitosamente.', newLab)
		} catch (error) {
			console.log(error)
			await logEvent('error', 'Error al crear la muestra.', { error: error.message, stack: error.stack }, user.id, req)
			await t.rollback()
			return sendResponse(res, 500)
		} finally {
			redisClient.disconnect()
		}
	},

	async updateSample(req, res) {
		const t = await db_main.transaction()
		const redisClient = createRedisClient()

		try {
			const parsedData = sample_zod.safeParse(req.body)
			if (!parsedData.success) return sendResponse(res, 400, parsedData.error.errors[0].message)

			const existingSample = await sample_Schema.findByPk(req.params.id)
			if (!existingSample) return sendResponse(res, 404, 'Muestra no encontrada.')

			const existingCodeSample = await sample_Schema.findOne({
				where: { sample_code: req.body.sample_code, id_sample: { [Op.ne]: req.params.id } },
			})
			if (existingCodeSample) return sendResponse(res, 400, 'Ya existe otra muestra con este código.')

			const sampleData = {
				...req.body,
				id_analyst_fk: req.user.id,
			}
			const updateSample = await sample_Schema.update(sampleData, {
				where: { id_sample: req.params.id },
				returning: true,
				transaction: t,
			})

			await t.commit()

			const cacheKeys = await redisClient.keys(`cache:${KEY_REDIS_SAMPLE}:page:*`)
			if (cacheKeys.length > 0) await redisClient.del(...cacheKeys)

			await logEvent('info', 'Muestra actualizada exitosamente.', { updateSample }, req.user.id, req)
			return sendResponse(res, 200, 'Muestra actualizada exitosamente.', updateSample)
		} catch (error) {
			console.log(error)
			await logEvent(
				'error',
				'Error al actualizar la muestra.',
				{ error: error.message, stack: error.stack },
				req.user.id,
				req
			)
			await t.rollback()
			return sendResponse(res, 500, 'Error interno del servidor')
		} finally {
			redisClient.disconnect()
		}
	},

	async deleteSample(req, res) {
		const sampleFound = await sample_Schema.findByPk(req.params.id)
		if (!sampleFound) return sendResponse(res, 400, 'No se encontro la muestra.')

		await GenericCrudModel.deleteRecord({
			keyRedis: KEY_REDIS_SAMPLE,
			model: sample_Schema,
			transaction_db_name: db_main,
			id_params: req.params.id,
			user_id: req.user.id,
			req,
			res,
			messageSuccess: 'Muestra eliminada exitosamente.',
			messageNotFound: 'Muestra no encontrada.',
			messageError: 'Error al eliminar la muestra.',
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

			const reactives = await sample_Schema.findAll({
				where: {
					createdAt: {
						[Op.gte]: startUTC,
						[Op.lte]: endUTC,
					},
				},
				order: [['createdAt', 'ASC']],
			})

			if (!reactives.length)
				return sendResponse(res, 404, 'No se encontraron registros de muestras para generar el reporte.')

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

			await logEvent('info', 'Se generó un reporte PDF de muestras.', null, req.user.id, req)

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

export { sampleController }
