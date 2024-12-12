import { z } from 'zod'

const reset_password_schema = z
	.object({
		token: z.string().nonempty('El token es obligatorio.'),
		newPassword: z
			.string({
				required_error: 'La nueva contraseña es obligatoria.',
			})
			.min(8, 'La nueva contraseña debe tener al menos 8 caracteres.')
			.max(16, 'La nueva contraseña no puede tener más de 16 caracteres.')
			.refine(val => /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/.test(val), {
				message: 'La contraseña debe contener al menos una letra mayúscula, un número y un carácter especial.',
			}),
		confirmPassword: z
			.string()
			.min(8, 'La nueva contraseña debe tener al menos 8 caracteres.')
			.max(16, 'La nueva contraseña no puede tener más de 16 caracteres.')
			.refine(val => /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/.test(val), {
				message: 'La contraseña debe contener al menos una letra mayúscula, un número y un carácter especial.',
			}),
	})
	.refine(
		values => {
			return values.newPassword === values.confirmPassword
		},
		{
			message: 'Las contraseñas no coinciden',
			path: ['confirmPassword'],
		}
	)

export { reset_password_schema }
