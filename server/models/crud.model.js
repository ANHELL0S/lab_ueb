import { createRedisClient } from '../config/redis.config.js'
import { TIME_KEY_VALID } from '../const/redis_keys.const.js'
import { logEvent } from '../helpers/log.helper.js'
import { sendResponse } from '../helpers/response_handler.helper.js'

class GenericCrudModel {
	// sin redis
	/*
	static async getAllRecord({ model, label, res, req }) {
		try {
			const record = await model.findAll({ order: [['createdAt', 'DESC']] })
			if (record.length === 0) return sendResponse(res, 404, `${label} no encontrados.`)
			return sendResponse(res, 200, `${label} obtenidos exitosamente.`, record)
		} catch (error) {
			await logEvent(
				'error',
				`Error inesperado al obtener todos los ${label.lowerCase()}.`,
				{ error: error.message, stack: error.stack },
				null,
				req
			)
			return sendResponse(res, 500)
		}
	}
	*/

	// con redis - sin paginacion
	/*
	static async getAllRecord({ model, label, res, req }) {
		const redisClient = createRedisClient()
		const cacheKey = `cache:${label}:all`

		try {
			const cachedData = await redisClient.get(cacheKey)
			if (cachedData) {
				const parsedData = JSON.parse(cachedData)
				//console.log(`>> Datos obtenidos desde Redis para la clave: ${cacheKey}`)
				return sendResponse(res, 200, `${label} obtenidos exitosamente desde el caché.`, parsedData)
			}

			const record = await model.findAll({ order: [['createdAt', 'DESC']] })
			if (record.length === 0) return sendResponse(res, 404, `${label} no encontrados.`)

			// Almacenar los datos en Redis
			await redisClient.set(cacheKey, JSON.stringify(record), 'EX', 60)
			//console.log(`>> Datos de ${label} almacenados en Redis con la clave: ${cacheKey} (TTL: 1 minuto)`)

			return sendResponse(res, 200, `${label} obtenidos exitosamente.`, record)
		} catch (error) {
			await logEvent(
				'error',
				`Error inesperado al obtener todos los ${label}.`,
				{ error: error.message, stack: error.stack },
				null,
				req
			)
			return sendResponse(res, 500)
		} finally {
			redisClient.disconnect()
		}
	}
	*/

	static async getAllRecord({ model, keyRedis, res, req, messageSuccess, messageNotFound, messageError }) {
		const redisClient = createRedisClient()
		const { page = 1, limit = 10 } = req.query
		const offset = (page - 1) * limit
		const cacheKey = `cache:${keyRedis}:page:${page}:limit:${limit}`

		try {
			// Recuperar datos de la caché
			const cachedData = await redisClient.get(cacheKey)
			if (cachedData) {
				const parsedData = JSON.parse(cachedData)
				return sendResponse(res, 200, `${messageSuccess}`, parsedData)
			}

			// Obtener los datos paginados desde la base de datos
			const { count, rows } = await model.findAndCountAll({
				order: [['createdAt', 'DESC']],
				limit: parseInt(limit, 10),
				offset: parseInt(offset, 10),
			})

			if (rows.length === 0) return sendResponse(res, 404, `${messageNotFound}`)

			const responseData = {
				totalRecords: count,
				totalPages: Math.ceil(count / limit),
				currentPage: parseInt(page, 10),
				recordsPerPage: parseInt(limit, 10),
				data: {
					[keyRedis]: rows,
				},
			}

			// Almacenar los datos paginados en Redis
			await redisClient.set(cacheKey, JSON.stringify(responseData), 'EX', TIME_KEY_VALID)
			return sendResponse(res, 200, `${messageSuccess}`, responseData)
		} catch (error) {
			await logEvent('error', `${messageError}`, { error: error.message, stack: error.stack }, null, req)
			return sendResponse(res, 500)
		} finally {
			redisClient.disconnect()
		}
	}

	/*
	static async getRecordById({ id, model, label, res, req }) {
		try {
			const record = await model.findByPk(id)
			if (!record) return sendResponse(res, 404, `${label} no econtrado.`)
			return sendResponse(res, 200, `${label} obtenido exitosamente.`, record)
		} catch (error) {
			await logEvent(
				'error',
				`Error inesperado al buscar el registro con ID: ${id}.`,
				{ error: error.message, stack: error.stack },
				null,
				req
			)
			return sendResponse(res, 500)
		}
	}
	*/

	static async getRecordById({ id, model, keyRedis, res, req, messageSuccess, messageNotFound, messageError }) {
		const redisClient = createRedisClient()
		const cacheKey = `cache:${keyRedis}:${id}`

		try {
			const cachedData = await redisClient.get(cacheKey)
			if (cachedData) {
				const parsedData = JSON.parse(cachedData)
				//console.log(`>> Datos obtenidos desde Redis para la clave: ${cacheKey}`)
				return sendResponse(res, 200, `${messageSuccess}`, parsedData)
			}

			// Si no están en el caché, recuperar el dato del modelo
			const record = await model.findByPk(id)
			if (!record) return sendResponse(res, 404, `${messageNotFound}`)

			await redisClient.set(cacheKey, JSON.stringify(record), 'EX', TIME_KEY_VALID)
			//console.log(`>> Datos de ${keyRedis} con ID ${id} almacenados en Redis con la clave: ${cacheKey} (TTL: 1 minuto)`)

			return sendResponse(res, 200, `${messageSuccess}`, record)
		} catch (error) {
			await logEvent('error', `${messageError} Con ID: ${id}.`, { error: error.message, stack: error.stack }, null, req)
			return sendResponse(res, 500)
		} finally {
			redisClient.disconnect()
		}
	}

	/*
	static async createRecord({ label, model, data, transaction_db_name, user_id, req, res }) {
		const t = await transaction_db_name.transaction()
		try {
			const newRecord = await model.create(data, { transaction: t })
			await logEvent('info', `${label} creado exitosamente.`, { newRecord }, user_id, req)
			await t.commit()
			return sendResponse(res, 201, `${label} creado exitosamente.`, newRecord)
		} catch (error) {
			await logEvent(
				'error',
				`Error inesperado al crear el ${label}.`,
				{ error: error.message, stack: error.stack },
				user_id,
				req
			)
			await t.rollback()
			return sendResponse(res, 500)
		}
	}
	*/

	static async createRecord({
		keyRedis,
		model,
		data,
		transaction_db_name,
		user_id,
		req,
		res,
		messageSuccess,
		messageError,
	}) {
		const t = await transaction_db_name.transaction()
		const redisClient = createRedisClient()

		try {
			// Crear el nuevo registro en la base de datos
			const newRecord = await model.create(data, { transaction: t })

			// Buscar y eliminar claves específicas relacionadas (páginas, etc.)
			const cacheKeys = await redisClient.keys(`cache:${keyRedis}:page:*`)
			if (cacheKeys.length > 0) {
				await redisClient.del(...cacheKeys) // Elimina todas las claves relacionadas
				//console.log(`>> Caché de páginas invalidado para el modelo: ${keyRedis}`)
			}
			// Registrar el nuevo evento de creación
			await logEvent('info', `${messageSuccess}`, { newRecord }, user_id, req)

			// Commit de la transacción
			await t.commit()

			return sendResponse(res, 201, `${messageSuccess}`, newRecord)
		} catch (error) {
			await logEvent('error', `${messageError}.`, { error: error.message, stack: error.stack }, user_id, req)
			await t.rollback()
			return sendResponse(res, 500)
		} finally {
			redisClient.disconnect()
		}
	}

	// sin redis
	/*
	static async updateRecord({ label, model, data, id_params, user_id, transaction_db_name, req, res }) {
		const t = await transaction_db_name.transaction()
		try {
			const record = await model.findByPk(id_params, { transaction: t })
			if (!record) return sendResponse(res, 404, `${label} no encontrado.`)

			await record.update(data, { transaction: t })
			await logEvent('info', `${label} actualizado exitosamente.`, { updatedRecord: record }, user_id, req)

			await t.commit()
			return sendResponse(res, 200, `${label} actualizado exitosamente.`, record)
		} catch (error) {
			await logEvent(
				'error',
				`Error inesperado al actualizar el ${label}.`,
				{ error: error.message, stack: error.stack },
				user_id,
				req
			)
			await t.rollback()
			return sendResponse(res, 500)
		}
	}
	*/

	static async updateRecord({
		keyRedis,
		model,
		data,
		id_params,
		user_id,
		transaction_db_name,
		req,
		res,
		messageSuccess,
		messageNotFound,
		messageError,
	}) {
		const t = await transaction_db_name.transaction()
		const redisClient = createRedisClient()

		try {
			const record = await model.findByPk(id_params, { transaction: t })
			if (!record) return sendResponse(res, 404, `${messageNotFound}`)

			await record.update(data, { transaction: t })

			const cacheKeys = await redisClient.keys(`cache:${keyRedis}:page:*`)
			if (cacheKeys.length > 0) {
				await redisClient.del(...cacheKeys)
			}

			await logEvent('info', `${messageSuccess}`, { updatedRecord: record }, user_id, req)
			await t.commit()

			return sendResponse(res, 200, `${messageSuccess}`, record)
		} catch (error) {
			await logEvent(
				'error',
				`${messageError} Con ID: ${id_params}.`,
				{ error: error.message, stack: error.stack },
				user_id,
				req
			)
			await t.rollback()
			return sendResponse(res, 500)
		} finally {
			redisClient.disconnect()
		}
	}

	static async deleteRecord({
		keyRedis,
		model,
		id_params,
		user_id,
		transaction_db_name,
		req,
		res,
		messageSuccess,
		messageNotFound,
		messageError,
	}) {
		const t = await transaction_db_name.transaction()
		const redisClient = createRedisClient()

		try {
			const record = await model.findByPk(id_params, { transaction: t })
			let before_record = record
			if (!record) return sendResponse(res, 404, `${messageNotFound}.`)

			await record.destroy({ transaction: t })

			// Buscar y eliminar claves específicas relacionadas (páginas, etc.)
			const cacheKeys = await redisClient.keys(`cache:${keyRedis}:page:*`)
			if (cacheKeys.length > 0) {
				await redisClient.del(...cacheKeys) // Elimina todas las claves relacionadas
				//console.log(`>> Caché de páginas invalidado para el modelo: ${keyRedis}`)
			}

			await logEvent('info', `${messageSuccess}`, { deletedRecord: before_record }, user_id, req)
			await t.commit()
			return sendResponse(res, 200, `${messageSuccess}`, before_record)
		} catch (error) {
			console.log(error)
			await logEvent(
				'error',
				`${messageError} Con  ID: ${id_params}.`,
				{ error: error.message, stack: error.stack },
				user_id,
				req
			)
			await t.rollback()
			return sendResponse(res, 500)
		}
	}
}

export { GenericCrudModel }
