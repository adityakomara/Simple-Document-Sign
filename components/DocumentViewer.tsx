import React, { useEffect, useState, useRef } from 'react';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';
import {
    FilePdfIcon,
    FileWordIcon,
    FileExcelIcon,
    FileCsvIcon,
    ExclamationTriangleIcon,
    SpinnerIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ZoomInIcon,
    ZoomOutIcon,
    PlusIcon,
    MinusIcon,
    RotateIcon,
    TrashIcon
} from './Icons';

interface DocumentViewerProps {
  file: File;
  signature: string | null;
  signatureSize: number;
  onSignatureSizeChange: (size: number) => void;
  signatureRotation: number;
  onSignatureRotationChange: (rotation: number) => void;
  signaturePosition: { x: number; y: number };
  onSignaturePositionChange: (position: { x: number; y: number }) => void;
  onRemoveSignature: () => void;
  pageNum: number;
  onPageNumChange: (page: number) => void;
}

const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FilePdfIcon className="w-16 h-16 text-red-500" />;
    if (fileType.includes('word')) return <FileWordIcon className="w-16 h-16 text-blue-500" />;
    if (fileType.includes('sheet') || fileType.includes('excel')) return <FileExcelIcon className="w-16 h-16 text-green-500" />;
    if (fileType.includes('csv')) return <FileCsvIcon className="w-16 h-16 text-gray-500" />;
    return <ExclamationTriangleIcon className="w-16 h-16 text-yellow-500" />;
};

const getFriendlyFileType = (mimeType: string): string => {
    switch (mimeType) {
        case 'application/pdf':
            return 'PDF Document';
        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            return 'Microsoft Word Document';
        case 'application/vnd.ms-excel':
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            return 'Microsoft Excel Spreadsheet';
        case 'text/csv':
            return 'CSV File';
        default:
            if (mimeType.includes('word')) return 'Word Document';
            if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'Excel Spreadsheet';
            return 'Document'; // Default to a generic term
    }
};

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3.0;
const DEFAULT_ZOOM = 1.0;

const MIN_SIG_SIZE = 50;
const MAX_SIG_SIZE = 300;


// Extracted Signature Preview component for reuse and cleaner logic
const SignaturePreview: React.FC<Omit<DocumentViewerProps, 'file' | 'pageNum' | 'onPageNumChange'>> = ({
    signature,
    signatureSize,
    onSignatureSizeChange,
    signatureRotation,
    onSignatureRotationChange,
    signaturePosition,
    onSignaturePositionChange,
    onRemoveSignature,
}) => {
    const signatureRef = useRef<HTMLDivElement>(null);

    const handleIncreaseSignatureSize = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSignatureSizeChange(Math.min(signatureSize + 10, MAX_SIG_SIZE));
    };

    const handleDecreaseSignatureSize = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSignatureSizeChange(Math.max(signatureSize - 10, MIN_SIG_SIZE));
    };
    
    const handleRotateMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!signatureRef.current) return;

        const sigRect = signatureRef.current.getBoundingClientRect();
        const centerX = sigRect.left + sigRect.width / 2;
        const centerY = sigRect.top + sigRect.height / 2;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const angleRad = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX);
            const angleDeg = (angleRad * 180 / Math.PI) + 90;
            onSignatureRotationChange(angleDeg < 0 ? angleDeg + 360 : angleDeg);
        };

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleDragMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const container = (e.currentTarget as HTMLElement).parentElement;
        if (!container) return;
        
        const containerRect = container.getBoundingClientRect();

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const x = moveEvent.clientX - containerRect.left;
            const y = moveEvent.clientY - containerRect.top;
    
            const relativeX = Math.max(0, Math.min(1, x / containerRect.width));
            const relativeY = Math.max(0, Math.min(1, y / containerRect.height));
    
            onSignaturePositionChange({ x: relativeX, y: relativeY });
        };
    
        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <div 
            ref={signatureRef}
            className="group absolute z-10 flex flex-col items-center cursor-grab active:cursor-grabbing"
            style={{ 
                left: `${signaturePosition.x * 100}%`,
                top: `${signaturePosition.y * 100}%`,
                transform: `translate(-50%, -50%) rotate(${signatureRotation}deg)` 
            }}
            onMouseDown={handleDragMouseDown}
        >
            <img
                src={signature!}
                alt="Signature"
                className="p-1 rounded border-2 border-dashed border-transparent group-hover:border-blue-500/70 transition-all duration-200 group-hover:shadow-lg"
                style={{ width: `${signatureSize}px`, mixBlendMode: 'darken' }}
            />
             <p className="text-xs text-slate-600 bg-white/70 px-2 py-0.5 rounded-full font-semibold text-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ transform: `rotate(${-signatureRotation}deg)` }}
             >
                Digitally Signed
            </p>
            <div 
                className="absolute -top-4 -right-4 flex items-center bg-white border border-slate-300 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ transform: `rotate(${-signatureRotation}deg)` }} // Counter-rotate the controls
                onMouseDown={(e) => e.stopPropagation()} // Prevent drag from starting on controls
            >
                 <button 
                    onClick={handleDecreaseSignatureSize} 
                    disabled={signatureSize <= MIN_SIG_SIZE}
                    className="p-2 text-slate-600 hover:text-blue-600 disabled:text-slate-300 disabled:cursor-not-allowed"
                    aria-label="Decrease signature size"
                >
                    <MinusIcon className="w-6 h-6" />
                </button>
                <button 
                    onClick={handleIncreaseSignatureSize} 
                    disabled={signatureSize >= MAX_SIG_SIZE}
                    className="p-2 text-slate-600 hover:text-blue-600 disabled:text-slate-300 disabled:cursor-not-allowed"
                    aria-label="Increase signature size"
                >
                    <PlusIcon className="w-6 h-6" />
                </button>
                 <div className="w-px h-5 bg-slate-200 mx-1"></div>
                 <button
                    onClick={onRemoveSignature}
                    className="p-2 text-slate-600 hover:text-red-500 transition-colors"
                    aria-label="Remove signature"
                >
                    <TrashIcon className="w-6 h-6" />
                </button>
            </div>
             <div 
                className="absolute -bottom-5 left-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                onMouseDown={handleRotateMouseDown}
                style={{ transform: `rotate(${-signatureRotation}deg)` }} // Counter-rotate the controls
            >
                <div className="p-2 bg-white border border-slate-300 rounded-full shadow-md text-slate-600 hover:text-blue-600">
                   <RotateIcon className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
};

const DocumentViewer: React.FC<DocumentViewerProps> = (props) => {
    const { file, pageNum, onPageNumChange } = props;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const viewerRef = useRef<HTMLDivElement>(null);
    const [pdfDoc, setPdfDoc] = useState<any | null>(null);
    const [numPages, setNumPages] = useState(0);
    const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM);
    const [isLoading, setIsLoading] = useState(true);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const renderTaskRef = useRef<any>(null);

    const isPdf = file.type === 'application/pdf';

    useEffect(() => {
        if (!isPdf) {
            setIsLoading(false);
            return;
        }

        const loadPdf = async () => {
            if (renderTaskRef.current) {
                renderTaskRef.current.cancel();
            }
            if (pdfDoc) {
                pdfDoc.destroy();
            }

            try {
                setNumPages(0);
                setZoomLevel(DEFAULT_ZOOM);
                setCanvasSize({ width: 0, height: 0 });
                setIsLoading(true);
                
                pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.149/pdf.worker.min.mjs`;

                const fileBuffer = await file.arrayBuffer();
                if (fileBuffer.byteLength === 0) {
                    console.error("Error loading PDF: The PDF file is empty, i.e. its size is zero bytes.");
                    setIsLoading(false);
                    return;
                }
                const loadingTask = pdfjsLib.getDocument(fileBuffer);
                const pdf = await loadingTask.promise;
                setNumPages(pdf.numPages);
                setPdfDoc(pdf);
            } catch (error) {
                console.error("Error loading PDF:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadPdf();

        return () => {
            if (pdfDoc) {
                pdfDoc.destroy();
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [file, isPdf]);

    useEffect(() => {
        if (!pdfDoc) return;

        const renderPage = async (pageNumber: number) => {
            if (renderTaskRef.current) {
                await renderTaskRef.current.cancel();
            }
            
            try {
                const page = await pdfDoc.getPage(pageNumber);
                const canvas = canvasRef.current;
                if (!canvas) return;

                const viewport = page.getViewport({ scale: zoomLevel });
                
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                setCanvasSize({ width: viewport.width, height: viewport.height });

                const renderContext = {
                    canvasContext: canvas.getContext('2d')!,
                    viewport: viewport
                };
                
                const task = page.render(renderContext);
                renderTaskRef.current = task;

                await task.promise;
                renderTaskRef.current = null;
            } catch (error: any) {
                if (error.name !== 'RenderingCancelledException') {
                    console.error('Error rendering page:', error);
                }
            }
        };

        renderPage(pageNum);
    }, [pdfDoc, pageNum, zoomLevel]);

    const goToPreviousPage = () => onPageNumChange(Math.max(pageNum - 1, 1));
    const goToNextPage = () => onPageNumChange(Math.min(pageNum + 1, numPages));

    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, MAX_ZOOM));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, MIN_ZOOM));

    return (
        <div ref={viewerRef} className="relative w-full h-[70vh] bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center">
            {isPdf ? (
                isLoading ? (
                    <div className="flex flex-col items-center text-slate-500">
                        <SpinnerIcon className="w-12 h-12 animate-spin" />
                        <p className="mt-4 font-medium">Loading Document...</p>
                    </div>
                ) : (
                    <>
                        <div className="w-full h-full overflow-auto p-4">
                           <div 
                                className="relative mx-auto"
                                style={{
                                    width: canvasSize.width,
                                    height: canvasSize.height,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                }}
                            >
                                <canvas ref={canvasRef} />
                                {props.signature && <SignaturePreview {...props} />}
                            </div>
                        </div>
                        {numPages > 0 && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-2 bg-slate-800 text-white px-2 py-1.5 rounded-full shadow-lg z-20">
                                <button 
                                    onClick={handleZoomOut} 
                                    disabled={zoomLevel <= MIN_ZOOM} 
                                    className="p-2 rounded-full hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-transparent transition-colors" 
                                    aria-label="Zoom out"
                                >
                                    <ZoomOutIcon className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={goToPreviousPage} 
                                    disabled={pageNum <= 1} 
                                    className="p-2 rounded-full hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-transparent transition-colors" 
                                    aria-label="Previous page"
                                >
                                    <ChevronLeftIcon className="w-5 h-5" />
                                </button>
                                <span className="font-semibold text-sm px-2 tabular-nums">Page {pageNum} of {numPages}</span>
                                <button 
                                    onClick={goToNextPage} 
                                    disabled={pageNum >= numPages} 
                                    className="p-2 rounded-full hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-transparent transition-colors" 
                                    aria-label="Next page"
                                >
                                    <ChevronRightIcon className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={handleZoomIn} 
                                    disabled={zoomLevel >= MAX_ZOOM} 
                                    className="p-2 rounded-full hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-transparent transition-colors" 
                                    aria-label="Zoom in"
                                >
                                    <ZoomInIcon className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </>
                )
            ) : (
                <>
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        {getFileIcon(file.type)}
                        <h3 className="mt-4 text-lg font-semibold text-slate-700">Preview not available</h3>
                        <p className="text-sm text-slate-500">
                            {getFriendlyFileType(file.type)} files cannot be previewed directly.
                        </p>
                        <p className="mt-2 text-sm text-slate-500">You can still sign the document record.</p>
                    </div>
                    {props.signature && <SignaturePreview {...props} />}
                </>
            )}
        </div>
    );
};

export default DocumentViewer;