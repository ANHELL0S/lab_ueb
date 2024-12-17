import { LuX } from 'react-icons/lu'
import { useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { lab_schema_zod } from '../../validators/labValidator'
import { Button } from '../../../../components/Button/Button'
import { ToastGeneric } from '../../../../components/Toasts/Toast'
import { InputFieldZod } from '../../../../components/Input/InputFieldZod'
import { createLabRequest, updateLabRequest } from '../../../../services/api/lab.api'

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

export const LabForm = ({ onClose, onSuccess, lab = null }) => {
	const [modalOpen, setModalOpen] = useState(false)
	const [loading, setLoading] = useState(false)

	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue,
	} = useForm({
		resolver: zodResolver(lab_schema_zod),
		defaultValues: lab || {},
	})

	const onSubmit = async data => {
		setLoading(true)
		try {
			let response
			if (lab) {
				response = await updateLabRequest(lab.id_lab, data)
				ToastGeneric({ type: 'success', message: response.message })
			} else {
				response = await createLabRequest(data)
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
										{lab ? 'Editar laboratorio' : 'Crear laboratorio'}
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

								<form
									onSubmit={handleSubmit(onSubmit)}
									className='flex flex-col gap-y-4 pb-20 overflow-y-auto text-xs text-gray-600 dark:text-gray-300 pr-3'>
									<InputFieldZod
										label='Nombre'
										placeholder='Ingrese el nombre'
										register={register('name')}
										error={errors.name}
									/>
									<InputFieldZod
										label='Localización'
										placeholder='Ingrese la localización'
										register={register('location')}
										error={errors.location}
									/>
									<InputFieldZod
										label='Descripción'
										placeholder='Ingrese la descripción'
										type='text'
										register={register('description')}
										error={errors.description}
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
