import { Router } from 'express'
import { GENERAL_ADMIN } from '../const/roles.const.js'
import { Auth } from '../middlewares/auth.middleware.js'
import { hasRole } from '../middlewares/role.middleware.js'
import { userController } from '../controllers/user.controller.js'
import { limiterRequest } from '../middlewares/rateLimit.middleware.js'

const router = Router()

router.get('/', Auth, userController.getAllUsers)
router.get('/:id', Auth, userController.getUserById)
router.put('/update-password', limiterRequest({ maxRequests: 3, time: '1m' }), Auth, userController.updatePassword)
router.put('/update-info/:id', Auth, userController.updateUser)

router.post('/', Auth, userController.createUser)
router.delete('/:id', Auth, userController.deleteUser)

export default router
