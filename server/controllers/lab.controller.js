import {
	rol_Schema,
	user_Schema,
	laboratory_Schema,
	user_roles_Schema,
	system_config_Schema,
	user_role_main_Schema,
	laboratory_analyst_Schema,
} from '../schema/schemes.js'
import { Op } from 'sequelize'
import moment from 'moment-timezone'
import { db_main } from '../config/db.config.js'
import { logEvent } from '../helpers/log.helper.js'
import { generatePdfTable } from '../libs/pdf_kit.lib.js'
import { GenericCrudModel } from '../models/crud.model.js'
import { TECHNICAL_ANALYST } from '../const/roles.const.js'
import { createRedisClient } from '../config/redis.config.js'
import { sendResponse } from '../helpers/response_handler.helper.js'
import { KEY_REDIS_LAB, TIME_KEY_VALID } from '../const/redis_keys.const.js'
import { assing_analyst_lab_zod, lab_zod } from '../validators/lab.validator.js'
import { PAGINATION_LIMIT, PAGINATION_PAGE } from '../const/pagination.const.js'

const labController = {
	async getAllLabs(req, res) {
		const redisClient = createRedisClient()
		const { page = PAGINATION_PAGE, limit = PAGINATION_LIMIT } = req.query
		const offset = (page - 1) * limit
		const cacheKey = `cache:${KEY_REDIS_LAB}:page:${page}:limit:${limit}`

		try {
			const cachedData = await redisClient.get(cacheKey)
			if (cachedData) {
				const parsedData = JSON.parse(cachedData)
				return sendResponse(res, 200, 'Laboratorios obtenidos exitosamente.', parsedData)
			}

			const { count, rows } = await laboratory_Schema.findAndCountAll({
				include: [
					{
						model: laboratory_analyst_Schema,
					},
				],
				limit: limit,
				offset: offset,
				subQuery: false,
				distinct: true,
				order: [['createdAt', 'DESC']],
			})

			if (rows.length === 0) return sendResponse(res, 404, 'No se encontraron laboratorios.')

			const responseData = {
				totalRecords: count,
				totalPages: Math.ceil(count / limit),
				currentPage: parseInt(page, 10),
				recordsPerPage: parseInt(limit, 10),
				labs: rows,
			}

			await redisClient.set(cacheKey, JSON.stringify(responseData), 'EX', TIME_KEY_VALID)

			return sendResponse(res, 200, 'Laboratorios obtenidos exitosamente.', responseData)
		} catch (error) {
			await logEvent('error', 'Error al obtener laboratorios.', { error: error.message, stack: error.stack }, null, req)
			return sendResponse(res, 500)
		} finally {
			redisClient.disconnect()
		}
	},

	async getLabById(req, res) {
		const { id } = req.params
		return GenericCrudModel.getRecordById({
			model: laboratory_Schema,
			keyRedis: KEY_REDIS_LAB,
			id: id,
			res,
			req,
			messageSuccess: 'Laboratorio obtenido exitosamente.',
			messageNotFound: 'Laboratorio no encontrado.',
			messageError: 'Error la obtener el laboratorio.',
		})
	},

	async createLab(req, res) {
		const t = await db_main.transaction()
		const redisClient = createRedisClient()

		const { user } = req
		const { name, id_analyst_fk } = req.body

		try {
			const parsedData = lab_zod.safeParse(req.body)
			if (!parsedData.success) return sendResponse(res, 400, parsedData.error.errors[0].message)

			const existing_name_lab = await laboratory_Schema.findOne({ where: { name: name } })
			if (existing_name_lab) return sendResponse(res, 400, 'Ya existe un laboratorio con el mismo nombre.')

			const existingUser = await user_Schema.findByPk(id_analyst_fk)
			if (!existingUser || !existingUser.active) return sendResponse(res, 404, 'El usuario no existe o no disponible.')

			const userRoleMain = await user_role_main_Schema.findOne({
				where: { id_user_fk: id_analyst_fk },
			})
			if (!userRoleMain) return sendResponse(res, 400, 'El usuario no tiene roles asignados.')

			const hasSupervisorRole = await user_roles_Schema.findOne({
				where: {
					id_user_role_intermediate_fk: userRoleMain.id_user_role_intermediate,
				},
				include: [
					{
						model: rol_Schema,
						where: { type_rol: TECHNICAL_ANALYST },
					},
				],
			})
			if (!hasSupervisorRole) return sendResponse(res, 400, 'El usuario no tiene el rol de analista asignado.')

			const labData = {
				...req.body,
			}

			const newLab = await laboratory_Schema.create(labData, { transaction: t })

			await t.commit()

			const cacheKeys = await redisClient.keys(`cache:${KEY_REDIS_LAB}:page:*`)
			if (cacheKeys.length > 0) await redisClient.del(...cacheKeys)

			await logEvent('info', 'Laboratorio creado exitosamente.', { newLab }, user.id, req)
			return sendResponse(res, 201, 'Laboratorio creado exitosamente.', newLab)
		} catch (error) {
			await logEvent(
				'error',
				'Error al crear el laboratorio.',
				{ error: error.message, stack: error.stack },
				user.id,
				req
			)
			await t.rollback()
			return sendResponse(res, 500)
		}
	},

	async assignAnalystLab(req, res) {
		const t = await db_main.transaction()
		const redisClient = createRedisClient()

		const { user } = req
		const { id_lab_fk, id_analyst_fk } = req.body

		try {
			const parsedData = assing_analyst_lab_zod.safeParse(req.body)
			if (!parsedData.success) return sendResponse(res, 400, parsedData.error.errors[0].message)

			const existingLlab = await laboratory_Schema.findByPk(id_lab_fk)
			if (!existingLlab || existingLlab.active === false)
				return sendResponse(res, 400, 'El laboratorio no existe o no disponible.')

			const existingUser = await user_Schema.findByPk(id_analyst_fk)
			if (!existingUser || !existingUser.active === false)
				return sendResponse(res, 404, 'El usuario no existe o está suspendido.')

			const userRoleMain = await user_role_main_Schema.findOne({
				where: { id_user_fk: id_analyst_fk },
			})
			if (!userRoleMain) return sendResponse(res, 400, 'El usuario no tiene roles asignados.')

			const hasSupervisorRole = await user_roles_Schema.findOne({
				where: {
					id_user_role_intermediate_fk: userRoleMain.id_user_role_intermediate,
				},
				include: [
					{
						model: rol_Schema,
						where: { type_rol: TECHNICAL_ANALYST },
					},
				],
			})
			if (!hasSupervisorRole) return sendResponse(res, 400, 'El usuario no tiene el rol de analista asignado.')

			const labData = {
				...req.body,
			}

			const newLab = await laboratory_analyst_Schema.create(labData, { transaction: t })

			await t.commit()

			const cacheKeys = await redisClient.keys(`cache:${KEY_REDIS_LAB}:page:*`)
			if (cacheKeys.length > 0) await redisClient.del(...cacheKeys)

			await logEvent('info', 'Laboratorio creado exitosamente.', { newLab }, user.id, req)
			return sendResponse(res, 201, 'Laboratorio creado exitosamente.', newLab)
		} catch (error) {
			await logEvent(
				'error',
				'Error al crear el laboratorio.',
				{ error: error.message, stack: error.stack },
				user.id,
				req
			)
			await t.rollback()
			return sendResponse(res, 500)
		}
	},

	async updateLab(req, res) {
		try {
			const parsedData = lab_zod.safeParse(req.body)
			if (!parsedData.success) return sendResponse(res, 400, parsedData.error.errors[0].message)

			const { user } = req
			const { id } = req.params
			const { name, id_supervisor_fk } = req.body

			const labFound = await laboratory_Schema.findOne({ where: { id_lab: id } })
			if (!labFound) return sendResponse(res, 404, 'Laboratorio no econtrado.')
			const existingLab = await laboratory_Schema.findOne({
				where: { name: name, id_lab: { [Op.ne]: id } },
			})
			if (existingLab) return sendResponse(res, 400, 'Ya existe otro laboratorio con este nombre.')

			const labData = {
				...req.body,
				id_supervisor_fk: id_supervisor_fk,
			}

			await GenericCrudModel.updateRecord({
				keyRedis: KEY_REDIS_LAB,
				model: laboratory_Schema,
				data: labData,
				id_params: id,
				user_id: user.id,
				transaction_db_name: db_main,
				req,
				res,
				messageSuccess: 'Laboratorio actualizado exitosamente.',
				messageNotFound: 'Laboratorio no encontrado.',
				messageError: 'Error al actualizar el laboratorio.',
			})
		} catch (error) {
			return sendResponse(res, 500)
		}
	},

	async deleteLab(req, res) {
		const { user } = req
		const { id } = req.params

		const labFound = await laboratory_Schema.findByPk(id)
		if (!labFound) return sendResponse(res, 200, 'Laboratorio no encontrado.')
		const labInUse = await laboratory_analyst_Schema.findOne({ where: { id_laboratory_analysts: labFound.id_lab } })
		if (labInUse) return sendResponse(res, 400, 'El laboratorio esta en funcionamiento.')

		await GenericCrudModel.deleteRecord({
			keyRedis: KEY_REDIS_LAB,
			model: laboratory_Schema,
			transaction_db_name: db_main,
			id_params: id,
			user_id: user.id,
			req,
			res,
			messageSuccess: 'Laboratorio eliminado exitosamente.',
			messageNotFound: 'Laboratorio no encontrado.',
			messageError: 'Error al eliminar el laboratorio.',
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

			const consumptions = await laboratory_Schema.findAll({
				where: {
					createdAt: {
						[Op.gte]: startUTC,
						[Op.lte]: endUTC,
					},
				},
				order: [['createdAt', 'ASC']],
			})

			if (!consumptions.length)
				return sendResponse(res, 404, 'No se encontraron registros de laboratorios para generar el reporte.')

			const title_rows = ['Nombre', 'Ubicación', 'Descripción', 'Estado', 'Fecha']
			const rows = consumptions.map(item => [
				item.name,
				item.location,
				item.description,
				item.active ? 'Habilitado' : 'Deshabilitado',
				moment(item.createdAt).tz(timezone).format('DD-MM-YYYY HH:mm'),
			])

			const totalRows = consumptions.length

			const infoU = await system_config_Schema.findOne()
			const institutionData = {
				name: infoU.institution_name,
				address: infoU.address,
				contact: `${infoU.contact_phone} | ${infoU.contact_email}`,
			}

			await logEvent('info', 'Se generó un reporte PDF de laboratorios.', null, req.user.id, req)

			const formatDate = date => (date ? moment(date).tz(timezone).format('DD-MM-YYYY') : 'No especificado')

			await generatePdfTable(
				{
					institutionData,
					title: 'Reporte de laboratorios.',
					header: {
						dateRange: `Fecha de reporte: ${formatDate(startUTC)} - ${formatDate(endUTC)}`,
						totalRows: `Total de registros: ${totalRows}`,
					},
					title_rows,
					rows,
					filename: `Reporte_Laboratorios_${moment().tz(timezone).format('YYYY-MM-DD_HH-mm')}.pdf`,
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

export { labController }
