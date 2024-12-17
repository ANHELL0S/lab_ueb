import { LuX } from 'react-icons/lu'
import { useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { userSchema } from '../../validators/UserValidator'
import { Button } from '../../../../components/Button/Button'
import { ToastGeneric } from '../../../../components/Toasts/Toast'
import { InputFieldZod } from '../../../../components/Input/InputFieldZod'
import { createUserRequest, updateUserRequest } from '../../../../services/api/user.api'

const overlayVariants = {
	hidden: { opacity: 0, backdropFilter: 'blur(0px)' },
	visible: { opacity: 1, backdropFilter: 'blur(0px)', transition: { duration: 0.2 } },
}

const modalVariants = {
	hidden: {
		opacity: 0,
		scale: 1,
		x: '100%',
		transition: { duration: 0.2, ease: 'easeInOut' },
	},
	visible: {
		opacity: 1,
		scale: 1,
		x: '0%',
		transition: { duration: 0.2, ease: 'circIn' },
	},
}

const UserForm = ({ onClose, onSuccess, user = null }) => {
	const [modalOpen, setModalOpen] = useState(false)
	const [loading, setLoading] = useState(false)

	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue,
	} = useForm({
		resolver: zodResolver(userSchema),
		defaultValues: user || {},
	})

	const onSubmit = async data => {
		setLoading(true)
		try {
			let response
			if (user) {
				response = await updateUserRequest(user.id_user, data)
				ToastGeneric({ type: 'success', message: response.message })
			} else {
				response = await createUserRequest(data)
				ToastGeneric({ type: 'success', message: response.message })
			}
			onClose()

			if (onSuccess) onSuccess()
		} catch (error) {
			ToastGeneric({ type: 'error', message: error.message })
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		setModalOpen(true)
	}, [])

	return (
		<>
			<AnimatePresence>
				{modalOpen && (
					<>
						<motion.div
							className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'
							initial='hidden'
							animate='visible'
							exit='hidden'
							variants={overlayVariants}
						/>
						<motion.div
							className='fixed inset-0 m-2 z-50 flex items-center justify-end overflow-auto'
							initial='hidden'
							animate='visible'
							exit='hidden'
							variants={overlayVariants}>
							<motion.div
								className='relative flex h-full w-full max-w-md flex-col gap-y-5 rounded-lg bg-slate-50 p-6 text-gray-600 shadow-lg dark:bg-gray-800 dark:text-gray-300'
								variants={modalVariants}
								onClick={e => e.stopPropagation()}>
								<div className='flex items-center justify-between'>
									<h3 className='text-lg font-semibold text-slate-600 dark:text-gray-100'>
										{user ? 'Editar usuario' : 'Crear usuario'}
									</h3>

									<Button
										variant='none'
										size='small'
										disabled={loading}
										onClick={() => {
											setModalOpen(false)
											setTimeout(onClose, 300)
										}}>
										<LuX size={16} />
									</Button>
								</div>

								<div className='grid grid-cols-1 gap-x-4 gap-y-3 font-medium'>
									<div className='text-xs flex flex-col gap-y-1 font-semibold text-sky-500'>
										<div className='flex flex-col gap-y-2 border-l-4 border-sky-500 bg-sky-50 p-2 font-normal dark:border-sky-700 dark:bg-sky-900/50'>
											<span>La contraseña será generada automáticamente en base al correo electrónico.</span>
											<span>Se enviará un correo a la dirección indicada con la información de la cuenta.</span>
										</div>
									</div>
								</div>

								<form
									onSubmit={handleSubmit(onSubmit)}
									className='flex flex-col gap-y-4 pb-20 overflow-y-auto text-xs text-gray-600 dark:text-gray-300 pr-3'>
									<InputFieldZod
										label='Nombre'
										placeholder='Ingrese el nombre'
										register={register('full_name')}
										error={errors.full_name}
									/>
									<InputFieldZod
										label='Correo Electrónico'
										placeholder='Ingrese el correo'
										type='email'
										register={register('email')}
										error={errors.email}
									/>
									<InputFieldZod
										label='Teléfono'
										placeholder='Ingrese el teléfono'
										type='text'
										register={register('phone')}
										error={errors.phone}
									/>
									<InputFieldZod
										label='Cédula'
										placeholder='Ingrese la cédula'
										type='text'
										register={register('identification_card')}
										error={errors.identification_card}
									/>
									<InputFieldZod
										label='Código'
										placeholder='Ingrese el código'
										type='text'
										register={register('code')}
										error={errors.code}
									/>

									<div className='absolute bottom-0 left-0 rounded-lg flex w-full flex-col justify-end gap-4 bg-white p-6 text-xs font-semibold dark:bg-gray-800 sm:flex-row'>
										<Button
											onClick={() => {
												setModalOpen(false)
												setTimeout(onClose, 300)
											}}
											disabled={loading}
											variant='none'
											type='submit'
											size='small'>
											Cancelar
										</Button>

										<Button variant='primary' type='submit' size='small' loading={loading}>
											{loading ? 'Actualizando usuario...' : 'Ok, actualizar usuario'}
										</Button>
									</div>
								</form>
							</motion.div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</>
	)
}

export { UserForm }
