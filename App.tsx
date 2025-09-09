import React, { useState, useCallback } from 'react';
import FileUpload from './components/FileUpload';
import DocumentViewer from './components/DocumentViewer';
import SignatureModal from './components/SignatureModal';
import { SignatureIcon, BrandIcon, CheckCircleIcon, ArrowPathIcon, DownloadIcon, SpinnerIcon } from './components/Icons';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [signatureSize, setSignatureSize] = useState(150);
  const [signatureRotation, setSignatureRotation] = useState(0);
  const [signaturePosition, setSignaturePosition] = useState({ x: 0.85, y: 0.8 });
  const [pageNum, setPageNum] = useState(1);


  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setSignature(null); // Reset signature when a new file is uploaded
    setPageNum(1); // Reset to the first page
  }, []);

  const handleSaveSignature = useCallback((signatureDataUrl: string) => {
    setSignature(signatureDataUrl);
    setIsModalOpen(false);
  }, []);

  const handleReset = useCallback(() => {
    setFile(null);
    setSignature(null);
    setIsModalOpen(false);
    setSignatureSize(150);
    setSignatureRotation(0);
    setSignaturePosition({ x: 0.85, y: 0.8 });
    setPageNum(1);
  }, []);

  const handleDownload = async () => {
    if (!file || !signature) return;

    setIsDownloading(true);
    try {
        if (file.type === 'application/pdf') {
            const { PDFDocument, degrees } = await import('pdf-lib');
            const existingPdfBytes = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(existingPdfBytes);
            
            const pngImageBytes = await fetch(signature).then(res => res.arrayBuffer());
            const pngImage = await pdfDoc.embedPng(pngImageBytes);

            const pages = pdfDoc.getPages();
            // Ensure signature is placed on the correct, currently viewed page
            const targetPage = pages[pageNum - 1] || pages[0];
            if (!targetPage) {
                throw new Error("Target page for signature not found.");
            }

            const { width: pageWidth, height: pageHeight } = targetPage.getSize();
            
            const sigWidth = signatureSize;
            const sigHeight = (pngImage.height / pngImage.width) * sigWidth;

            // Convert relative position (0-1) to absolute PDF coordinates (points)
            // PDF origin is bottom-left, and we're positioning the center of the signature
            const x = signaturePosition.x * pageWidth - (sigWidth / 2);
            const y = (1 - signaturePosition.y) * pageHeight - (sigHeight / 2);


            targetPage.drawImage(pngImage, {
                x,
                y,
                width: sigWidth,
                height: sigHeight,
                rotate: degrees(signatureRotation),
            });

            const pdfBytes = await pdfDoc.save();
            
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `signed-${file.name}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            const canvas = document.createElement('canvas');
            canvas.width = 800;
            canvas.height = 600;
            const ctx = canvas.getContext('2d');

            if (!ctx) return;

            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 32px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Document Signed', canvas.width / 2, 100);

            ctx.fillStyle = '#64748b';
            ctx.font = '18px sans-serif';
            ctx.fillText(file.name, canvas.width / 2, 150);

            const img = new Image();
            await new Promise(resolve => { 
                img.onload = resolve;
                img.src = signature;
            });

            const sigWidth = signatureSize * 2; // Scale for larger canvas
            const sigHeight = (img.height / img.width) * sigWidth;
            
            const sigCenterX = signaturePosition.x * canvas.width;
            const sigCenterY = signaturePosition.y * canvas.height;

            ctx.save();
            ctx.translate(sigCenterX, sigCenterY);
            ctx.rotate((signatureRotation * Math.PI) / 180);
            ctx.drawImage(img, -sigWidth / 2, -sigHeight / 2, sigWidth, sigHeight);
            ctx.restore();
            
            ctx.fillStyle = '#94a3b8';
            ctx.font = '14px sans-serif';
            ctx.fillText(`Signed on: ${new Date().toLocaleString()}`, canvas.width / 2, canvas.height - 50);

            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            const extension = file.name.split('.').pop();
            const basename = extension ? file.name.slice(0, -(extension.length + 1)) : file.name;
            link.download = `signed-${basename}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    } catch (error) {
        console.error("Failed to download signed document:", error);
        alert("An error occurred while preparing your download. Please try again.");
    } finally {
        setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 sm:p-6 font-sans antialiased">
      <header className="w-full max-w-5xl flex items-center justify-between">
        <div className="flex items-center space-x-3 text-slate-800">
          <BrandIcon />
          <h1 className="text-2xl font-bold">Simple Document Sign</h1>
        </div>
      </header>
      
      <main className="w-full max-w-5xl bg-white rounded-xl shadow-lg p-6 sm:p-8 mt-6 flex-grow">
        {!file ? (
          <FileUpload onFileSelect={handleFileSelect} />
        ) : (
          <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-slate-200">
                <div className='max-w-md'>
                    <h2 className="text-xl font-semibold text-slate-700 truncate">{file.name}</h2>
                    <p className="text-sm text-slate-500">
                        {(file.size / 1024).toFixed(2)} KB
                    </p>
                </div>

                <div className="flex items-center space-x-2 sm:space-x-4 mt-4 md:mt-0">
                  {signature ? (
                     <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                       <CheckCircleIcon />
                       <span className="font-semibold text-lg">Document Approved</span>
                     </div>
                  ) : (
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="inline-flex items-center justify-center px-5 py-2.5 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors duration-200"
                    >
                      <SignatureIcon />
                      <span className="ml-2">Sign Document</span>
                    </button>
                  )}
                  {signature && (
                      <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="inline-flex items-center justify-center px-4 py-2.5 text-base font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 focus:ring-4 focus:ring-slate-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Download signed document"
                      >
                        {isDownloading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <DownloadIcon className="w-5 h-5" />}
                        <span className="ml-2 hidden sm:inline">Download</span>
                      </button>
                  )}
                  <button
                      onClick={handleReset}
                      className="inline-flex items-center justify-center px-4 py-2.5 text-base font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 focus:ring-4 focus:ring-slate-300 transition-colors duration-200"
                    >
                      <ArrowPathIcon />
                      <span className="ml-2 hidden sm:inline">Reset</span>
                  </button>
                </div>
            </div>
            
            <DocumentViewer 
                file={file} 
                signature={signature} 
                signatureSize={signatureSize}
                onSignatureSizeChange={setSignatureSize}
                signatureRotation={signatureRotation}
                onSignatureRotationChange={setSignatureRotation}
                signaturePosition={signaturePosition}
                onSignaturePositionChange={setSignaturePosition}
                onRemoveSignature={() => setSignature(null)}
                pageNum={pageNum}
                onPageNumChange={setPageNum}
            />
          </div>
        )}
      </main>
      
      <footer className="w-full max-w-5xl text-center text-slate-500 py-6 mt-4">
          <p>&copy; {new Date().getFullYear()} Simple Document Sign. All rights reserved.</p>
      </footer>

      <SignatureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSignature}
      />
    </div>
  );
};

export default App;