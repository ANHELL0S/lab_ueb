import { useEffect, useState } from 'react'
import { getAllSamplesRequest } from '../services/api/sample.api'

const useAllSamplesStore = () => {
	const [samples, setSample] = useState([])
	const [error, setError] = useState(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const fetchData = async () => {
			try {
				const data = await getAllSamplesRequest()
				setSample(data)
			} catch (error) {
				setError(error.message)
			} finally {
				setLoading(false)
			}
		}

		fetchData()
	}, [])

	return { samples, loading, error, setSample }
}

export { useAllSamplesStore }
