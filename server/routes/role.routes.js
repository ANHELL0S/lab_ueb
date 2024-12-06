import { Router } from 'express'
import { SUPERVISOR } from '../const/roles.const.js'
import { Auth } from '../middlewares/auth.middleware.js'
import { hasRole } from '../middlewares/role.middleware.js'
import { roleController } from '../controllers/role.controller.js'

const router = Router()

router.get('/', Auth, roleController.getAllRoleUsers)

export default router
