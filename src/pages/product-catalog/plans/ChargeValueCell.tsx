import { BILLING_MODEL, Price, PRICE_UNIT_TYPE } from '@/models/Price';
import { getRegularPriceTableCharge, getCustomPriceTableCharge, calculateDiscountedPrice } from '@/utils/common/price_helpers';
import { Info } from 'lucide-react';
import { formatAmount } from '@/components/atoms/Input/Input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { Coupon } from '@/models/Coupon';
import formatCouponName from '@/utils/common/format_coupon_name';
import { useMemo } from 'react';

interface BaseProps {
	data: Price;
	overriddenAmount?: string;
	appliedCoupon?: Coupon | null;
}

type RegularChargeValueCellProps = BaseProps;
type CustomPricingChargeValueCellProps = BaseProps;

// Component for regular charges (non-custom pricing)
export const RegularChargeValueCell = ({ data, overriddenAmount, appliedCoupon }: RegularChargeValueCellProps) => {
	const { price, tiers, isTiered, discountInfo } = useMemo(() => {
		const priceData = overriddenAmount ? { ...data, amount: overriddenAmount } : data;
		const priceString = getRegularPriceTableCharge(priceData as any);

		const tierData = data.tiers as unknown as Array<{
			up_to: number | null;
			unit_amount: string;
			flat_amount: string;
		}> | null;

		const hasTiers = data.billing_model === BILLING_MODEL.TIERED && Array.isArray(tierData) && tierData.length > 0;
		const discount = !overriddenAmount && appliedCoupon ? calculateDiscountedPrice(data, appliedCoupon) : null;

		return {
			price: priceString,
			tiers: tierData,
			isTiered: hasTiers,
			discountInfo: discount,
		};
	}, [data, overriddenAmount, appliedCoupon]);

	const formatRange = useMemo(() => {
		return (tier: any, index: number, allTiers: any[]) => {
			const from = index === 0 ? 1 : allTiers[index - 1].up_to + 1;
			return tier.up_to === null || index === allTiers.length - 1 ? `${from} - ∞` : `${from} - ${tier.up_to}`;
		};
	}, []);

	return (
		<div className='flex items-center gap-2'>
			{discountInfo ? (
				<div className='flex items-center gap-2'>
					<div className='flex flex-col'>
						<div className='line-through text-gray-400 text-sm'>
							{getCurrencySymbol(data.currency)}
							{formatAmount(discountInfo.originalAmount.toString())}
						</div>
						<div className='text-gray-900 font-medium'>
							{getCurrencySymbol(data.currency)}
							{formatAmount(discountInfo.discountedAmount.toString())}
						</div>
					</div>
					<TooltipProvider delayDuration={0}>
						<Tooltip>
							<TooltipTrigger>
								<Info className='h-4 w-4 text-blue-500 hover:text-blue-600 transition-colors duration-150' />
							</TooltipTrigger>
							<TooltipContent
								sideOffset={5}
								className='bg-white border border-gray-200 shadow-lg text-sm text-gray-900 px-3 py-2 rounded-lg'>
								<div className='font-medium'>{appliedCoupon ? formatCouponName(appliedCoupon) : 'No coupon applied'}</div>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			) : (
				<div>{price}</div>
			)}
			{isTiered && (
				<TooltipProvider delayDuration={0}>
					<Tooltip>
						<TooltipTrigger>
							<Info className='h-4 w-4 text-gray-400 hover:text-gray-500 transition-colors duration-150' />
						</TooltipTrigger>
						<TooltipContent
							sideOffset={5}
							className='bg-white border border-gray-200 shadow-lg text-sm text-gray-900 px-4 py-3 rounded-lg max-w-[320px]'>
							<div className='space-y-3'>
								<div className='font-medium border-b border-spacing-1 border-gray-200 pb-2 text-base text-gray-900'>Volume Pricing</div>
								<div className='space-y-2'>
									{tiers?.map((tier, index) => (
										<div key={index} className='flex flex-col gap-1'>
											<div className='flex items-center justify-between gap-6'>
												<div className='!font-normal text-muted-foreground'>
													{formatRange(tier, index, tiers)}
													{' units'}
												</div>
												<div className='text-right'>
													<div className='!font-normal text-muted-foreground'>
														{getCurrencySymbol(data.currency)}
														{formatAmount(tier.unit_amount)}
														{' per unit'}
													</div>
													{Number(tier.flat_amount) > 0 && (
														<div className='text-xs text-gray-500'>
															+ {getCurrencySymbol(data.currency)}
															{formatAmount(tier.flat_amount)}
															{' flat fee'}
														</div>
													)}
												</div>
											</div>
											{index < tiers.length - 1 && <div className='h-px bg-gray-100' />}
										</div>
									))}
								</div>
							</div>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			)}
		</div>
	);
};

// Component for custom pricing charges
export const CustomPricingChargeValueCell = ({ data, overriddenAmount, appliedCoupon }: CustomPricingChargeValueCellProps) => {
	const { currencySymbol, price, tiers, isTiered, discountInfo } = useMemo(() => {
		const symbol = data.pricing_unit?.symbol || getCurrencySymbol(data.currency || '');

		const priceWithOverride = overriddenAmount ? { ...data, amount: overriddenAmount } : data;
		const priceString = getCustomPriceTableCharge(priceWithOverride as any);

		const tierData =
			data.price_unit_config?.price_unit_tiers ||
			(data.price_unit_tiers as unknown as Array<{
				up_to: number | null;
				unit_amount: string;
				flat_amount: string;
			}> | null);

		const hasTiers = data.billing_model === BILLING_MODEL.TIERED && Array.isArray(tierData) && tierData.length > 0;
		const discount = !overriddenAmount && appliedCoupon ? calculateDiscountedPrice(data, appliedCoupon) : null;

		return {
			currencySymbol: symbol,
			price: priceString,
			tiers: tierData,
			isTiered: hasTiers,
			discountInfo: discount,
		};
	}, [data, overriddenAmount, appliedCoupon]);

	const formatRange = useMemo(() => {
		return (tier: any, index: number, allTiers: any[]) => {
			const from = index === 0 ? 1 : allTiers[index - 1].up_to + 1;
			return tier.up_to === null || index === allTiers.length - 1 ? `${from} - ∞` : `${from} - ${tier.up_to}`;
		};
	}, []);

	if (data.price_unit_type !== PRICE_UNIT_TYPE.CUSTOM) {
		return '--';
	}

	return (
		<div className='flex items-center gap-2'>
			{discountInfo ? (
				<div className='flex items-center gap-2'>
					<div className='flex flex-col'>
						<div className='line-through text-gray-400 text-sm'>
							{currencySymbol}
							{formatAmount(discountInfo.originalAmount.toString())}
						</div>
						<div className='text-gray-900 font-medium'>
							{currencySymbol}
							{formatAmount(discountInfo.discountedAmount.toString())}
						</div>
					</div>
					<TooltipProvider delayDuration={0}>
						<Tooltip>
							<TooltipTrigger>
								<Info className='h-4 w-4 text-blue-500 hover:text-blue-600 transition-colors duration-150' />
							</TooltipTrigger>
							<TooltipContent
								sideOffset={5}
								className='bg-white border border-gray-200 shadow-lg text-sm text-gray-900 px-3 py-2 rounded-lg'>
								<div className='font-medium'>{appliedCoupon ? formatCouponName(appliedCoupon) : 'No coupon applied'}</div>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			) : (
				<div>{price}</div>
			)}
			{isTiered && (
				<TooltipProvider delayDuration={0}>
					<Tooltip>
						<TooltipTrigger>
							<Info className='h-4 w-4 text-gray-400 hover:text-gray-500 transition-colors duration-150' />
						</TooltipTrigger>
						<TooltipContent
							sideOffset={5}
							className='bg-white border border-gray-200 shadow-lg text-sm text-gray-900 px-4 py-3 rounded-lg max-w-[320px]'>
							<div className='space-y-3'>
								<div className='font-medium border-b border-spacing-1 border-gray-200 pb-2 text-base text-gray-900'>
									Custom Pricing Tiers
								</div>
								<div className='space-y-2'>
									{tiers?.map((tier, index) => (
										<div key={index} className='flex flex-col gap-1'>
											<div className='flex items-center justify-between gap-6'>
												<div className='!font-normal text-muted-foreground'>
													{formatRange(tier, index, tiers)}
													{' units'}
												</div>
												<div className='text-right'>
													<div className='!font-normal text-muted-foreground'>
														{currencySymbol}
														{formatAmount(tier.unit_amount || '0')}
														{' per unit'}
													</div>
													{Number(tier.flat_amount) > 0 && (
														<div className='text-xs text-gray-500'>
															+ {currencySymbol}
															{formatAmount(tier.flat_amount || '0')}
															{' flat fee'}
														</div>
													)}
												</div>
											</div>
											{index < tiers.length - 1 && <div className='h-px bg-gray-100' />}
										</div>
									))}
								</div>
							</div>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			)}
		</div>
	);
};

// Main component that routes to the appropriate sub-component
type Props = BaseProps;

const ChargeValueCell = ({ data, overriddenAmount, appliedCoupon }: Props) => {
	const isCustomPricing = data.price_unit_type === PRICE_UNIT_TYPE.CUSTOM;

	if (isCustomPricing) {
		return <CustomPricingChargeValueCell data={data} overriddenAmount={overriddenAmount} appliedCoupon={appliedCoupon} />;
	}

	return <RegularChargeValueCell data={data} overriddenAmount={overriddenAmount} appliedCoupon={appliedCoupon} />;
};

export default ChargeValueCell;
