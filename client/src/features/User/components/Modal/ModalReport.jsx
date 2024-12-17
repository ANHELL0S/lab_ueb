import { LuX } from 'react-icons/lu'
import { Banner } from '../Banner/Banner'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../../../../components/Button/Button'
import { ToastGeneric } from '../../../../components/Toasts/Toast'
import { getReportUserRequest } from '../../../../services/api/user.api'

const ReportModal = ({ onClose }) => {
	const [loading, setLoading] = useState(false)
	const [modalOpen, setModalOpen] = useState(false)
	const [startDate, setStartDate] = useState('')
	const [endDate, setEndDate] = useState('')

	useEffect(() => {
		setModalOpen(true)
	}, [])

	const fetchReportData = async () => {
		setLoading(true)
		try {
			await getReportUserRequest(startDate, endDate)
			ToastGeneric({ type: 'success', message: 'Reporte generado exitosamente.' })
		} catch (error) {
			ToastGeneric({ type: 'error', message: 'Rango de fechas sin registros.' })
		} finally {
			setLoading(false)
		}
	}

	const handleDownload = () => fetchReportData()

	const handleResetDates = () => {
		setStartDate('')
		setEndDate('')
	}

	const overlayVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: { duration: 0.2, ease: 'easeInOut' },
		},
	}

	const modalVariants = {
		hidden: { opacity: 0, scale: 0.9, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
		visible: {
			opacity: 1,
			scale: 1,
			y: 0,
			transition: { duration: 0.2, ease: 'easeInOut' },
		},
		exit: {
			opacity: 0,
			scale: 1,
			y: 0,
			transition: { duration: 0.2, ease: 'easeIn' },
		},
	}

	const messages = [
		'Los reportes se generan con base en un rango de fechas seleccionado.',
		'Si no se selecciona un rango, por defecto se mostrará el reporte del mes actual.',
	]

	return (
		<AnimatePresence>
			{modalOpen && (
				<motion.div
					className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'
					initial='hidden'
					animate='visible'
					exit='hidden'
					variants={overlayVariants}>
					<motion.div
						className='relative w-full max-w-sm p-6 space-y-4 rounded-lg bg-white shadow-xl dark:bg-gray-800'
						variants={modalVariants}
						onClick={e => e.stopPropagation()}>
						<div className='flex justify-between items-center'>
							<h3 className='text-lg font-semibold text-slate-600 dark:text-gray-100'>Reporte usuarios</h3>

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

						<Banner type='info' messages={messages} />

						<div className='space-y-4 text-xs'>
							<div>
								<label htmlFor='startDate' className='block font-medium'>
									Fecha inicio
								</label>
								<input
									type='date'
									id='startDate'
									value={startDate}
									onChange={e => setStartDate(e.target.value)}
									className='mt-2 block w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-500 border-slate-300 '
								/>
							</div>

							<div>
								<label htmlFor='endDate' className='block font-medium'>
									Fecha fin
								</label>
								<input
									type='date'
									id='endDate'
									value={endDate}
									onChange={e => setEndDate(e.target.value)}
									className='mt-2 block w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-500 border-slate-300 '
								/>
							</div>

							<Button onClick={handleResetDates} variant='none' size='small'>
								Restablecer fechas
							</Button>
						</div>

						<div className='flex justify-end space-x-2 pt-2'>
							<Button
								onClick={() => {
									setModalOpen(false)
									setTimeout(onClose, 200)
								}}
								disabled={loading}
								variant='none'
								size='small'>
								Cancelar
							</Button>

							<Button onClick={handleDownload} variant='primary' size='small' loading={loading}>
								{loading ? 'Generando reporte...' : 'Generar reporte'}
							</Button>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	)
}

export { ReportModal }
