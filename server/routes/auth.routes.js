import { Router } from 'express'
import { Auth } from '../middlewares/auth.middleware.js'
import { authController } from '../controllers/auth.controller.js'
import { limiterRequest } from '../middlewares/rateLimit.middleware.js'
import { verifyToken } from '../middlewares/verify_token.middleware.js'

const router = Router()

router.post('/signin', limiterRequest({ maxRequests: 5, time: '1m' }), authController.signin)
router.post('/logout', Auth, authController.logout)
router.post('/refresh-token', authController.refreshToken)
router.post(
	'/request-password-reset',
	limiterRequest({ maxRequests: 3, time: '1m' }),
	authController.requestPasswordReset
)
router.put('/reset-password/:id', verifyToken, authController.resetPassword)

export default router
