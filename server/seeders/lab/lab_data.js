import { DERLYS, ERIKAC, ISABELP, MAFERQ, PAOLAW, SANTIAGOS } from '../../const/credential_user.const.js'
const lab_data = [
	{
		name: 'Laboratorio de Cromatografía',
		location: 'Edificio A',
		description: 'Especializado en técnicas cromatográficas.',
		analyst_email: ISABELP,
	},
	{
		name: 'Laboratorio de Biomasa',
		location: 'Edificio B',
		description: 'Procesos de conversión de biomasa.',
		analyst_email: MAFERQ,
	},
	{
		name: 'Laboratorio de Preparación de Muestras',
		location: 'Edificio C',
		description: 'Preparación de muestras para análisis.',
		analyst_email: ERIKAC,
	},
	{
		name: 'Laboratorio de Análisis de Alimentos y Fitoquímica',
		location: 'Edificio D',
		description: 'Control de calidad alimentaria.',
		analyst_email: PAOLAW,
	},
	{
		name: 'Laboratorio de Química Analítica, Ambiental, Agua y Suelo',
		location: 'Edificio E',
		description: 'Análisis ambiental y químico.',
		analyst_email: SANTIAGOS,
	},
	{
		name: 'Laboratorio de Biología Molecular y Biotecnología',
		location: 'Edificio F',
		description: 'Investigación molecular y biotecnología.',
		analyst_email: DERLYS,
	},
	{
		name: 'Laboratorio Clínico',
		location: 'Edificio G',
		description: 'Pruebas y análisis clínicos.',
		analyst_email: MAFERQ,
	},
]

export { lab_data }
