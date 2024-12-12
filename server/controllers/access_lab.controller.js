import { Op } from 'sequelize'
import moment from 'moment-timezone'
import { db_main } from '../config/db.config.js'
import { logEvent } from '../helpers/log.helper.js'
import { generatePdfTable } from '../libs/pdf_kit.lib.js'
import { GenericCrudModel } from '../models/crud.model.js'
import { createRedisClient } from '../config/redis.config.js'
import { sendResponse } from '../helpers/response_handler.helper.js'
import { access_lab_zod, change_permission_acess_lab_zod } from '../validators/access_lab.validator.js'
import { PAGINATION_LIMIT, PAGINATION_PAGE } from '../const/pagination.const.js'
import { KEY_REDIS_ACCESS_LAB, KEY_REDIS_ACCESS_LAB_STATUS, TIME_KEY_VALID } from '../const/redis_keys.const.js'
import {
	user_Schema,
	laboratory_Schema,
	access_lab_Scheme,
	system_config_Schema,
	access_lab_status_Schema,
} from '../schema/schemes.js'

const accessLabController = {
	async getAllAccessLabs(req, res) {
		const redisClient = createRedisClient()
		const { page = PAGINATION_PAGE, limit = PAGINATION_LIMIT, identification_card = '' } = req.query
		const offset = (page - 1) * limit
		const cacheKey = `cache:${KEY_REDIS_ACCESS_LAB}:page:${page}:limit:${limit}:identification_card:${identification_card}`

		try {
			const cachedData = await redisClient.get(cacheKey)
			if (cachedData) {
				const parsedData = JSON.parse(cachedData)
				return sendResponse(res, 200, 'Accesos a laboratorios obtenidos exitosamente.', parsedData)
			}

			const { count, rows } = await access_lab_Scheme.findAndCountAll({
				include: [
					{
						model: access_lab_status_Schema,
					},
				],
				where: {
					...(identification_card && { identification_card: { [Op.iLike]: `%${identification_card}%` } }),
				},
				limit: limit,
				offset: offset,
				subQuery: false,
				order: [['createdAt', 'DESC']],
			})

			if (rows.length === 0) return sendResponse(res, 404, 'No se encontraron accesos a laboratorios.')

			const responseData = {
				totalRecords: count,
				totalPages: Math.ceil(count / limit),
				currentPage: parseInt(page, 10),
				recordsPerPage: parseInt(limit, 10),
				access_labs: rows,
			}

			await redisClient.set(cacheKey, JSON.stringify(responseData), 'EX', TIME_KEY_VALID)

			return sendResponse(res, 200, 'Acessos a laboratorios obtenidos exitosamente.', responseData)
		} catch (error) {
			await logEvent(
				'error',
				'Error al obtener accesos a laboratorios.',
				{ error: error.message, stack: error.stack },
				null,
				req
			)
			return sendResponse(res, 500)
		} finally {
			redisClient.disconnect()
		}
	},

	async getAccessLabById(req, res) {
		return GenericCrudModel.getRecordById({
			id: req.params.id,
			model: access_lab_Scheme,
			keyRedis: KEY_REDIS_ACCESS_LAB,
			res,
			req,
			messageSuccess: 'Acceso al laboratorio obtenido exitosamente.',
			messageNotFound: 'Acceso al laboratorio no encontrado.',
			messageError: 'Error la obtener el acceso al laboratorio.',
		})
	},

	async createAcessLab(req, res) {
		const t = await db_main.transaction()
		const redisClient = createRedisClient()

		const { user } = req
		const { id_lab_fk } = req.body

		try {
			const parsedData = access_lab_zod.safeParse(req.body)
			if (!parsedData.success) return sendResponse(res, 400, parsedData.error.errors[0].message)

			const labFound = await laboratory_Schema.findByPk(id_lab_fk)
			if (!labFound || !labFound.active) return sendResponse(res, 404, 'Laboratorio no econtrado o no disponible.')

			const accesLab = {
				...req.body,
				id_access_manager_fk: user.id,
			}
			const newAccessLab = await access_lab_Scheme.create(accesLab, { transaction: t })

			const accessStatusLab = {
				id_access_lab_fk: newAccessLab.id_access_lab,
			}
			await access_lab_status_Schema.create(accessStatusLab, { transaction: t })

			await t.commit()

			const cacheKeys = await redisClient.keys(`cache:${KEY_REDIS_ACCESS_LAB}:page:*`)
			if (cacheKeys.length > 0) await redisClient.del(...cacheKeys)

			await logEvent('info', 'Acceso a laboratorio creado exitosamente.', { newAccessLab }, user.id, req)
			return sendResponse(res, 201, 'Acceso a laboratorio creado exitosamente.', newAccessLab)
		} catch (error) {
			await logEvent(
				'error',
				'Error al crear el accesso a laboratorio',
				{ error: error.message, stack: error.stack },
				user.id,
				req
			)
			await t.rollback()
			return sendResponse(res, 500)
		}
	},

	async updateAcessLab(req, res) {
		try {
			const parsedData = access_lab_zod.safeParse(req.body)
			if (!parsedData.success) return sendResponse(res, 400, parsedData.error.errors[0].message)

			const { user } = req
			const { id } = req.params
			const { id_lab_fk } = req.body

			const labFound = await laboratory_Schema.findOne({ where: { id_lab: id_lab_fk } })
			if (!labFound || !labFound.active)
				return sendResponse(res, 404, 'El laboratorio especificado no existe o no está activo.')

			const accessLabData = {
				...req.body,
				id_access_manager_fk: user.id,
			}

			await GenericCrudModel.updateRecord({
				label: KEY_REDIS_ACCESS_LAB,
				model: access_lab_Scheme,
				data: accessLabData,
				id_params: id,
				user_id: user.id,
				transaction_db_name: db_main,
				req,
				res,
				messageSuccess: 'Acceso a laboratorio actualizado exitosamente.',
				messageNotFound: 'Acceso a laboratorio no encontrado.',
				messageError: 'Error al actualizar el acceso a laboratorio.',
			})
		} catch (error) {
			return sendResponse(res, 500)
		}
	},

	async changePermissionAcessLab(req, res) {
		try {
			const parsedData = change_permission_acess_lab_zod.safeParse(req.body)
			if (!parsedData.success) return sendResponse(res, 400, parsedData.error.errors[0].message)

			const accessLabStatusFound = await access_lab_status_Schema.findByPk(req.params.id)
			if (!accessLabStatusFound) return sendResponse(res, 200, 'Estado de acceso no encontrado.')
			const labFound = await access_lab_Scheme.findOne({ where: { id_lab: req.body.id_access_lab_fk } })
			if (!labFound) return sendResponse(res, 404, 'El accesos al laboratorio no existe.')

			const accessLabData = {
				...req.body,
			}

			await GenericCrudModel.updateRecord({
				label: KEY_REDIS_ACCESS_LAB_STATUS,
				model: access_lab_status_Schema,
				data: accessLabData,
				id_params: req.params.id,
				user_id: req.user.id,
				transaction_db_name: db_main,
				req,
				res,
				messageSuccess: 'Estado de acceso a laboratorio actualizado exitosamente.',
				messageNotFound: 'Estado de acceso a laboratorio no encontrado.',
				messageError: 'Error al actualizar el estado de acceso a laboratorio.',
			})
		} catch (error) {
			return sendResponse(res, 500)
		}
	},

	async deleteAcessLab(req, res) {
		const { user } = req
		const { id } = req.params
		await GenericCrudModel.deleteRecord({
			label: KEY_REDIS_ACCESS_LAB,
			model: access_lab_Scheme,
			id_params: id,
			user_id: user.id,
			transaction_db_name: db_main,
			req,
			res,
			messageSuccess: 'Accesso a laboratorio eliminado exitosamente.',
			messageNotFound: 'Accesso a laboratorio no encontrado.',
			messageError: 'Error al eliminar accesso a laboratorio.',
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

			const access_lab = await access_lab_Scheme.findAll({
				include: [{ model: user_Schema }, { model: laboratory_Schema }, { model: access_lab_status_Schema }],
				where: {
					createdAt: {
						[Op.gte]: startUTC,
						[Op.lte]: endUTC,
					},
				},
				order: [['createdAt', 'ASC']],
			})

			if (!access_lab.length)
				return sendResponse(res, 404, 'No se encontraron registros de accesos para generar el reporte.')

			const title_rows = ['Nombres', 'Cédula', 'Laboratorio', 'Responsable', 'Estado', 'Fecha']
			const rows = access_lab.map(item => [
				item.full_name,
				item.identification_card,
				item.laboratory?.name,
				item.user?.full_name,
				traslateStatus(item.access_lab_status?.status),
				moment(item.createdAt).tz(timezone).format('DD-MM-YYYY HH:mm'),
			])

			// Contamos la cantidad de registros por estado
			const statusCounts = access_lab.reduce(
				(counts, item) => {
					const status = item.access_lab_status?.status
					if (status === 'pending') counts.pending++
					else if (status === 'approved') counts.approved++
					else if (status === 'rejected') counts.rejected++
					return counts
				},
				{ pending: 0, approved: 0, rejected: 0 }
			)

			function traslateStatus(status) {
				const traducciones = {
					pending: 'Pendiente',
					approved: 'Aprobado',
					rejected: 'Rechazado',
				}
				return traducciones[status] || 'Desconocido'
			}

			const totalRows = access_lab.length

			const infoU = await system_config_Schema.findOne()
			const institutionData = {
				name: infoU.institution_name,
				address: infoU.address,
				contact: `${infoU.contact_phone} | ${infoU.contact_email}`,
			}

			await logEvent('info', 'Se generó un reporte PDF de accesos.', null, req.user.id, req)

			const formatDate = date => (date ? moment(date).tz(timezone).format('DD-MM-YYYY') : 'No especificado')

			await generatePdfTable(
				{
					institutionData,
					title: 'Reporte de accesos.',
					header: {
						totalRows: `Total de registros: ${totalRows}`,
						dateRange: `Fecha de reporte: ${formatDate(startUTC)} - ${formatDate(endUTC)}`,
						statusCounts: `Pendientes: ${statusCounts.pending}, Aprobados: ${statusCounts.approved}, Rechazados: ${statusCounts.rejected}`,
					},
					title_rows,
					rows,
					filename: `Reporte_Accesos_${moment().tz(timezone).format('YYYY-MM-DD_HH-mm')}.pdf`,
				},
				res
			)
		} catch (error) {
			await logEvent(
				'error',
				'Error al generar el reporte PDF de accesos.',
				{ error: error.message, stack: error.stack },
				req.user.id,
				req
			)
			return sendResponse(res, 500)
		}
	},
}

export { accessLabController }
