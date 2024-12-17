import { Router } from 'express'
import { GENERAL_ADMIN, SUPERVISOR } from '../const/roles.const.js'
import { Auth } from '../middlewares/auth.middleware.js'
import { hasRole } from '../middlewares/role.middleware.js'
import { labController } from '../controllers/lab.controller.js'

const router = Router()
router.get('/all', Auth, labController.getAllLabs)
router.get('/get-by-id/:id', Auth, labController.getLabById)
router.post('/create', Auth, hasRole([SUPERVISOR, GENERAL_ADMIN]), labController.createLab)
router.put('/update/:id', Auth, hasRole([SUPERVISOR, GENERAL_ADMIN]), labController.updateLab)
router.put('/change-status/:id', Auth, hasRole([SUPERVISOR, GENERAL_ADMIN]), labController.changeStatusLab)
router.delete('/delete/:id', Auth, hasRole([SUPERVISOR, GENERAL_ADMIN]), labController.deleteLab)
router.post('/assing-analyst/:id', Auth, hasRole([SUPERVISOR, GENERAL_ADMIN]), labController.assignAnalystLab)
router.get('/report/pdf', Auth, hasRole([SUPERVISOR, GENERAL_ADMIN]), labController.generatePdfReport)

export default router
