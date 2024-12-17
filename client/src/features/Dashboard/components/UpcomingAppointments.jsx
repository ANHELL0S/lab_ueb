import React, { useState } from 'react'
import dayjs from 'dayjs'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'

const appointments = [
	{
		date: '2024-12-02',
		time: '10:00 AM',
		title: 'Vaccination Day',
		description: 'Discounts on all vaccinations',
	},
	{
		date: '2024-12-06',
		time: '2:00 PM',
		title: 'Health Checkup',
		description: 'Routine health check-up',
	},
	{
		date: '2024-11-25',
		time: '11:00 AM',
		title: 'Adoption Fair',
		description: 'Find a forever home for pets',
	},
]

const UpcomingAppointments = () => {
	const [selectedDate, setSelectedDate] = useState(new Date())

	// Filter appointments for the selected date
	const filteredAppointments = appointments.filter(appointment => dayjs(appointment.date).isSame(selectedDate, 'day'))

	// Check if there are events on a particular date
	const isEventDate = date => appointments.some(appointment => dayjs(appointment.date).isSame(date, 'day'))

	return (
		<div className='flex items-start space-x-8'>
			{/* React Calendar */}
			<div>
				<Calendar
					onChange={setSelectedDate}
					value={selectedDate}
					className='border rounded-lg'
					tileClassName={({ date, view }) => {
						if (view === 'month' && isEventDate(date)) {
							return 'bg-green-400 text-blue-600 font-bold text-xl'
						}
						return null
					}}
				/>
			</div>

			{/* Appointment Details for the selected date */}
			<div className='w-full p-4'>
				<h3 className='text-xl font-semibold text-neutral-800'>
					Appointments on {dayjs(selectedDate).format('MMMM DD, YYYY')}
				</h3>
				{filteredAppointments.length > 0 ? (
					<ul className='mt-4 space-y-4'>
						{filteredAppointments.map((appointment, index) => (
							<li key={index} className='p-4 border rounded-lg shadow-sm'>
								<div className='flex justify-between'>
									<span className='font-medium text-neutral-700'>{appointment.title}</span>
									<span className='text-neutral-500'>{appointment.time}</span>
								</div>
								<p className='text-sm text-neutral-600'>{appointment.description}</p>
							</li>
						))}
					</ul>
				) : (
					<p className='mt-4 text-neutral-500'>No appointments for this date.</p>
				)}
			</div>
		</div>
	)
}

export { UpcomingAppointments }
