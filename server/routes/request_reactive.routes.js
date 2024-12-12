import { Router } from 'express'
import { SUPERVISOR } from '../const/roles.const.js'
import { Auth } from '../middlewares/auth.middleware.js'
import { hasRole } from '../middlewares/role.middleware.js'
import { requestReactiveController } from '../controllers/request_reactive.controller.js'

const router = Router()

router.get('/all', Auth, requestReactiveController.getAllRequestReactives)
router.get('/get-by-id/:id', Auth, requestReactiveController.getRequestReactiveById)
router.post('/create', Auth, requestReactiveController.createRequestReactive)
router.put('/update/:id', Auth, requestReactiveController.updateRequestReactive)
router.delete('/delete/:id', Auth, requestReactiveController.deleteRequestReactive)

export default router
