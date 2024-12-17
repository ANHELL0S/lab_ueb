import bcrypt from 'bcrypt'
import moment from 'moment-timezone'
import { Op, Sequelize } from 'sequelize'
import { db_main } from '../config/db.config.js'
import { logEvent } from '../helpers/log.helper.js'
import { generatePdfTable } from '../libs/pdf_kit.lib.js'
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
	user_roles_Schema,
	user_role_main_Schema,
	laboratory_analyst_Schema,
	system_config_Schema,
} from '../schema/schemes.js'
import { KEY_REDIS_USER, TIME_KEY_VALID } from '../const/redis_keys.const.js'
import { PAGINATION_LIMIT, PAGINATION_PAGE } from '../const/pagination.const.js'

const userController = {
	async getAllUsers(req, res) {
		const redisClient = createRedisClient()
		const { page = PAGINATION_PAGE, limit = PAGINATION_LIMIT, search = '' } = req.query
		const offset = (page - 1) * limit
		const cacheKey = `cache:${KEY_REDIS_USER}:page:${page}:limit:${limit}:search:${search}`

		try {
			const cachedData = await redisClient.get(cacheKey)
			if (cachedData) {
				const parsedData = JSON.parse(cachedData)
				return sendResponse(res, 200, 'Usuarios obtenidos exitosamente.', parsedData)
			}

			const whereCondition = search
				? Sequelize.literal(
						`concat("full_name", "identification_card", "email") ILIKE '%${search}%' AND id_user != '${req.user.id}'`
				  )
				: { id_user: { [Sequelize.Op.ne]: req.user.id } }

			const countQuery = await user_Schema.count({
				where: whereCondition,
			})

			const { rows } = await user_Schema.findAndCountAll({
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
				where: whereCondition,
				limit: limit,
				offset: offset,
				subQuery: false,
				distinct: true,
				order: [['createdAt', 'DESC']],
			})

			if (rows.length === 0 || rows.length === null) return sendResponse(res, 200, 'No se encontraron usuarios.')

			const responseData = {
				totalRecords: countQuery,
				totalPages: countQuery > 0 ? Math.ceil(countQuery / limit) : 1,
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
			if (!parsedData.success) return sendResponse(res, 400, parsedData.error.errors[0].message)

			const { user } = req
			const { id } = req.params
			const { email, phone, identification_card } = req.body

			const user_found = await user_Schema.findByPk(id)
			if (!user_found) return sendResponse(res, 404, 'Usuario no encontrado')

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

			await checkDuplicate('email', email, 'Ya existe un usuario con este correo.')
			await checkDuplicate('phone', phone, 'Ya existe un usuario con este teléfono.')
			await checkDuplicate(
				'identification_card',
				identification_card,
				'Ya existe un usuario con este número de cédula.'
			)

			const userData = { ...req.body }

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
			return sendResponse(res, 500)
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

	async changeStatusUser(req, res) {
		try {
			const user_found = await user_Schema.findByPk(req.params.id)
			if (!user_found) return sendResponse(res, 404, 'Usuario no encontrado.')

			const userData = {
				active: !user_found.active,
			}

			await GenericCrudModel.updateRecord({
				keyRedis: KEY_REDIS_USER,
				model: user_Schema,
				data: userData,
				id_params: req.params.id,
				user_id: req.user.id,
				transaction_db_name: db_main,
				req,
				res,
				messageSuccess: 'Cambio de estado actualizado exitosamente.',
				messageNotFound: 'Usuario no encontrado.',
				messageError: 'Error al cambiar el estado del usuario.',
			})
		} catch (error) {
			console.log(error)
			sendResponse(res, 500)
		}
	},

	async deleteUser(req, res) {
		try {
			const userfound = await user_Schema.findByPk(req.params.id)
			if (!userfound) return sendResponse(res, 404, 'El usuario no fue encontrado.')

			const userIsLab = await laboratory_analyst_Schema.findOne({ where: { id_analyst_fk: userfound.id_user } })
			if (userIsLab)
				return sendResponse(res, 400, 'No se puede eliminar este usuario porque está asignado a un laboratorio.')

			await GenericCrudModel.deleteRecord({
				keyRedis: KEY_REDIS_USER,
				model: user_Schema,
				id_params: req.params.id,
				user_id: req.user.id,
				transaction_db_name: db_main,
				req,
				res,
				messageSuccess: 'Usuario eliminado exitosamente.',
				messageNotFound: 'Usuario no encontrado.',
				messageError: 'Hubo un error al intentar eliminar el usuario.',
			})
		} catch (error) {
			sendResponse(res, 500)
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

			const usersFound = await user_Schema.findAll({
				where: {
					createdAt: {
						[Op.gte]: startUTC,
						[Op.lte]: endUTC,
					},
				},
				order: [['createdAt', 'ASC']],
			})

			if (!usersFound.length) return sendResponse(res, 404, 'No se encontraron usuarios para generar el reporte.')

			const title_rows = ['Nombres', 'Email', 'Teléfono', 'Cédula', 'Código', 'Estado']
			const rows = usersFound.map(item => [
				item?.full_name || '',
				item?.email || '',
				item?.phone || '',
				item?.identification_card || '',
				item?.code || '',
				item?.active ? 'Habilitado' : 'Deshabilitado',
			])

			const totalRows = usersFound.length

			const infoU = await system_config_Schema.findOne()
			const institutionData = {
				name: infoU.institution_name,
				address: infoU.address,
				contact: `${infoU.contact_phone} | ${infoU.contact_email}`,
			}

			await logEvent('info', 'Se generó un reporte PDF de usuarios.', null, req.user.id, req)

			const formatDate = date => (date ? moment(date).tz(timezone).format('DD-MM-YYYY') : 'No especificado')

			const pdfFilename = `Reporte_Usuarios_${moment().tz(timezone).format('YYYY-MM-DD_HH-mm')}.pdf`
			await generatePdfTable(
				{
					institutionData,
					title: 'Reporte de usuarios.',
					header: {
						dateRange: `Fecha de reporte: ${formatDate(startUTC)} - ${formatDate(endUTC)}`,
						totalRows: `Total de registros: ${totalRows}`,
					},
					title_rows,
					rows,
					filename: pdfFilename,
				},
				res
			)
		} catch (error) {
			await logEvent(
				'error',
				'Error al generar el reporte PDF de usuarios.',
				{ error: error.message, stack: error.stack },
				req.user.id,
				req
			)
			return sendResponse(res, 500)
		}
	},
}

export { userController }
