import express from 'express'
import labRoutes from './routes/lab.routes.js'
import authRoutes from './routes/auth.routes.js'
import userRoutes from './routes/user.routes.js'
import accesslabRoutes from './routes/access_lab.routes.js'
import roleRoutes from './routes/role.routes.js'
import reactiveRoutes from './routes/reactive.routes.js'
import consumptionRoutes from './routes/consumption.routes.js'
import requestEeactiveRoutes from './routes/request_reactive.routes.js'

const router = express.Router()

// Endpoints public
router.use('/auth/', authRoutes)

// Endpoints privates
router.use('/user/', userRoutes)
router.use('/role/', roleRoutes)
router.use('/lab/', labRoutes)
router.use('/access-lab/', accesslabRoutes)
router.use('/reactive/', reactiveRoutes)
router.use('/consumption/', consumptionRoutes)
router.use('/request-reactive/', requestEeactiveRoutes)

export default router
