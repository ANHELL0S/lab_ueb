import { UserSection } from '../../features/User/User'
import { PrivateLayout } from '../../layouts/Private/PrivateLayout'

const userPage = () => {
	return (
		<PrivateLayout>
			<UserSection />
		</PrivateLayout>
	)
}

export default userPage
