import { Router } from 'express'
import { Auth } from '../middlewares/auth.middleware.js'
import { hasRole } from '../middlewares/role.middleware.js'
import { ACCESS_MANAGER, DIRECTOR, TECHNICAL_ANALYST } from '../const/roles.const.js'
import { accessLabController } from '../controllers/access_lab.controller.js'

const router = Router()

router.get('/all', Auth, accessLabController.getAllAccessLabs)
router.get('/get-by-id/:id', Auth, accessLabController.getAccessLabById)
router.post('/create', Auth, accessLabController.createAcessLab)
router.put('/update/:id', Auth, accessLabController.updateAcessLab)
router.delete('/delete/:id', Auth, accessLabController.deleteAcessLab)
router.get('/report/pdf', Auth, accessLabController.generatePdfReport)
router.post('/change-permission', Auth, accessLabController.changePermissionAcessLab)

export default router
