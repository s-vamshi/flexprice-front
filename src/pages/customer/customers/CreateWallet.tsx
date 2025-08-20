import { Button, DatePicker, Input } from '@/components/atoms';
import { CurrencySelector } from '@/components/molecules';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { cn } from '@/lib/utils';
import { Wallet } from '@/models/Wallet';
import { PRICE_UNIT_TYPE } from '@/models/Price';
import WalletApi from '@/api/WalletApi';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { useMutation } from '@tanstack/react-query';
import { FC, useState } from 'react';
import toast from 'react-hot-toast';
import { CreateWalletPayload } from '@/types/dto';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CurrencyOption } from '@/components/molecules/CurrencySelector';

interface Props {
	customerId: string;
	onSuccess?: (walletId: string) => void;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const CreateWallet: FC<Props> = ({ customerId, onSuccess = () => {}, open, onOpenChange }) => {
	const [errors, setErrors] = useState({
		currency: '',
		name: '',
		initial_credits_to_load: '',
		conversion_rate: '',
	});

	const [walletPayload, setwalletPayload] = useState<Partial<CreateWalletPayload>>({
		currency: '',
		initial_credits_to_load: 0,
		conversion_rate: 1,
		name: 'Prepaid Wallet',
	});

	const [selectedCurrencyOption, setSelectedCurrencyOption] = useState<CurrencyOption | undefined>();
	const [selectedCurrency, setSelectedCurrency] = useState<string>('');

	// const [autoTopup, setautoTopup] = useState(false);

	const { mutateAsync: createWallet, isPending } = useMutation({
		mutationKey: ['createWallet', customerId],
		mutationFn: async () => {
			return await WalletApi.createWallet({
				currency: walletPayload.currency!,
				customerId,
				name: walletPayload.name,
				initial_credits_to_load: walletPayload.initial_credits_to_load,
				conversion_rate: walletPayload.conversion_rate,
				initial_credits_expiry_date_utc: walletPayload.initial_credits_expiry_date_utc,
			});
		},
		onError: (error: ServerError) => {
			toast.error(error.error.message || 'An error occurred while creating wallet');
		},
		onSuccess: async (data: Wallet) => {
			toast.success('Wallet created successfully');
			onSuccess(data.id);
			await refetchQueries(['fetchWallets']);
			await refetchQueries(['fetchWalletBalances']);
			await refetchQueries(['fetchWalletsTransactions']);
		},
	});

	const handleCreateWallet = async () => {
		if (!walletPayload.name) {
			setErrors((prev) => ({ ...prev, name: 'Wallet name is required' }));
			return;
		}

		if (!walletPayload.currency) {
			setErrors((prev) => ({ ...prev, currency: 'Currency is required' }));
			return;
		}

		const wallet = await createWallet();
		return wallet.id;
	};

	const handleCurrencyChange = (value: string, option?: CurrencyOption) => {
		setSelectedCurrencyOption(option);
		setSelectedCurrency(value);

		// If custom pricing unit is selected, use its base currency for wallet payload
		if (option?.currencyType === PRICE_UNIT_TYPE.CUSTOM && option.extras?.baseCurrency) {
			setwalletPayload((prev) => ({
				...prev,
				currency: option.extras!.baseCurrency, // Use base currency for wallet payload
				conversion_rate: option.extras!.conversionRate,
			}));
		} else {
			// For fiat currencies, use the selected currency directly
			setwalletPayload((prev) => ({
				...prev,
				currency: value,
				conversion_rate: 1,
			}));
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='bg-white sm:max-w-[600px] max-h-[80vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle>Create Wallet</DialogTitle>
					<DialogDescription>Define the wallet details and the currency it will operate in.</DialogDescription>
				</DialogHeader>
				<div className='grid gap-4 py-4'>
					<Input
						error={errors.name}
						value={walletPayload.name}
						onChange={(e) => setwalletPayload({ ...walletPayload, name: e })}
						label='Wallet Name'
						placeholder='Enter wallet name'
					/>

					<CurrencySelector
						value={selectedCurrency}
						label='Select Currency'
						onChange={handleCurrencyChange}
						placeholder='Select Currency'
						error={errors.currency}
					/>

					<div className='flex flex-col items-start gap-2 w-full'>
						<label className={cn(' block text-sm font-medium', 'text-zinc-950')}>Conversion Rate</label>
						<div className='flex items-center gap-2 w-full'>
							<Input className='w-full' value={'1'} disabled suffix='credit' />
							<span>=</span>
							<Input
								className='w-full'
								variant='number'
								suffix={getCurrencySymbol(walletPayload.currency || '')}
								value={walletPayload.conversion_rate}
								onChange={(e) => {
									// Only allow editing if it's a fiat currency (not custom pricing unit)
									if (selectedCurrencyOption?.currencyType !== PRICE_UNIT_TYPE.CUSTOM) {
										setwalletPayload({ ...walletPayload, conversion_rate: e as unknown as number });
									}
								}}
								disabled={selectedCurrencyOption?.currencyType === PRICE_UNIT_TYPE.CUSTOM}
							/>
						</div>
						{selectedCurrencyOption?.currencyType === PRICE_UNIT_TYPE.CUSTOM && (
							<p className='text-sm text-muted-foreground'>
								Conversion rate is locked for custom pricing units. Wallet will use {walletPayload.currency} as base currency.
							</p>
						)}
					</div>
					<Input
						label='Free Credits'
						suffix='credits'
						variant='formatted-number'
						placeholder='Enter Free Credits to be added to the wallet'
						value={walletPayload.initial_credits_to_load}
						onChange={(e) => {
							setwalletPayload({ ...walletPayload, initial_credits_to_load: e as unknown as number });
						}}
					/>
					<div>
						<DatePicker
							labelClassName='text-foreground'
							label='Free Credits Expiry Date'
							minDate={new Date()}
							placeholder='Select Expiry Date'
							date={walletPayload.initial_credits_expiry_date_utc}
							setDate={(e) => {
								setwalletPayload({ ...walletPayload, initial_credits_expiry_date_utc: e as unknown as Date });
							}}
						/>
					</div>

					<div className='w-full justify-end flex'>
						<Button isLoading={isPending} disabled={isPending} onClick={handleCreateWallet}>
							Save Wallet
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default CreateWallet;
