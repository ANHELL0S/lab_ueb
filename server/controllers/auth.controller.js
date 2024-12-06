import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.config.js'
import { db_main } from '../config/db.config.js'
import { logEvent } from '../helpers/log.helper.js'
import { sendCodeResetPassword } from '../libs/mailer.lib.js'
import { comparePassword } from '../helpers/bcrypt.helper.js'
import { sendResponse } from '../helpers/response_handler.helper.js'
import { reset_password_schema } from '../validators/auth.validator.js'
import { isTokenExpired } from '../helpers/verify_healt_token.helpers.js'
import { createAccessToken, createRefreshToken } from '../libs/jwt.lib.js'
import { convertJwtRefreshToMilliseconds } from '../helpers/token.helper.js'
import { rol_Schema, token_Schema, user_role_main_Schema, user_roles_Schema, user_Schema } from '../schema/schemes.js'

const authController = {
	async signin(req, res) {
		try {
			const { email, password } = req.body
			if (!email || !password) return sendResponse(res, 400, 'Por favor, ingresa tus credenciales.')

			const userFound = await user_Schema.findOne({
				where: { email },
				include: [
					{
						model: user_role_main_Schema,
					},
				],
			})

			// Verificiones
			if (!userFound) return sendResponse(res, 401, 'Credenciales inválidas.')
			const isPasswordValid = await comparePassword(password, userFound.password)
			if (!isPasswordValid) return sendResponse(res, 401, 'Credenciales inválidas.')
			if (!userFound.active) return sendResponse(res, 403, 'Tu cuenta está suspendida.')

			// Obtener el id_user_role_intermediate directamente desde user_role_main_Schema
			const userRoleIntermediate = userFound.user_roles_intermediate
			if (!userRoleIntermediate) return sendResponse(res, 403, 'El usuario no tiene roles asignados.')

			// Ahora obtener los roles desde user_roles_Schema usando el id_user_role_intermediate
			const userRoles = await user_roles_Schema.findAll({
				where: { id_user_role_intermediate_fk: userRoleIntermediate.id_user_role_intermediate },
				include: [
					{
						model: rol_Schema,
					},
				],
			})

			// Obtener solo los IDs de los roles
			const roleIds = userRoles.map(userRole => userRole.id_rol_fk)
			if (roleIds.length === 0) return sendResponse(res, 404, 'No se encontraron roles del usuario.')

			// Generar tokens
			const accessToken = await createAccessToken({ id: userFound.id_user, roles: roleIds })
			const refreshToken = await createRefreshToken({ id: userFound.id_user })

			// Configurar las cookies para los tokens
			const jwtExpiredValue = env.JWT_EXPIRED
			const expiredTokenMaxAge = convertJwtRefreshToMilliseconds(jwtExpiredValue)

			res.cookie('accessToken', accessToken, {
				httpOnly: true, // No accesible desde JavaScript
				secure: env.NODE_ENV === 'production',
				sameSite: env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
				path: '/',
				maxAge: expiredTokenMaxAge,
			})

			const jwtRefreshValue = env.JWT_REFRESH
			const refreshTokenMaxAge = convertJwtRefreshToMilliseconds(jwtRefreshValue)

			res.cookie('refreshToken', refreshToken, {
				httpOnly: true, // No accesible desde JavaScript
				secure: env.NODE_ENV === 'production',
				sameSite: env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
				path: '/',
				maxAge: refreshTokenMaxAge,
			})

			await logEvent('info', 'Inicio de sesión exitoso', { id: userFound.id_user }, userFound.id_user, req)

			return sendResponse(res, 200, 'Inicio de sesión exitoso.', {
				user: {
					id: userFound.id_user,
					roles: roleIds,
				},
				accessToken,
			})
		} catch (error) {
			await logEvent(
				'error',
				'Error inesperado durante el inicio de sesión',
				{ error: error.message, stack: error.stack },
				null,
				req
			)
			return sendResponse(res, 500, 'Error interno del servidor')
		}
	},

	async logout(req, res) {
		try {
			res.clearCookie('accessToken', { path: '/' })
			res.clearCookie('refreshToken', { path: '/' })
			await logEvent('info', 'Sesion cerrada exitosamente', { id: req.user.id }, req.user.id, req)
			return sendResponse(res, 200, 'Sesión cerrada exitosamente.')
		} catch (error) {
			await logEvent(
				'error',
				'Error durante el cierre de sesión',
				{ error: error.message, stack: error.stack },
				null,
				req
			)
			return sendResponse(res, 500)
		}
	},

	async refreshToken(req, res) {
		try {
			const { refreshToken } = req.cookies
			if (!refreshToken) return sendResponse(res, 401, 'No hay token, inicia sesión nuevamente.')

			const data = jwt.verify(refreshToken, env.JWT_SECRET)

			const userFound = await user_Schema.findByPk(data.id)
			if (!userFound) return sendResponse(res, 404, 'Usuario no encontrado.')

			const accessToken = await createAccessToken({ id: userFound.id_user })
			const jwtRefreshValue = env.JWT_REFRESH
			const expiredTokenMaxAge = convertJwtRefreshToMilliseconds(jwtRefreshValue)

			res.cookie('accessToken', accessToken, {
				httpOnly: true, // Not access js
				secure: env.NODE_ENV === 'production',
				sameSite: env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
				path: '/',
				maxAge: expiredTokenMaxAge,
			})

			res.clearCookie('refreshToken', { path: '/' })

			await logEvent('info', 'Sesión extendida con éxito', { userId: userFound.id_user }, userFound.id_user, req)
			return sendResponse(res, 200, 'Sesión extendida con éxito.', { accessToken: accessToken })
		} catch (error) {
			await logEvent(
				'error',
				'Error al intentar refrescar el token',
				{ error: error.message, stack: error.stack },
				null,
				req
			)
			return sendResponse(res, 500)
		}
	},

	async requestPasswordReset(req, res) {
		try {
			const { email } = req.body

			if (!email) return sendResponse(res, 401, 'Por favor, ingresa tu email actual.')

			const user = await user_Schema.findOne({ where: { email } })
			if (!user) return sendResponse(res, 404, 'Email no encontrado.')

			const token = jwt.sign({ id: user.id_user }, env.JWT_SECRET, { expiresIn: '30m' })

			await token_Schema.create({
				id_user_fk: user.id_user,
				token: token,
			})

			const send_data = await sendCodeResetPassword(email, token)

			await logEvent(
				'info',
				'Correo de restablecimiento de contraseña enviado',
				{ link: send_data, token: token },
				user.id_user,
				req
			)
			sendResponse(res, 200, 'Correo enviado exitosamente.', { link: send_data, token: token })
		} catch (error) {
			await logEvent(
				'error',
				'Error en la solicitud de restablecimiento de contraseña',
				{ error: error.message, stack: error.stack },
				null,
				req
			)
			return sendResponse(res, 500)
		}
	},

	async resetPassword(req, res) {
		const t = await db_main.transaction()
		try {
			const parsedData = reset_password_schema.safeParse(req.body)
			if (!parsedData.success) return sendResponse(res, 400, parsedData.error.errors[0].message)

			const { token } = req.body
			const { id } = req.params

			if (isTokenExpired(token)) return sendResponse(res, 401, 'El código OTP ha expirado.')

			const decoded = jwt.verify(token, env.JWT_SECRET)
			if (decoded.id !== id) return sendResponse(res, 403, 'No autorizado para realizar esta acción.')

			const user = await user_Schema.findByPk(id, { transaction: t })
			if (!user) return sendResponse(res, 404, 'Usuario no encontrado.')

			const hashedPassword = await bcrypt.hash(newPassword, 10)
			if (!hashedPassword) throw new Error('Error al generar la nueva contraseña.')

			const userData = {
				password: hashedPassword,
			}

			await user_Schema.update(userData, {
				where: { id_user: id },
				transaction: t,
			})

			await token_Schema.update(
				{ used: true },
				{
					where: { token: token },
					transaction: t,
				}
			)

			await logEvent('info', 'Contraseña restablecida correctamente.', null, id, req)
			await t.commit()
			return sendResponse(res, 200, 'Contraseña restablecida correctamente.')
		} catch (error) {
			await logEvent(
				'error',
				'Error al restablecer la contraseña',
				{ error: error.message, stack: error.stack },
				null,
				req
			)
			await t.rollback()
			return sendResponse(res, 500)
		}
	},
}

export { authController }
