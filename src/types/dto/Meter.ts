import { Meter, METER_AGGREGATION_TYPE, METER_USAGE_RESET_PERIOD, Pagination, BUCKET_SIZE } from '@/models';

// ============================================
// Meter Request Types
// ============================================

export interface MeterFilter {
	key: string;
	values: string[];
}

export interface MeterAggregation {
	type: METER_AGGREGATION_TYPE;
	field?: string;
	multiplier?: number;
	bucket_size?: BUCKET_SIZE;
}

export interface CreateMeterRequest {
	name: string;
	event_name: string;
	aggregation: MeterAggregation;
	reset_usage: METER_USAGE_RESET_PERIOD;
	filters?: MeterFilter[];
}

export interface UpdateMeterRequest {
	filters?: MeterFilter[];
}

// ============================================
// Meter Response Types
// ============================================

export type MeterResponse = Meter;

export interface GetAllMetersResponse {
	items: Meter[];
	pagination: Pagination;
}

export interface ListMetersResponse {
	items: MeterResponse[];
	pagination: Pagination;
}
