import { FC, useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button, FormHeader, Input, Loader, Page, Select, Spacer, Divider } from '@/components/atoms';
import CustomerApi from '@/api/CustomerApi';
import { useParams, useNavigate } from 'react-router-dom';
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';
import useUser from '@/hooks/useUser';
import { currencyOptions } from '@/constants/constants';
import { formatDateShort, getCurrencySymbol, calculateCouponDiscount } from '@/utils/common/helper_functions';
import InvoiceApi from '@/api/InvoiceApi';
import toast from 'react-hot-toast';
import { RouteNames } from '@/core/routes/Routes';
import { Trash2 } from 'lucide-react';
import { AddChargesButton } from '@/components/organisms/PlanForm/SetupChargesSection';
import { InvoiceType, PAYMENT_STATUS } from '@/constants';
import { Coupon } from '@/models/Coupon';
import InvoiceTaxAssociationTable from '@/components/molecules/InvoiceTaxAssociationTable/InvoiceTaxAssociationTable';
import { TaxRateOverride } from '@/types/dto/tax';
import TaxApi from '@/api/TaxApi';
import { EXPAND } from '@/models/expand';
import { TAXRATE_ENTITY_TYPE } from '@/models/Tax';

interface LineItem {
	display_name: string;
	quantity: string;
	amount: string;
}

const CreateInvoicePage: FC = () => {
	const { customerId } = useParams();
	const navigate = useNavigate();
	const { data: customer, isLoading } = useQuery({
		queryKey: ['customer', customerId],
		queryFn: () => CustomerApi.getCustomerById(customerId!),
		enabled: !!customerId,
	});

	const { user } = useUser();
	const { updateBreadcrumb } = useBreadcrumbsStore();
	const [currency, setCurrency] = useState(currencyOptions[0].value);

	const [lineItems, setLineItems] = useState<LineItem[]>([
		{
			display_name: '',
			quantity: '1',
			amount: '0',
		},
	]);
	const [selectedCoupon, _] = useState<Coupon | null>(null);
	const [calculatedDiscount, setCalculatedDiscount] = useState<number>(0);
	const [finalTotal, setFinalTotal] = useState<number>(0);
	const [taxOverrides, setTaxOverrides] = useState<TaxRateOverride[]>([]);

	// Calculate period start as today at midnight UTC
	const today = new Date();
	today.setUTCHours(0, 0, 0, 0);

	useEffect(() => {
		if (customer?.name) {
			updateBreadcrumb(2, customer?.name);
			updateBreadcrumb(3, 'Invoices', RouteNames.customers + '/' + customerId + '/invoice');
		}
	}, [customer, updateBreadcrumb]);

	// Prefill with customer's tax associations as overrides (like subscription)
	const { data: customerTaxAssociations } = useQuery({
		queryKey: ['customerTaxAssociations', customerId],
		queryFn: async () => {
			return await TaxApi.listTaxAssociations({
				limit: 100,
				offset: 0,
				entity_id: customerId!,
				expand: EXPAND.TAX_RATE,
				entity_type: TAXRATE_ENTITY_TYPE.CUSTOMER,
			});
		},
		enabled: !!customerId,
	});

	useEffect(() => {
		if (customerTaxAssociations?.items) {
			setTaxOverrides(
				customerTaxAssociations.items.map((item: any) => ({
					tax_rate_code: item.tax_rate?.code ?? '',
					currency: item.currency?.toLowerCase(),
					auto_apply: item.auto_apply,
					priority: item.priority,
				})),
			);
		}
	}, [customerTaxAssociations]);

	// Recalculate discounts whenever line items or coupon change
	useEffect(() => {
		const subtotal = calculateSubtotal();
		const discount = selectedCoupon ? calculateCouponDiscount(selectedCoupon, subtotal) : 0;

		setCalculatedDiscount(discount);
		setFinalTotal(subtotal);
	}, [lineItems, selectedCoupon]);

	const handleAddLineItem = () => {
		setLineItems([
			...lineItems,
			{
				display_name: '',
				quantity: '1',
				amount: '0',
			},
		]);
	};

	const handleLineItemChange = (index: number, field: keyof LineItem, value: string) => {
		const newLineItems = [...lineItems];
		newLineItems[index] = {
			...newLineItems[index],
			[field]: value,
		};
		setLineItems(newLineItems);
	};

	const handleRemoveLineItem = (index: number) => {
		const newLineItems = lineItems.filter((_, i) => i !== index);
		setLineItems(newLineItems);
	};

	const calculateSubtotal = () => {
		return lineItems.reduce((total, item) => {
			return total + parseFloat(item.amount) * parseFloat(item.quantity);
		}, 0);
	};

	const { mutate: createInvoice, isPending } = useMutation({
		mutationFn: async () => {
			// Create line items including coupon discounts as negative line items
			const invoiceLineItems = [
				...lineItems.map((item) => ({
					display_name: item.display_name,
					quantity: item.quantity,
					amount: parseFloat(item.amount || '0') * parseFloat(item.quantity || '0'),
				})),
			];

			return await InvoiceApi.createInvoice({
				customer_id: customerId!,
				invoice_type: InvoiceType.ONE_OFF,
				currency,
				payment_status: PAYMENT_STATUS.PENDING,
				amount_due: finalTotal,
				period_start: today.toISOString(),
				line_items: invoiceLineItems,
				total: finalTotal,
				subtotal: calculateSubtotal(),
				billing_reason: 'manual',
				coupons: selectedCoupon ? [selectedCoupon.id] : [],
				tax_rate_overrides: taxOverrides.length > 0 ? taxOverrides : undefined,
				metadata: {},
			});
		},
		onSuccess: (data) => {
			toast.success('Invoice created successfully');
			navigate(`${RouteNames.customers}/${customerId}/invoice/${data.id}`);
		},
		onError: (error: ServerError) => {
			toast.error(error.error.message || 'Failed to create invoice');
		},
	});

	const handleSubmit = () => {
		// Validate form
		if (!customerId) {
			toast.error('Customer ID is required');
			return;
		}

		if (lineItems.length === 0) {
			toast.error('At least one line item is required');
			return;
		}

		const hasEmptyFields = lineItems.some(
			(item) => !item.display_name || !item.quantity || !item.amount || parseFloat(item.amount) <= 0 || parseFloat(item.quantity) <= 0,
		);

		if (hasEmptyFields) {
			toast.error('Please fill in all line item fields with valid values');
			return;
		}

		createInvoice();
	};

	const handleCancel = () => {
		navigate(`${RouteNames.customers}/${customerId}`);
	};

	if (isLoading) return <Loader />;

	const customerAddress = customer
		? `${customer.address_line1} ${customer.address_line2} ${customer.address_city} ${customer.address_state} ${customer.address_postal_code} ${customer.address_country}`
		: '--';

	const tenantAddress = user?.tenant.billing_details.address
		? `${user.tenant.billing_details.address.address_line1} ${user.tenant.billing_details.address.address_line2} ${user.tenant.billing_details.address.address_city} ${user.tenant.billing_details.address.address_state} ${user.tenant.billing_details.address.address_postal_code} ${user.tenant.billing_details.address.address_country}`
		: '--';

	return (
		<Page heading='Create One-off Invoice'>
			<div className='space-y-6'>
				<div className='rounded-xl border border-gray-300 p-6'>
					<div className='p-4'>
						<FormHeader title='Invoice Details' variant='sub-header' titleClassName='font-semibold' />
						<Spacer className='!my-6' />
						<div className='w-full grid grid-cols-3 gap-4'>
							<p className='text-[#71717A] text-sm'>Issue Date</p>
							<p></p>
							<p className='text-[#71717A] text-sm'>Currency</p>
						</div>
						<div className='w-full grid grid-cols-3 gap-4'>
							<p className='text-[#09090B] text-sm'>{formatDateShort(today.toISOString())}</p>
							<p></p>
							<Select value={currency} options={currencyOptions} onChange={setCurrency} />
						</div>
					</div>

					<Divider className='my-4' />

					<div className='grid grid-cols-2 p-4 gap-8'>
						<div className='text-left'>
							<FormHeader className='!mb-2' title={user?.tenant.name} variant='sub-header' titleClassName='font-semibold' />
							<p className='text-sm text-[#71717A] mb-[2px]'>{user?.tenant.name}</p>
							<p className='text-sm text-[#71717A] mb-[2px]'>{user?.email}</p>
							<p className='text-sm text-[#71717A] mb-[2px]'>{tenantAddress}</p>
						</div>

						<div>
							<FormHeader className='!mb-2' title='Bill to' variant='sub-header' titleClassName='font-semibold' />
							<p className='text-sm text-[#71717A] mb-[2px]'>{customer?.name || '--'}</p>
							<p className='text-sm text-[#71717A] mb-[2px]'>{customer?.email || '--'}</p>
							<p className='text-sm text-[#71717A] mb-[2px]'>{customerAddress}</p>
						</div>
					</div>

					<Divider />

					<div className='p-4'>
						<FormHeader title='Order Details' variant='sub-header' titleClassName='font-semibold' />
						<div className='mt-6'>
							{lineItems.map((item, index) => (
								<div key={index} className='flex gap-4 mb-4 items-end'>
									<Input
										label={index === 0 ? 'Item Name' : ''}
										value={item.display_name}
										onChange={(value) => handleLineItemChange(index, 'display_name', value)}
										placeholder='Enter item name'
									/>
									<Input
										label={index === 0 ? 'Quantity' : ''}
										value={item.quantity}
										onChange={(value) => handleLineItemChange(index, 'quantity', value)}
										variant='integer'
										placeholder='1'
									/>
									<Input
										label={index === 0 ? 'Amount' : ''}
										value={item.amount}
										onChange={(value) => handleLineItemChange(index, 'amount', value)}
										variant='formatted-number'
										inputPrefix={getCurrencySymbol(currency)}
										placeholder='0.00'
									/>
									<Input
										label='Total'
										value={`${(parseFloat(item.amount || '0') * parseFloat(item.quantity || '0')).toFixed(2)}`}
										disabled
										variant='formatted-number'
										inputPrefix={getCurrencySymbol(currency)}
										placeholder='0.00'
									/>
									<Button variant='outline' className='size-[42px]' onClick={() => handleRemoveLineItem(index)}>
										<Trash2 className='w-4 h-4' />
									</Button>
								</div>
							))}

							<AddChargesButton onClick={handleAddLineItem} label='Add Line Item' />
						</div>
					</div>

					<Divider />

					{/* Tax Section */}
					<div className='p-4'>
						<FormHeader title='Taxes' variant='sub-header' titleClassName='font-semibold' />
						<InvoiceTaxAssociationTable data={taxOverrides} onChange={setTaxOverrides} defaultCurrency={currency} />
					</div>

					<Divider />

					<div className='p-4'>
						<FormHeader title='Coupons' variant='sub-header' titleClassName='font-semibold' />
						{/* <CouponAssociation
							data={disc}
							onChange={setCoupons}
							currency={currency}
						/> */}
					</div>

					<div className='flex justify-end mt-8'>
						<div className='text-sm text-gray-800 space-y-4 w-1/3 px-2'>
							<div className='flex justify-between'>
								<span>Subtotal</span>
								<span>{`${getCurrencySymbol(currency)}${calculateSubtotal().toFixed(2)}`}</span>
							</div>
							{calculatedDiscount > 0 && (
								<div className='flex justify-between text-green-600'>
									<span>Coupon Discount</span>
									<span>-{`${getCurrencySymbol(currency)}${calculatedDiscount.toFixed(2)}`}</span>
								</div>
							)}
							<div className='flex justify-between'>
								<span>Tax</span>
								<span>-</span>
							</div>
							<div className='border-t'></div>
							<div className='flex justify-between font-bold'>
								<span>Total Amount</span>
								<span>{`${getCurrencySymbol(currency)}${(finalTotal - calculatedDiscount).toFixed(2)}`}</span>
							</div>
						</div>
					</div>
				</div>

				<div className='flex justify-end p-4'>
					<Button variant='outline' className='mr-4' onClick={handleCancel}>
						Cancel
					</Button>
					<Button onClick={handleSubmit} disabled={isPending}>
						{isPending ? 'Creating...' : 'Create Invoice'}
					</Button>
				</div>
			</div>
		</Page>
	);
};

export default CreateInvoicePage;
