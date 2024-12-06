import { Op } from 'sequelize'
import { db_main } from '../config/db.config.js'
import { logEvent } from '../helpers/log.helper.js'
import { GenericCrudModel } from '../models/crud.model.js'
import { createRedisClient } from '../config/redis.config.js'
import { sendResponse } from '../helpers/response_handler.helper.js'
import { access_lab_zod } from '../validators/access_lab.validator.js'
import { PAGINATION_LIMIT, PAGINATION_PAGE } from '../const/pagination.const.js'
import { KEY_REDIS_ACCESS_LAB, TIME_KEY_VALID } from '../const/redis_keys.const.js'
import { access_lab_Scheme, access_lab_status_Schema, laboratory_Schema } from '../schema/schemes.js'

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
				labs: rows,
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
}

export { accessLabController }
