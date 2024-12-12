const formattedDate = new Date().toLocaleDateString('es-ES', {
	year: 'numeric',
	month: 'long',
	day: 'numeric',
})

export { formattedDate }
