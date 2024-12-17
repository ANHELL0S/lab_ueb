import { z } from 'zod'

export const lab_schema_zod = z.object({
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
		.min(3, 'La descripción debe tener al menos 3 caracteres.')
		.max(255, 'La descripción no puede tener más de 255 caracteres.')
		.optional(),
})
