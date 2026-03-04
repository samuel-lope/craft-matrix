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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="glass-panel w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="font-bold text-lg text-slate-100 uppercase tracking-widest">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 text-slate-300">
          {children}
        </div>
      </div>
    </div>
  );
}
