import {
	CreditGrant,
	Pagination,
	CREDIT_GRANT_CADENCE,
	CREDIT_GRANT_PERIOD,
	CREDIT_GRANT_EXPIRATION_TYPE,
	CREDIT_GRANT_PERIOD_UNIT,
	CREDIT_SCOPE,
	Metadata,
} from '@/models';
import { QueryFilter, TimeRangeFilter } from './base';

// ============================================
// Credit Grant Request Types
// ============================================

export interface CreateCreditGrantRequest {
	name: string;
	scope: CREDIT_SCOPE;
	plan_id?: string;
	subscription_id?: string;
	credits: number;
	cadence: CREDIT_GRANT_CADENCE;
	period?: CREDIT_GRANT_PERIOD;
	period_count?: number;
	expiration_type?: CREDIT_GRANT_EXPIRATION_TYPE;
	expiration_duration?: number;
	expiration_duration_unit?: CREDIT_GRANT_PERIOD_UNIT;
	priority?: number;
	metadata?: Metadata;
}

export interface UpdateCreditGrantRequest {
	name?: string;
	metadata?: Metadata;
}

// ============================================
// Credit Grant Response Types
// ============================================

export type CreditGrantResponse = CreditGrant;

export interface ListCreditGrantsResponse extends Pagination {
	items: CreditGrantResponse[];
}

export interface GetCreditGrantsResponse extends Pagination {
	items: CreditGrant[];
}

export interface GetCreditGrantsRequest extends QueryFilter, TimeRangeFilter {
	subscription_ids?: string[];
	plan_ids?: string[];
}

export interface ProcessScheduledCreditGrantApplicationsResponse {
	success_applications_count: number;
	failed_applications_count: number;
	total_applications_count: number;
}
