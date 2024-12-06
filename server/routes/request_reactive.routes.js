import { Router } from 'express'
import { SUPERVISOR } from '../const/roles.const.js'
import { Auth } from '../middlewares/auth.middleware.js'
import { hasRole } from '../middlewares/role.middleware.js'
import { requestReactiveController } from '../controllers/request_reactive.controller.js'

const router = Router()

router.get('/', Auth, requestReactiveController.getAllRequestReactives)
router.get('/:id', Auth, requestReactiveController.getReactiveById)
router.post('/', Auth, requestReactiveController.createRequestReactive)
router.put('/:id', Auth, requestReactiveController.updateReactive)
router.delete('/:id', Auth, requestReactiveController.deleteReactive)

export default router
