import { EXPAND } from '@/models/expand';

export const generateQueryParams = (baseUrl: string, params: Record<string, any>): string => {
	const queryParams = Object.keys(params)
		.filter((key) => key && params[key] !== undefined && params[key] !== null)
		.map((key) => {
			const value = Array.isArray(params[key]) ? params[key].join(',') : params[key];
			return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
		})
		.join('&');

	return queryParams ? `${baseUrl}?${queryParams}` : baseUrl;
};

export const generateExpandParams = (values: EXPAND[]): string => {
	if (!values || values.length === 0) {
		return '';
	}
	return values.join(',');
};
