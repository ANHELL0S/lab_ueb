import { sampleInstance } from '../../config/instances'

export const getAllSamplesRequest = async () => {
	try {
		const response = await sampleInstance.get('/all')
		return response.data
	} catch (error) {
		throw new Error(`${error.response.data.message}`)
	}
}

export const getSampleByIdRequest = async id => {
	try {
		const response = await sampleInstance.get(`/get-by-id/${id}`)
		return response.data
	} catch (error) {
		throw new Error(`${error.response?.data?.message || 'An error occurred'}`)
	}
}
