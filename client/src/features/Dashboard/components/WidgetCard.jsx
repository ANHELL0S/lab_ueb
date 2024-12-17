const WidgetCard = ({ icon: Icon, title, value, color }) => {
	return (
		<>
			<div className='p-4 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center space-x-4 transform transition-all ease-in-out duration-300'>
				<div className={`p-3 rounded-full ${color} text-white`}>
					<Icon size={24} />
				</div>
				<div>
					<p className='text-2xl font-bold text-slate-700 dark:text-slate-100'>{value}</p>
					<h4 className='text-base font-medium text-slate-500 dark:text-slate-300'>{title}</h4>
				</div>
			</div>
		</>
	)
}

export { WidgetCard }
