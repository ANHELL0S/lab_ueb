import { Router } from 'express'
import { SUPERVISOR } from '../const/roles.const.js'
import { Auth } from '../middlewares/auth.middleware.js'
import { hasRole } from '../middlewares/role.middleware.js'
import { reactiveController } from '../controllers/reactive.controller.js'

const router = Router()

router.get('/all', Auth, reactiveController.getAllReactives)
router.get('/get-by-id/:id', Auth, reactiveController.getReactiveById)
router.post('/create', Auth, reactiveController.createReactive)
router.put('/update/:id', Auth, reactiveController.updateReactive)
router.delete('/delete/:id', Auth, reactiveController.deleteReactive)
router.get('/report/pdf', Auth, reactiveController.generatePdfReport)

export default router
