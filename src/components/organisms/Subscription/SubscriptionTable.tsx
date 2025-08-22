import { FC } from 'react';
import { Subscription, SUBSCRIPTION_STATUS } from '@/models/Subscription';
import { ColumnData, FlexpriceTable } from '@/components/molecules';
import { Chip } from '@/components/atoms';
import { formatBillingPeriodForDisplay } from '@/utils/common/helper_functions';
import formatDate from '@/utils/common/format_date';
import SubscriptionActionButton from './SubscriptionActionButton';

export interface SubscriptionTableProps {
	data: Subscription[];
	onRowClick?: (row: Subscription) => void;
	allowRedirect?: boolean;
}

export const getSubscriptionStatus = (status: string) => {
	switch (status.toUpperCase()) {
		case SUBSCRIPTION_STATUS.ACTIVE:
			return <Chip variant='success' label='Active' />;
		case SUBSCRIPTION_STATUS.PAUSED:
			return <Chip variant='warning' label='Paused' />;
		case SUBSCRIPTION_STATUS.CANCELLED:
			return <Chip variant='failed' label='Cancelled' />;
		default:
			return <Chip variant='default' label='Inactive' />;
	}
};

export const formatSubscriptionStatus = (status: string) => {
	switch (status.toUpperCase()) {
		case SUBSCRIPTION_STATUS.ACTIVE:
			return 'Active';
		case SUBSCRIPTION_STATUS.PAUSED:
			return 'Paused';
		case SUBSCRIPTION_STATUS.CANCELLED:
			return 'Cancelled';
		default:
			return 'Inactive';
	}
};

const SubscriptionTable: FC<SubscriptionTableProps> = ({ data, onRowClick, allowRedirect = true }): JSX.Element => {
	const columns: ColumnData<Subscription>[] = [
		{
			title: 'Plan Name',
			render: (row) => row.plan?.name,
		},
		{
			title: 'Billing Period',
			render: (row) => <span>{formatBillingPeriodForDisplay(row.billing_period)}</span>,
		},
		{
			title: 'Status',
			render: (row) => getSubscriptionStatus(row.subscription_status),
		},
		{
			title: 'Start Date',
			render: (row) => <span>{formatDate(row.start_date)}</span>,
		},
		...(allowRedirect
			? [
					{
						width: '30px',
						fieldVariant: 'interactive' as const,
						hideOnEmpty: true,
						render: (row: Subscription) => <SubscriptionActionButton subscription={row} />,
					},
				]
			: []),
	];

	return (
		<FlexpriceTable
			onRowClick={(row) => {
				onRowClick?.(row);
			}}
			columns={columns}
			data={data}
			variant='no-bordered'
		/>
	);
};

export default SubscriptionTable;
