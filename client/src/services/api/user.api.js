import { userInstance } from '../../config/instances'
import { currentDate } from '../../helpers/dateTimeZone.helper'

export const getInfoUserRequest = async () => {
	try {
		const response = await userInstance.get('/me')
		return response.data
	} catch (error) {
		throw new Error(`${error.response.data.message}`)
	}
}

export const getAllUsersRequest = async (page, limit, search) => {
	try {
		const response = await userInstance.get('/all', {
			params: { page, limit, search },
		})
		return response.data
	} catch (error) {
		throw new Error(`${error.response.data.message}`)
	}
}

export const createUserRequest = async data => {
	try {
		const response = await userInstance.post('/create', data)
		return response.data
	} catch (error) {
		throw new Error(`${error.response.data.message}`)
	}
}

export const updateUserRequest = async (id, data) => {
	try {
		const response = await userInstance.put(`/update/${id}`, data)
		return response.data
	} catch (error) {
		throw new Error(`${error.response.data.message}`)
	}
}

export const updateAccountRequest = async data => {
	try {
		const response = await userInstance.put('/change-info', data)
		return response.data
	} catch (error) {
		throw new Error(`${error.response.data.message}`)
	}
}

export const updatePasswordRequest = async data => {
	try {
		const response = await userInstance.put('/change-password', data)
		return response.data
	} catch (error) {
		throw new Error(`${error.response.data.message}`)
	}
}

export const changeStatusUsersRequest = async id => {
	try {
		const response = await userInstance.put(`/change-status/${id}`)
		return response.data
	} catch (error) {
		throw new Error(`${error.response.data.message}`)
	}
}

export const deleteUserRequest = async id => {
	try {
		const response = await userInstance.delete(`/delete/${id}`)
		return response.data
	} catch (error) {
		throw new Error(`${error.response.data.message}`)
	}
}

export const getReportUserRequest = async (startDate, endDate) => {
	try {
		const response = await userInstance.get('/report/pdf', {
			params: { startDate, endDate },
			responseType: 'blob',
		})

		const blob = response.data

		const link = document.createElement('a')
		link.href = URL.createObjectURL(blob)

		link.download = `Reporte_Usuarios_${currentDate}.pdf`

		link.click()
	} catch (error) {
		throw new Error(`${error.response.status}`)
	}
}
