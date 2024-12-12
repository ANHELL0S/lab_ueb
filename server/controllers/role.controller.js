import { rol_Schema } from '../schema/schemes.js'
import { logEvent } from '../helpers/log.helper.js'
import { GenericCrudModel } from '../models/crud.model.js'
import { createRedisClient } from '../config/redis.config.js'
import { sendResponse } from '../helpers/response_handler.helper.js'
import { KEY_REDIS_ROLE, TIME_KEY_VALID } from '../const/redis_keys.const.js'
import { PAGINATION_LIMIT, PAGINATION_PAGE } from '../const/pagination.const.js'

const roleController = {
	async getAllRoleUsers(req, res) {
		const redisClient = createRedisClient()
		const { page = PAGINATION_PAGE, limit = PAGINATION_LIMIT } = req.query
		const offset = (page - 1) * limit
		const cacheKey = `cache:${KEY_REDIS_ROLE}:page:${page}:limit:${limit}`

		try {
			const cachedData = await redisClient.get(cacheKey)
			if (cachedData) {
				const parsedData = JSON.parse(cachedData)
				return sendResponse(res, 200, 'Roles obtenidos exitosamente.', parsedData)
			}

			const { count, rows } = await rol_Schema.findAndCountAll({
				offset: offset,
				limit: limit,
				subQuery: false,
				distinct: true,
				order: [['createdAt', 'DESC']],
			})

			if (rows.length === 0) return sendResponse(res, 200, 'No hay más roles disponibles.')

			const responseData = {
				totalRecords: count,
				totalPages: Math.ceil(count / limit),
				currentPage: page,
				recordsPerPage: limit,
				roles: rows,
			}

			await redisClient.set(cacheKey, JSON.stringify(responseData), 'EX', TIME_KEY_VALID)

			return sendResponse(res, 200, 'Roles obtenidos exitosamente.', responseData)
		} catch (error) {
			await logEvent('error', 'Error al obtener los roles.', { error: error.message, stack: error.stack }, null, req)
			return sendResponse(res, 500)
		} finally {
			redisClient.disconnect()
		}
	},

	async getRoleById(req, res) {
		const { id } = req.params
		return GenericCrudModel.getRecordById({
			keyRedis: KEY_REDIS_ROLE,
			model: rol_Schema,
			id: id,
			res,
			req,
			messageSuccess: 'Rol obtenido exitosamente.',
			messageNotFound: 'Rol no encontrado.',
			messageError: 'Error la obtener el rol.',
		})
	},
}

export { roleController }
