import { z } from 'zod'

const lab_zod = z.object({
	name: z
		.string()
		.min(3, 'El nombre debe tener al menos 3 caracteres.')
		.max(255, 'El nombre no puede tener más de 255 caracteres.'),
	location: z
		.string()
		.min(3, 'La ubicación debe tener al menos 3 caracteres.')
		.max(255, 'La ubicación no puede tener más de 255 caracteres.'),
	description: z
		.string()
		.min(0, 'La descripción debe tener al menos 0 caracteres.')
		.max(255, 'La descripción no puede tener más de 255 caracteres.')
		.optional(),
	active: z.boolean(),
	id_analyst_fk: z.string().uuid({ message: 'Invalid UUID' }),
})

const assing_analyst_lab_zod = z.object({
	id_lab_fk: z.string().uuid({ message: 'Invalid UUID' }),
	id_analyst_fk: z.string().uuid({ message: 'Invalid UUID' }),
})

export { lab_zod, assing_analyst_lab_zod }
