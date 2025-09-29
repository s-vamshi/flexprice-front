import { ContractScenario, ContractType, BILLING_PERIOD, BILLING_CYCLE } from './types';

// Contract scenarios factory for different contract types
export class ContractScenarioFactory {
	private static scenarios: Map<string, ContractScenario> = new Map();

	static {
		// Initialize all contract scenarios
		this.initializeScenarios();
	}

	private static initializeScenarios(): void {
		// Enterprise Contract
		this.scenarios.set('enterprise', {
			planName: 'Enterprise',
			billingPeriod: BILLING_PERIOD.ANNUAL,
			currency: 'usd',
			startDate: new Date(),
			endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
			lineItems: [
				{ name: 'Base Subscription', price: 5000, quantity: 1 },
				{ name: 'Advanced Analytics', price: 1000, quantity: 1 },
				{ name: 'Priority Support', price: 500, quantity: 1 },
				{ name: 'Custom Integrations', price: 2000, quantity: 1 },
			],
			metadata: {
				contractType: ContractType.ENTERPRISE,
				renewalTerm: BILLING_CYCLE.ANNIVERSARY,
				discount: 0.15,
				specialConditions: ['SLA Guarantee', 'Dedicated Support'],
			},
		});

		// Professional Contract
		this.scenarios.set('professional', {
			planName: 'Professional',
			billingPeriod: BILLING_PERIOD.MONTHLY,
			currency: 'usd',
			startDate: new Date(),
			lineItems: [
				{ name: 'Base Subscription', price: 299, quantity: 1 },
				{ name: 'API Access', price: 99, quantity: 1 },
				{ name: 'Advanced Reporting', price: 149, quantity: 1 },
			],
			metadata: {
				contractType: ContractType.PROFESSIONAL,
				renewalTerm: BILLING_CYCLE.ANNIVERSARY,
				discount: 0.05,
			},
		});

		// Startup Contract
		this.scenarios.set('startup', {
			planName: 'Startup',
			billingPeriod: BILLING_PERIOD.MONTHLY,
			currency: 'usd',
			startDate: new Date(),
			lineItems: [
				{ name: 'Base Subscription', price: 99, quantity: 1 },
				{ name: 'Basic Support', price: 29, quantity: 1 },
			],
			metadata: {
				contractType: ContractType.STARTUP,
				renewalTerm: BILLING_CYCLE.ANNIVERSARY,
				discount: 0.1,
			},
		});

		// Custom Contract
		this.scenarios.set('custom', {
			planName: 'Custom',
			billingPeriod: BILLING_PERIOD.QUARTERLY,
			currency: 'usd',
			startDate: new Date(),
			endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months from now
			lineItems: [
				{ name: 'Custom Feature A', price: 1500, quantity: 2 },
				{ name: 'Custom Feature B', price: 800, quantity: 1 },
				{ name: 'Setup Fee', price: 2000, quantity: 1 },
				{ name: 'Training Sessions', price: 500, quantity: 4 },
			],
			metadata: {
				contractType: ContractType.CUSTOM,
				renewalTerm: BILLING_CYCLE.ANNIVERSARY,
				discount: 0.2,
				customTerms: true,
				specialConditions: ['Custom Development', 'Flexible Terms'],
			},
		});

		// Standard Contract
		this.scenarios.set('standard', {
			planName: 'Standard',
			billingPeriod: BILLING_PERIOD.MONTHLY,
			currency: 'usd',
			startDate: new Date(),
			lineItems: [{ name: 'Base Subscription', price: 199, quantity: 1 }],
			metadata: {
				contractType: ContractType.STANDARD,
				renewalTerm: BILLING_CYCLE.ANNIVERSARY,
				discount: 0,
			},
		});

		// Premium Contract
		this.scenarios.set('premium', {
			planName: 'Premium',
			billingPeriod: BILLING_PERIOD.ANNUAL,
			currency: 'usd',
			startDate: new Date(),
			endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
			lineItems: [
				{ name: 'Base Subscription', price: 1200, quantity: 1 },
				{ name: 'Premium Features', price: 300, quantity: 1 },
				{ name: 'Priority Support', price: 200, quantity: 1 },
			],
			metadata: {
				contractType: ContractType.PROFESSIONAL, // Using professional as base
				renewalTerm: BILLING_CYCLE.ANNIVERSARY,
				discount: 0.12,
			},
		});

		// Basic Contract
		this.scenarios.set('basic', {
			planName: 'Basic',
			billingPeriod: BILLING_PERIOD.MONTHLY,
			currency: 'usd',
			startDate: new Date(),
			lineItems: [{ name: 'Base Subscription', price: 49, quantity: 1 }],
			metadata: {
				contractType: ContractType.STANDARD,
				renewalTerm: BILLING_CYCLE.ANNIVERSARY,
				discount: 0,
			},
		});
	}

	/**
	 * Get contract scenario by key
	 */
	static getScenario(key: string): ContractScenario | undefined {
		return this.scenarios.get(key.toLowerCase());
	}

	/**
	 * Get all available scenario keys
	 */
	static getAvailableKeys(): string[] {
		return Array.from(this.scenarios.keys());
	}

	/**
	 * Find matching scenario based on filename patterns
	 */
	static findMatchingScenario(fileName: string): ContractScenario {
		const baseFileName = fileName.toLowerCase().replace('.pdf', '');

		// Try exact matches first
		for (const key of this.scenarios.keys()) {
			if (baseFileName.includes(key)) {
				return this.scenarios.get(key)!;
			}
		}

		// Try partial matches
		for (const key of this.scenarios.keys()) {
			if (key.includes(baseFileName) || baseFileName.includes(key)) {
				return this.scenarios.get(key)!;
			}
		}

		// Try keyword matches
		const keywords = {
			enterprise: 'enterprise',
			corporate: 'enterprise',
			business: 'professional',
			pro: 'professional',
			professional: 'professional',
			startup: 'startup',
			small: 'startup',
			custom: 'custom',
			tailored: 'custom',
			premium: 'premium',
			advanced: 'premium',
			basic: 'basic',
			simple: 'basic',
			standard: 'standard',
			regular: 'standard',
		};

		for (const [keyword, scenarioKey] of Object.entries(keywords)) {
			if (baseFileName.includes(keyword)) {
				const scenario = this.scenarios.get(scenarioKey);
				if (scenario) {
					return scenario;
				}
			}
		}

		// Default fallback
		return this.scenarios.get('standard')!;
	}

	/**
	 * Create a custom scenario with overrides
	 */
	static createCustomScenario(baseScenario: ContractScenario, overrides: Partial<ContractScenario>): ContractScenario {
		return {
			...baseScenario,
			...overrides,
			metadata: {
				...baseScenario.metadata,
				...overrides.metadata,
			},
		};
	}
}
