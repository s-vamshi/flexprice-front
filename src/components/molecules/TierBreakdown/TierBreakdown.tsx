import { FC } from 'react';
import { Card } from '@/components/atoms';
import { TIER_MODE } from '@/models/Price';
import { getCurrencySymbol } from '@/utils/common/helper_functions';

interface TierBreakdownItem {
	range: string;
	quantity: string;
	rate: string;
	cost: string;
}

interface Props {
	tiers: TierBreakdownItem[];
	totalCost: string;
	effectiveRate: string;
	tierMode: TIER_MODE;
	currency: string;
	usageQuantity: string;
}

const TierBreakdown: FC<Props> = ({ tiers, totalCost, effectiveRate, tierMode, currency, usageQuantity }) => {
	const currencySymbol = getCurrencySymbol(currency);

	return (
		<Card className='p-4'>
			<div className='space-y-4'>
				<div className='flex justify-between items-center'>
					<h3 className='text-lg font-semibold text-gray-900'>Tier Breakdown</h3>
					<div className='text-sm text-gray-600'>
						Mode: <span className='font-medium'>{tierMode}</span>
					</div>
				</div>

				<div className='grid grid-cols-2 gap-4 text-sm'>
					<div>
						<span className='text-gray-600'>Total Usage:</span>
						<span className='ml-2 font-medium'>{usageQuantity}</span>
					</div>
					<div>
						<span className='text-gray-600'>Total Cost:</span>
						<span className='ml-2 font-medium'>
							{currencySymbol}
							{totalCost}
						</span>
					</div>
				</div>

				{tierMode === TIER_MODE.VOLUME && (
					<div className='bg-blue-50 p-3 rounded-md'>
						<div className='text-sm text-blue-800'>
							<strong>Volume Mode:</strong> All {usageQuantity} units charged at the highest tier rate of {currencySymbol}
							{effectiveRate} per unit.
						</div>
					</div>
				)}

				{tierMode === TIER_MODE.SLAB && (
					<div className='bg-green-50 p-3 rounded-md'>
						<div className='text-sm text-green-800'>
							<strong>Slab Mode:</strong> Each tier range priced separately and summed.
						</div>
					</div>
				)}

				{tiers.length > 0 && (
					<div className='space-y-2'>
						<div className='text-sm font-medium text-gray-700'>Tier Details:</div>
						<div className='space-y-1'>
							{tiers.map((tier, index) => (
								<div key={index} className='flex justify-between text-sm py-1 border-b border-gray-100 last:border-b-0'>
									<div className='flex-1'>
										<span className='text-gray-600'>Range:</span>
										<span className='ml-2 font-medium'>{tier.range}</span>
									</div>
									<div className='flex-1'>
										<span className='text-gray-600'>Quantity:</span>
										<span className='ml-2 font-medium'>{tier.quantity}</span>
									</div>
									<div className='flex-1'>
										<span className='text-gray-600'>Rate:</span>
										<span className='ml-2 font-medium'>
											{currencySymbol}
											{tier.rate}
										</span>
									</div>
									<div className='flex-1'>
										<span className='text-gray-600'>Cost:</span>
										<span className='ml-2 font-medium'>
											{currencySymbol}
											{tier.cost}
										</span>
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</Card>
	);
};

export default TierBreakdown;
