import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { ToastGeneric } from '../components/Toasts/Toast'
import {
	getInfoUserRequest,
	getAllUsersRequest,
	updateAccountRequest,
	deleteUserRequest,
} from '../services/api/user.api'

export const useUserStore = () => {
	const { isAuthenticated } = useAuth()
	const [userStore, setUserStore] = React.useState([])
	const [loading, setLoading] = React.useState(false)
	const [error, setError] = React.useState(null)

	const fetchUserInfo = React.useCallback(async () => {
		if (!isAuthenticated) {
			setUserStore([])
			return
		}
		setLoading(true)
		setError(null)
		try {
			const data = await getInfoUserRequest()
			setUserStore(data)
		} catch (err) {
			setError(err)
		} finally {
			setLoading(false)
		}
	}, [isAuthenticated])

	React.useEffect(() => {
		fetchUserInfo()
	}, [fetchUserInfo])

	return { userStore, loading, error, refetch: fetchUserInfo }
}

export const useAllUsersStore = () => {
	const [users, setUsers] = useState(null)
	const [error, setError] = useState(null)
	const [loading, setLoading] = useState(true)
	const [page, setPage] = useState(1)
	const [limit, setLimit] = useState(10)
	const [search, setSearch] = useState('')

	const fetchUsers = async () => {
		setLoading(true)
		try {
			const data = await getAllUsersRequest(page, limit, search)
			setUsers(data)
		} catch (error) {
			setError(error.message)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchUsers()
	}, [page, limit, search])

	return { users, loading, error, page, limit, search, setPage, setLimit, setSearch, fetchUsers }
}

export const useUpdateAccount = () => {
	const updateAccount = async data => {
		try {
			const response = await updateAccountRequest(data)
			ToastGeneric({ type: 'success', message: response.message })
			return response
		} catch (error) {
			ToastGeneric({ type: 'error', message: error.message })
			throw error
		}
	}

	return { updateAccount }
}

export const useDeleteUser = () => {
	const updateAccount = async id => {
		try {
			const response = await deleteUserRequest(id)
			ToastGeneric({ type: 'success', message: response.message })
			return response
		} catch (error) {
			ToastGeneric({ type: 'error', message: error.message })
			throw error
		}
	}

	return { updateAccount }
}
