import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Edit2, Play, Save } from 'lucide-react';
import { SavedGrid, GridState } from './types';
import Modal from './Modal';

type GridManagerProps = {
  onClose: () => void;
  onLoad: (grid: SavedGrid) => void;
};

export default function GridManager({ onClose, onLoad }: GridManagerProps) {
  const [savedGrids, setSavedGrids] = useState<SavedGrid[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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
    <div className="flex flex-col h-full bg-slate-950 text-slate-200">
      <header className="flex items-center gap-4 p-6 border-b border-white/10">
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold uppercase tracking-widest text-slate-100">Saved Grids</h1>
      </header>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedGrids.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">
              No saved grids found. Save your work from the main editor.
            </div>
          ) : (
            savedGrids.sort((a, b) => b.updatedAt - a.updatedAt).map(grid => (
              <div key={grid.id} className="glass-panel p-5 rounded-xl flex flex-col gap-4 group transition-all hover:border-indigo-500/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <div className="flex items-start justify-between gap-2">
                  {editingId === grid.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRename(grid.id, editName)}
                        className="glass-input flex-1 px-2 py-1"
                      />
                      <button onClick={() => handleRename(grid.id, editName)} className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded transition-colors">
                        <Save className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-200 truncate group-hover:text-indigo-300 transition-colors" title={grid.name}>{grid.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(grid.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {editingId !== grid.id && (
                    <div className="flex items-center gap-1 shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditingId(grid.id); setEditName(grid.name); }}
                        className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/20 rounded transition-colors"
                        title="Rename"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(grid.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 bg-slate-900/50 p-3 rounded-lg border border-white/5">
                  <div><span className="font-medium text-slate-300">Size:</span> {grid.gridState.cols}x{grid.gridState.rows}</div>
                  <div><span className="font-medium text-slate-300">Cells:</span> {Object.keys(grid.gridState.cells).length}</div>
                </div>

                <button
                  onClick={() => onLoad(grid)}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-all shadow-[0_0_10px_rgba(99,102,241,0.3)] mt-auto"
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
          <p className="text-slate-300 text-sm">Are you sure you want to delete this saved grid? This action cannot be undone.</p>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="px-4 py-2 text-sm font-medium bg-rose-600 text-white hover:bg-rose-500 rounded-lg transition-colors shadow-[0_0_10px_rgba(244,63,94,0.3)]"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
