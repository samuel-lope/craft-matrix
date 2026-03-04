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
    <div className="flex flex-col h-full bg-neutral-50">
      <header className="flex items-center gap-4 p-6 border-b border-neutral-200 bg-white">
        <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-semibold">Saved Grids</h1>
      </header>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedGrids.length === 0 ? (
            <div className="col-span-full py-12 text-center text-neutral-500 border-2 border-dashed border-neutral-200 rounded-xl bg-white">
              No saved grids found. Save your work from the main editor.
            </div>
          ) : (
            savedGrids.sort((a, b) => b.updatedAt - a.updatedAt).map(grid => (
              <div key={grid.id} className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
                <div className="flex items-start justify-between gap-2">
                  {editingId === grid.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input 
                        type="text" 
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRename(grid.id, editName)}
                        className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button onClick={() => handleRename(grid.id, editName)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                        <Save className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-neutral-900 truncate" title={grid.name}>{grid.name}</h3>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {new Date(grid.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                  
                  {editingId !== grid.id && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={() => { setEditingId(grid.id); setEditName(grid.name); }}
                        className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Rename"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setDeleteConfirmId(grid.id)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600 bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                  <div><span className="font-medium">Size:</span> {grid.gridState.cols}x{grid.gridState.rows}</div>
                  <div><span className="font-medium">Cells:</span> {Object.keys(grid.gridState.cells).length}</div>
                </div>

                <button 
                  onClick={() => onLoad(grid)}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-neutral-900 hover:bg-black text-white rounded-lg text-sm font-medium transition-colors mt-auto"
                >
                  <Play className="w-4 h-4" />
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
          <p className="text-neutral-600">Are you sure you want to delete this saved grid? This action cannot be undone.</p>
          <div className="flex justify-end gap-3 pt-2">
            <button 
              onClick={() => setDeleteConfirmId(null)}
              className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="px-4 py-2 text-sm font-medium bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
