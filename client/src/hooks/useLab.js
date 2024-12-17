import { useEffect, useState } from 'react'
import { getAllLabsRequest } from '../services/api/lab.api'

export const useAllLabsStore = () => {
	const [labs, setLabs] = useState(null)
	const [error, setError] = useState(null)
	const [loading, setLoading] = useState(true)
	const [page, setPage] = useState(1)
	const [limit, setLimit] = useState(10)
	const [search, setSearch] = useState('')

	const fetchLabs = async () => {
		setLoading(true)
		try {
			const data = await getAllLabsRequest(page, limit, search)
			setLabs(data)
		} catch (error) {
			setError(error.message)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchLabs()
	}, [page, limit, search])

	return { labs, loading, error, page, limit, search, setPage, setLimit, setSearch, fetchLabs }
}
