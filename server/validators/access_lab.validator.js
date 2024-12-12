import { z } from 'zod'
import { isValidCI } from '../validators/cli.validator.js'
import { ACCESS_APPROVED, ACCESS_PENDING, ACCESS_REJECTED } from '../const/access.values.js'

const access_lab_zod = z.object({
	full_name: z
		.string()
		.min(3, 'El nombre debe tener al menos 3 caracteres.')
		.max(255, 'El nombre no puede tener más de 255 caracteres.'),
	identification_card: z
		.string()
		.length(10, { message: 'La cédula debe tener 10 caracteres.' })
		.refine(value => isValidCI(value), 'La cédula no es válida'),
	type_access: z
		.string()
		.min(3, 'El tipo de acceso debe tener al menos 3 caracteres.')
		.max(255, 'El tipo de acceso no puede tener más de 255 caracteres.'),
	id_lab_fk: z.string().uuid({ message: 'Invalid UUID' }),
})

const change_permission_acess_lab_zod = z.object({
	id_access_lab_fk: z.string().uuid({ message: 'Invalid UUID' }),
	status: z.string().refine(value => [ACCESS_PENDING, ACCESS_APPROVED, ACCESS_REJECTED].includes(value), {
		message: 'Estado no valido.',
	}),
})
export { access_lab_zod, change_permission_acess_lab_zod }
