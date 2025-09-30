import React, { useState, useRef } from 'react';
import { Button } from '@/components/atoms';
import Dialog from '@/components/atoms/Dialog/Dialog';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PDFProcessedData, ProcessingStatus } from './types';
import { ContractScenarioFactory } from './contractScenarios';

interface PDFUploadModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onPDFProcessed: (pdfData: PDFProcessedData) => void;
	customerId: string;
	customerName: string;
}

const PDFUploadModal: React.FC<PDFUploadModalProps> = ({ isOpen, onOpenChange, onPDFProcessed, customerName }) => {
	const [isProcessing, setIsProcessing] = useState(false);
	const [uploadedFile, setUploadedFile] = useState<File | null>(null);
	const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
	const [errorMessage, setErrorMessage] = useState<string>('');
	const [currentStep, setCurrentStep] = useState<string>('');
	const [progress, setProgress] = useState<number>(0);
	const [uploadProgress, setUploadProgress] = useState<number>(0);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file && file.type === 'application/pdf') {
			setUploadedFile(file);
			setProcessingStatus(ProcessingStatus.UPLOADING);
			setErrorMessage('');
			setUploadProgress(0);

			// Simulate file upload with much more realistic timing and randomness
			const baseUploadTime = Math.max(1500, 1000 + Math.random() * 3000); // 1500ms to 4000ms
			const fileSizeFactor = Math.min(3.0, file.size / (1024 * 1024)); // Up to 3x for larger files
			const networkVariation = 0.7 + Math.random() * 0.8; // 0.7x to 1.5x network speed variation
			const uploadTime = baseUploadTime * (1 + fileSizeFactor) * networkVariation;
			const steps = 35; // More steps for smoother progress
			const baseStepTime = uploadTime / steps;

			for (let i = 0; i <= steps; i++) {
				setUploadProgress((i / steps) * 100);

				// Much more randomness to each step (0.2x to 2.5x variation)
				const stepVariation = 0.2 + Math.random() * 2.3;
				const stepTime = baseStepTime * stepVariation;

				// Add occasional "network hiccups" - longer delays
				if (Math.random() < 0.15) {
					// 15% chance of network hiccup
					const hiccupDelay = 200 + Math.random() * 800; // 200-1000ms extra delay
					await new Promise((resolve) => setTimeout(resolve, hiccupDelay));
				}

				await new Promise((resolve) => setTimeout(resolve, stepTime));
			}

			// Show upload complete state - user needs to manually start processing
			setProcessingStatus(ProcessingStatus.UPLOAD_COMPLETE);
		} else {
			setErrorMessage('Please select a PDF file');
		}
	};

	const calculateProcessingTime = (fileSize: number): number => {
		// Much more realistic AI processing time - AI analysis is complex!
		const baseTime = Math.max(12000, Math.min(35000, fileSize / 200)); // 12-35 seconds based on size

		// Add significant randomness for realistic variation
		const randomFactor = 0.8 + Math.random() * 0.8; // 0.8 to 1.6

		// Add substantial processing time for AI complexity
		const aiProcessingDelay = Math.random() * 8000; // 0-8 seconds extra for AI

		return Math.round(baseTime * randomFactor + aiProcessingDelay);
	};

	const simulatePDFProcessing = (fileName: string): PDFProcessedData => {
		// Use the factory to find matching scenario based on filename
		return ContractScenarioFactory.findMatchingScenario(fileName);
	};

	const handleProcessPDF = async () => {
		if (!uploadedFile) return;

		setIsProcessing(true);
		setProcessingStatus(ProcessingStatus.PROCESSING);

		try {
			// Calculate realistic processing time based on file size
			const processingTime = calculateProcessingTime(uploadedFile.size);

			// User-friendly processing steps
			const progressSteps = [
				'Getting started...',
				'Scanning your contract...',
				'Analyzing pricing information...',
				'Finding billing details...',
				'Checking plan features...',
				'Scanning contract terms...',
				'Finding start and end dates...',
				'Looking for special conditions...',
				'Checking renewal terms...',
				'Finding customer details...',
				'Analyzing payment schedules...',
				'Checking for add-ons...',
				'Looking for discounts...',
				'Scanning contract duration...',
				'Finding billing cycles...',
				'Checking currency details...',
				'Analyzing subscription terms...',
				'Looking for overrides...',
				'Checking contract type...',
				'Scanning special clauses...',
				'Finding plan names...',
				'Checking pricing models...',
				'Analyzing service details...',
				'Looking for custom terms...',
				'Checking contract structure...',
				'Scanning all sections...',
				'Organizing information...',
				'Preparing subscription data...',
				'Almost done...',
				'Finishing up...',
			];

			// Simulate processing with realistic timing variations
			for (let i = 0; i < progressSteps.length; i++) {
				setCurrentStep(progressSteps[i]);
				setProgress(((i + 1) / progressSteps.length) * 100);

				// Vary step duration for more realism (some steps take longer)
				const baseStepDuration = processingTime / progressSteps.length;
				const variationFactor = 0.3 + Math.random() * 1.4; // 0.3 to 1.7x variation
				const stepDuration = baseStepDuration * variationFactor;

				await new Promise((resolve) => setTimeout(resolve, stepDuration));
			}

			// Process the PDF based on file name
			const processedData = simulatePDFProcessing(uploadedFile.name);

			// Create a simple file URL for the PDF
			const pdfFileUrl = URL.createObjectURL(uploadedFile);

			// Add the file URL to the processed data
			const processedDataWithUrl = {
				...processedData,
				pdfFileUrl,
			};

			// Brief success state before closing
			setProcessingStatus(ProcessingStatus.SUCCESS);
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Pass the processed data to parent
			onPDFProcessed(processedDataWithUrl);

			// Close modal immediately after processing
			onOpenChange(false);

			// Reset state
			setUploadedFile(null);
			setProcessingStatus(ProcessingStatus.IDLE);
			setErrorMessage('');
		} catch {
			setProcessingStatus(ProcessingStatus.ERROR);
			setErrorMessage('Failed to process PDF. Please try again.');
		} finally {
			setIsProcessing(false);
		}
	};

	const handleClose = () => {
		onOpenChange(false);
		setUploadedFile(null);
		setProcessingStatus(ProcessingStatus.IDLE);
		setErrorMessage('');
		setCurrentStep('');
		setProgress(0);
		setUploadProgress(0);
	};

	return (
		<Dialog
			isOpen={isOpen}
			onOpenChange={handleClose}
			title='Upload Contract'
			description={`Upload a PDF contract and we'll automatically set up the subscription for ${customerName}`}
			className='max-w-2xl'>
			<div className='space-y-6'>
				{/* Modern Upload Area */}
				<div className='space-y-4'>
					{/* Upload Dropzone - Only show when idle or uploading */}
					{processingStatus === ProcessingStatus.IDLE || processingStatus === ProcessingStatus.UPLOADING ? (
						<div
							className={cn(
								'border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200',
								processingStatus === ProcessingStatus.UPLOADING
									? 'border-[#09090B] bg-[#F4F4F5] cursor-not-allowed'
									: 'border-[#E4E4E7] hover:border-[#71717A] hover:bg-[#F4F4F5] cursor-pointer',
							)}
							onClick={() => {
								if (processingStatus === ProcessingStatus.IDLE) {
									fileInputRef.current?.click();
								}
							}}>
							<input ref={fileInputRef} type='file' accept='.pdf' onChange={handleFileUpload} className='hidden' />

							{/* Upload Content */}
							{!uploadedFile ? (
								<div className='flex flex-col items-center space-y-3'>
									<div className='w-12 h-12 rounded-full bg-[#F4F4F5] flex items-center justify-center'>
										<Upload className='w-6 h-6 text-[#71717A]' />
									</div>
									<div>
										<div className='text-sm font-medium text-[#09090B] mb-1'>
											Drop your contract here, or{' '}
											<span className='text-[#09090B] underline cursor-pointer hover:text-[#71717A] transition-colors'>
												click to browse
											</span>
										</div>
										<div className='text-xs text-[#64748B]'>We'll scan the contract and fill in the subscription details for you</div>
									</div>
								</div>
							) : (
								<div className='flex flex-col items-center space-y-3'>
									<div className='w-12 h-12 rounded-full bg-[#F4F4F5] flex items-center justify-center'>
										<FileText className='w-6 h-6 text-[#71717A]' />
									</div>
									<div className='text-center'>
										<div className='text-sm font-medium text-[#09090B] mb-1'>{uploadedFile.name}</div>
										<div className='text-xs text-[#64748B]'>{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</div>
									</div>
								</div>
							)}
						</div>
					) : null}

					{/* Upload Progress - Only show during upload */}
					{processingStatus === ProcessingStatus.UPLOADING && (
						<div className='space-y-2'>
							<div className='flex justify-between text-xs text-[#71717A]'>
								<span>Uploading...</span>
								<span>{Math.round(uploadProgress)}%</span>
							</div>
							<div className='w-full bg-[#F4F4F5] rounded-full h-1.5'>
								<div
									className='bg-[#09090B] h-1.5 rounded-full transition-all duration-200 ease-out'
									style={{ width: `${uploadProgress}%` }}
								/>
							</div>
						</div>
					)}
				</div>

				{/* Upload Complete Status - Hide during AI processing */}
				{processingStatus === ProcessingStatus.UPLOAD_COMPLETE && (
					<div className='bg-green-50 border border-green-200 rounded-xl p-4'>
						<div className='flex items-center space-x-3'>
							<div className='w-8 h-8 rounded-full bg-green-100 flex items-center justify-center'>
								<CheckCircle className='w-4 h-4 text-green-600' />
							</div>
							<div>
								<div className='text-sm font-medium text-green-900'>Contract uploaded</div>
								<div className='text-xs text-green-700'>
									Ready to scan your contract. Click <span className='font-medium text-green-900'>"Scan Contract"</span> to get started.
								</div>
							</div>
						</div>
					</div>
				)}

				{/* AI Processing Status */}
				{processingStatus === ProcessingStatus.PROCESSING && (
					<div className='bg-gradient-to-r from-[#F4F4F5] to-[#F9F9F9] border border-[#E4E4E7] rounded-xl p-6'>
						<div className='text-center space-y-4'>
							<div>
								<div className='text-lg font-semibold text-[#09090B] mb-1'>Analyzing your contract</div>
								<div className='text-sm text-[#71717A] mb-4'>{currentStep || 'Getting started...'}</div>

								{/* Modern Progress Bar */}
								<div className='w-full bg-[#F4F4F5] rounded-full h-2 mb-2'>
									<div
										className='bg-gradient-to-r from-[#09090B] to-[#71717A] h-2 rounded-full transition-all duration-500 ease-out'
										style={{ width: `${progress}%` }}
									/>
								</div>

								<div className='text-xs text-[#64748B]'>{Math.round(progress)}% complete</div>
							</div>
						</div>
					</div>
				)}

				{/* Error Message */}
				{processingStatus === ProcessingStatus.ERROR && (
					<div className='bg-red-50 border border-red-200 rounded-xl p-4'>
						<div className='flex items-center space-x-3'>
							<div className='w-8 h-8 rounded-full bg-red-100 flex items-center justify-center'>
								<AlertCircle className='w-4 h-4 text-red-500' />
							</div>
							<div>
								<div className='text-sm font-medium text-red-900'>Something went wrong</div>
								<div className='text-xs text-red-700'>{errorMessage}</div>
							</div>
						</div>
					</div>
				)}

				{/* Action Buttons */}
				<div className='flex justify-end space-x-3 pt-4 border-t border-[#E4E4E7]'>
					<Button variant='outline' onClick={handleClose} disabled={isProcessing} className='px-6'>
						Cancel
					</Button>
					{/* Only show Process button after upload is complete */}
					{processingStatus === ProcessingStatus.UPLOAD_COMPLETE && (
						<Button onClick={handleProcessPDF} disabled={isProcessing} className='px-6'>
							Scan Contract
						</Button>
					)}
					{/* Show processing button during AI analysis */}
					{processingStatus === ProcessingStatus.PROCESSING && (
						<Button disabled={true} className='px-6'>
							Analyzing...
						</Button>
					)}
				</div>
			</div>
		</Dialog>
	);
};

export default PDFUploadModal;
