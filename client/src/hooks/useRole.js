import { useEffect, useState } from 'react'
import { getAllRolesRequest } from '../services/api/role.api'

export const useAllRolesStore = () => {
	const [roles, setRoles] = useState(null)
	const [error, setError] = useState(null)
	const [loading, setLoading] = useState(true)
	const [page, setPage] = useState(1)
	const [limit, setLimit] = useState(10)

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true)
			try {
				const data = await getAllRolesRequest(page, limit)
				setRoles(data)
			} catch (error) {
				setError(error.message)
			} finally {
				setLoading(false)
			}
		}

		fetchData()
	}, [page, limit])

	return { roles, loading, error, page, limit, setPage, setLimit }
}
