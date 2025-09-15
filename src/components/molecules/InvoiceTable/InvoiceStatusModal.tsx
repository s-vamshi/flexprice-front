import { Button, CheckboxRadioGroupItem, FormHeader, Modal, Select, Spacer, Input, Textarea } from '@/components/atoms';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { Invoice } from '@/models/Invoice';
import InvoiceApi from '@/api/InvoiceApi';
import { useMutation } from '@tanstack/react-query';
import { FC, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AddChargesButton } from '@/components/organisms/PlanForm/SetupChargesSection';
import { Trash2 } from 'lucide-react';
import { ServerError } from '@/core/axios/types';

interface InvoiceStatusProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	invoice?: Invoice;
}

/**
 * invoice status

	- for void
		- invoice_status = draft | finalize 
		- payment_status = failed | pending 
	    
	- for finalize
		- invoice_status = draft
		- payment_status = pending

	
 * 
 */

const InvoiceStatusModal: FC<InvoiceStatusProps> = ({ isOpen, onOpenChange, invoice }) => {
	const statusOptions: CheckboxRadioGroupItem[] = [
		{
			label: 'Void',
			value: 'VOIDED',
			description: 'Cancels the invoice and prevents further changes.',
			disabled: !(
				(invoice?.invoice_status === 'DRAFT' || invoice?.invoice_status === 'FINALIZED') &&
				(invoice?.payment_status === 'FAILED' || invoice?.payment_status === 'PENDING')
			),
		},
		{
			label: 'Finalize',
			value: 'FINALIZED',
			description: 'Marks the invoice as final and ready for processing.',
			disabled: !(invoice?.invoice_status === 'DRAFT' && invoice?.payment_status === 'FAILED'),
		},
		{
			label: 'Draft',
			value: 'DRAFT',
			description: 'Keeps the invoice in draft mode, allowing further edits.',
			disabled: true,
		},
	];

	const { isPending, mutate: updateStatus } = useMutation({
		mutationFn: async (status: string) => {
			if (status === 'VOIDED') {
				const metadataObj: Record<string, string> = {};
				voidMetadata.forEach(({ key, value }) => {
					if (key.trim()) metadataObj[key] = value;
				});
				const payload = Object.keys(metadataObj).length > 0 ? { metadata: metadataObj } : undefined;
				return await InvoiceApi.voidInvoice(invoice?.id as string, payload);
			} else if (status === 'FINALIZED') {
				return await InvoiceApi.finalizeInvoice(invoice?.id as string);
				// update invoice status to draft
				// update payment status to pending
			} else if (status === 'DRAFT') {
				toast.error('Draft status is yet to be implemented');
				// return await InvoiceApi.voidInvoice(invoice?.id as string);
				// update invoice status to draft
				// update payment status to pending
			}
		},
		async onSuccess() {
			toast.success('Invoice status updated successfully');
			await refetchQueries(['fetchInvoices']);
			await refetchQueries(['fetchInvoice']);
		},
		onError: (error: ServerError) => {
			toast.error(error?.error.message || 'Failed to update invoice status');
		},
	});

	const [status, setStatus] = useState(
		invoice ? statusOptions.find((option) => option.value === invoice.invoice_status) || statusOptions[0] : statusOptions[0],
	);
	const [voidMetadata, setVoidMetadata] = useState<{ key: string; value: string }[]>([{ key: '', value: '' }]);

	useEffect(() => {
		if (invoice) {
			setStatus(statusOptions.find((option) => option.value === invoice.invoice_status) || statusOptions[0]);
		}
	}, [invoice]);

	const handleKeyChange = (idx: number, newKey: string) => {
		setVoidMetadata((prev) => {
			const arr = [...prev];
			arr[idx] = { ...arr[idx], key: newKey };
			return arr;
		});
	};

	const handleValueChange = (idx: number, newValue: string) => {
		setVoidMetadata((prev) => {
			const arr = [...prev];
			arr[idx] = { ...arr[idx], value: newValue };
			return arr;
		});
	};

	const handleAddMetadata = () => {
		setVoidMetadata((prev) => [...prev, { key: '', value: '' }]);
	};

	const handleRemoveMetadata = (idx: number) => {
		setVoidMetadata((prev) => prev.filter((_, i) => i !== idx));
	};

	return (
		<Modal isOpen={isOpen} onOpenChange={onOpenChange}>
			<div className='card bg-white max-w-lg'>
				<FormHeader
					title='Update Invoice Status'
					variant='sub-header'
					subtitle='Updating the invoice status will not impact the payment status.'
				/>
				<Spacer className='!my-6' />
				<Select
					value={status.value}
					options={statusOptions}
					onChange={(e) => setStatus(statusOptions.find((option) => option.value === e) || statusOptions[0])}
					isRadio={true}
				/>

				{status.value === 'VOIDED' && (
					<>
						<Spacer className='!my-6' />
						<div className='border-t pt-6'>
							<h3 className='text-lg font-medium text-gray-900 mb-4'>Add Metadata (Optional)</h3>
							<div className='flex flex-col gap-4'>
								{voidMetadata.map((item, idx) => (
									<div key={idx} className='flex gap-2 items-start'>
										<div className='flex-[3] min-w-0'>
											<Input placeholder='Key' value={item.key} onChange={(v) => handleKeyChange(idx, v)} className='rounded-lg' />
										</div>
										<div className='flex-[5] min-w-0'>
											<Textarea
												placeholder='Value'
												value={item.value}
												onChange={(v) => handleValueChange(idx, v)}
												textAreaClassName='min-h-6 h-6 rounded-md'
												className='rounded-md'
											/>
										</div>
										{voidMetadata.length > 0 && (
											<Button variant='ghost' className='size-10' onClick={() => handleRemoveMetadata(idx)} aria-label='Remove'>
												<Trash2 className='size-6' />
											</Button>
										)}
									</div>
								))}
								<div>
									<AddChargesButton onClick={handleAddMetadata} label='Add another metadata item' />
								</div>
							</div>
						</div>
					</>
				)}

				<Spacer className='!my-6' />
				<div className='flex justify-end gap-4'>
					<Button onClick={() => onOpenChange(false)} variant={'outline'} className='btn btn-primary'>
						Cancel
					</Button>
					<Button
						disabled={isPending}
						onClick={() => {
							onOpenChange(false);
							updateStatus(status.value);
						}}
						className='btn btn-primary'>
						{status.value === 'VOIDED' ? 'Void Invoice' : 'Update'}
					</Button>
				</div>
			</div>
		</Modal>
	);
};

export default InvoiceStatusModal;
