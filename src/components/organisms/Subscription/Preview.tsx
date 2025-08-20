import { Price, PRICE_TYPE } from '@/models/Price';
import { useMemo } from 'react';
import {
	formatBillingPeriodForDisplay,
	calculateCouponDiscount,
	getCurrencySymbol,
	calculateTotalCouponDiscount,
} from '@/utils/common/helper_functions';
import { BILLING_PERIOD } from '@/constants/constants';
import { BILLING_CYCLE, SubscriptionPhase } from '@/models/Subscription';
import formatDate from '@/utils/common/format_date';
import { calculateAnniversaryBillingAnchor, calculateCalendarBillingAnchor } from '@/utils/helpers/subscription';
import { cn } from '@/lib/utils';
import { Calendar, Receipt } from 'lucide-react';
import TimelinePreview, { PreviewTimelineItem } from './TimelinePreview';
import { ExpandedPlan } from '@/types/plan';
import { Coupon } from '@/models/Coupon';
import { getCurrentPriceAmount } from '@/utils/common/price_override_helpers';
import { TaxRateOverride } from '@/types/dto/tax';
import { AddAddonToSubscriptionRequest } from '@/types/dto/Addon';
import { useQuery } from '@tanstack/react-query';
import AddonApi from '@/api/AddonApi';

const PERIOD_DURATION: Record<BILLING_PERIOD, string> = {
	[BILLING_PERIOD.DAILY]: '1 day',
	[BILLING_PERIOD.WEEKLY]: '1 week',
	[BILLING_PERIOD.MONTHLY]: '1 month',
	[BILLING_PERIOD.QUARTERLY]: '3 months',
	[BILLING_PERIOD.HALF_YEARLY]: '6 months',
	[BILLING_PERIOD.ANNUAL]: '1 year',
} as const;

interface PreviewProps {
	data: Price[];
	className?: string;
	selectedPlan?: ExpandedPlan | null;
	phases: SubscriptionPhase[];
	coupons?: Coupon[];
	priceOverrides?: Record<string, string>;
	lineItemCoupons?: Record<string, Coupon>;
	taxRateOverrides?: TaxRateOverride[];
	addons?: AddAddonToSubscriptionRequest[];
}

/**
 * Component that displays subscription preview information including start date and first invoice details
 *
 * Pricing Logic:
 * 1. Plan charges: FIXED charges from the plan (separate from addons)
 * 2. Addon charges: Calculated separately based on addon requests
 * 3. Line-item discounts: Applied to individual plan charges only
 * 4. Subscription discounts: Applied to plan total after line-item discounts
 * 5. Tax: Applied to total (plan after discounts + addons)
 */

// ============================================================================
// PRICING CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculates plan pricing with line-item discounts
 */
const calculatePlanPricing = (planCharges: Price[], priceOverrides: Record<string, string>, lineItemCoupons: Record<string, Coupon>) => {
	let total = 0;
	let originalTotal = 0;
	let totalDiscount = 0;
	const lineItemDiscounts: Record<string, number> = {};

	planCharges.forEach((charge) => {
		const currentAmount = getCurrentPriceAmount(charge, priceOverrides);
		const chargeAmount = parseFloat(currentAmount);
		originalTotal += chargeAmount; // Always add to original total

		// Only apply line item coupons to FIXED charges, not USAGE/metered charges
		if (charge.type === PRICE_TYPE.FIXED) {
			const chargeCoupon = lineItemCoupons[charge.id];
			const chargeDiscount = chargeCoupon ? calculateCouponDiscount(chargeCoupon, chargeAmount) : 0;

			lineItemDiscounts[charge.id] = chargeDiscount;
			totalDiscount += chargeDiscount;
			total += Math.max(0, chargeAmount - chargeDiscount);
		} else {
			// For usage charges, just add the amount without line item coupon discount
			total += chargeAmount;
		}
	});

	return { total, originalTotal, lineItemDiscounts, totalDiscount };
};

/**
 * Calculates addon pricing based on addon requests
 */
const calculateAddonPricing = (addons: AddAddonToSubscriptionRequest[], allAddons: any[], billingPeriod: string, currency: string) => {
	let total = 0;
	const addonDetails: Array<{ name: string; amount: number }> = [];

	addons.forEach((addonRequest) => {
		const addon = allAddons.find((a) => a.id === addonRequest.addon_id);
		if (addon?.prices) {
			// Find the price that matches the billing period and currency
			const matchingPrice = addon.prices.find(
				(price: Price) =>
					price.billing_period.toLowerCase() === billingPeriod.toLowerCase() &&
					price.currency.toLowerCase() === currency.toLowerCase() &&
					price.type === PRICE_TYPE.FIXED,
			);

			if (matchingPrice) {
				const amount = parseFloat(matchingPrice.amount);
				total += amount;
				addonDetails.push({
					name: addon.name,
					amount: amount,
				});
			}
		}
	});

	return { total, addonDetails };
};

/**
 * Calculates tax amount based on tax rate overrides
 */
const calculateTaxAmount = (subtotal: number, taxRateOverrides: TaxRateOverride[], currency: string): number => {
	if (!taxRateOverrides || taxRateOverrides.length === 0) return 0;

	// Filter tax overrides for the current currency and auto-apply enabled
	const applicableTaxes = taxRateOverrides.filter((tax) => tax.currency.toLowerCase() === currency.toLowerCase() && tax.auto_apply);

	// For demo purposes, applying a 10% tax when applicable taxes exist
	// TODO: Implement proper tax rate fetching and calculation
	if (applicableTaxes.length > 0) {
		return subtotal * 0.1;
	}

	return 0;
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Determines if any charge has ADVANCE invoice cadence
 */
const hasAdvanceCharge = (charges: Price[]): boolean => {
	return charges?.some((charge) => charge.invoice_cadence === 'ADVANCE') ?? false;
};

/**
 * Generates billing description based on charges and billing period
 */
const getBillingDescription = (charges: Price[], billingPeriod: BILLING_PERIOD, date: Date): string => {
	const period = PERIOD_DURATION[billingPeriod] || formatBillingPeriodForDisplay(billingPeriod).toLowerCase();
	return hasAdvanceCharge(charges) ? `Bills immediately for ${period}` : `Bills on ${formatDate(date)} for ${period}`;
};

/**
 * Calculates the first invoice date based on billing cycle and period
 */
const calculateFirstInvoiceDate = (startDate: Date, billingPeriod: BILLING_PERIOD, billingCycle: BILLING_CYCLE): Date => {
	return billingCycle === BILLING_CYCLE.CALENDAR
		? calculateCalendarBillingAnchor(startDate, billingPeriod)
		: calculateAnniversaryBillingAnchor(startDate, billingPeriod);
};

// ============================================================================
// INVOICE PREVIEW COMPONENT
// ============================================================================

/**
 * Renders the invoice preview section with pricing breakdown
 */
const InvoicePreview = ({
	planOriginalTotal,
	addonTotal,
	addonDetails,
	lineItemTotalDiscount,
	subscriptionCouponDiscount,
	taxAmount,
	finalTotal,
	currency,
	billingDescription,
	totalCoupons,
	totalLineItemCoupons,
}: {
	planOriginalTotal: number;
	addonTotal: number;
	addonDetails: Array<{ name: string; amount: number }>;
	lineItemTotalDiscount: number;
	subscriptionCouponDiscount: number;
	taxAmount: number;
	finalTotal: number;
	currency: string;
	billingDescription: string;
	totalCoupons: number;
	totalLineItemCoupons: number;
}) => (
	<div>
		<div className='space-y-1'>
			{/* Plan Subtotal */}
			<p className='text-sm text-gray-600'>
				Plan: {getCurrencySymbol(currency || 'USD')}
				{planOriginalTotal.toFixed(2)}
			</p>

			{/* Addons */}
			{addonTotal > 0 && (
				<>
					<p className='text-sm text-gray-600'>
						Addons: {getCurrencySymbol(currency || 'USD')}
						{addonTotal.toFixed(2)}
					</p>
					{addonDetails.map((addon, index) => (
						<p key={index} className='text-xs text-gray-500 ml-4'>
							• {addon.name}: {getCurrencySymbol(currency || 'USD')}
							{addon.amount.toFixed(2)}
						</p>
					))}
				</>
			)}

			{/* Subtotal before discounts */}
			{(lineItemTotalDiscount > 0 || subscriptionCouponDiscount > 0) && (
				<p className='text-sm text-gray-600'>
					Subtotal: {getCurrencySymbol(currency || 'USD')}
					{(planOriginalTotal + addonTotal).toFixed(2)}
				</p>
			)}

			{/* Discounts */}
			{totalCoupons > 0 && (
				<>
					{lineItemTotalDiscount > 0 && (
						<p className='text-sm text-blue-600'>
							Line-item discounts: -{getCurrencySymbol(currency || 'USD')}
							{lineItemTotalDiscount.toFixed(2)}
						</p>
					)}
					{subscriptionCouponDiscount > 0 && (
						<p className='text-sm text-blue-600'>
							Subscription discount: -{getCurrencySymbol(currency || 'USD')}
							{subscriptionCouponDiscount.toFixed(2)}
						</p>
					)}
				</>
			)}

			{/* Tax */}
			{taxAmount > 0 && (
				<p className='text-sm text-gray-600'>
					Tax: {getCurrencySymbol(currency || 'USD')}
					{taxAmount.toFixed(2)}
				</p>
			)}

			{/* Final total */}
			<p className='text-sm text-gray-900 font-semibold border-t border-gray-200 pt-1'>
				Net payable: {getCurrencySymbol(currency || 'USD')}
				{finalTotal.toFixed(2)}
			</p>
		</div>

		{totalCoupons > 0 && (
			<p className='text-xs text-gray-500 mt-2'>
				{totalCoupons} coupon{totalCoupons > 1 ? 's' : ''} applied
				{lineItemTotalDiscount > 0 && totalLineItemCoupons > 0 && (
					<span className='ml-1'>
						({totalLineItemCoupons} line-item, {totalCoupons - totalLineItemCoupons} subscription)
					</span>
				)}
			</p>
		)}

		<p className='text-sm text-gray-600 mt-2'>{billingDescription}</p>
	</div>
);

/**
 * Component that displays subscription preview information including start date and first invoice details
 *
 * Pricing Logic:
 * 1. Plan charges: FIXED charges from the plan (separate from addons)
 * 2. Addon charges: Calculated separately based on addon requests
 * 3. Line-item discounts: Applied to individual plan charges only
 * 4. Subscription discounts: Applied to plan total after line-item discounts
 * 5. Tax: Applied to total (plan after discounts + addons)
 */
const Preview = ({
	data, // Plan prices only (excluding addons)
	className,
	phases,
	coupons = [],
	priceOverrides = {},
	lineItemCoupons = {},
	taxRateOverrides = [],
	addons = [],
}: PreviewProps) => {
	// ============================================================================
	// INITIALIZATION & DATA FETCHING
	// ============================================================================

	const firstPhase = phases.at(0);
	const startDate = firstPhase?.start_date;
	const billingCycle = firstPhase?.billing_cycle || BILLING_CYCLE.ANNIVERSARY;

	// Fetch addons data for calculation
	const { data: allAddons = [] } = useQuery({
		queryKey: ['addons'],
		queryFn: async () => {
			const response = await AddonApi.ListAddon({ limit: 1000, offset: 0 });
			return response.items;
		},
		staleTime: 5 * 60 * 1000,
		refetchOnWindowFocus: false,
	});

	// ============================================================================
	// PLAN PRICING CALCULATIONS
	// ============================================================================

	// Filter only FIXED charges from plan (excludes USAGE/metered charges)
	const recurringCharges = useMemo(() => data.filter((charge) => charge.type === PRICE_TYPE.FIXED), [data]);

	// Calculate plan pricing with line-item discounts applied
	const {
		total: recurringTotal,
		originalTotal: recurringOriginalTotal,
		totalDiscount: lineItemTotalDiscount,
	} = useMemo(() => {
		return calculatePlanPricing(recurringCharges, priceOverrides, lineItemCoupons);
	}, [recurringCharges, priceOverrides, lineItemCoupons]);

	// ============================================================================
	// ADDON PRICING CALCULATIONS
	// ============================================================================

	// Get billing period and currency from plan data
	const billingPeriod = useMemo(() => data[0]?.billing_period.toUpperCase() as BILLING_PERIOD, [data]);
	const currency = useMemo(() => recurringCharges[0]?.currency || 'USD', [recurringCharges]);

	// Calculate addon pricing separately from plan pricing
	const { total: addonTotal, addonDetails } = useMemo(() => {
		return calculateAddonPricing(addons, allAddons, billingPeriod, currency);
	}, [addons, allAddons, billingPeriod, currency]);

	// ============================================================================
	// DISCOUNT CALCULATIONS
	// ============================================================================

	// Calculate subscription-level coupon discount (applies only to plan after line-item discounts, not addons)
	const subscriptionCouponDiscount = useMemo(() => {
		if (coupons.length === 0) return 0;
		return calculateTotalCouponDiscount(coupons, recurringTotal);
	}, [coupons, recurringTotal]);

	// Calculate plan subtotal after all discounts (addons are separate)
	const planSubtotalAfterDiscounts = useMemo(() => {
		return Math.max(0, recurringTotal - subscriptionCouponDiscount);
	}, [recurringTotal, subscriptionCouponDiscount]);

	// ============================================================================
	// TAX & FINAL CALCULATIONS
	// ============================================================================

	// Calculate total before tax (plan after discount + addons)
	const totalBeforeTax = useMemo(() => {
		return planSubtotalAfterDiscounts + addonTotal;
	}, [planSubtotalAfterDiscounts, addonTotal]);

	// Calculate tax amount (applied to total: plan after discount + addons)
	const taxAmount = useMemo(() => {
		return calculateTaxAmount(totalBeforeTax, taxRateOverrides, currency);
	}, [totalBeforeTax, taxRateOverrides, currency]);

	// Calculate final total including tax
	const finalTotal = useMemo(() => {
		return totalBeforeTax + taxAmount;
	}, [totalBeforeTax, taxAmount]);

	// ============================================================================
	// TIMELINE GENERATION
	// ============================================================================

	const firstInvoiceDate = useMemo(() => {
		return startDate ? calculateFirstInvoiceDate(startDate as Date, billingPeriod, billingCycle) : undefined;
	}, [billingCycle, billingPeriod, startDate]);

	const billingDescription = useMemo(() => {
		return firstInvoiceDate ? getBillingDescription(data, billingPeriod, firstInvoiceDate) : '';
	}, [data, billingPeriod, firstInvoiceDate]);

	const timelineItems = useMemo(() => {
		const items: PreviewTimelineItem[] = phases.map((phase, index) => ({
			icon: <Calendar className='h-[22px] w-[22px] text-gray-500 shrink-0' />,
			subtitle: index === 0 ? 'Subscription Start' : 'Subscription Updates',
			label: formatDate(phase.start_date),
		}));

		// Calculate total coupons and discounts
		const totalLineItemCoupons = Object.keys(lineItemCoupons).length;
		const totalCoupons = coupons.length + totalLineItemCoupons;

		// Insert first invoice preview after the first item
		const invoicePreview: PreviewTimelineItem = {
			icon: <Receipt className='h-[22px] w-[22px] text-gray-500 shrink-0' />,
			subtitle: (
				<InvoicePreview
					planOriginalTotal={recurringOriginalTotal}
					addonTotal={addonTotal}
					addonDetails={addonDetails}
					lineItemTotalDiscount={lineItemTotalDiscount}
					subscriptionCouponDiscount={subscriptionCouponDiscount}
					taxAmount={taxAmount}
					finalTotal={finalTotal}
					currency={currency}
					billingDescription={billingDescription}
					totalCoupons={totalCoupons}
					totalLineItemCoupons={totalLineItemCoupons}
				/>
			),
			label: `First invoice: ${firstInvoiceDate ? formatDate(firstInvoiceDate) : ''}`,
		};

		const updatedItems = [items[0], invoicePreview, ...items.slice(1)];

		// Add end date if it exists
		const lastPhase = phases[phases.length - 1];
		if (lastPhase.end_date) {
			updatedItems.push({
				icon: <Calendar className='h-[22px] w-[22px] text-gray-500 shrink-0' />,
				subtitle: 'Subscription ends',
				label: formatDate(lastPhase.end_date),
			});
		}

		return updatedItems;
	}, [
		phases,
		firstInvoiceDate,
		recurringOriginalTotal,
		addonTotal,
		addonDetails,
		billingDescription,
		coupons,
		lineItemCoupons,
		lineItemTotalDiscount,
		subscriptionCouponDiscount,
		taxAmount,
		finalTotal,
		currency,
	]);

	return (
		<div className={cn('w-full', className)}>
			<TimelinePreview items={timelineItems} />
		</div>
	);
};

export default Preview;
