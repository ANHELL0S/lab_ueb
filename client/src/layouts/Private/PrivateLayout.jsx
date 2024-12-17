import { Navbar } from '../../sections/Navbar/Navbar'
import { Sidebar } from '../../sections/Sidebar/Sidebar'

const PrivateLayout = ({ children }) => {
	return (
		<>
			<div className='flex bg-slate-100 dark:bg-gray-900 max-h-screen flex-col lg:flex-row md:flex-row sm:flex-row'>
				<Sidebar />
				<div className='flex-1 m-2 rounded-lg border bg-slate-50 dark:bg-gray-800 dark:border-gray-700 px-6 py-4 flex flex-col'>
					<Navbar />
					<div className='overflow-y-auto'>{children}</div>
				</div>
			</div>
		</>
	)
}

export { PrivateLayout }
