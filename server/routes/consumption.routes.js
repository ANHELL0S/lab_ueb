import { Router } from 'express'
import { SUPERVISOR } from '../const/roles.const.js'
import { Auth } from '../middlewares/auth.middleware.js'
import { hasRole } from '../middlewares/role.middleware.js'
import { consumptionController } from '../controllers/consumption.controller.js'

const router = Router()

router.get('/all', Auth, consumptionController.getAllConsumptions)
router.get('/get-by-id/:id', Auth, consumptionController.getConsumptionsById)
router.post('/create', Auth, consumptionController.createConsumptionsReactive)
router.delete('/delete/:id', Auth, consumptionController.deleteConsumptionsReactive)
router.get('/report/pdf', Auth, consumptionController.generatePdfReport)

export default router
