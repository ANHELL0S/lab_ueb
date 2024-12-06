import { Router } from 'express'
import { Auth } from '../middlewares/auth.middleware.js'
import { hasRole } from '../middlewares/role.middleware.js'
import { ACCESS_MANAGER, DIRECTOR, TECHNICAL_ANALYST } from '../const/roles.const.js'
import { accessLabController } from '../controllers/access_lab.controller.js'

const router = Router()

router.get('/', Auth, accessLabController.getAllAccessLabs)
router.get('/:id', Auth, accessLabController.getAccessLabById)
router.post('/', Auth, accessLabController.createAcessLab)
router.put('/:id', Auth, accessLabController.updateAcessLab)
router.delete('/:id', Auth, accessLabController.deleteAcessLab)

export default router
