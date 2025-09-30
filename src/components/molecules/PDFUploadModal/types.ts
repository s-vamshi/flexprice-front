// Contract types and scenarios for PDF processing simulation
import { BILLING_PERIOD } from '@/constants/constants';
import { BILLING_CYCLE } from '@/models/Subscription';

export enum ContractType {
	ENTERPRISE = 'enterprise',
	PROFESSIONAL = 'professional',
	STARTUP = 'startup',
	CUSTOM = 'custom',
	STANDARD = 'standard',
}

// Re-export existing enums for convenience
export { BILLING_PERIOD } from '@/constants/constants';
export { BILLING_CYCLE } from '@/models/Subscription';

export enum ProcessingStatus {
	IDLE = 'idle',
	UPLOADING = 'uploading',
	UPLOAD_COMPLETE = 'upload_complete',
	PROCESSING = 'processing',
	SUCCESS = 'success',
	ERROR = 'error',
}

export interface LineItem {
	name: string;
	price: number;
	quantity: number;
}

export interface ContractMetadata {
	contractType: ContractType;
	renewalTerm: BILLING_CYCLE;
	discount: number;
	customTerms?: boolean;
	specialConditions?: string[];
}

export interface PDFProcessedData {
	planName: string;
	billingPeriod: BILLING_PERIOD;
	currency: string; // Using string for currency to match existing system
	startDate: Date;
	endDate?: Date;
	lineItems: LineItem[];
	metadata: ContractMetadata;
	pdfFileUrl?: string; // Simple file URL for PDF
}

export interface ContractScenario {
	planName: string;
	billingPeriod: BILLING_PERIOD;
	currency: string;
	startDate: Date;
	endDate?: Date;
	lineItems: LineItem[];
	metadata: ContractMetadata;
}
