import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '../../Button/Button'
import { zodResolver } from '@hookform/resolvers/zod'
import { InputFieldZod } from '../../Input/InputFieldZod'
import { useUpdateAccount } from '../../../hooks/useUser'
import { personalInfoSchema } from '../../../validators/account.validator'

const PersonalInfoForm = ({ user }) => {
	const { mutateAsync: updateAccount } = useUpdateAccount()
	const [isUpdatingAccount, setIsUpdatingAccount] = useState(false)

	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue,
	} = useForm({
		resolver: zodResolver(personalInfoSchema),
		defaultValues: user,
	})

	const onSubmitAccountForm = async data => {
		updateAccount(
			{ data },
			{
				onSuccess: () => setIsUpdatingAccount(false),
				onError: () => setIsUpdatingAccount(false),
			}
		)
	}
	return (
		<form onSubmit={handleSubmit(onSubmitAccountForm)} className='space-y-8'>
			<div className='space-y-5'>
				<InputFieldZod
					label='Nombres'
					type='text'
					placeholder='Ingrese su nombre'
					register={register('full_name')}
					error={errors.full_name}
					defaultValue={user?.full_name}
				/>
				<InputFieldZod
					label='Correo electrónico'
					type='email'
					placeholder='Introduce tu correo'
					register={register('email')}
					error={errors.email}
					defaultValue={user?.email}
				/>
				<div className='flex justify-between gap-8'>
					<InputFieldZod
						label='Teléfono'
						type='tel'
						placeholder='Introduce tu número de teléfono'
						register={register('phone')}
						error={errors.phone}
						defaultValue={user?.phone}
					/>
					<InputFieldZod
						label='Cédula'
						type='text'
						placeholder='Introduce tu número de cédula'
						register={register('identification_card')}
						error={errors.identification_card}
						defaultValue={user?.identification_card}
					/>
				</div>
			</div>

			<div className='flex justify-end'>
				<Button variant='primary' type='submit' size='md' disabled={isUpdatingAccount}>
					{isUpdatingAccount ? 'Procesando...' : 'Guardar cambios'}
				</Button>
			</div>
		</form>
	)
}

export { PersonalInfoForm }
