import { Router } from 'express'
import { SUPERVISOR } from '../const/roles.const.js'
import { Auth } from '../middlewares/auth.middleware.js'
import { hasRole } from '../middlewares/role.middleware.js'
import { consumptionController } from '../controllers/consumption.controller.js'

const router = Router()

router.get('/', Auth, consumptionController.getAllConsumptions)
router.get('/:id', Auth, consumptionController.getConsumptionsById)
router.post('/', Auth, consumptionController.createConsumptionsReactive)
router.delete('/', Auth, consumptionController.deleteConsumptionsReactive)

export default router
