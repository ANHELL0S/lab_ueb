// URL API
export const BASE_URL = import.meta.env.VITE_API_BASE_URL

// API endpoints
export const AUTH_API_URL = `${BASE_URL}/auth`
export const USER_API_URL = `${BASE_URL}/user`
export const LAB_API_URL = `${BASE_URL}/lab`
export const REACTIVE_API_URL = `${BASE_URL}/reactive`
export const SAMPLE_API_URL = `${BASE_URL}/sample`
export const ROLE_API_URL = `${BASE_URL}/role`

// Authentication routes
export const LOGIN_PATH = '/'
export const REGISTER_PATH = '/crear-cuenta'
export const RECOVER_ACCOUNT_PATH = '/recuperar-contraseña'
export const PASSWORD_RESET_PATH = '/restablecer-contraseña/:token'

// Public routes
export const NOT_FOUND_PATH = '*'
export const ABOUT_PATH = '/sobre-nosotros'

// Private routes
export const DASHBOARD_PATH = '/inicio'
export const ACCOUNT_PATH = '/mi-cuenta'
export const USER_PATH = '/usuarios'
export const LAB_PATH = '/laboratorios'

// Dev
export const NAME_DEV = 'Angelo G'
export const SOCIAL_NETWORk_DEV = 'https://www.facebook.com/ANHELL0s'
