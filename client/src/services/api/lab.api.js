import { labInstance } from '../../config/instances'

export const getAllLabsRequest = async (page, limit, search) => {
	try {
		const response = await labInstance.get('/all', {
			params: { page, limit, search },
		})
		return response.data
	} catch (error) {
		throw new Error(`${error.response.data.message}`)
	}
}

export const getLabByIdRequest = async id => {
	try {
		const response = await labInstance.get(`/get-by-id/${id}`)
		return response.data
	} catch (error) {
		throw new Error(`${error.response.data.message}`)
	}
}

export const createLabRequest = async data => {
	try {
		const response = await labInstance.post('/create', data)
		return response.data
	} catch (error) {
		throw new Error(`${error.response.data.message}`)
	}
}

export const updateLabRequest = async (id, data) => {
	try {
		const response = await labInstance.put(`/update/${id}`, data)
		return response.data
	} catch (error) {
		throw new Error(`${error.response.data.message}`)
	}
}

export const createAssignLabAnalystRequest = async data => {
	try {
		const response = await labInstance.post('/assing-analyst', data)
		return response.data
	} catch (error) {
		throw new Error(`${error.response.data.message}`)
	}
}

export const updateAssignLabAnalystRequest = async (id, data) => {
	try {
		const response = await labInstance.put(`/assing-analyst/${id}`, data)
		return response.data
	} catch (error) {
		throw new Error(`${error.response.data.message}`)
	}
}

export const changeStatusLabRequest = async id => {
	try {
		const response = await labInstance.put(`/change-status/${id}`)
		return response.data
	} catch (error) {
		throw new Error(`${error.response.data.message}`)
	}
}

export const deleteLabRequest = async id => {
	try {
		const response = await labInstance.delete(`/delete/${id}`)
		return response.data
	} catch (error) {
		throw new Error(`${error.response.data.message}`)
	}
}
