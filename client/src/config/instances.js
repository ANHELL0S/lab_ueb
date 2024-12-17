import axios from 'axios'

import {
	LAB_API_URL,
	AUTH_API_URL,
	USER_API_URL,
	ROLE_API_URL,
	SAMPLE_API_URL,
	REACTIVE_API_URL,
} from '../helpers/constants.helper'

const createInstance = baseURL => {
	return axios.create({
		baseURL,
		withCredentials: true,
	})
}

export const labInstance = createInstance(LAB_API_URL)
export const authInstance = createInstance(AUTH_API_URL)
export const userInstance = createInstance(USER_API_URL)
export const roleInstance = createInstance(ROLE_API_URL)
export const sampleInstance = createInstance(SAMPLE_API_URL)
export const reactiveInstance = createInstance(REACTIVE_API_URL)
