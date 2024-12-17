import { BiInfoCircle } from 'react-icons/bi'

const SelectFieldZod = ({ label, name, options, onChange, register, error }) => {
	return (
		<div className='flex flex-col gap-y-1.5 w-full text-xs'>
			<div className='flex gap-x-2'>
				<label className={`${error ? 'text-red-500' : 'text-slate-600 dark:text-slate-200'}`}>{label}</label>
				<span className='text-red-500'>*</span>
			</div>
			<select
				{...register(name)}
				onChange={onChange}
				className='w-full rounded-md border border-slate-200 bg-slate-50 dark:bg-slate-700 dark:border-slate-500 px-3 py-2 focus:border-slate-400 focus:outline-none'>
				<option value=''>Selecciona una opción</option>
				{options.map(option => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>

			{error && (
				<div className='text-red-500 text-xs flex items-start gap-1 font-normal'>
					<BiInfoCircle size={16} /> <p>{error.message}</p>
				</div>
			)}
		</div>
	)
}

export { SelectFieldZod }
