import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Edit2, Play, Save, Cloud, Link, Check } from 'lucide-react';
import { SavedGrid, GridState } from './types';
import Modal from './Modal';
import { generateSimplifiedSvg } from './gridUtils';

type GridManagerProps = {
  onClose: () => void;
  onLoad: (grid: SavedGrid) => void;
};

export default function GridManager({ onClose, onLoad }: GridManagerProps) {
  const [savedGrids, setSavedGrids] = useState<SavedGrid[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (workspaceId: string) => {
    const url = `${window.location.origin}/?workspace=${workspaceId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(workspaceId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    const stored = localStorage.getItem('savedGrids');
    if (stored) {
      try {
        setSavedGrids(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse saved grids', e);
      }
    }
  }, []);

  const saveToStorage = (grids: SavedGrid[]) => {
    localStorage.setItem('savedGrids', JSON.stringify(grids));
    setSavedGrids(grids);
  };

  const handleRename = (id: string, newName: string) => {
    if (!newName.trim()) return;
    const updated = savedGrids.map(g => g.id === id ? { ...g, name: newName.trim(), updatedAt: Date.now() } : g);
    saveToStorage(updated);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    const updated = savedGrids.filter(g => g.id !== id);
    saveToStorage(updated);
    setDeleteConfirmId(null);
  };

  return (
    <div className="flex flex-col h-full bg-black text-neutral-200">
      <header className="flex items-center gap-4 p-6 border-b border-neutral-800">
        <button onClick={onClose} className="p-2 hover:bg-neutral-900 transition-colors text-neutral-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-bold uppercase tracking-widest text-neutral-100">Saved Grids</h1>
      </header>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedGrids.length === 0 ? (
            <div className="col-span-full py-12 text-center text-[10px] font-bold tracking-widest uppercase text-neutral-600 border border-dashed border-neutral-800 bg-neutral-950">
              No saved grids found. Save your work from the main editor.
            </div>
          ) : (
            savedGrids.sort((a, b) => b.updatedAt - a.updatedAt).map(grid => (
              <div key={grid.id} className="bg-neutral-950 border border-neutral-800 p-5 flex flex-col gap-4 group transition-colors hover:border-neutral-500 rounded-sm">
                
                <div className="w-full aspect-square bg-black border border-neutral-800 rounded-sm overflow-hidden flex items-center justify-center p-2 relative">
                  <div 
                    className="w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain" 
                    dangerouslySetInnerHTML={{ __html: generateSimplifiedSvg(grid.gridState, false) }} 
                  />
                  {grid.workspaceId && (
                    <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm border border-neutral-800 rounded-sm px-1.5 py-1 flex items-center gap-1 text-sky-400">
                      <Cloud className="w-3 h-3" />
                      <span className="text-[8px] font-bold uppercase tracking-widest hidden sm:inline">Synced</span>
                    </div>
                  )}
                </div>

                <div className="flex items-start justify-between gap-2">
                  {editingId === grid.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRename(grid.id, editName)}
                        className="glass-input flex-1 px-2 py-1 uppercase text-[10px] tracking-widest"
                        aria-label="New grid name"
                      />
                      <button onClick={() => handleRename(grid.id, editName)} className="p-1 text-white hover:bg-neutral-800 transition-colors">
                        <Save className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-xs uppercase tracking-widest text-neutral-300 truncate group-hover:text-white transition-colors" title={grid.name}>{grid.name}</h3>
                      <p className="text-[10px] tracking-widest uppercase text-neutral-500 mt-1">
                        {new Date(grid.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {editingId !== grid.id && (
                    <div className="flex items-center gap-1 shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      {grid.workspaceId && (
                        <button
                          onClick={() => handleCopyLink(grid.workspaceId!)}
                          className="p-1.5 text-neutral-500 hover:text-sky-400 hover:bg-sky-950/30 transition-colors"
                          title="Copy Link"
                        >
                          {copiedId === grid.workspaceId ? <Check className="w-4 h-4 text-emerald-500" /> : <Link className="w-4 h-4" />}
                        </button>
                      )}
                      <button
                        onClick={() => { setEditingId(grid.id); setEditName(grid.name); }}
                        className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors"
                        title="Rename"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(grid.id)}
                        className="p-1.5 text-neutral-500 hover:text-rose-500 hover:bg-rose-950/30 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] uppercase tracking-widest text-neutral-500 bg-black p-3 border border-neutral-800">
                  <div><span className="font-bold text-neutral-400">Size:</span> {grid.gridState.cols}x{grid.gridState.rows}</div>
                  <div><span className="font-bold text-neutral-400">Cells:</span> {Object.keys(grid.gridState.cells).length}</div>
                </div>

                <button
                  onClick={() => onLoad(grid)}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-white hover:bg-neutral-200 text-black text-[10px] uppercase tracking-widest font-bold transition-colors mt-auto"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Load Grid
                </button>
              </div>
            ))
          )}
        </div>
      </main>

      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Saved Grid"
      >
        <div className="space-y-4">
          <p className="text-neutral-400 text-xs">Are you sure you want to delete this saved grid? This action cannot be undone.</p>
          <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-neutral-800">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="px-4 py-2 text-[10px] uppercase tracking-widest font-bold text-neutral-500 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="px-4 py-2 text-[10px] uppercase tracking-widest font-bold bg-neutral-900 text-rose-500 hover:bg-rose-950 border border-rose-900/50 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
