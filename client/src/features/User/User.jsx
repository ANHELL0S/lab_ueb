import { useState, useEffect } from 'react'
import { UserForm } from './components/Form/UserForm'
import { useAllUsersStore } from '../../hooks/useUser'
import { Button } from '../../components/Button/Button'
import { NotFound } from '../../components/Banner/NotFound'
import { ReportModal } from './components/Modal/ModalReport'
import { SpinnerLoading } from '../../components/Loaders/SpinnerLoading'
import { BiDotsVertical, BiEditAlt, BiReset, BiSearch, BiX } from 'react-icons/bi'
import { ModalActive, ModalDelete, ModalDesactive } from './components/Form/UserCRUD'
import { LuChevronLeft, LuChevronRight, LuFile, LuInfo, LuPlus, LuSearch, LuTrash2 } from 'react-icons/lu'

const UserSection = () => {
	const { users, loading, error, page, limit, search, setPage, setLimit, setSearch, fetchUsers } = useAllUsersStore()

	const userData = users?.data?.users
	const totalRecords = users?.data?.totalRecords
	const totalPages = Math.ceil(totalRecords / limit)

	useEffect(() => {
		if (page > totalPages) setPage(1)
	}, [page, totalPages, setPage])

	const handlePageChange = newPage => {
		if (newPage >= 1 && newPage <= totalPages) setPage(newPage)
	}

	const handleLimitChange = event => {
		setLimit(parseInt(event?.target?.value, 10))
		setPage(1)
	}

	const refreshUserList = () => fetchUsers()

	useEffect(() => {
		if (search === '') setSearch('')
	}, [search, setSearch])

	if (error) {
		return (
			<div className='flex justify-center items-center h-full max-h-screen text-center'>
				<NotFound
					icon={<LuInfo size={50} />}
					title='Error inesperado'
					description='Lo sentimos, se ha producido un error. Por favor, vuelve más tarde.'
				/>
			</div>
		)
	}

	const [selected, setSelected] = useState(null)
	const [showReportModal, setShowReportModal] = useState(false)
	const [showCreateModal, setShowCreateModal] = useState(false)
	const [showDeleteModal, setShowDeleteModal] = useState(false)
	const [showActiveModal, setShowActiveModal] = useState(false)
	const [showEditModal, setShowEditModal] = useState(false)
	const [showDesactiveModal, setShowDesactiveModal] = useState(false)

	// CREATE USER
	const handleCloseCreateModal = () => setShowCreateModal(false)
	const toggleCreateModal = () => setShowCreateModal(!showCreateModal)

	// UPDATE USER
	const handleEdit = user => {
		setSelected(user)
		setShowEditModal(true)
		setDropdownVisible(null)
	}
	const toggleEditModal = () => setShowEditModal(!showEditModal)

	// DELETE USER
	const handleDelete = user => {
		setSelected(user)
		setShowDeleteModal(true)
		setDropdownVisible(null)
	}
	const toggleDeleteModal = () => setShowDeleteModal(!showDeleteModal)
	const handleDeleteCallback = async () => fetchUsers()

	// DESACTIVE USER
	const handleDesactive = user => {
		setSelected(user)
		setShowDesactiveModal(true)
		setDropdownVisible(null)
	}
	const toggleDesactiveModal = () => setShowDesactiveModal(!showDesactiveModal)
	const handleDesactiveCallback = async () => fetchUsers()

	// ACTIVE USER
	const handleActive = user => {
		setSelected(user)
		setShowActiveModal(true)
		setDropdownVisible(null)
	}
	const toggleActiveModal = () => setShowActiveModal(!showActiveModal)
	const handleActiveCallback = async () => fetchUsers()

	const toggleReportModal = () => setShowReportModal(!showReportModal)

	const [dropdownVisible, setDropdownVisible] = useState(null)

	const toggleDropdown = id => {
		setDropdownVisible(dropdownVisible === id ? null : id)
	}

	return (
		<>
			<main className='mr-4 ml-0.5'>
				<div className='justify-between flex items-center flex-wrap lg:flex-nowrap'>
					<div className='flex items-center gap-4 flex-wrap lg:flex-nowrap md:py-4 sm:py-4 py-4'>
						<div className='relative w-full'>
							<input
								type='text'
								placeholder='Buscar usuario...'
								className='p-1.5 pl-8 pr-3 border text-sm border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-500 dark:text-slate-300 w-full sm:w-auto focus:outline-none focus:ring-0'
								value={search}
								onChange={e => setSearch(e.target.value)}
							/>
							<BiSearch
								className='absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-300'
								size={20}
							/>

							{search && (
								<button
									className='absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-300'
									onClick={() => setSearch('')}
									title='Resetear búsqueda'>
									<BiX size={20} />
								</button>
							)}
						</div>

						<div className='flex items-center gap-4 w-full flex-wrap'>
							<div className='flex gap-2 text-slate-500 text-xs dark:text-slate-200 w-full sm:w-auto'>
								<button
									onClick={() => handlePageChange(page - 1)}
									disabled={page === 1}
									className={`px-2 py-1 hover:bg-slate-100 rounded-lg dark:bg-slate-700 disabled:bg-slate-200 border dark:border-slate-500 dark:hover:bg-slate-600 transition-all ease-in-out duration-300 ${page === 1 ? 'cursor-not-allowed opacity-50' : ''}`}>
									<LuChevronLeft size={16} />
								</button>

								<span className='p-2'>{`${page} de ${totalPages || 0}`}</span>

								<button
									onClick={() => handlePageChange(page + 1)}
									disabled={page === totalPages}
									className={`px-2 py-1 hover:bg-slate-100 rounded-lg dark:bg-slate-700 disabled:bg-slate-200 border dark:border-slate-500 dark:hover:bg-slate-600 transition-all ease-in-out duration-300 ${page === totalPages ? 'cursor-not-allowed opacity-50' : ''}`}>
									<LuChevronRight size={16} />
								</button>
							</div>

							<select
								id='limit'
								value={limit}
								onChange={handleLimitChange}
								className='p-1 border border-slate-300 cursor-pointer bg-slate-50 dark:bg-slate-700 dark:border-slate-500 text-sm text-gray-700 dark:text-gray-300 rounded-lg transition ease-in-out duration-300 hover:bg-slate-50 dark:hover:bg-slate-600 w-20 sm:w-auto mt-2 sm:mt-0'>
								<option value={5}>5</option>
								<option value={10}>10</option>
								<option value={50}>50</option>
								<option value={100}>100</option>
							</select>
						</div>
					</div>
					<div className='flex items-center justify-between gap-4 flex-wrap lg:flex-nowrap'>
						<div className='flex gap-4 flex-wrap'>
							<Button variant='secondary' size='small' iconStart={<LuFile />} onClick={toggleReportModal}>
								Reporte
							</Button>

							<Button variant='primary' size='small' iconStart={<LuPlus />} onClick={toggleCreateModal}>
								Nuevo usuario
							</Button>
						</div>
					</div>
				</div>

				{userData?.length === 0 || userData === null || totalRecords === undefined ? (
					<div className='flex justify-center py-32'>
						<NotFound
							icon={<LuSearch size={50} />}
							title='Sin resultados'
							description='Lo sentimos, no se encontraron usuarios que coincidan con tu búsqueda.'
						/>
					</div>
				) : (
					<div className='max-h-full overflow-y-auto pt-4'>
						{loading ? (
							<div className='flex justify-center py-32'>
								<SpinnerLoading />
							</div>
						) : (
							<table className='min-w-full text-sm text-left'>
								<thead className='border-b dark:border-b-gray-600 dark:text-gray-400'>
									<tr className='text-slate-500 dark:text-gray-400'>
										<th className='px-2 py-1.5 font-medium'>Nombres</th>
										<th className='px-2 py-1.5 font-medium'>Código</th>
										<th className='px-2 py-1.5 font-medium'>Email</th>
										<th className='px-2 py-1.5 font-medium'>Teléfono</th>
										<th className='px-2 py-1.5 font-medium'>Cédula</th>
										<th className='px-2 py-1.5 font-medium'>Roles</th>
										<th className='px-2 py-1.5 font-medium'>Estado</th>
										<th className='px-2 py-1.5 font-medium'>Acciones</th>
									</tr>
								</thead>
								<tbody>
									{userData?.map(user => (
										<tr
											key={user?.id_user}
											className='hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'>
											<td className='px-2 py-1.5'>{user?.full_name}</td>
											<td className='px-2 py-1.5'>{user?.code}</td>
											<td className='px-2 py-1.5'>{user?.email}</td>
											<td className='px-2 py-1.5'>{user?.phone}</td>
											<td className='px-2 py-1.5'>{user?.identification_card}</td>
											<td className='px-2 py-1.5'>
												<div className='grid grid-cols-[repeat(auto-fit,minmax(80px,1fr))] gap-2'>
													{user?.user_roles_intermediate?.user_roles.map((role, index) => (
														<span key={index} className='block'>
															<span
																className={`bloc px-2 py-0.5 text-xs font-medium rounded-md dark:text-slate-100 
					${(() => {
						switch (role?.role?.type_rol) {
							case 'director':
								return 'bg-rose-500 text-white'
							case 'supervisor':
								return 'bg-sky-500 text-white'
							case 'analyst':
								return 'bg-purple-500 text-white'
							case 'access_manager':
								return 'bg-teal-500 text-white'
							default:
								return 'bg-gray-500 text-white'
						}
					})()}`}>
																{(() => {
																	switch (role?.role?.type_rol) {
																		case 'director':
																			return 'Director'
																		case 'supervisor':
																			return 'Supervisor'
																		case 'analyst':
																			return 'Analista'
																		case 'access_manager':
																			return 'Accesos'
																		default:
																			return null
																	}
																})()}
															</span>
														</span>
													))}
												</div>
											</td>

											<td
												className={`px-2 py-1.5 font-semibold text-xs ${user?.active ? 'text-teal-500' : 'text-red-500'}`}>
												{user?.active ? 'Activo' : 'Inactivo'}
											</td>

											<td className='p-2'>
												<div className='relative'>
													<button
														className='p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600/50 rounded-full transition-all ease-in-out duration-300'
														onClick={() => toggleDropdown(user.id_user)}>
														<BiDotsVertical size={16} />
													</button>

													{/* Dropdown Menu */}
													{dropdownVisible === user.id_user && (
														<div className='absolute right-12 mt-2 px-1 border dark:border-gray-500 w-max bg-white dark:bg-slate-700 rounded-lg shadow-lg z-10'>
															<ul className='py-1 text-xs text-slate-500 dark:text-slate-300 font-medium'>
																<li>
																	<button
																		className='dark:text-slate-300 flex items-center gap-2 w-full text-left p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg'
																		onClick={() => handleEdit(user)}>
																		<BiEditAlt />
																		Editar usuario
																	</button>
																</li>
																<li>
																	{user?.active ? (
																		<button
																			className='flex items-center gap-2 w-full text-left p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg'
																			onClick={() => handleDesactive(user)}>
																			<BiReset />
																			Desactivar usuario
																		</button>
																	) : (
																		<button
																			className='flex items-center gap-2 w-full text-left p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg'
																			onClick={() => handleActive(user)}>
																			<BiReset />
																			Activar usuario
																		</button>
																	)}
																</li>
																<li>
																	<button
																		className='w-full text-left p-2 hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center gap-2 rounded-lg text-red-500'
																		onClick={() => handleDelete(user)}>
																		<LuTrash2 />
																		Eliminar usuario
																	</button>
																</li>
															</ul>
														</div>
													)}
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</div>
				)}
			</main>

			{showCreateModal && <UserForm onClose={handleCloseCreateModal} onSuccess={refreshUserList} />}
			{showDeleteModal && <ModalDelete user={selected} onClose={toggleDeleteModal} onDelete={handleDeleteCallback} />}
			{showDesactiveModal && (
				<ModalDesactive user={selected} onClose={toggleDesactiveModal} onDesactive={handleDesactiveCallback} />
			)}
			{showActiveModal && <ModalActive user={selected} onClose={toggleActiveModal} onActive={handleActiveCallback} />}
			{showEditModal && <UserForm user={selected} onClose={toggleEditModal} onSuccess={refreshUserList} />}
			{showReportModal && <ReportModal onClose={toggleReportModal} />}
		</>
	)
}

export { UserSection }
