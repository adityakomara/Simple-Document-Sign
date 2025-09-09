import React, { useCallback, useState } from 'react';
import { UploadIcon, CheckCircleIcon, ExclamationTriangleIcon } from './Icons';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv'
];
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv'];

const validateFile = (file: File): string | null => {
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    // Check both MIME type and extension for robustness
    if (ALLOWED_MIME_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(fileExtension)) {
        return null; // File is valid
    }
    return 'Unsupported file type. Please upload a PDF, Word, Excel, or CSV file.';
};


const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const [uploadState, setUploadState] = useState<'idle' | 'dragging' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSuccessfulUpload = useCallback((file: File) => {
    setUploadState('success');
    setTimeout(() => {
      onFileSelect(file);
    }, 1500);
  }, [onFileSelect]);
  
  const processFile = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
        setErrorMessage(error);
        setUploadState('error');
        // Reset to idle after a delay so the user can read the message
        setTimeout(() => {
            setUploadState('idle');
            setErrorMessage('');
        }, 3000);
    } else {
        handleSuccessfulUpload(file);
    }
  }, [handleSuccessfulUpload]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      processFile(event.target.files[0]);
    }
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setUploadState('idle');
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      processFile(event.dataTransfer.files[0]);
      event.dataTransfer.clearData();
    }
  }, [processFile]);

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragEnter = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (uploadState === 'idle') {
      setUploadState('dragging');
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (uploadState === 'dragging') {
        setUploadState('idle');
    }
  };
  
  const getDropzoneClasses = () => {
    switch (uploadState) {
        case 'dragging':
            return 'border-blue-500 bg-blue-50 transform scale-105 shadow-xl';
        case 'success':
            return 'border-green-500 bg-green-50';
        case 'error':
            return 'border-red-500 bg-red-50';
        default:
            return 'border-slate-300 bg-slate-50 hover:bg-slate-100';
    }
  };

  const renderContent = () => {
      switch (uploadState) {
          case 'dragging':
              return (
                  <>
                      <UploadIcon className="w-12 h-12 mb-4 text-blue-500" />
                      <p className="mb-2 text-xl font-semibold text-blue-600">
                          Drop your file here!
                      </p>
                  </>
              );
          case 'success':
              return (
                  <>
                      <div className="relative">
                          <CheckCircleIcon className="w-16 h-16 text-green-500" />
                          <div className="absolute top-0 left-0 w-16 h-16 border-2 border-green-200 rounded-full animate-ping"></div>
                      </div>
                      <p className="mt-4 text-xl font-semibold text-green-700">
                          Upload Successful!
                      </p>
                  </>
              );
          case 'error':
            return (
                <>
                    <ExclamationTriangleIcon className="w-12 h-12 mb-4 text-red-500" />
                    <p className="mb-2 text-lg font-semibold text-red-700">
                        Invalid File Type
                    </p>
                    <p className="text-sm text-red-600 text-center px-4">{errorMessage}</p>
                </>
            );
          default: // idle
              return (
                  <>
                      <UploadIcon className="w-10 h-10 mb-4 text-slate-500" />
                      <p className="mb-2 text-lg text-slate-600">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-sm text-slate-500">PDF, Word, Excel, or CSV documents</p>
                  </>
              );
      }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
        <label
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            htmlFor="file-upload"
            className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300 ${getDropzoneClasses()}`}
        >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {renderContent()}
            </div>
            <input 
                id="file-upload" 
                type="file" 
                className="hidden" 
                onChange={handleFileChange}
                accept={ALLOWED_EXTENSIONS.join(',')}
                disabled={uploadState === 'success' || uploadState === 'error'}
            />
        </label>
    </div>
  );
};

export default FileUpload;