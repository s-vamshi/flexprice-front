import { FC, useState, useEffect } from 'react';
import { Dialog } from '@/components/atoms';
import { Input, Button, Select, SelectOption } from '@/components/atoms';
import { Price, BILLING_MODEL, TIER_MODE, CreatePriceTier, TransformQuantity, PRICE_TYPE } from '@/models/Price';
import { formatAmount, removeFormatting } from '@/components/atoms/Input/Input';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { ExtendedPriceOverride } from '@/utils/common/price_override_helpers';
import VolumeTieredPricingForm from '@/components/organisms/PlanForm/VolumeTieredPricingForm';

interface Props {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	price: Price;
	onPriceOverride: (priceId: string, override: Partial<ExtendedPriceOverride>) => void;
	onResetOverride: (priceId: string) => void;
	overriddenPrices: Record<string, ExtendedPriceOverride>;
}

const billingModelOptions: SelectOption[] = [
	{ label: 'Flat Fee', value: BILLING_MODEL.FLAT_FEE },
	{ label: 'Package', value: BILLING_MODEL.PACKAGE },
	{ label: 'Volume Tiered', value: BILLING_MODEL.TIERED },
	{ label: 'Slab Tiered', value: 'SLAB_TIERED' },
];

const PriceOverrideDialog: FC<Props> = ({ isOpen, onOpenChange, price, onPriceOverride, onResetOverride, overriddenPrices }) => {
	const [overrideAmount, setOverrideAmount] = useState('');
	const [overrideQuantity, setOverrideQuantity] = useState<number | undefined>(undefined);
	const [overrideBillingModel, setOverrideBillingModel] = useState<BILLING_MODEL | 'SLAB_TIERED'>(price.billing_model);
	const [overrideTiers, setOverrideTiers] = useState<CreatePriceTier[]>([]);
	const [overrideTransformQuantity, setOverrideTransformQuantity] = useState<TransformQuantity>({
		divide_by: 1,
	});
	const [isOverridden, setIsOverridden] = useState(false);

	// Check if this price is currently overridden
	useEffect(() => {
		const currentOverride = overriddenPrices[price.id];
		const isCurrentlyOverridden = currentOverride !== undefined;
		setIsOverridden(isCurrentlyOverridden);

		if (isCurrentlyOverridden) {
			setOverrideAmount(currentOverride.amount || '');
			setOverrideQuantity(currentOverride.quantity);
			setOverrideBillingModel(currentOverride.billing_model || price.billing_model);
			setOverrideTiers(currentOverride.tiers || []);
			setOverrideTransformQuantity(currentOverride.transform_quantity || { divide_by: 1, round: 'up' });
		} else {
			setOverrideAmount('');
			setOverrideQuantity(undefined);
			setOverrideBillingModel(price.billing_model);
			// Initialize with original tiers if they exist, otherwise start with one default tier
			if (price.tiers && price.tiers.length > 0) {
				setOverrideTiers(
					price.tiers.map((tier) => ({
						unit_amount: tier.unit_amount,
						flat_amount: tier.flat_amount || '0',
						up_to: tier.up_to,
					})),
				);
			} else {
				// Start with one default tier
				setOverrideTiers([
					{
						unit_amount: '',
						flat_amount: '0',
						up_to: null,
					},
				]);
			}
			setOverrideTransformQuantity({ divide_by: 1, round: 'up' });
		}
	}, [price.id, overriddenPrices, price.billing_model, price.tier_mode, price.tiers]);

	const handleOverride = () => {
		const override: Partial<ExtendedPriceOverride> = {};

		// Only include amount if billing model is not tiered
		if (overrideBillingModel !== BILLING_MODEL.TIERED && overrideBillingModel !== 'SLAB_TIERED') {
			if (overrideAmount && removeFormatting(overrideAmount) !== price.amount) {
				override.amount = removeFormatting(overrideAmount);
			}
		}

		// Quantity can be overridden for any billing model
		if (overrideQuantity !== undefined) {
			override.quantity = overrideQuantity;
		}

		// Billing model override
		if (overrideBillingModel !== price.billing_model) {
			override.billing_model = overrideBillingModel;
		}

		// Only include tiers if billing model is tiered
		if ((overrideBillingModel === BILLING_MODEL.TIERED || overrideBillingModel === 'SLAB_TIERED') && overrideTiers.length > 0) {
			override.tiers = overrideTiers;
		}

		// Only include transform_quantity if billing model is package
		if (overrideBillingModel === BILLING_MODEL.PACKAGE && overrideTransformQuantity !== undefined) {
			override.transform_quantity = overrideTransformQuantity;
		}

		if (Object.keys(override).length > 0) {
			onPriceOverride(price.id, override);
		} else {
			onResetOverride(price.id);
		}
		onOpenChange(false);
	};

	const handleReset = () => {
		onResetOverride(price.id);
		setOverrideAmount('');
		setOverrideQuantity(undefined);
		setOverrideBillingModel(price.billing_model);
		if (price.tiers && price.tiers.length > 0) {
			setOverrideTiers(
				price.tiers.map((tier) => ({
					unit_amount: tier.unit_amount,
					flat_amount: tier.flat_amount || '0',
					up_to: tier.up_to,
				})),
			);
		} else {
			setOverrideTiers([
				{
					unit_amount: '',
					flat_amount: '0',
					up_to: null,
				},
			]);
		}
		setOverrideTransformQuantity({ divide_by: 1 });
		setIsOverridden(false);
	};

	const handleCancel = () => {
		const currentOverride = overriddenPrices[price.id];
		if (currentOverride) {
			setOverrideAmount(currentOverride.amount || '');
			setOverrideQuantity(currentOverride.quantity);
			setOverrideBillingModel(currentOverride.billing_model || price.billing_model);
			setOverrideTiers(currentOverride.tiers || []);
			setOverrideTransformQuantity(currentOverride.transform_quantity || { divide_by: 1 });
		} else {
			setOverrideAmount('');
			setOverrideQuantity(undefined);
			setOverrideBillingModel(price.billing_model);
			if (price.tiers && price.tiers.length > 0) {
				setOverrideTiers(
					price.tiers.map((tier) => ({
						unit_amount: tier.unit_amount,
						flat_amount: tier.flat_amount || '0',
						up_to: tier.up_to,
					})),
				);
			} else {
				setOverrideTiers([
					{
						unit_amount: '',
						flat_amount: '0',
						up_to: null,
					},
				]);
			}
			setOverrideTransformQuantity({ divide_by: 1 });
		}
		onOpenChange(false);
	};

	const hasChanges = () => {
		// Check if billing model has changed (including SLAB_TIERED conversion)
		const originalBillingModel = price.billing_model;
		const originalTierMode = price.tier_mode || TIER_MODE.VOLUME;

		let billingModelChanged = false;
		if (overrideBillingModel === 'SLAB_TIERED' && originalBillingModel === BILLING_MODEL.TIERED && originalTierMode === TIER_MODE.SLAB) {
			billingModelChanged = false; // Same as original
		} else if (
			overrideBillingModel === BILLING_MODEL.TIERED &&
			originalBillingModel === BILLING_MODEL.TIERED &&
			originalTierMode === TIER_MODE.VOLUME
		) {
			billingModelChanged = false; // Same as original
		} else {
			billingModelChanged = overrideBillingModel !== originalBillingModel;
		}

		return (
			(overrideAmount && removeFormatting(overrideAmount) !== price.amount) ||
			overrideQuantity !== undefined ||
			billingModelChanged ||
			overrideTiers.length > 0 ||
			overrideTransformQuantity !== undefined
		);
	};

	const originalFormatted = formatAmount(price.amount);
	const currencySymbol = getCurrencySymbol(price.currency);

	return (
		<Dialog
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title='Override Price Configuration'
			description={`Modify the pricing configuration for ${price.meter?.name || price.description || 'this charge'}`}
			className='w-auto min-w-[32rem] max-w-[90vw]'>
			<div className='space-y-6 max-h-[80vh] overflow-y-auto'>
				<div className='space-y-4'>
					{/* Original Price Display */}
					<div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
						<div className='text-sm text-gray-600'>Original Price</div>
						<div className='font-medium'>
							{currencySymbol}
							{originalFormatted}
						</div>
					</div>

					{/* Billing Model Override - Only show for USAGE price types */}
					{price.type === PRICE_TYPE.USAGE && (
						<div className='space-y-2'>
							<label className='text-sm font-medium text-gray-700'>Billing Model</label>
							<Select
								value={overrideBillingModel}
								onChange={(value) => setOverrideBillingModel(value as BILLING_MODEL)}
								options={billingModelOptions}
								placeholder='Select billing model'
							/>
						</div>
					)}

					{/* Amount Override - only show if billing model is not TIERED or SLAB_TIERED */}
					{overrideBillingModel !== BILLING_MODEL.TIERED && overrideBillingModel !== 'SLAB_TIERED' && (
						<div className='space-y-2'>
							<label className='text-sm font-medium text-gray-700'>Override Amount ({price.currency})</label>
							<Input
								type='formatted-number'
								value={overrideAmount}
								onChange={setOverrideAmount}
								placeholder='Enter new amount (optional)'
								suffix={currencySymbol}
								className='w-full'
							/>
						</div>
					)}

					{/* Tiers Override - only show if billing model is TIERED or SLAB_TIERED */}
					{(overrideBillingModel === BILLING_MODEL.TIERED || overrideBillingModel === 'SLAB_TIERED') && (
						<div className='space-y-2'>
							<label className='text-sm font-medium text-gray-700'>Tiers</label>
							<VolumeTieredPricingForm
								tieredPrices={
									overrideTiers.length > 0
										? overrideTiers.map((tier, index) => {
												// Calculate proper from and up_to values
												let from = 0;
												let up_to = null;

												if (index === 0) {
													from = 0;
													up_to = overrideTiers.length > 1 ? overrideTiers[1]?.up_to || 1 : null;
												} else {
													from = overrideTiers[index - 1]?.up_to || 0;
													up_to = index < overrideTiers.length - 1 ? overrideTiers[index + 1]?.up_to || null : null;
												}

												return {
													from,
													up_to,
													unit_amount: tier.unit_amount || '',
													flat_amount: tier.flat_amount || '0',
												};
											})
										: [{ from: 0, up_to: null, unit_amount: '', flat_amount: '0' }]
								}
								setTieredPrices={(setter) => {
									// Handle both function and direct value cases
									const newTiers =
										typeof setter === 'function'
											? setter(
													overrideTiers.length > 0
														? overrideTiers.map((tier, index) => ({
																from: index === 0 ? 0 : overrideTiers[index - 1]?.up_to || 0,
																up_to: tier.up_to || null,
																unit_amount: tier.unit_amount || '',
																flat_amount: tier.flat_amount || '0',
															}))
														: [{ from: 0, up_to: null, unit_amount: '', flat_amount: '0' }],
												)
											: setter;

									// Convert the PriceTier format to CreatePriceTier format
									// and properly handle the from/up_to values
									const convertedTiers = newTiers.map((tier: any, index: number) => {
										// Calculate proper up_to value for the CreatePriceTier format
										let up_to: number | null = null;
										if (index < newTiers.length - 1) {
											up_to = newTiers[index + 1]?.from || null;
										}

										return {
											unit_amount: tier.unit_amount || '',
											flat_amount: tier.flat_amount || '0',
											up_to,
										};
									});
									setOverrideTiers(convertedTiers);
								}}
								currency={price.currency}
								tierMode={overrideBillingModel === BILLING_MODEL.TIERED ? TIER_MODE.VOLUME : TIER_MODE.SLAB}
							/>
						</div>
					)}

					{/* Transform Quantity Override - only show if billing model is PACKAGE */}
					{overrideBillingModel === BILLING_MODEL.PACKAGE && (
						<div className='space-y-4'>
							<label className='text-sm font-medium text-gray-700'>Package Configuration</label>
							<div className='space-y-2'>
								<label className='text-sm text-gray-600'>Units per package</label>
								<Input
									type='number'
									value={overrideTransformQuantity?.divide_by || ''}
									onChange={(value) =>
										setOverrideTransformQuantity({
											...overrideTransformQuantity,
											divide_by: Number(value) || 1,
										})
									}
									placeholder='Enter units per package'
									className='w-full'
								/>
							</div>
						</div>
					)}

					{/* Override Summary */}
					{isOverridden && (
						<div className='flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
							<div className='text-sm text-blue-700'>This price has been overridden. Review the changes above.</div>
						</div>
					)}
				</div>

				<div className='flex gap-3 pt-4'>
					<Button variant='outline' onClick={handleCancel} className='flex-1'>
						Cancel
					</Button>
					{isOverridden && (
						<Button variant='outline' onClick={handleReset} className='flex-1'>
							Reset
						</Button>
					)}
					<Button onClick={handleOverride} className='flex-1' disabled={!hasChanges()}>
						{isOverridden ? 'Update Override' : 'Override Price'}
					</Button>
				</div>
			</div>
		</Dialog>
	);
};

export default PriceOverrideDialog;
