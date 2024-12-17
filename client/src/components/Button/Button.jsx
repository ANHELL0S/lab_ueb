import { useState } from 'react'
import { BiLoaderAlt } from 'react-icons/bi'

const Button = ({
	type = 'button',
	variant = 'primary',
	size = 'small',
	loading = false,
	disabled = false,
	children,
	onClick,
	iconStart,
	iconEnd,
}) => {
	const [ripple, setRipple] = useState(null)

	const baseClasses =
		'flex items-center justify-center focus:outline-none transition duration-300 ease-in-out font-medium transform relative overflow-hidden rounded-md'

	const variantClasses = {
		primary:
			'text-slate-50 bg-slate-500 hover:bg-slate-500/80 border border-transparent dark:bg-cyan-600 dark:hover:bg-cyan-600/80',
		secondary:
			'text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600',
		none: 'text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-700/50',
		outline:
			'border border-slate-200 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800',
		danger: 'text-white bg-red-500 hover:bg-red-500/80 border border-transparent',
		warning: 'text-white bg-orange-500 hover:bg-orange-500/80 border border-transparent',
		success:
			'bg-green-500 hover:bg-green-500/80 border border-transparent dark:bg-emerald-600 text-green-50 dark:hover:bg-emerald-600/80',
	}

	const sizeClasses = {
		small: 'p-2 text-xs',
		normal: 'p-3 text-sm',
		large: 'p-3 text-lg',
	}

	const createRipple = e => {
		if (loading || disabled) return

		const button = e.currentTarget
		const rect = button.getBoundingClientRect()
		const size = Math.max(rect.width, rect.height)
		const x = e.clientX - rect.left - size / 2
		const y = e.clientY - rect.top - size / 2

		setRipple({
			x,
			y,
			size,
		})

		setTimeout(() => {
			setRipple(null)
		}, 400)
	}

	return (
		<button
			type={type}
			className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} 
				${loading || disabled ? 'cursor-not-allowed opacity-50 pointer-events-none' : ''}`}
			disabled={loading || disabled}
			onClick={e => {
				if (loading || disabled) return
				createRipple(e)
				if (onClick) onClick(e)
			}}>
			{loading && <BiLoaderAlt className='animate-spin mr-2' />}
			{iconStart && <span className={`mr-2 ${children ? '' : 'mr-0'}`}>{iconStart}</span>}
			{children}
			{iconEnd && <span className={`ml-2 ${children ? '' : 'ml-0'}`}>{iconEnd}</span>}

			{ripple && (
				<span
					className='absolute bg-white opacity-30 rounded-full animate-ripple'
					style={{
						width: ripple.size,
						height: ripple.size,
						left: ripple.x,
						top: ripple.y,
					}}
				/>
			)}
		</button>
	)
}

export { Button }
