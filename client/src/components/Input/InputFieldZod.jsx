import { BiInfoCircle } from 'react-icons/bi'

const InputFieldZod = ({ label, placeholder, type = 'text', register, error }) => (
	<>
		<div className='flex flex-col gap-y-1.5 w-full text-xs font-medium text-gray-600 dark:text-gray-300'>
			<div className='flex gap-x-1'>
				<label className={`${error ? 'text-red-500' : ''}`}>{label}</label>
				<span className='text-red-500'>*</span>
			</div>

			<input
				{...register}
				type={type}
				placeholder={placeholder}
				className={`w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 focus:border-gray-400 focus:outline-none dark:bg-gray-70 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-100 ${error ? 'border-red-400 dark:border-red-400' : ''}`}
			/>

			<div className='text-red-500 text-xs flex items-start gap-1 font-normal'>
				{error && (
					<>
						<BiInfoCircle size={16} /> <p>{error.message}</p>
					</>
				)}
			</div>
		</div>
	</>
)

export { InputFieldZod }
