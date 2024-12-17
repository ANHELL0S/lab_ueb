import { Line } from 'react-chartjs-2'
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const ChartCard = () => {
	const data = {
		labels: ['Nov 1', 'Nov 2', 'Nov 3', 'Nov 4', 'Nov 5', 'Nov 6'],
		datasets: [
			{
				label: 'Revenue',
				data: [40, 10, 80, 10, 7, 55, 64],
				borderColor: '#8884d8',
				borderWidth: 3,
				fill: false,
			},
		],
	}

	const options = {
		responsive: true,
		scales: {
			x: {
				title: {
					display: true,
					text: 'Date',
				},
			},
			y: {
				title: {
					display: true,
					text: 'Revenue',
				},
				min: 0,
			},
		},
		plugins: {
			tooltip: {
				mode: 'nearest',
				intersect: false,
			},
		},
	}

	return (
		<>
			<Line data={data} options={options} />
		</>
	)
}

export { ChartCard }
