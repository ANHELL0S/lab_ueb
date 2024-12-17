import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
	BiMoney,
	BiWallet,
	BiLockAlt,
	BiCreditCard,
	BiMenuAltLeft,
	BiChevronLeft,
	BiCalendarCheck,
	BiCard,
	BiUserCheck,
} from 'react-icons/bi'
import path_logo from '../../assets/images/logo.png'
import { SidebarItem } from './components/SidebarItem'
import path_logo_collapsed from '../../assets/images/Logo_xs.png'
import { DASHBOARD_PATH, LAB_PATH, USER_PATH } from '../../helpers/constants.helper'
import {
	LuSettings2,
	LuBarChartBig,
	LuCalendarHeart,
	LuUser,
	LuInspect,
	LuPanelBottom,
	LuPanelBottomClose,
} from 'react-icons/lu'

const Sidebar = () => {
	const [isCollapsed, setIsCollapsed] = useState(false)
	const [isMobileOpen, setIsMobileOpen] = useState(false)
	const toggleSidebarCollapse = () => setIsCollapsed(!isCollapsed)

	return (
		<>
			{/* Botón para abrir/cerrar sidebar en móvil */}
			<button
				className='fixed md:hidden bottom-4 right-4 z-10 hover:bg-slate-700 border-slate-600 transition-all duration-200 ease-in-out bg-slate-600 border p-2 rounded-full text-slate-50'
				onClick={() => setIsMobileOpen(!isMobileOpen)}>
				<BiMenuAltLeft size={24} />
			</button>

			<nav
				className={`fixed md:static top-0 left-0 bg-slate-100 dark:bg-gray-900 z-50 h-screen transition-transform ease-in-out duration-300 ${isMobileOpen ? 'translate-x-0 border-r md:border-none lg:border-none shadow-xl md:shadow-none lg:shadow-none' : '-translate-x-full'} ${isCollapsed ? 'w-16' : 'w-56'} md:translate-x-0 flex flex-col`}>
				{/* Header del sidebar */}
				<div className='flex items-center justify-between p-2'>
					<Link to={DASHBOARD_PATH} className='flex items-center text-slate-700 rounded-md'>
						<h1 className='text-slate-50 p-1 flex items-center justify-center'>
							<img src={path_logo} alt='Logo' className='w-20 object-cover' />
						</h1>
					</Link>

					{isCollapsed && <img src={path_logo_collapsed} alt='Logo' className='w-10 h-10 object-cover' />}

					{/* Botón para colapsar/expandir el sidebar */}
					{!isMobileOpen && (
						<button
							className={`text-slate-50 hover:bg-slate-600 bg-slate-500 rounded-full ml-1.5 p-0.5 transition-all ease-in-out duration-200 ${
								isCollapsed ? '-rotate-180' : 'rotate-0'
							}`}
							onClick={toggleSidebarCollapse}>
							<BiChevronLeft size={24} />
						</button>
					)}
				</div>

				{/* Scrollable content */}
				<div className='flex-grow overflow-y-auto pr-3'>
					<div className='pl-4 flex flex-col gap-2 pt-4'>
						{!isCollapsed ? (
							<p className='text-sm font-medium text-slate-500/70 dark:text-slate-400'>Usuarios</p>
						) : (
							<hr className='pb-4' />
						)}
						<ul className='space-y-2 flex flex-col justify-center items-start'>
							<SidebarItem path={USER_PATH} icon={LuUser} label='Usuarios' isCollapsed={isCollapsed} />
						</ul>
					</div>

					<div className='pl-4 flex flex-col gap-2 pt-6'>
						{!isCollapsed ? (
							<p className='text-sm font-medium text-slate-500/70 dark:text-slate-400'>Laboratios</p>
						) : (
							<hr className='pb-4' />
						)}
						<ul className='space-y-2 flex flex-col justify-center items-start'>
							<SidebarItem path={LAB_PATH} icon={BiCard} label='Laboratorios' isCollapsed={isCollapsed} />
						</ul>
						<ul className='space-y-2 flex flex-col justify-center items-start'>
							<SidebarItem path={LAB_PATH} icon={BiUserCheck} label='Accesos' isCollapsed={isCollapsed} />
						</ul>
					</div>

					{/* Sección de Facturación */}
					<div className='pl-4 flex flex-col gap-2 pt-6'>
						{!isCollapsed ? (
							<p className='text-sm font-medium text-slate-500/70'>Facturación</p>
						) : (
							<hr className='pb-4' />
						)}
						<ul className='space-y-2 flex flex-col justify-center items-start'>
							<SidebarItem path='/facturas' icon={BiCreditCard} label='Facturas' isCollapsed={isCollapsed} />
							<SidebarItem path='/pagos' icon={BiMoney} label='Pagos' isCollapsed={isCollapsed} />
						</ul>
					</div>

					{/* Sección de Configuración */}
					<div className='pl-4 flex flex-col gap-2 pt-6'>
						{!isCollapsed ? (
							<p className='text-sm font-medium text-slate-500/70'>Configuración</p>
						) : (
							<hr className='pb-4' />
						)}
						<ul className='space-y-2 flex flex-col justify-center items-start'>
							<SidebarItem
								path='/configuracion'
								icon={LuSettings2}
								label='Configuración General'
								isCollapsed={isCollapsed}
							/>
							<SidebarItem path='/roles' icon={BiLockAlt} label='Roles y Permisos' isCollapsed={isCollapsed} />
						</ul>
					</div>

					{/* Sección de Informes y Reportes */}
					<div className='pl-4 flex flex-col gap-2 pt-6'>
						{!isCollapsed ? (
							<p className='text-sm font-medium text-slate-500/70'>Informes y Reportes</p>
						) : (
							<hr className='pb-4' />
						)}
						<ul className='space-y-2 flex flex-col justify-center items-start'>
							<SidebarItem path='/informes/ventas' icon={LuBarChartBig} label='General' isCollapsed={isCollapsed} />
							<SidebarItem path='/informes/pagos' icon={BiWallet} label='Pagos' isCollapsed={isCollapsed} />
						</ul>
					</div>
				</div>
			</nav>
		</>
	)
}

export { Sidebar }
