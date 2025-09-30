import React, { useEffect, useState } from 'react';
import Modal from '@/components/atoms/Modal/Modal';
import { FileText } from 'lucide-react';

interface PDFViewerModalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	pdfUrl: string;
	title?: string;
}

const PDFViewerModal: React.FC<PDFViewerModalProps> = ({ isOpen, onOpenChange, pdfUrl, title = 'Contract PDF' }) => {
	// Extract file name from blob URL if possible
	const [fileName, setFileName] = useState(title);

	useEffect(() => {
		// Try to get the original file name from the URL
		if (pdfUrl.startsWith('blob:')) {
			// For blob URLs, we'll use the title or try to extract from the URL
			const urlParts = pdfUrl.split('/');
			const blobId = urlParts[urlParts.length - 1];
			if (blobId && blobId.length > 8) {
				// Just use the last part of the blob ID to make it shorter
				setFileName(`${title} (${blobId.substring(0, 8)}...)`);
			}
		}
	}, [pdfUrl, title]);

	return (
		<Modal isOpen={isOpen} onOpenChange={onOpenChange} className='w-[95vw] h-[95vh] max-w-7xl'>
			<div className='bg-white rounded-xl shadow-2xl h-full flex flex-col overflow-hidden' style={{ backgroundColor: 'white' }}>
				{/* Modern Header */}
				<div className='flex items-center gap-3 p-4 border-b border-gray-100 bg-white'>
					<FileText className='h-5 w-5 text-blue-600' />
					<h2 className='text-lg font-semibold text-gray-800 flex-1 truncate'>{fileName}</h2>
				</div>

				{/* PDF Content with modern styling */}
				<div className='flex-1 overflow-hidden bg-white'>
					<iframe
						src={`${pdfUrl}#toolbar=0&view=FitH`}
						className='w-full h-full border-0'
						title='PDF Viewer'
						style={{
							background: 'white',
							backgroundColor: 'white',
						}}
					/>
				</div>
			</div>
		</Modal>
	);
};

export default PDFViewerModal;
