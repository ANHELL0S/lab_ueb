import { z } from 'zod'

export const userSchema = z.object({
	full_name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres' }),
	email: z.string().email({ message: 'Ingrese un correo electrónico válido' }),
	phone: z.string().regex(/^[0-9]{10}$/, { message: 'Ingrese un número de teléfono válido (10 dígitos)' }),
	identification_card: z.string().regex(/^[0-9]{10}$/, { message: 'Ingrese un cédula válido (10 dígitos)' }),
	code: z
		.string()
		.min(3, 'El código debe tener al menos 3 caracteres')
		.max(255, 'El código debe tener maximo 255 caracteres'),
})
