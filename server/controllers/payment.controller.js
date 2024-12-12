import { Op } from 'sequelize'
import moment from 'moment-timezone'
import { db_main } from '../config/db.config.js'
import { logEvent } from '../helpers/log.helper.js'
import { generatePdfTable } from '../libs/pdf_kit.lib.js'
import { GenericCrudModel } from '../models/crud.model.js'
import { createRedisClient } from '../config/redis.config.js'
import { payment_zod } from '../validators/payment.validator.js'
import { sendResponse } from '../helpers/response_handler.helper.js'
import { PAGINATION_LIMIT, PAGINATION_PAGE } from '../const/pagination.const.js'
import { KEY_REDIS_PAYMENT, TIME_KEY_VALID } from '../const/redis_keys.const.js'
import { access_lab_payment_Scheme, access_lab_Scheme, system_config_Schema } from '../schema/schemes.js'

const paymentController = {
	async getAllPayment(req, res) {
		const redisClient = createRedisClient()
		const { page = PAGINATION_PAGE, limit = PAGINATION_LIMIT, code_bill = '' } = req.query
		const offset = (page - 1) * limit
		const cacheKey = `cache:${KEY_REDIS_PAYMENT}:page:${page}:limit:${limit}:code_bill:${code_bill}`

		try {
			const cachedData = await redisClient.get(cacheKey)
			if (cachedData) {
				const parsedData = JSON.parse(cachedData)
				return sendResponse(res, 200, 'Pagos obtenidas exitosamente.', parsedData)
			}

			const { count, rows } = await access_lab_payment_Scheme.findAndCountAll({
				where: {
					...(code_bill && { code_bill: { [Op.iLike]: `%${code_bill}%` } }),
				},
				limit: limit,
				offset: offset,
				subQuery: false,
				distinct: true,
				order: [['createdAt', 'DESC']],
			})

			if (rows.length === 0) return sendResponse(res, 404, 'No se encontraron pagos.')

			const responseData = {
				totalRecords: count,
				totalPages: Math.ceil(count / limit),
				currentPage: parseInt(page, 10),
				recordsPerPage: parseInt(limit, 10),
				payments: rows,
			}

			await redisClient.set(cacheKey, JSON.stringify(responseData), 'EX', TIME_KEY_VALID)

			return sendResponse(res, 200, 'Pagos obtenidos exitosamente.', responseData)
		} catch (error) {
			await logEvent('error', 'Error al obtener los pagos.', { error: error.message, stack: error.stack }, null, req)
			return sendResponse(res, 500)
		} finally {
			redisClient.disconnect()
		}
	},

	async getPaymentById(req, res) {
		return GenericCrudModel.getRecordById({
			model: access_lab_payment_Scheme,
			keyRedis: KEY_REDIS_PAYMENT,
			id: req.params.id,
			res,
			req,
			messageSuccess: 'Pago obtenido exitosamente.',
			messageNotFound: 'Pago no encontrado.',
			messageError: 'Error la obtener el pago.',
		})
	},

	async createPayment(req, res) {
		const t = await db_main.transaction()
		const redisClient = createRedisClient()

		const { user } = req

		try {
			const parsedData = payment_zod.safeParse(req.body)
			if (!parsedData.success) return sendResponse(res, 400, parsedData.error.errors[0].message)

			const existing_code_sample_lab = await access_lab_payment_Scheme.findOne({
				where: { code_bill: req.body.code_bill },
			})
			if (existing_code_sample_lab) return sendResponse(res, 400, 'Ya existe un pago  con el mismo código.')

			const accessFound = await access_lab_Scheme.findOne({
				where: { id_access_lab: req.body.id_access_lab_fk },
			})
			if (!accessFound) return sendResponse(res, 404, 'No se encontró un acceso.')

			const paymentData = {
				...req.body,
			}

			const newLab = await access_lab_payment_Scheme.create(paymentData, { transaction: t })

			await t.commit()

			const cacheKeys = await redisClient.keys(`cache:${KEY_REDIS_PAYMENT}:page:*`)
			if (cacheKeys.length > 0) await redisClient.del(...cacheKeys)

			await logEvent('info', 'Pago creado exitosamente.', { newLab }, user.id, req)
			return sendResponse(res, 201, 'Pago creado exitosamente.', newLab)
		} catch (error) {
			console.log(error)
			await logEvent('error', 'Error al crear el pago.', { error: error.message, stack: error.stack }, user.id, req)
			await t.rollback()
			return sendResponse(res, 500)
		} finally {
			redisClient.disconnect()
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

			const paymentsFound = await access_lab_payment_Scheme.findAll({
				include: [
					{
						model: access_lab_Scheme,
					},
				],

				where: {
					createdAt: {
						[Op.gte]: startUTC,
						[Op.lte]: endUTC,
					},
				},
				subQuery: false,
				distinct: true,
				order: [['createdAt', 'ASC']],
			})

			console.log(paymentsFound)

			if (!paymentsFound.length)
				return sendResponse(res, 404, 'No se encontraron registros de pagos para generar el reporte.')

			const title_rows = ['Remitente', 'Total', 'Cod Pago', 'Estado', 'Fecha']
			const rows = paymentsFound.map(item => [
				item.access_lab.full_name,
				item.amount_paid,
				item.code_bill,
				item.status,
				moment(item.payment_date).tz(timezone).format('DD-MM-YYYY'),
			])

			const totalRows = paymentsFound.length

			const infoU = await system_config_Schema.findOne()
			const institutionData = {
				name: infoU.institution_name,
				address: infoU.address,
				contact: `${infoU.contact_phone} | ${infoU.contact_email}`,
			}

			await logEvent('info', 'Se generó un reporte PDF de pagos.', null, req.user.id, req)

			const formatDate = date => (date ? moment(date).tz(timezone).format('DD-MM-YYYY') : 'No especificado')

			await generatePdfTable(
				{
					institutionData,
					title: 'Reporte de pagos.',
					header: {
						dateRange: `Fecha de reporte: ${formatDate(startUTC)} - ${formatDate(endUTC)}`,
						totalRows: `Total de registros: ${totalRows}`,
					},
					title_rows,
					rows,
					filename: `Reporte_Reactivos_${moment().tz(timezone).format('YYYY-MM-DD_HH-mm')}.pdf`,
				},
				res
			)
		} catch (error) {
			console.log(error)
			await logEvent(
				'error',
				'Error al generar el reporte PDF de pagos.',
				{ error: error.message, stack: error.stack },
				req.user.id,
				req
			)
			return sendResponse(res, 500)
		}
	},
}

export { paymentController }
