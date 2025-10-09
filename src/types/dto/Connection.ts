import { Connection } from '@/models/Connection';

export interface GetConnectionsPayload {
	status?: string;
	provider_type?: string;
	limit?: number;
	offset?: number;
}

export interface GetConnectionsResponse {
	connections: Connection[];
	total: number;
	limit: number;
	offset: number;
}

export interface CreateConnectionPayload {
	name: string;
	provider_type: string;
	encrypted_secret_data: {
		account_id?: string;
		publishable_key?: string;
		secret_key: string;
		webhook_secret: string;
	};
	sync_config: {
		plan: {
			inbound: boolean;
			outbound: boolean;
		};
		subscription: {
			inbound: boolean;
			outbound: boolean;
		};
		invoice: {
			inbound: boolean;
			outbound: boolean;
		};
	};
}

export interface UpdateConnectionPayload {
	name: string;
	sync_config: {
		plan: {
			inbound: boolean;
			outbound: boolean;
		};
		subscription: {
			inbound: boolean;
			outbound: boolean;
		};
		invoice: {
			inbound: boolean;
			outbound: boolean;
		};
	};
}
