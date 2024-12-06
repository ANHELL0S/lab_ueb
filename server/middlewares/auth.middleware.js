import jwt from 'jsonwebtoken'
import { env } from '../config/env.config.js'
import { sendResponse } from '../helpers/response_handler.helper.js'

export const Auth = (req, res, next) => {
	try {
		const { accessToken } = req.cookies
		if (!accessToken) return sendResponse(res, 401, 'Autenticación requerida. Por favor inicia sesión.')
		jwt.verify(accessToken, env.JWT_SECRET, (error, user) => {
			if (error) return sendResponse(res, 401, 'Tu sesión actual ha expirado, por favor vuelve a iniciar sesión.')
			req.user = user
			next()
		})
	} catch (error) {
		return sendResponse(res, 500)
	}
}
