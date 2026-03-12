import React from 'react';
import { X } from 'lucide-react';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80">
      <div className="bg-black border border-neutral-800 w-full max-w-md animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-widest">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-neutral-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 text-neutral-300">
          {children}
        </div>
      </div>
    </div>
  );
}
