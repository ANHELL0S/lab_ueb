import { Toaster } from 'sonner'
import { AuthProvider } from './context/AuthContext.jsx'
import { RoutesConfig } from './routes/config.routes.jsx'
import { BrowserRouter as Router } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { OfflineAlert } from './components/Banner/OfflineAlert.jsx'
import { NetworkStatusProvider } from './context/NetworkStatusContext.jsx'

function App() {
	return (
		<NetworkStatusProvider>
			<OfflineAlert />
			<ThemeProvider>
				<AuthProvider>
					<Router>
						<RoutesConfig />
					</Router>
				</AuthProvider>
			</ThemeProvider>
			<Toaster />
		</NetworkStatusProvider>
	)
}

export default App
