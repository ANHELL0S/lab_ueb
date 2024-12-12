import { z } from 'zod'
import {
	CELSIUS,
	CENTIGRAMOS,
	CENTIMETROS_CUBICOS,
	CUBIC_METERS,
	DECAGRAMOS,
	FAHRENHEIT,
	GALONES,
	GRAMOS,
	KELVIN,
	KILO_GRAMOS,
	LIBRAS,
	LITROS,
	MICROGRAMOS,
	MILI_GRAMOS,
	MILI_LITROS,
	MOLARIDAD,
	NORMALIDAD,
	ONZAS,
	PINTAS,
	PORCENTAJE,
	TONELADAS,
	UNIDADES,
} from '../const/units_measurement.js'

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
	unit: z.enum(
		[
			GRAMOS,
			MILI_GRAMOS,
			KILO_GRAMOS,
			TONELADAS,
			MICROGRAMOS,
			CENTIGRAMOS,
			DECAGRAMOS,
			ONZAS,
			LIBRAS,
			LITROS,
			MILI_LITROS,
			GALONES,
			CENTIMETROS_CUBICOS,
			PINTAS,
			CUBIC_METERS,
			CELSIUS,
			FAHRENHEIT,
			KELVIN,
			MOLARIDAD,
			NORMALIDAD,
			PORCENTAJE,
			UNIDADES,
		],
		{
			errorMap: () => ({ message: 'La unidad de consumo no es valida.' }),
		}
	),
	cas: z.number().positive('La cantidad inicial debe ser mayor a 0.'),
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
	unit: z.enum(
		[
			GRAMOS,
			MILI_GRAMOS,
			KILO_GRAMOS,
			TONELADAS,
			MICROGRAMOS,
			CENTIGRAMOS,
			DECAGRAMOS,
			ONZAS,
			LIBRAS,
			LITROS,
			MILI_LITROS,
			GALONES,
			CENTIMETROS_CUBICOS,
			PINTAS,
			CUBIC_METERS,
			CELSIUS,
			FAHRENHEIT,
			KELVIN,
			MOLARIDAD,
			NORMALIDAD,
			PORCENTAJE,
			UNIDADES,
		],
		{
			errorMap: () => ({ message: 'La unidad de consumo no es valida.' }),
		}
	),
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
	status: z
		.enum(['pending', 'approved', 'rejected'], {
			errorMap: () => ({ message: 'El estado de la petición no es valido.' }),
		})
		.optional(),
})

export { reactive_zod, consumption_reactive_zod, request_reactive_zod }
