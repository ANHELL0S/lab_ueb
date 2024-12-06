import { Router } from 'express'
import { SUPERVISOR } from '../const/roles.const.js'
import { Auth } from '../middlewares/auth.middleware.js'
import { hasRole } from '../middlewares/role.middleware.js'
import { reactiveController } from '../controllers/reactive.controller.js'

const router = Router()

router.get('/', Auth, reactiveController.getAllReactives)
router.get('/:id', Auth, reactiveController.getReactiveById)
router.post('/', Auth, reactiveController.createReactive)
router.put('/:id', Auth, reactiveController.updateReactive)
router.delete('/:id', Auth, reactiveController.deleteReactive)

export default router
