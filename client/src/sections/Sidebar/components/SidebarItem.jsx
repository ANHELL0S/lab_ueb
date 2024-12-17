import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const SidebarItem = ({ path, icon: Icon, label, isCollapsed }) => {
	const location = useLocation()
	const [isHovered, setIsHovered] = useState(false)

	const isActive =
		location.pathname === path
			? 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-50'
			: 'hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700'

	return (
		<Link
			to={path}
			className={`flex items-center gap-2 p-1.5 text-sm font-medium rounded-md w-full cursor-pointer text-slate-500  dark:text-slate-400 ${isActive}`}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}>
			<Icon size={22} />
			{!isCollapsed && <span>{label}</span>}

			{isCollapsed && isHovered && (
				<div className='absolute bg-slate-500 font-medium text-slate-50 text-sm py-1 px-2 rounded-md ml-10'>
					{label}
				</div>
			)}
		</Link>
	)
}

export { SidebarItem }
