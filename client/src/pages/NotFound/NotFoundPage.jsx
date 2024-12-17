import { PublicLayout } from '../../layouts/Public/PublicLayout'
import { NotFoundSection } from '../../features/404/404'

const NotFoundPage = () => {
	return (
		<>
			<PublicLayout>
				<NotFoundSection />
			</PublicLayout>
		</>
	)
}

export default NotFoundPage
