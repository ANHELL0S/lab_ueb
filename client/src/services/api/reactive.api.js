import { reactiveInstance } from '../../config/instances'

export const getAllReactivesRequest = async () => {
	try {
		const response = await reactiveInstance.get('/all')
		return response.data
	} catch (error) {
		throw new Error(`${error.response.data.message}`)
	}
}

export const getReactiveByIdRequest = async id => {
	try {
		const response = await reactiveInstance.get(`/get-by-id/${id}`)
		return response.data
	} catch (error) {
		throw new Error(`${error.response?.data?.message || 'An error occurred'}`)
	}
}
