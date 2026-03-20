import React, { useState } from 'react';
import { Copy, Check, Cloud, Globe, Clock, User } from 'lucide-react';
import Modal from './Modal';

type SyncModalProps = {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string | null;
  ownerName: string | null;
  syncDate: number | null;
};

export default function SyncModal({ isOpen, onClose, workspaceId, ownerName, syncDate }: SyncModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (workspaceId) {
      navigator.clipboard.writeText(`${window.location.origin}/?workspace=${workspaceId}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!workspaceId) return null;
  const link = `${window.location.origin}/?workspace=${workspaceId}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Workspace Online">
      <div className="space-y-6">
        
        <div className="p-4 bg-sky-950/20 border border-sky-900/50 rounded-lg flex items-start gap-4">
          <div className="p-2 bg-sky-500/10 rounded overflow-hidden shrink-0 ring-1 ring-sky-500/20">
             <Cloud className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-sky-400 uppercase tracking-widest leading-none mb-1">Cloud Synchronized</h3>
            <p className="text-xs text-neutral-400 leading-relaxed font-medium">
              This grid is securely stored on Cloudflare D1 and accessible worldwide through the unique link below.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Public Share Link</label>
          <div className="flex bg-black border border-neutral-800 transition-all overflow-hidden focus-within:ring-1 focus-within:ring-white">
            <div className="flex items-center justify-center px-3 border-r border-neutral-800 bg-neutral-950">
              <Globe className="w-4 h-4 text-emerald-500" />
            </div>
            <input
              type="text"
              readOnly
              value={link}
              className="w-full h-10 px-3 bg-transparent text-[11px] font-mono font-medium text-neutral-300 outline-none select-all"
            />
            <button
              onClick={handleCopy}
              className="px-4 border-l border-neutral-800 bg-neutral-900 hover:bg-neutral-800 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-1.5"
            >
              {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-neutral-800">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
              <User className="w-3 h-3" /> Owner
            </div>
            <div className="text-xs font-bold text-neutral-300 uppercase tracking-widest">
              {ownerName || 'Unknown'}
            </div>
          </div>
          <div className="space-y-1 justify-self-end text-right">
            <div className="flex items-center justify-end gap-1.5 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
              <Clock className="w-3 h-3" /> Last Synced
            </div>
            <div className="text-xs font-bold text-neutral-300 tracking-wider">
              {syncDate ? new Date(syncDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
            </div>
          </div>
        </div>
        
        <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-3 btn-primary text-center"
            >
              Done
            </button>
        </div>

      </div>
    </Modal>
  );
}
