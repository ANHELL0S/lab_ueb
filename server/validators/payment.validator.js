import { z } from 'zod'
import { PAYMENT_APPROVED, PAYMENT_CANCELED, PAYMENT_PENDING, PAYMENT_REJECTD } from '../const/payment.const.js'

const payment_zod = z.object({
	id_access_lab_fk: z.string().uuid('El ID del laboratorio debe ser un UUID válido.'),
	code_bill: z
		.string()
		.min(3, 'El código debe tener al menos 3 caracteres.')
		.max(255, 'El código no puede tener más de 255 caracteres.'),
	amount_paid: z.number().min(0, 'El monto pagado debe ser un número positivo o cero.'),
	status: z
		.enum([PAYMENT_PENDING, PAYMENT_APPROVED, PAYMENT_REJECTD, PAYMENT_CANCELED], {
			errorMap: () => {
				return {
					message: 'El estado del pago no es valido',
				}
			},
		})
		.optional(),
	payment_date: z
		.string()
		.optional()
		.refine(
			value => {
				if (value) {
					const date = new Date(value)
					return !isNaN(date.getTime())
				}
				return true
			},
			{
				message: 'La fecha de pago no es válida.',
			}
		),
})

export { payment_zod }
