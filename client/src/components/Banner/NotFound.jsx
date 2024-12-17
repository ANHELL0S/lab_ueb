import { motion } from 'framer-motion'

function NotFound({ title, description, icon }) {
	const bannerVariants = {
		hidden: { opacity: 0, scale: 0.4 },
		visible: { opacity: 1, scale: 1 },
	}

	return (
		<motion.div initial='hidden' animate='visible' variants={bannerVariants} transition={{ duration: 0.15 }}>
			<div className='gap-4 text-slate-500 dark:text-slate-300 flex flex-col items-center justify-center'>
				{icon && <div>{icon}</div>}
				<h2 className='text-lg font-semibold leading-relaxed uppercase'>{title}</h2>
				<p className='text-xs font-medium text-slate-500 dark:text-slate-400'>{description}</p>
			</div>
		</motion.div>
	)
}

export { NotFound }
