import path from 'path'
import YAML from 'yamljs'
import swaggerUi from 'swagger-ui-express'
import { env } from '../config/env.config.js'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

const swaggerDocument = YAML.load(path.join(__dirname, '../services/swagger/api-docs.yaml'))

const setupSwagger = app => {
	if (env.NODE_ENV !== 'production') app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
}

export { setupSwagger }
