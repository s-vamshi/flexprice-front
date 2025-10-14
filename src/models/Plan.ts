import { BaseModel, Metadata } from './base';
import { Entitlement } from './Entitlement';
import { Price } from './Price';
import { CreditGrant } from './CreditGrant';

export interface Plan extends BaseModel {
	readonly description: string;
	readonly lookup_key: string;
	readonly name: string;
	readonly entitlements: Entitlement[];
	readonly prices: Price[];
	readonly credit_grants: CreditGrant[];
	readonly metadata?: Metadata;
}
