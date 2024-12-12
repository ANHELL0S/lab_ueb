import { z } from 'zod'
import {
	SAMPLE_EXTERNAL,
	SAMPLE_GASEOUS,
	SAMPLE_LIQUID,
	SAMPLE_PROJECT,
	SAMPLE_SOLID,
	SAMPLE_THESIS,
} from '../const/sample.values.js'

const sample_zod = z.object({
	applicant_name: z
		.string()
		.min(1, 'El nombre del solicitante es obligatorio')
		.max(255, 'El nombre no puede exceder los 255 caracteres'),
	identification_card: z
		.string()
		.min(10, 'El número de identificación minimo 10 digitos')
		.max(15, 'El número de identificación no puede exceder los 15 dígitos'),
	phone: z
		.string()
		.min(10, 'El número de teléfono minimo 10 digitos')
		.max(15, 'El número de teléfono no puede exceder los 15 dígitos'),
	email: z
		.string()
		.email('Formato de correo electrónico inválido')
		.max(255, 'El correo electrónico no puede exceder los 255 caracteres'),
	address: z
		.string()
		.min(1, 'La dirección es obligatoria')
		.max(255, 'La dirección no puede exceder los 255 caracteres'),
	sample_code: z
		.string()
		.min(1, 'El código de muestra es obligatorio')
		.max(255, 'El código de muestra no puede exceder los 255 caracteres'),
	sample_name: z
		.string()
		.min(1, 'El nombre de la muestra es obligatorio')
		.max(255, 'El nombre de la muestra no puede exceder los 255 caracteres'),
	container: z
		.string()
		.min(1, 'El contenedor es obligatorio')
		.max(255, 'El contenedor no puede exceder los 255 caracteres'),
	state: z.enum([SAMPLE_LIQUID, SAMPLE_SOLID, SAMPLE_GASEOUS], { message: 'Estado de muestra inválido' }),
	type: z.enum([SAMPLE_THESIS, SAMPLE_PROJECT, SAMPLE_EXTERNAL], { message: 'Tipo de muestra inválido' }),
	report_number: z
		.string()
		.min(1, 'El número de reporte es obligatorio')
		.max(255, 'El número de reporte no puede exceder los 255 caracteres'),
})

export { sample_zod }
