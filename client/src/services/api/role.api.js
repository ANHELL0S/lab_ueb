import { roleInstance } from '../../config/instances'

export const getAllRolesRequest = async () => {
	try {
		const response = await roleInstance.get('/all')
		return response.data
	} catch (error) {
		throw new Error(`${error.response.data.message}`)
	}
}

export const getRoleByIdRequest = async id => {
	try {
		const response = await roleInstance.get(`/get-by-id/${id}`)
		return response.data
	} catch (error) {
		throw new Error(`${error.response?.data?.message || 'An error occurred'}`)
	}
}
