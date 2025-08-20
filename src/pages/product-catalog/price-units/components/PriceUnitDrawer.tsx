import { FC, useEffect, useState } from 'react';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button, Input, Sheet, Select, Spacer } from '@/components/atoms';
import PriceUnitApi from '@/api/PriceUnitApi';
import { PriceUnitResponse } from '@/types/dto/PriceUnit';
import { Decimal } from 'decimal.js';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { logger } from '@/utils/common/Logger';
import { currencyOptions } from '@/constants/constants';
import { getConversionRateDescription } from '@/utils/common/helper_functions';

const schema = z.object({
	name: z.string().min(1, 'Name is required'),
	code: z.string().length(3, 'Code must be exactly 3 characters'),
	symbol: z.string().max(10, 'Symbol must be at most 10 characters'),
	base_currency: z.string().length(3, 'Base currency must be exactly 3 characters'),
	conversion_rate: z.string().refine((val) => {
		try {
			const decimal = new Decimal(val);
			return decimal.greaterThan(0);
		} catch {
			return false;
		}
	}, 'Conversion rate must be a positive number'),
	precision: z.number().min(0).max(8),
});

interface Props {
	data?: PriceUnitResponse;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	trigger?: React.ReactNode;
}

const PriceUnitDrawer: FC<Props> = ({ data, onOpenChange, open, trigger }) => {
	const [formData, setFormData] = useState<Partial<PriceUnitResponse>>(data || {});
	const [errors, setErrors] = useState<Partial<Record<keyof PriceUnitResponse, string>>>({});
	const [internalOpen, setInternalOpen] = useState(false);
	const isControlled = open !== undefined && onOpenChange !== undefined;
	const isEdit = !!data;

	useEffect(() => {
		setFormData(data || {});
	}, [data]);

	const currentOpen = isControlled ? open : internalOpen;
	const toggleOpen = (open?: boolean) => {
		if (isControlled) {
			onOpenChange?.(open ?? false);
		} else {
			setInternalOpen((prev) => !prev);
		}
	};

	const handleChange = (name: keyof typeof formData, value: string | number | undefined) => {
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const validateForm = () => {
		const result = schema.safeParse(formData);
		if (!result.success) {
			const newErrors: Partial<Record<keyof PriceUnitResponse, string>> = {};
			result.error.errors.forEach((error) => {
				const field = error.path[0] as keyof PriceUnitResponse;
				newErrors[field] = error.message;
			});
			setErrors(newErrors);
			return false;
		}
		setErrors({});
		return true;
	};

	const { mutate: savePriceUnit, isPending } = useMutation({
		mutationFn: async () => {
			const payload = {
				name: formData.name!,
				code: formData.code!,
				symbol: formData.symbol!,
				base_currency: formData.base_currency!,
				conversion_rate: new Decimal(formData.conversion_rate!),
				precision: formData.precision!,
			};

			if (data) {
				return await PriceUnitApi.update(data.id, payload);
			} else {
				return await PriceUnitApi.create(payload);
			}
		},
		onSuccess: async () => {
			await refetchQueries(['fetchPriceUnits']);
			toast.success(data ? 'Price unit updated successfully' : 'Price unit added successfully');
			if (!data) {
				setFormData({});
			}
			toggleOpen();
		},
		onError: (error: ServerError) => {
			logger.error(error);
			toast.error(error.error?.message || 'Failed to save price unit. Please try again.');
		},
	});

	const handleSubmit = () => {
		if (validateForm()) {
			savePriceUnit();
		}
	};

	const isCtaDisabled = !formData.name || !formData.code || !formData.base_currency || !formData.conversion_rate;

	return (
		<div>
			<Sheet
				isOpen={currentOpen}
				onOpenChange={toggleOpen}
				title={data ? 'Edit Price Unit' : 'Create Price Unit'}
				description={data ? 'Update price unit details.' : 'Enter details to create a new price unit.'}
				trigger={trigger}>
				<div className='space-y-4 mt-4'>
					<Input
						label='Name'
						placeholder='Enter Name'
						value={formData.name || ''}
						onChange={(e) => handleChange('name', e)}
						error={errors.name}
						description='A descriptive name for the price unit (e.g., US Dollar, Euro)'
					/>

					<Input
						label='Code'
						placeholder='e.g. USD'
						value={formData.code || ''}
						onChange={(e) => handleChange('code', e)}
						error={errors.code}
						disabled={isEdit}
						maxLength={3}
						description='ISO 4217 currency code (3 letters, e.g., USD, EUR, GBP)'
					/>

					<Input
						label='Symbol'
						placeholder='e.g. $'
						value={formData.symbol || ''}
						onChange={(e) => handleChange('symbol', e)}
						error={errors.symbol}
						maxLength={10}
						description='Currency symbol used for display (e.g., $, €, £)'
					/>

					<Select
						label='Base Currency'
						placeholder='Select base currency'
						value={formData.base_currency || ''}
						options={currencyOptions}
						onChange={(value) => handleChange('base_currency', value)}
						error={errors.base_currency}
						disabled={isEdit}
						description='The reference currency for conversion rates'
					/>

					<Input
						label='Conversion Rate'
						type='number'
						step='any'
						placeholder='e.g. 1.0'
						value={formData.conversion_rate?.toString() || ''}
						onChange={(e) => handleChange('conversion_rate', e)}
						error={errors.conversion_rate}
						description={
							formData.conversion_rate && formData.code && formData.base_currency
								? getConversionRateDescription(formData.conversion_rate.toString(), formData.code, formData.base_currency)
								: 'Rate to convert from base currency to this price unit (e.g., 1.0 for same currency, 0.85 for USD to EUR)'
						}
					/>

					<Input
						label='Precision'
						type='number'
						placeholder='e.g. 2'
						value={formData.precision?.toString() || '2'}
						onChange={(e) => handleChange('precision', Number(e))}
						error={errors.precision}
						min={0}
						max={8}
						description='Number of decimal places to display (0-8, e.g., 2 for $10.50, 0 for ¥1000)'
					/>

					<Spacer height={'0px'} />
					<Button isLoading={isPending} disabled={isPending || isCtaDisabled} onClick={handleSubmit}>
						{isPending ? 'Saving...' : data ? 'Update Price Unit' : 'Create Price Unit'}
					</Button>
				</div>
			</Sheet>
		</div>
	);
};

export default PriceUnitDrawer;
