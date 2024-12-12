import { Router } from 'express'
import { SUPERVISOR } from '../const/roles.const.js'
import { Auth } from '../middlewares/auth.middleware.js'
import { hasRole } from '../middlewares/role.middleware.js'
import { kardexController } from '../controllers/kardex.controller.js'

const router = Router()

router.get('/all', Auth, kardexController.getAllKardex)
router.get('/get-by-id/:id', Auth, kardexController.getKardexById)
router.get('/report/pdf', Auth, kardexController.generatePdfReport)

export default router
