import { useState } from 'react'
import { ModalAction } from '../Modal/ActionModal'
import { ToastGeneric } from '../../../../components/Toasts/Toast'
import { deleteUserRequest, changeStatusUsersRequest } from '../../../../services/api/user.api'

export const ModalCreate = ({ onClose, onCreate }) => {
	const [loading, setLoading] = useState(false)
	const [formData, setFormData] = useState({
		username: '',
		email: '',
		phone: '',
		identification_card: '',
		residence: '',
		type_employment: '',
		securityWord: '',
		role: '',
		confirmsecurityWord: '',
	})

	const handleChange = e => {
		const { name, value } = e.target
		setFormData(prevData => ({
			...prevData,
			[name]: value,
		}))
	}

	const handleSubmit = async data => {
		setLoading(true)
		try {
			const response = await createUsersRequest(data)
			ToastGeneric({ type: 'success', message: response.message })
			onCreate()
			onClose()
		} catch (error) {
			ToastGeneric({ type: 'error', message: error.message })
		} finally {
			setLoading(false)
		}
	}

	const modalProps = {
		text: {
			title: 'Crear usuario',
			description: 'Por favor, asegúrate de ingresar los datos correctos para la creación del nuevo usuario.',
			info1: 'Ten en cuenta que la cédula que registres se asigna como parte de la contraseña.',
			info2: 'Ten en cuenta que la palabra de seguridad que registres complementa a la contraseña.',
			info3: 'Ejemplo de contraseña: 0201406751PALABRASECRETA',
			info4: 'Las credeciales junto con la palabra segura se enviaran al correo regitrado.',
			buttonSubmit: 'Ok, crear!',
			buttonCancel: 'No, cancelar',
		},
		loading,
		onClose,
		onSubmit: handleSubmit,
		onChange: handleChange,
		formData,
	}

	return <ModalUsers {...modalProps} />
}

export const ModalUpdate = ({ user, onClose, onUpdate }) => {
	const [loading, setLoading] = useState(false)

	const [formData, setFormData] = useState({
		username: user.username || '',
		email: user.email || '',
		phone: user.phone || '',
		identification_card: user.identification_card || '',
		residence: user.residence || '',
		type_employment: user.type_employment || '',
		role: user.role.type_rol || '',
		securityWord: '',
	})

	const handleChange = e => {
		const { name, value } = e.target
		setFormData(prevState => ({
			...prevState,
			[name]: value,
		}))
	}

	const handleSubmit = async data => {
		setLoading(true)
		try {
			const response = await updateUsersRequest(user.id_user, data)
			ToastGeneric({ type: 'success', message: response.message })
			onClose()
			onUpdate()
		} catch (error) {
			ToastGeneric({ type: 'error', message: error.message })
		} finally {
			setLoading(false)
		}
	}

	const modalProps = {
		text: {
			title: 'Actualizar usuario',
			description: 'Por favor, asegúrate de ingresar los datos correctos para la actualización del usuario.',
			info1: 'Para aplicar los cambios debes ingresar la palabra segura del usuario.',
			info2: 'Si no recuerda la palabra segura, por favor revisa el correo registrado originalmente.',
			buttonSubmit: 'Ok, actualizar!',
			buttonCancel: 'No, cancelar',
		},
		loading,
		onClose,
		formData,
		onSubmit: handleSubmit,
		onChange: handleChange,
	}

	return <ModalUsersUpdate {...modalProps} />
}

///

export const ModalDesactive = ({ user, onClose, onDesactive }) => {
	const [loading, setLoading] = useState(false)

	const handleSubmit = async e => {
		e.preventDefault()
		setLoading(true)
		try {
			const response = await changeStatusUsersRequest(user.id_user)
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
			title: 'Deshabilitar usuario',
			description_a: `Estás a punto de deshabilitar al usuario`,
			description_b: `${user.full_name}`,
			description_c: '¿Está seguro?',
			buttonCancel: 'No, mantenlo',
			buttonSubmit: 'Ok, deshabilitar',
			buttonLoading: 'Deshabilitando usuario...',
		},
		actionType: 'warning',
		loading,
		onClose,
		onSubmit: handleSubmit,
	}

	return <ModalAction {...modalProps} />
}

export const ModalActive = ({ user, onClose, onActive }) => {
	const [loading, setLoading] = useState(false)

	const handleSubmit = async e => {
		e.preventDefault()
		setLoading(true)
		try {
			const response = await changeStatusUsersRequest(user.id_user)
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
			title: 'Habilitar usuario',
			description_a: `Estás a punto de habilitar al usuario`,
			description_b: `${user.full_name}`,
			description_c: '¿Está seguro?',
			buttonCancel: 'No, mantenlo',
			buttonSubmit: 'Ok, habilitar',
			buttonLoading: 'Habilitando usuario...',
		},
		actionType: 'success',
		loading,
		onClose,
		onSubmit: handleSubmit,
	}

	return <ModalAction {...modalProps} />
}

export const ModalDelete = ({ user, onClose, onDelete }) => {
	const [loading, setLoading] = useState(false)

	const handleSubmit = async e => {
		e.preventDefault()
		setLoading(true)
		try {
			const response = await deleteUserRequest(user.id_user)
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
			title: 'Eliminar usuario',
			description_a: `Estás a punto de eliminar al usuario`,
			description_b: `${user.full_name}`,
			description_c: '¿Está seguro?',
			buttonCancel: 'No, mantenlo',
			buttonSubmit: 'Ok, eliminar',
			buttonLoading: 'Eliminado usuario...',
		},
		actionType: 'danger',
		loading,
		onClose,
		onSubmit: handleSubmit,
	}

	return <ModalAction {...modalProps} />
}
