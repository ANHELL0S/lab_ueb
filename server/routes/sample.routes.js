import { Router } from 'express'
import { SUPERVISOR } from '../const/roles.const.js'
import { Auth } from '../middlewares/auth.middleware.js'
import { hasRole } from '../middlewares/role.middleware.js'
import { sampleController } from '../controllers/sample.controller.js'

const router = Router()
router.get('/all', Auth, sampleController.getAllSample)
router.get('/get-by-id/:id', Auth, sampleController.getSampleById)
router.post('/create', Auth, sampleController.createSample)
router.put('/update/:id', Auth, sampleController.updateSample)
router.delete('/delete/:id', Auth, sampleController.deleteSample)
router.get('/report/pdf', Auth, sampleController.generatePdfReport)

export default router
