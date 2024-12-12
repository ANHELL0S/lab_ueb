import bcrypt from 'bcrypt'
import { Op } from 'sequelize'
import { db_main } from '../config/db.config.js'
import { logEvent } from '../helpers/log.helper.js'
import { hashPassword } from '../helpers/bcrypt.helper.js'
import { GenericCrudModel } from '../models/crud.model.js'
import { user_schema } from '../validators/user.validator.js'
import { createRedisClient } from '../config/redis.config.js'
import { send_email_with_info_sigup } from '../libs/mailer.lib.js'
import { sendResponse } from '../helpers/response_handler.helper.js'
import { user_password_schema } from '../validators/user.validator.js'
import {
	rol_Schema,
	user_Schema,
	laboratory_Schema,
	user_roles_Schema,
	user_role_main_Schema,
} from '../schema/schemes.js'
import { KEY_REDIS_USER, TIME_KEY_VALID } from '../const/redis_keys.const.js'
import { PAGINATION_LIMIT, PAGINATION_PAGE } from '../const/pagination.const.js'

const userController = {
	async getAllUsers(req, res) {
		const redisClient = createRedisClient()
		const { page = PAGINATION_PAGE, limit = PAGINATION_LIMIT, full_name = '', identification_card = '' } = req.query
		const offset = (page - 1) * limit
		const cacheKey = `cache:${KEY_REDIS_USER}:page:${page}:limit:${limit}:full_name:${full_name}:identification_card:${identification_card}`

		try {
			const cachedData = await redisClient.get(cacheKey)
			if (cachedData) {
				const parsedData = JSON.parse(cachedData)
				return sendResponse(res, 200, 'Usuarios obtenidos exitosamente.', parsedData)
			}

			const { count, rows } = await user_Schema.findAndCountAll({
				attributes: { exclude: ['password'] },
				include: [
					{
						model: user_role_main_Schema,
						attributes: { exclude: ['createdAt', 'updatedAt'] },
						include: [
							{
								model: user_roles_Schema,
								attributes: { exclude: ['createdAt', 'updatedAt', 'id_user_role_intermediate_fk'] },
								include: [
									{
										model: rol_Schema,
										attributes: { exclude: ['createdAt', 'updatedAt'] },
									},
								],
							},
						],
					},
				],
				where: {
					...(full_name && { full_name: { [Op.iLike]: `%${full_name}%` } }),
					...(identification_card && { identification_card: { [Op.iLike]: `%${identification_card}%` } }),
				},
				limit: limit,
				offset: offset,
				subQuery: false,
				distinct: true, //FIXME: Esto asegura que los reactivos no se cuenten más de una vez
				order: [['createdAt', 'DESC']],
			})

			if (rows.length === 0) return sendResponse(res, 404, 'No se encontraron usuarios.')

			const responseData = {
				totalRecords: count,
				totalPages: Math.ceil(count / limit),
				currentPage: parseInt(page, 10),
				recordsPerPage: parseInt(limit, 10),
				users: rows,
			}

			await redisClient.set(cacheKey, JSON.stringify(responseData), 'EX', TIME_KEY_VALID)

			return sendResponse(res, 200, 'Usuarios obtenidos exitosamente.', responseData)
		} catch (error) {
			await logEvent('error', 'Error al obtener los usuarios.', { error: error.message, stack: error.stack }, null, req)
			return sendResponse(res, 500)
		} finally {
			redisClient.disconnect()
		}
	},

	async getUserById(req, res) {
		const { id } = req.params
		return GenericCrudModel.getRecordById({
			keyRedis: KEY_REDIS_USER,
			model: user_Schema,
			id: id,
			res,
			req,
			messageSuccess: 'Usuario obtenido exitosamente.',
			messageNotFound: 'Usuario no encontrado.',
			messageError: 'Error la obtener el usuario.',
		})
	},

	async getMeUser(req, res) {
		try {
			const userFound = await user_Schema.findByPk(req.user.id)
			if (!userFound) return sendResponse(res, 404, 'Usuario no encontrado.')
			return sendResponse(res, 200, 'Usuario obtendio exitosamente.', userFound)
		} catch (error) {
			await logEvent(
				'error',
				'Error al obtenre el usuario.',
				{ error: error.message, stack: error.stack },
				req.user.id,
				req
			)
			return sendResponse(res, 500)
		}
	},

	async createUser(req, res) {
		const t = await db_main.transaction()
		const redisClient = createRedisClient()

		const { user } = req
		const { full_name, email, phone, identification_card } = req.body

		try {
			const parsedData = user_schema.safeParse(req.body)
			if (!parsedData.success) return sendResponse(res, 400, parsedData.error.errors[0].message)

			// Verificar duplicados considerando solo registros activos
			const checkDuplicate = async (field, value, errorMessage) => {
				const existingUser = await user_Schema.findOne({
					where: {
						[field]: value,
					},
					paranoid: false,
				})

				if (existingUser) return sendResponse(res, 400, errorMessage)
			}
			// Validar campos únicos (email, phone, identification_card)
			const emailError = await checkDuplicate('email', email, 'Ya existe un usuario con este correo.')
			if (emailError) return

			const phoneError = await checkDuplicate('phone', phone, 'Ya existe un usuario con este teléfono.')
			if (phoneError) return

			const idCardError = await checkDuplicate(
				'identification_card',
				identification_card,
				'Ya existe un usuario con este número de cédula.'
			)
			if (idCardError) return

			const hash_password = await hashPassword(identification_card)
			const userData = {
				...req.body,
				password: hash_password,
			}
			const createUser = await user_Schema.create(userData, { transaction: t })
			if (createUser.success) await send_email_with_info_sigup(full_name, email, identification_card)

			await t.commit()

			const cacheKeys = await redisClient.keys(`cache:${KEY_REDIS_USER}:page:*`)
			if (cacheKeys.length > 0) await redisClient.del(...cacheKeys)

			await logEvent('info', 'Usuario creado exitosamente.', { createUser }, user.id, req)
			return sendResponse(res, 201, 'Usuario creado exitosamente.', createUser)
		} catch (error) {
			await logEvent('error', 'Error al crear el usuario.', { error: error.message, stack: error.stack }, user.id, req)
			await t.rollback()
			return sendResponse(res, 500)
		}
	},

	async updateUser(req, res) {
		try {
			const parsedData = user_schema.safeParse(req.body)
			if (!parsedData.success) {
				return sendResponse(res, 400, parsedData.error.errors[0].message)
			}

			const { user } = req
			const { id } = req.params
			const { id_rol_fk, email, phone, identification_card } = req.body

			const user_found = await user_Schema.findByPk(id)
			if (!user_found) return sendResponse(res, 404, 'Usuario no encontrado')

			const role_exis = await rol_Schema.findByPk(id_rol_fk)
			if (!role_exis) return sendResponse(res, 404, 'Rol no encontrado')

			// Check for unique email, phone, and identification card
			const checkDuplicate = async (field, value, errorMessage) => {
				if (value !== user_found[field]) {
					const existingClient = await user_Schema.findOne({
						where: {
							[field]: value,
							id_user: { [Op.ne]: user_found.id_user },
						},
					})
					if (existingClient) return sendResponse(res, 400, errorMessage)
				}
			}

			// Validate unique fields (email, phone, identification_card)
			await checkDuplicate('email', email, 'Ya existe un usuario con este correo.')
			await checkDuplicate('phone', phone, 'Ya existe un usuario con este teléfono.')
			await checkDuplicate(
				'identification_card',
				identification_card,
				'Ya existe un usuario con este número de cédula.'
			)

			// Prepare user data for update
			const userData = { ...req.body }

			// Update the user record using a generic CRUD model
			await GenericCrudModel.updateRecord({
				keyRedis: KEY_REDIS_USER,
				model: user_Schema,
				data: userData,
				id_params: id,
				user_id: user.id,
				transaction_db_name: db_main,
				req,
				res,
				messageSuccess: 'Usuario actualizado exitosamente.',
				messageNotFound: 'Usuario no encontrado.',
				messageError: 'Error al actualizar el usuario.',
			})
		} catch (error) {
			return sendResponse(res, 500, 'Error inesperado al actualizar el usuario.')
		}
	},

	async updatePassword(req, res) {
		const t = await db_main.transaction()
		try {
			const parsedData = user_password_schema.safeParse(req.body)
			if (!parsedData.success) return sendResponse(res, 400, parsedData.error.errors[0].message)

			const { user } = req
			const { currentPassword, newPassword, confirmPassword } = req.body

			const user_found = await user_Schema.findByPk(user.id, { transaction: t })
			if (!user_found) return sendResponse(res, 404, 'Usuario no encontrado.')

			bcrypt.compare(currentPassword, user_found.password, async (err, match) => {
				if (err) {
					await t.rollback()
					return sendResponse(res, 500)
				}
				if (match) {
					if (newPassword === confirmPassword) {
						const hashedPassword = await hashPassword(newPassword)

						const userData = {
							...req.body,
							password: hashedPassword,
						}
						await user_Schema.update(userData, {
							where: { id_user: user.id },
							transaction: t,
						})

						await t.commit()
						await logEvent(
							'success',
							'Contraseña actualizada exitosamente.',
							{ newPassword: newPassword },
							user.id,
							req
						)
						return sendResponse(res, 200, 'Contraseña actualizada exitosamente.')
					} else {
						await t.rollback()
						return sendResponse(res, 400, 'La nueva contraseña no coincide.')
					}
				} else {
					await t.rollback()
					return sendResponse(res, 401, 'Contraseña actual inválida.')
				}
			})
		} catch (error) {
			await logEvent(
				'error',
				'Error inesperado durante el cambio de contraseña',
				{ error: error.message, stack: error.stack },
				user.id,
				req
			)
			await t.rollback()
			return sendResponse(res, 500)
		}
	},

	async deleteUser(req, res) {
		const { user } = req
		const { id } = req.params

		const userfound = await user_Schema.findByPk(id)
		if (!userfound) return sendResponse(res, 404, 'Usuario no encontrado.')

		const userIsLab = await laboratory_Schema.findOne({ where: { id_analyst_fk: userfound.id_user } })
		if (userIsLab) return sendResponse(res, 400, 'El usuario esta a cargo de un laboratorio.')

		await GenericCrudModel.deleteRecord({
			keyRedis: KEY_REDIS_USER,
			model: user_Schema,
			id_params: id,
			user_id: user.id,
			transaction_db_name: db_main,
			req,
			res,
			messageSuccess: 'Usuario eliminado exitosamente.',
			messageNotFound: 'Usuario no encontrado.',
			messageError: 'Error al eliminar el usuario.',
		})
	},
}

export { userController }
