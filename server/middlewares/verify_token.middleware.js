import jwt from 'jsonwebtoken'
import { env } from '../config/env.config.js'
import { token_Schema, user_Schema } from '../schema/schemes.js'
import { sendResponse } from '../helpers/response_handler.helper.js'

async function verifyToken(req, res, next) {
	try {
		const userFound = await user_Schema.findByPk(req.params.id)
		if (!req.params.id || !userFound) return sendResponse(res, 404, 'Usuario no econtrado.')

		const tokenInDb = await token_Schema.findOne({
			where: {
				id_user_fk: req.params.id,
				used: false,
			},
			order: [['createdAt', 'DESC']],
		})

		if (!tokenInDb) return sendResponse(res, 401, 'Token inválido o ya utilizado.')

		try {
			const decoded = jwt.verify(tokenInDb.token, env.JWT_SECRET)

			req.userId = decoded.id_user
			next()
		} catch (err) {
			if (err instanceof jwt.TokenExpiredError) {
				return sendResponse(res, 401, 'El token ha expirado.')
			} else {
				return sendResponse(res, 500, 'Error al verificar el token.')
			}
		}
	} catch (error) {
		return sendResponse(res, 500, 'Error en la verificación del token.')
	}
}

export { verifyToken }
