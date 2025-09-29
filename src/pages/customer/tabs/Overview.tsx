import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { AddButton, Card, CardHeader, NoDataCard, Button } from '@/components/atoms';
import CustomerApi from '@/api/CustomerApi';
import { useQuery } from '@tanstack/react-query';
import SubscriptionTable from '@/components/organisms/Subscription/SubscriptionTable';
import { Subscription } from '@/models/Subscription';
import Loader from '@/components/atoms/Loader';
import toast from 'react-hot-toast';
import CustomerUsageTable from '@/components/molecules/CustomerUsageTable/CustomerUsageTable';
import { RouteNames } from '@/core/routes/Routes';
import { PDFUploadModal, PDFProcessedData } from '@/components/molecules/PDFUploadModal';
import { useState } from 'react';
import { FileText } from 'lucide-react';

type ContextType = {
	isArchived: boolean;
};

const fetchAllSubscriptions = async (customerId: string) => {
	const subs = await CustomerApi.getCustomerSubscriptions(customerId);
	return subs.items;
};

const Overview = () => {
	const navigate = useNavigate();
	const { id: customerId } = useParams();
	const { isArchived } = useOutletContext<ContextType>();
	const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);

	const handleAddSubscription = () => {
		navigate(`${RouteNames.customers}/${customerId}/add-subscription`);
	};

	const handlePDFUpload = () => {
		setIsPDFModalOpen(true);
	};

	const handlePDFProcessed = (pdfData: PDFProcessedData) => {
		// Navigate to subscription creation with PDF data
		const queryParams = new URLSearchParams({
			fromPDF: 'true',
			planName: pdfData.planName,
			billingPeriod: pdfData.billingPeriod,
			currency: pdfData.currency,
			startDate: pdfData.startDate.toISOString(),
			...(pdfData.endDate && { endDate: pdfData.endDate.toISOString() }),
			lineItems: JSON.stringify(pdfData.lineItems),
			metadata: JSON.stringify(pdfData.metadata),
		});

		navigate(`${RouteNames.customers}/${customerId}/add-subscription?${queryParams.toString()}`);
	};

	const {
		data: subscriptions,
		isLoading: subscriptionsLoading,
		error: subscriptionsError,
	} = useQuery({
		queryKey: ['subscriptions', customerId],
		queryFn: () => fetchAllSubscriptions(customerId!),
	});

	const {
		data: usageData,
		isLoading: usageLoading,
		error: usageError,
	} = useQuery({
		queryKey: ['usage', customerId],
		queryFn: () => CustomerApi.getUsageSummary({ customer_id: customerId! }),
	});

	const { data: customerData, isLoading: customerLoading } = useQuery({
		queryKey: ['customer', customerId],
		queryFn: () => CustomerApi.getCustomerById(customerId!),
	});

	if (subscriptionsLoading || usageLoading || customerLoading) {
		return <Loader />;
	}

	if (subscriptionsError || usageError) {
		toast.error('Something went wrong');
	}

	const renderSubscriptionContent = () => {
		if ((subscriptions?.length || 0) > 0) {
			return (
				<Card variant='notched'>
					<CardHeader
						title='Subscriptions'
						cta={
							!isArchived && (
								<div className='flex gap-2'>
									<Button variant='outline' onClick={handlePDFUpload} className='flex items-center gap-2'>
										<FileText className='w-4 h-4' />
										Upload Contract
									</Button>
									<AddButton onClick={handleAddSubscription} />
								</div>
							)
						}
					/>
					<SubscriptionTable
						onRowClick={(row) => {
							navigate(`${RouteNames.customers}/${customerId}/subscription/${row.id}`);
						}}
						data={subscriptions as Subscription[]}
					/>
				</Card>
			);
		}

		return (
			<NoDataCard
				title='Subscriptions'
				subtitle={isArchived ? 'No subscriptions found' : 'No active subscriptions'}
				cta={
					!isArchived && (
						<div className='flex gap-2'>
							<Button variant='outline' onClick={handlePDFUpload} className='flex items-center gap-2'>
								<FileText className='w-4 h-4' />
								Upload Contract
							</Button>
							<AddButton onClick={handleAddSubscription} />
						</div>
					)
				}
			/>
		);
	};

	return (
		<div className='space-y-6'>
			{renderSubscriptionContent()}

			{/* customer entitlements table */}
			{(usageData?.features?.length || 0) > 0 && (
				<Card variant='notched'>
					<CardHeader title='Entitlements' />
					<CustomerUsageTable data={usageData?.features ?? []} />
				</Card>
			)}

			{/* PDF Upload Modal */}
			<PDFUploadModal
				isOpen={isPDFModalOpen}
				onOpenChange={setIsPDFModalOpen}
				onPDFProcessed={handlePDFProcessed}
				customerId={customerId!}
				customerName={customerData?.external_id || customerData?.name || 'Customer'}
			/>
		</div>
	);
};

export default Overview;
