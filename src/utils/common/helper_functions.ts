import { BILLING_PERIOD } from '@/constants/constants';
import { BILLING_MODEL, Price, PRICE_TYPE } from '@/models/Price';
import { getAllISOCodes } from 'iso-country-currency';
import { v4 as uuidv4 } from 'uuid';

export function getCurrencySymbol(currency: string): string {
	try {
		const info = getAllISOCodes().filter((code) => code.currency === currency.toUpperCase());
		return info[0].symbol;
	} catch (error) {
		console.error('Error getting currency symbol', error);
		return currency;
	}
}

export function getCurrencyName(currency: string): string {
	try {
		const info = getAllISOCodes().filter((code) => code.currency === currency.toUpperCase());
		return info[0].countryName;
	} catch (error) {
		console.error('Error getting currency name', error);
		return currency;
	}
}

export const formatBillingModel = (billingModel: string) => {
	switch (billingModel.toUpperCase()) {
		case BILLING_MODEL.FLAT_FEE:
			return 'Flat Fee';
		case BILLING_MODEL.PACKAGE:
			return 'Package';
		case BILLING_MODEL.TIERED:
			return 'Tiered';
		default:
			return '--';
	}
};

/**
 * Formats billing period for price display (e.g., "50rs/month", "100rs/day")
 * @param billingPeriod - The billing period to format
 * @returns The billing period in short form (day, month, year, etc.)
 */
export const formatBillingPeriodForPrice = (billingPeriod: string) => {
	switch (billingPeriod.toUpperCase()) {
		case BILLING_PERIOD.DAILY:
			return 'day';
		case BILLING_PERIOD.WEEKLY:
			return 'week';
		case BILLING_PERIOD.MONTHLY:
			return 'month';
		case BILLING_PERIOD.ANNUAL:
			return 'year';
		case BILLING_PERIOD.QUARTERLY:
			return 'quarter';
		case BILLING_PERIOD.HALF_YEARLY:
			return 'half year';
		default:
			return '--';
	}
};

/**
 * Formats billing period for sentence display (e.g., "You will be billed monthly")
 * @param billingPeriod - The billing period to format
 * @returns The billing period in adjective form (monthly, annually, etc.)
 */
export const formatBillingPeriodForDisplay = (billingPeriod: string) => {
	switch (billingPeriod.toUpperCase()) {
		case BILLING_PERIOD.DAILY:
			return 'Daily';
		case BILLING_PERIOD.WEEKLY:
			return 'Weekly';
		case BILLING_PERIOD.MONTHLY:
			return 'Monthly';
		case BILLING_PERIOD.ANNUAL:
			return 'Annually';
		case BILLING_PERIOD.QUARTERLY:
			return 'Quarterly';
		case BILLING_PERIOD.HALF_YEARLY:
			return 'Half Yearly';
		default:
			return '--';
	}
};

export const getPriceTypeLabel = (type: string): string => {
	switch (type.toUpperCase()) {
		case PRICE_TYPE.FIXED:
			return 'Recurring';
		case PRICE_TYPE.USAGE:
			return 'Usage Based';
		default:
			return '--';
	}
};

export const toSentenceCase = (str: string): string => {
	if (!str) return str;
	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const getTotalPayableText = (recurringCharges: Price[], usageCharges: Price[], recurringTotal: number) => {
	let text = '';

	if (recurringCharges.length > 0) {
		text += `${getCurrencySymbol(recurringCharges[0].currency)}${recurringTotal}`;
	}

	if (usageCharges.length > 0) {
		if (recurringCharges.length > 0) {
			text += ' + Usage';
		} else {
			text += 'Depends on usage';
		}
	}

	return text;
};

export const getTotalPayableInfo = (recurringCharges: Price[], usageCharges: Price[], recurringTotal: number) => {
	let text = '';

	if (recurringCharges.length > 0) {
		text += `${getCurrencySymbol(recurringCharges[0].currency)}${recurringTotal}`;
	}

	if (usageCharges.length > 0) {
		if (recurringCharges.length > 0) {
			text += ' + Usage';
		} else {
			text += 'depending on usage';
		}
	}

	return text;
};

export const formatDateShort = (dateString: string): string => {
	const date = new Date(dateString);
	const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
	return date.toLocaleDateString('en-US', options);
};

/**
 * Calculates the discount amount based on coupon type and value
 * @param coupon - The coupon object
 * @param originalAmount - The original amount to apply discount to
 * @returns The discount amount
 */
export const calculateCouponDiscount = (
	coupon: { type: string; amount_off?: string; percentage_off?: string },
	originalAmount: number,
): number => {
	if (coupon.type === 'fixed' && coupon.amount_off) {
		return Math.min(parseFloat(coupon.amount_off), originalAmount);
	} else if (coupon.type === 'percentage' && coupon.percentage_off) {
		return (originalAmount * parseFloat(coupon.percentage_off)) / 100;
	}
	return 0;
};

/**
 * Calculates total discount from multiple coupons
 * @param coupons - Array of coupons to apply
 * @param originalAmount - The original amount to apply discounts to
 * @returns The total discount amount
 */
export const calculateTotalCouponDiscount = (
	coupons: { type: string; amount_off?: string; percentage_off?: string }[],
	originalAmount: number,
): number => {
	return coupons.reduce((totalDiscount, coupon) => {
		return totalDiscount + calculateCouponDiscount(coupon, originalAmount);
	}, 0);
};

/**
 * Gets the total payable text including coupon discounts
 * @param recurringCharges - Array of recurring charges
 * @param usageCharges - Array of usage charges
 * @param recurringTotal - Total recurring amount
 * @param coupons - Array of coupons to apply
 * @returns Formatted text showing total with discounts
 */
export const getTotalPayableTextWithCoupons = (
	recurringCharges: Price[],
	usageCharges: Price[],
	recurringTotal: number,
	coupons: { type: string; amount_off?: string; percentage_off?: string }[] = [],
) => {
	let text = '';

	if (recurringCharges.length > 0) {
		const currency = recurringCharges[0].currency;
		const totalDiscount = calculateTotalCouponDiscount(coupons, recurringTotal);
		const finalAmount = Math.max(0, recurringTotal - totalDiscount);

		text += `${getCurrencySymbol(currency)}${finalAmount.toFixed(2)}`;

		// Show discount information if there are coupons
		if (coupons.length > 0 && totalDiscount > 0) {
			text += ` (${getCurrencySymbol(currency)}${recurringTotal.toFixed(2)} - ${getCurrencySymbol(currency)}${totalDiscount.toFixed(2)} discount)`;
		}
	}

	if (usageCharges.length > 0) {
		if (recurringCharges.length > 0) {
			text += ' + Usage';
		} else {
			text += 'Depends on usage';
		}
	}

	return text;
};

/**
 * Gets coupon discount breakdown text
 * @param coupons - Array of coupons
 * @param originalAmount - Original amount before discounts
 * @param currency - Currency symbol
 * @returns Formatted text showing coupon breakdown
 */
export const getCouponBreakdownText = (
	coupons: { type: string; amount_off?: string; percentage_off?: string; name?: string }[],
	originalAmount: number,
	currency: string = 'USD',
) => {
	if (coupons.length === 0) return '';

	let breakdown = '';

	coupons.forEach((coupon, index) => {
		const discount = calculateCouponDiscount(coupon, originalAmount);
		if (discount > 0) {
			if (index > 0) breakdown += ', ';
			breakdown += `${coupon.name || 'Coupon'}: -${getCurrencySymbol(currency)}${discount.toFixed(2)}`;
		}
	});

	return breakdown;
};

/**
 * Generates a unique ID using Math.random()
 * @returns A unique ID
 */
export const generateUniqueId = (): string => {
	return uuidv4().replace(/-/g, '');
};

/**
 * Generates a description for conversion rate based on the rate value and price unit code
 * @param conversionRate - The conversion rate value
 * @param priceUnitCode - The price unit code (e.g., 'CRD', 'PTS')
 * @param baseCurrency - The base currency code (e.g., 'USD')
 * @returns A formatted description string
 */
export const getConversionRateDescription = (conversionRate: string | number, priceUnitCode: string, baseCurrency: string): string => {
	const rate = parseFloat(conversionRate.toString());

	if (isNaN(rate) || rate <= 0) {
		return '';
	}

	if (rate === 1) {
		return `1 ${baseCurrency.toUpperCase()} = 1 ${priceUnitCode.toUpperCase()}`;
	} else if (rate > 1) {
		return `1 ${baseCurrency.toUpperCase()} = ${rate} ${priceUnitCode.toUpperCase()}`;
	} else {
		const inverseRate = (1 / rate).toFixed(2);
		return `1 ${baseCurrency.toUpperCase()} = ${inverseRate} ${priceUnitCode.toUpperCase()}`;
	}
};

/**
 * Converts credits to currency amount based on conversion rate
 * @param credits - The number of credits
 * @param conversionRate - The conversion rate (currency per credit)
 * @returns The equivalent currency amount
 */
export const getCurrencyAmountFromCredits = (credits: number, conversionRate: number): number => {
	return credits * conversionRate;
};

/**
 * Converts currency amount to credits based on conversion rate
 * @param amount - The currency amount
 * @param conversionRate - The conversion rate (currency per credit)
 * @returns The equivalent number of credits
 */
export const getCreditsFromCurrencyAmount = (amount: number, conversionRate: number): number => {
	return amount / conversionRate;
};
