import { LuDog, LuCat, LuAccessibility, LuReplaceAll } from 'react-icons/lu'

const AppointmentCard = ({ petName, petType, raza, time, description }) => {
	const Icon = petType === 'Dog' ? LuAccessibility : LuReplaceAll

	return (
		<>
			<li className='p-4 border dark:border-gray-600 rounded-lg flex items-center space-x-4'>
				<div className='flex flex-col gap-4 w-full dark:text-gray-200 text-slate-500'>
					<div className='flex justify-between'>
						<div className='space-x-2'>
							<span className='text-slate-50 font-medium text-sm bg-yellow-500 dark:bg-yellow-500/50 px-2 rounded'>
								{petType}
							</span>
							<span className='font-medium text-sm bg-slate-100 dark:bg-gray-500 px-2 rounded'>{description}</span>
						</div>
						<p className='text-sm'>{time}</p>
					</div>

					<div className='flex gap-4'>
						<div className='p-3 bg-blue-100 text-blue-500 rounded-full'>
							<Icon size={24} />
						</div>
						<div>
							<p className='text-sm text-slate-500'>{petName}</p>
							<span className='text-slate-500'>{raza}</span>
						</div>
					</div>
				</div>
			</li>
		</>
	)
}

export { AppointmentCard }
