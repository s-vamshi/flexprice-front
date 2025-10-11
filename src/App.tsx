import { RouterProvider } from 'react-router-dom';
import { MainRouter } from '@/core/routes/Routes';
import { UserProvider } from '@/hooks/UserContext';
import { Toaster } from 'react-hot-toast';
import { DocsProvider } from './context/DocsContext';
import ReactQueryProvider from './core/services/tanstack/ReactQueryProvider';
import { useEffect } from 'react';

const App = () => {
	useEffect(() => {
		const currentVersion = __APP_VERSION__;
		const refreshIfNewBuild = () => {
			fetch(`/meta.json?t=${Date.now()}`, { cache: 'no-cache' })
				.then((res) => res.json())
				.then((meta) => {
					const latestVersion = meta.versionId;
					if (latestVersion !== currentVersion) {
						console.log('New version detected', latestVersion, currentVersion);
						if ('caches' in window) {
							caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
						}
						window.location.reload();
					} else {
						console.log('No updates');
					}
				})
				.catch((err) => console.error('Error checking version', err));
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
