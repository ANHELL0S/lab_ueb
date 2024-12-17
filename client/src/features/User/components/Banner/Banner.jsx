export const Banner = ({ type, messages = [] }) => {
	const bannerStyles = {
		error: 'border-red-500 bg-red-100 text-red-600 dark:text-red-500 dark:border-red-700 dark:bg-red-800/50',
		warning:
			'border-yellow-500 bg-yellow-100 text-yellow-600 dark:text-amber-500 dark:border-amber-700 dark:bg-amber-800/50',
		info: 'border-blue-500 bg-blue-100 text-blue-600 dark:text-cyan-500 dark:border-cyan-700 dark:bg-cyan-800/50',
		success: 'border-green-500 bg-green-100 text-green-600 dark:text-teal-500 dark:border-teal-700 dark:bg-teal-800/50',
	}

	const currentBannerStyle = bannerStyles[type] || bannerStyles.info

	return (
		<div className='grid grid-cols-1 gap-x-4 gap-y-3 font-medium'>
			<div className='text-xs flex flex-col gap-y-1 font-semibold text-sky-500'>
				<div className={`flex flex-col gap-y-2 border-l-4 ${currentBannerStyle} p-2 font-normal`}>
					{messages.map((message, index) => (
						<span key={index}>{message}</span>
					))}
				</div>
			</div>
		</div>
	)
}
