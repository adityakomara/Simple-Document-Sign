
import React, { useRef, useEffect } from 'react';
// @ts-ignore
import SignatureCanvas from 'react-signature-canvas';
import { CloseIcon, TrashIcon, CheckIcon } from './Icons';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signature: string) => void;
}

const SignatureModal: React.FC<SignatureModalProps> = ({ isOpen, onClose, onSave }) => {
  const sigPad = useRef<SignatureCanvas>(null);

  const clear = () => {
    sigPad.current?.clear();
  };

  const save = () => {
    if (sigPad.current?.isEmpty()) {
        alert("Please provide a signature first.");
        return;
    }
    const signatureDataUrl = sigPad.current?.getTrimmedCanvas().toDataURL('image/png');
    if (signatureDataUrl) {
      onSave(signatureDataUrl);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Clear canvas when modal opens
      sigPad.current?.clear();
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800">Create Your Signature</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
            <CloseIcon />
          </button>
        </header>

        <main className="p-4">
            <div className="w-full h-48 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg overflow-hidden">
                <SignatureCanvas
                    ref={sigPad}
                    penColor='black'
                    canvasProps={{ className: 'w-full h-full' }}
                />
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center">Draw your signature in the box above.</p>
        </main>
        
        <footer className="flex justify-end items-center p-4 space-x-3 bg-slate-50 rounded-b-xl">
          <button
            onClick={clear}
            className="inline-flex items-center justify-center px-4 py-2 text-base font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 focus:ring-4 focus:ring-slate-200 transition-colors duration-200"
          >
            <TrashIcon />
            <span className="ml-2">Clear</span>
          </button>
          <button
            onClick={save}
            className="inline-flex items-center justify-center px-5 py-2 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors duration-200"
          >
            <CheckIcon />
            <span className="ml-2">Apply Signature</span>
          </button>
        </footer>
      </div>
    </div>
  );
};

export default SignatureModal;
