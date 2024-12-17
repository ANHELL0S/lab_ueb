import { Router } from 'express'
import { GENERAL_ADMIN, SUPERVISOR } from '../const/roles.const.js'
import { Auth } from '../middlewares/auth.middleware.js'
import { hasRole } from '../middlewares/role.middleware.js'
import { roleController } from '../controllers/role.controller.js'

const router = Router()

router.get('/all', Auth, roleController.getAllRoleUsers)
router.get('/:id', Auth, roleController.getRoleById)

export default router
