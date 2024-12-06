import { z } from 'zod'

const reactive_zod = z.object({
	name: z
		.string()
		.min(3, 'El nombre debe tener al menos 3 caracteres.')
		.max(255, 'El nombre no puede tener más de 255 caracteres.'),
	code: z
		.string()
		.min(3, 'El código debe tener al menos 3 caracteres.')
		.max(255, 'El código no puede tener más de 255 caracteres.'),
	number_of_containers: z
		.number()
		.int('El número de contenedores debe ser un entero.')
		.min(1, 'Debe haber al menos un contenedor.')
		.nonnegative('El número de contenedores no puede ser negativo.'),
	initial_quantity: z.number().positive('La cantidad inicial debe ser mayor a 0.'),
	current_quantity: z.number().nonnegative('La cantidad actual no puede ser negativa.'),
	unit: z.enum(['g', 'mg', 'kg', 'l', 'ml', 'units'], {
		errorMap: () => ({ message: 'La unidad debe ser una de las siguientes: g, mg, kg, l, ml, units.' }),
	}),
	cas: z.number().positive('La cantidad inicial debe ser mayor a 0.'),
	entry_date: z
		.string()
		.datetime({ offset: true })
		.refine(date => new Date(date).toString() !== 'Invalid Date', 'La fecha de entrada debe ser válida.'),
	expiration_date: z
		.string()
		.datetime({ offset: true })
		.optional()
		.nullable()
		.refine(
			date => date === null || new Date(date).toString() !== 'Invalid Date',
			'La fecha de expiración debe ser válida.'
		),
	is_controlled: z.boolean().default(false),
})

const consumption_reactive_zod = z.object({
	id_reactive_fk: z.string().uuid({
		message: 'Debe ser un UUID válido para el reactivo.',
	}),
	name_experiment: z
		.string()
		.min(3, 'El nombre debe tener al menos 3 caracteres.')
		.max(255, 'El nombre no puede tener más de 255 caracteres.'),
	quantity_consumed: z
		.number({
			required_error: 'La cantidad consumida es obligatoria',
		})
		.positive('La cantidad debe ser mayor a cero'),
	unit: z.enum(['g', 'mg', 'kg', 'l', 'ml', 'units'], {
		required_error: 'La unidad es obligatoria',
	}),
})

const request_reactive_zod = z.object({
	id_reactive_fk: z.string().uuid({ message: 'Debe ser un UUID válido para el reactivo.' }),
	description: z
		.string({ required_error: 'La descripción es requerida.' })
		.min(3, 'La descripción debe tener al menos 3 caracteres.')
		.max(255, 'La descripción no puede tener más de 255 caracteres.'),
	amount_request: z
		.number({ required_error: 'La cantidad solicitada es requerida.' })
		.int('La cantidad debe ser un número entero.')
		.positive('La cantidad solicitada debe ser un número positivo.'),
})

export { reactive_zod, consumption_reactive_zod, request_reactive_zod }
