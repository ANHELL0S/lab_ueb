import { useContext } from 'react'
import Avvvatars from 'avvvatars-react'
import { useUserStore } from '../../hooks/useUser'
import { LuMoonStar, LuSun } from 'react-icons/lu'
import { Link, useLocation } from 'react-router-dom'
import ThemeContext from '../../context/ThemeContext'
import { ACCOUNT_PATH } from '../../helpers/constants.helper'

const Navbar = () => {
	const location = useLocation()
	const { userStore, loading, error } = useUserStore()
	const { theme, toggleTheme } = useContext(ThemeContext)

	const pathParts = location.pathname.split('/').filter(part => part)

	return (
		<>
			<nav className='flex items-center justify-between pb-4 text-slate-600 dark:text-gray-100'>
				<section className='mt-2 text-sm'>
					<div aria-label='breadcrumb'>
						<div className='flex items-center gap-0 font-semibold text-lg'>
							{pathParts.map((part, index) => {
								return (
									<div key={index} className='flex items-center uppercase'>
										<span>{part.replace(/-/g, ' ')}</span>
									</div>
								)
							})}
						</div>
					</div>
				</section>

				<section className='flex items-center gap-2 text-sm font-semibold'>
					<button
						onClick={toggleTheme}
						className='p-2 ml-4 border dark:border-gray-500 hover:border-slate-400 dark:hover:bg-slate-700 rounded-full transition-all duration-200 ease-linear'>
						{theme === 'dark' ? (
							<span>
								<LuSun />
							</span>
						) : (
							<span>
								<LuMoonStar />
							</span>
						)}
					</button>

					<Link
						to={ACCOUNT_PATH}
						className='flex items-center gap-2 w-full dark:border-gray-500 hover:border-slate-400 dark:hover:bg-slate-700 pr-3 transition-all ease-linear duration-200 border rounded-full'>
						<Avvvatars size={32} value={userStore?.data?.full_name} />
						<span>{userStore?.data?.full_name}</span>
					</Link>
				</section>
			</nav>
		</>
	)
}

export { Navbar }
