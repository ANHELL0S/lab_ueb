import { useEffect, useState } from 'react'
import { getAllReactivesRequest } from '../services/api/reactive.api'

const useAllReactivesStore = () => {
	const [reactives, setReactives] = useState([])
	const [error, setError] = useState(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const fetchData = async () => {
			try {
				const data = await getAllReactivesRequest()
				setReactives(data)
			} catch (error) {
				setError(error.message)
			} finally {
				setLoading(false)
			}
		}

		fetchData()
	}, [])

	return { reactives, loading, error, setReactives }
}

export { useAllReactivesStore }
