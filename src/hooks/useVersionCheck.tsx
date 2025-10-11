import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

const isNotProd = import.meta.env.VITE_APP_ENVIRONMENT !== 'prod';
export default function useVersionCheck(intervalMs = 60 * 1000) {
	const currentVersion = __APP_VERSION__;

	useEffect(() => {
		if (!isNotProd) {
			console.log('[VersionCheck] Skipped in dev mode');
			return;
		}

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
					toast.custom(
						(t) => (
							<div
								className={`${
									t.visible ? 'animate-enter' : 'animate-leave'
								} max-w-md w-full bg-yellow-400 text-black p-4 rounded shadow-lg flex justify-between items-center`}>
								<span>New version available!</span>
								<button
									className='ml-4 bg-black text-white px-2 py-1 rounded'
									onClick={() => {
										toast.dismiss(t.id);
										window.location.reload();
									}}>
									Refresh
								</button>
							</div>
						),
						{
							duration: 1000 * 60 * 60 * 24 * 365,
							id: latestVersion,
						},
					);
				} else {
					console.debug(`[VersionCheck][${timestamp}] App is up-to-date. Version: ${currentVersion}`);
				}
			} catch (err) {
				console.error('Error checking version', err);
			}
		};

		// Run immediately
		refreshIfNewBuild();

		// Set interval
		const intervalId = setInterval(refreshIfNewBuild, intervalMs);
		return () => clearInterval(intervalId);
	}, [intervalMs]);
}
