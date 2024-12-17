import { useState } from 'react'
import { ModalAction } from '../Modal/ActionModal'
import { ToastGeneric } from '../../../../components/Toasts/Toast'
import { deleteLabRequest, changeStatusLabRequest } from '../../../../services/api/lab.api'

export const ModalDesactive = ({ lab, onClose, onDesactive }) => {
	const [loading, setLoading] = useState(false)

	const handleSubmit = async e => {
		e.preventDefault()
		setLoading(true)
		try {
			const response = await changeStatusLabRequest(lab.id_lab)
			ToastGeneric({ type: 'success', message: response.message })
			onClose()
			onDesactive()
		} catch (error) {
			ToastGeneric({ type: 'error', message: error.message })
		} finally {
			setLoading(false)
		}
	}

	const modalProps = {
		text: {
			title: 'Deshabilitar laboratorio',
			description_a: `Estás a punto de deshabilitar el laboratorio`,
			description_b: `${lab.name}`,
			description_c: '¿Está seguro?',
			buttonCancel: 'No, mantenlo',
			buttonSubmit: 'Ok, deshabilitar',
			buttonLoading: 'Deshabilitando laboratorio...',
		},
		actionType: 'warning',
		loading,
		onClose,
		onSubmit: handleSubmit,
	}

	return <ModalAction {...modalProps} />
}

export const ModalActive = ({ lab, onClose, onActive }) => {
	const [loading, setLoading] = useState(false)

	const handleSubmit = async e => {
		e.preventDefault()
		setLoading(true)
		try {
			const response = await changeStatusLabRequest(lab.id_lab)
			ToastGeneric({ type: 'success', message: response.message })
			onClose()
			onActive()
		} catch (error) {
			ToastGeneric({ type: 'error', message: error.message })
		} finally {
			setLoading(false)
		}
	}

	const modalProps = {
		text: {
			title: 'Habilitar laboratorio',
			description_a: `Estás a punto de habilitar al laboratorio`,
			description_b: `${lab.name}`,
			description_c: '¿Está seguro?',
			buttonCancel: 'No, mantenlo',
			buttonSubmit: 'Ok, habilitar',
			buttonLoading: 'Habilitando laboratorio...',
		},
		actionType: 'success',
		loading,
		onClose,
		onSubmit: handleSubmit,
	}

	return <ModalAction {...modalProps} />
}

export const ModalDelete = ({ lab, onClose, onDelete }) => {
	const [loading, setLoading] = useState(false)

	const handleSubmit = async e => {
		e.preventDefault()
		setLoading(true)
		try {
			const response = await deleteLabRequest(lab.id_lab)
			ToastGeneric({ type: 'success', message: response.message })
			onClose()
			onDelete()
		} catch (error) {
			ToastGeneric({ type: 'error', message: error.message })
		} finally {
			setLoading(false)
		}
	}

	const modalProps = {
		text: {
			title: 'Eliminar laboratorio',
			description_a: `Estás a punto de eliminar al laboratorio`,
			description_b: `${lab.name}`,
			description_c: '¿Está seguro?',
			buttonCancel: 'No, mantenlo',
			buttonSubmit: 'Ok, eliminar',
			buttonLoading: 'Eliminado laboratorio...',
		},
		actionType: 'danger',
		loading,
		onClose,
		onSubmit: handleSubmit,
	}

	return <ModalAction {...modalProps} />
}
