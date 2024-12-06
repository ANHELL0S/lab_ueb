import { Router } from 'express'
import { SUPERVISOR } from '../const/roles.const.js'
import { Auth } from '../middlewares/auth.middleware.js'
import { hasRole } from '../middlewares/role.middleware.js'
import { labController } from '../controllers/lab.controller.js'

const router = Router()
router.get('/', Auth, labController.getAllLabs)
router.get('/search', Auth, labController.searchLabs) //FIXME: Poner antes de de una ruta con params o da error XD
router.get('/:id', Auth, labController.getLabById)

router.post('/', Auth, hasRole([SUPERVISOR]), labController.createLab)
router.put('/:id', Auth, hasRole([SUPERVISOR]), labController.updateLab)
router.delete('/:id', Auth, hasRole([SUPERVISOR]), labController.deleteLab)
router.post('/assing-analyst', Auth, hasRole([SUPERVISOR]), labController.assignAnalystLab)

export default router
