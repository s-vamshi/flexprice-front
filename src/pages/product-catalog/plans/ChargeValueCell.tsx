import { BILLING_MODEL, Price, TIER_MODE } from '@/models/Price';
import { getPriceTableCharge, calculateDiscountedPrice } from '@/utils/common/price_helpers';
import { Info } from 'lucide-react';
import { formatAmount } from '@/components/atoms/Input/Input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { Coupon } from '@/models/Coupon';
import formatCouponName from '@/utils/common/format_coupon_name';

interface Props {
	data: Price;
	overriddenAmount?: string;
	appliedCoupon?: Coupon | null;
}

const ChargeValueCell = ({ data, overriddenAmount, appliedCoupon }: Props) => {
	// Use overridden amount if provided, otherwise use original price
	const priceData = overriddenAmount ? { ...data, amount: overriddenAmount } : data;
	const price = getPriceTableCharge(priceData as any, false);
	const tiers = data.tiers as unknown as Array<{
		up_to: number | null;
		unit_amount: string;
		flat_amount: string;
	}> | null;
	const isTiered = data.billing_model === BILLING_MODEL.TIERED && Array.isArray(tiers) && tiers.length > 0;

	// Calculate discount if coupon is applied and price is not overridden
	const discountInfo = !overriddenAmount && appliedCoupon ? calculateDiscountedPrice(data, appliedCoupon) : null;

	const formatRange = (tier: any, index: number, allTiers: any[]) => {
		// Calculate 'from' based on previous tier's up_to, first tier starts at 0
		const from = index === 0 ? 0 : allTiers[index - 1].up_to;

		// For the last tier or when up_to is null, show infinity
		if (tier.up_to === null || index === allTiers.length - 1) {
			return `${from} - ∞`;
		}
		return `${from} - ${tier.up_to}`;
	};

	return (
		<div className='flex items-center gap-2'>
			{discountInfo ? (
				// Show discounted price with strikethrough original
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
					{/* Coupon info icon */}
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
				// Show normal price
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
									{data.tier_mode === TIER_MODE.VOLUME ? 'Volume' : 'Slab'} Tier Pricing
								</div>
								<div className='space-y-2 '>
									{tiers.map((tier, index) => (
										<div key={index} className='flex flex-col gap-1'>
											<div className='flex items-center justify-between gap-6'>
												<div className='!font-normal text-muted-foreground'>{formatRange(tier, index, tiers)} units</div>
												<div className='text-right'>
													<div className='!font-normal text-muted-foreground'>
														{getCurrencySymbol(data.currency)}
														{formatAmount(tier.unit_amount)} per unit
													</div>
													{Number(tier.flat_amount) > 0 && (
														<div className='text-xs text-gray-500'>
															+ {getCurrencySymbol(data.currency)}
															{formatAmount(tier.flat_amount)} flat fee
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

export default ChargeValueCell;
