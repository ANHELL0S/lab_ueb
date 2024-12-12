import { Router } from 'express'
import { SUPERVISOR } from '../const/roles.const.js'
import { Auth } from '../middlewares/auth.middleware.js'
import { hasRole } from '../middlewares/role.middleware.js'
import { paymentController } from '../controllers/payment.controller.js'

const router = Router()
router.get('/all', Auth, paymentController.getAllPayment)
router.get('/get-by-id/:id', Auth, paymentController.getPaymentById)
router.post('/create', Auth, paymentController.createPayment)
router.get('/report/pdf', Auth, paymentController.generatePdfReport)

export default router
