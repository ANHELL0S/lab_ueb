import { env } from '../config/env.config.js'

const isProduction = () => env.NODE_ENV === 'production'

export { isProduction }
