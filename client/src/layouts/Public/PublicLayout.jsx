const PublicLayout = ({ children }) => {
	return (
		<>
			<div className='min-h-screen flex flex-col items-center justify-center bg-slate-50'>{children}</div>
		</>
	)
}

export { PublicLayout }
