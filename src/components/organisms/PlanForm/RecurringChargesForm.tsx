import { useState } from 'react';
import { formatBillingPeriodForPrice, getCurrencySymbol } from '@/utils/common/helper_functions';
import { billlingPeriodOptions } from '@/constants/constants';
import { InternalPrice } from '../EntityChargesPage/EntityChargesPage';
import { CheckboxRadioGroup, FormHeader, Input, Spacer, Button, Select } from '@/components/atoms';
import { CurrencySelector, CurrencyOption } from '@/components/molecules';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import RecurringChargePreview from './RecurringChargePreview';
import { BILLING_CADENCE, INVOICE_CADENCE } from '@/models/Invoice';
import { BILLING_PERIOD, PRICE_ENTITY_TYPE, PRICE_UNIT_TYPE } from '@/models/Price';

interface Props {
	price: Partial<InternalPrice>;
	onAdd: (price: Partial<InternalPrice>) => void;
	onUpdate: (price: Partial<InternalPrice>) => void;
	onEditClicked: () => void;
	onDeleteClicked: () => void;
	entityType?: PRICE_ENTITY_TYPE;
	entityId?: string;
}

const RecurringChargesForm = ({
	price,
	onAdd,
	onUpdate,
	onEditClicked,
	onDeleteClicked,
	entityType = PRICE_ENTITY_TYPE.PLAN,
	entityId,
}: Props) => {
	const [localPrice, setLocalPrice] = useState<Partial<InternalPrice>>(price);
	const [selectedCurrencyOption, setSelectedCurrencyOption] = useState<CurrencyOption | undefined>();
	const [errors, setErrors] = useState<Partial<Record<keyof InternalPrice, string>>>({});

	const validate = () => {
		const newErrors: Partial<Record<keyof InternalPrice, string>> = {};

		if (!localPrice.amount) {
			newErrors.amount = 'Price is required';
		}
		if (!localPrice.billing_period) {
			newErrors.billing_period = 'Billing Period is required';
		}
		if (!localPrice.currency) {
			newErrors.currency = 'Currency is required';
		}

		if (!localPrice.invoice_cadence) {
			newErrors.invoice_cadence = 'Invoice Cadence is required';
		}

		if (localPrice.isTrialPeriod && !localPrice.trial_period) {
			newErrors.trial_period = 'Trial Period is required';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = () => {
		if (!validate()) return;

		// Determine the currency to send to backend
		const backendCurrency =
			selectedCurrencyOption?.currencyType === PRICE_UNIT_TYPE.CUSTOM
				? selectedCurrencyOption.extras?.baseCurrency || localPrice.currency
				: localPrice.currency;

		const priceWithEntity = {
			...localPrice,
			currency: backendCurrency,
			entity_type: entityType,
			entity_id: entityId || '',
			price_unit_type: selectedCurrencyOption?.currencyType === PRICE_UNIT_TYPE.CUSTOM ? PRICE_UNIT_TYPE.CUSTOM : PRICE_UNIT_TYPE.FIAT,
			price_unit_config:
				selectedCurrencyOption?.currencyType === PRICE_UNIT_TYPE.CUSTOM && selectedCurrencyOption?.value
					? {
							price_unit: selectedCurrencyOption.value!,
							amount: selectedCurrencyOption?.currencyType === PRICE_UNIT_TYPE.CUSTOM ? localPrice.amount : undefined,
						}
					: undefined,
		};

		// For custom price units, set amount to 0 since it's in price_unit_config
		if (selectedCurrencyOption?.currencyType === PRICE_UNIT_TYPE.CUSTOM) {
			priceWithEntity.amount = undefined;
		}

		if (price.internal_state === 'edit') {
			onUpdate({
				...priceWithEntity,
				isEdit: false,
			});
		} else {
			onAdd({
				...priceWithEntity,
				isEdit: false,
			});
		}
	};

	if (price.internal_state === 'saved') {
		return <RecurringChargePreview charge={price} onEditClicked={onEditClicked} onDeleteClicked={onDeleteClicked} />;
	}

	return (
		<div className='card'>
			<CurrencySelector
				value={localPrice.currency}
				label='Currency'
				onChange={(value, option) => {
					setLocalPrice({ ...localPrice, currency: value });
					setSelectedCurrencyOption(option);
				}}
				placeholder='Select currency'
				error={errors.currency}
			/>
			<Spacer height={'8px'} />
			<Select
				value={localPrice.billing_period}
				options={billlingPeriodOptions}
				onChange={(value) => setLocalPrice({ ...localPrice, billing_period: value as BILLING_PERIOD })}
				label='Billing Period'
				error={errors.billing_period}
			/>
			<Spacer height={'8px'} />
			<Input
				onChange={(value) => setLocalPrice({ ...localPrice, amount: value })}
				value={localPrice.amount}
				variant='formatted-number'
				label='Price'
				placeholder='0'
				error={errors.amount}
				inputPrefix={getCurrencySymbol(localPrice.currency || '')}
				suffix={<span className='text-[#64748B]'> {`per ${formatBillingPeriodForPrice(localPrice.billing_period || '')}`}</span>}
			/>
			<Spacer height={'16px'} />
			<FormHeader title='Billing Timing' variant='form-component-title' />
			{/* starting billing preffercences */}

			<CheckboxRadioGroup
				title='	'
				value={localPrice.invoice_cadence}
				checkboxItems={[
					{
						label: 'Advance',
						value: 'ADVANCE',
						description: 'Charge at the start of each billing cycle.',
					},
					{
						label: 'Arrear',
						value: 'ARREAR',
						description: 'Charge at the end of the billing cycle.',
					},
				]}
				onChange={(value) => {
					setLocalPrice({ ...localPrice, invoice_cadence: value as INVOICE_CADENCE });
					if (value === BILLING_CADENCE.ONETIME) {
						setLocalPrice({ ...localPrice, isTrialPeriod: false, trial_period: 0 });
					}
				}}
				error={errors.invoice_cadence}
			/>
			<Spacer height={'16px'} />
			<div>
				<FormHeader title='Trial Period' variant='form-component-title' />
				<div className='flex items-center space-x-4 s'>
					<Switch
						id='airplane-mode'
						checked={localPrice.isTrialPeriod}
						onCheckedChange={(value) => {
							setLocalPrice({ ...localPrice, isTrialPeriod: value });
						}}
					/>
					<Label htmlFor='airplane-mode'>
						<p className='font-medium text-sm text-[#18181B] peer-checked:text-black'>Start with a free trial</p>
						<Spacer height={'4px'} />
						<p className='text-sm font-normal text-[#71717A] peer-checked:text-gray-700'>
							Enable this option to add a free trial period for the subscription.
						</p>
					</Label>
				</div>
			</div>
			{localPrice.isTrialPeriod && (
				<div>
					<Spacer height={'8px'} />
					<Input
						variant='number'
						error={errors.trial_period}
						value={localPrice.trial_period}
						onChange={(value) => {
							setLocalPrice({ ...localPrice, trial_period: Number(value) });
						}}
						suffix='days'
						placeholder='Number of trial days'
					/>
				</div>
			)}
			<Spacer height={'16px'} />
			<div className='flex justify-end'>
				<Button onClick={onDeleteClicked} variant='secondary' className='mr-4 text-zinc-900'>
					{price.internal_state === 'edit' ? 'Delete' : 'Cancel'}
				</Button>
				<Button onClick={handleSubmit} variant='default' className='mr-4 font-normal'>
					{price.internal_state === 'edit' ? 'Update' : 'Add'}
				</Button>
			</div>
		</div>
	);
};

export default RecurringChargesForm;
