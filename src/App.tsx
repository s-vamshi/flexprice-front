import { RouterProvider } from 'react-router-dom';
import { MainRouter } from '@/core/routes/Routes';
import { UserProvider } from '@/hooks/UserContext';
import { Toaster } from 'react-hot-toast';
import { DocsProvider } from './context/DocsContext';
import ReactQueryProvider from './core/services/tanstack/ReactQueryProvider';
import { useEffect } from 'react';

const App = () => {
	const currentVersion = __APP_VERSION__;
	useEffect(() => {
		const refreshIfNewBuild = async () => {
			try {
				const res = await fetch(`/meta.json?t=${Date.now()}`, { cache: 'no-cache' });
				if (!res.ok) {
					throw new Error(`HTTP error! status: ${res.status}`);
				}
				const meta = await res.json();
				const latestVersion = meta.versionId;
				const timestamp = new Date().toISOString();
				if (latestVersion !== currentVersion) {
					console.info(`[VersionCheck][${timestamp}] New version detected. Current: ${currentVersion}, Latest: ${latestVersion}`);
					window.location.reload();
				} else {
					console.debug(`[VersionCheck][${timestamp}] App is up-to-date. Version: ${currentVersion}`);
				}
			} catch (err) {
				console.error('Error checking version', err);
			}
		};

		refreshIfNewBuild();

		const interval = setInterval(refreshIfNewBuild, 1000 * 60);
		return () => clearInterval(interval);
	}, []);

	return (
		<ReactQueryProvider>
			<UserProvider>
				<DocsProvider>
					<RouterProvider router={MainRouter} />
				</DocsProvider>

				{/* Toast Notifications */}
				<Toaster
					toastOptions={{
						success: {
							iconTheme: {
								primary: '#5CA7A0',
								secondary: '#fff',
							},
						},
						error: {
							iconTheme: {
								primary: '#E76E50',
								secondary: '#fff',
							},
						},
					}}
					position='bottom-center'
				/>
				<div id='modal-root'></div>
			</UserProvider>
		</ReactQueryProvider>
	);
};

export default App;
