import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { SavedAsset } from './types';

type AssetManagerProps = {
  onClose: () => void;
  savedColors: SavedAsset[];
  setSavedColors: React.Dispatch<React.SetStateAction<SavedAsset[]>>;
  savedBgSvgs: SavedAsset[];
  setSavedBgSvgs: React.Dispatch<React.SetStateAction<SavedAsset[]>>;
  savedItemSvgs: SavedAsset[];
  setSavedItemSvgs: React.Dispatch<React.SetStateAction<SavedAsset[]>>;
};

export default function AssetManager({
  onClose,
  savedColors,
  setSavedColors,
  savedBgSvgs,
  setSavedBgSvgs,
  savedItemSvgs,
  setSavedItemSvgs
}: AssetManagerProps) {
  const [activeTab, setActiveTab] = useState<'colors' | 'bg-svgs' | 'item-svgs'>('colors');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editValue, setEditValue] = useState('');

  const getActiveAssets = () => {
    switch (activeTab) {
      case 'colors': return savedColors;
      case 'bg-svgs': return savedBgSvgs;
      case 'item-svgs': return savedItemSvgs;
    }
  };

  const setActiveAssets = (assets: SavedAsset[]) => {
    switch (activeTab) {
      case 'colors': setSavedColors(assets); break;
      case 'bg-svgs': setSavedBgSvgs(assets); break;
      case 'item-svgs': setSavedItemSvgs(assets); break;
    }
  };

  const handleAdd = () => {
    const newAsset: SavedAsset = {
      id: Date.now().toString(),
      name: `New ${activeTab === 'colors' ? 'Color' : 'SVG'}`,
      value: activeTab === 'colors' ? '#000000' : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="currentColor"/></svg>'
    };
    setActiveAssets([...getActiveAssets(), newAsset]);
    handleEdit(newAsset);
  };

  const handleEdit = (asset: SavedAsset) => {
    setEditingId(asset.id);
    setEditName(asset.name);
    setEditValue(asset.value);
  };

  const handleSave = () => {
    if (!editingId) return;
    const updatedAssets = getActiveAssets().map(a =>
      a.id === editingId ? { ...a, name: editName, value: editValue } : a
    );
    setActiveAssets(updatedAssets);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setActiveAssets(getActiveAssets().filter(a => a.id !== id));
    if (editingId === id) setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200">
      <header className="flex items-center gap-4 p-6 border-b border-white/10">
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold uppercase tracking-widest text-slate-100">Asset Manager</h1>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-white/10 bg-slate-900/50 p-4 space-y-2">
          <button
            onClick={() => { setActiveTab('colors'); setEditingId(null); }}
            className={`w-full text-left px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'colors' ? 'bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'}`}
          >
            Colors
          </button>
          <button
            onClick={() => { setActiveTab('bg-svgs'); setEditingId(null); }}
            className={`w-full text-left px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'bg-svgs' ? 'bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'}`}
          >
            Background SVGs
          </button>
          <button
            onClick={() => { setActiveTab('item-svgs'); setEditingId(null); }}
            className={`w-full text-left px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'item-svgs' ? 'bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'}`}
          >
            Item SVGs
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto flex gap-8">
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium capitalize text-slate-200">{activeTab.replace('-', ' ')}</h2>
              <button
                onClick={handleAdd}
                className="btn-primary flex items-center gap-2 py-2 px-4 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add New
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {getActiveAssets().map(asset => (
                <div key={asset.id} className="glass-panel p-4 flex flex-col gap-3 group relative overflow-hidden transition-all hover:border-indigo-500/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] bg-slate-900/40">
                  <div className="h-24 rounded border border-white/10 flex items-center justify-center bg-slate-950 overflow-hidden relative">
                    {activeTab === 'colors' ? (
                      <div className="absolute inset-0" style={{ backgroundColor: asset.value }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" dangerouslySetInnerHTML={{ __html: asset.value }} />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm truncate pr-2 text-slate-300 group-hover:text-slate-100">{asset.name}</span>
                    <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(asset)} className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/20 rounded transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(asset.id)} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {getActiveAssets().length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-lg">
                  No assets found. Click "Add New" to create one.
                </div>
              )}
            </div>
          </div>

          {/* Editor Panel */}
          {editingId && (
            <div className="w-96 glass-panel flex flex-col h-fit sticky top-0 shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h3 className="font-semibold text-slate-200 uppercase tracking-widest text-sm">Edit Asset</h3>
                <button onClick={() => setEditingId(null)} className="p-1 text-slate-400 hover:text-slate-200 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="glass-input w-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {activeTab === 'colors' ? 'Color Value (Hex, RGB, RGBA)' : 'SVG Code'}
                  </label>
                  {activeTab === 'colors' ? (
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={editValue.startsWith('#') ? editValue.slice(0, 7) : '#000000'}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent ring-1 ring-white/10"
                      />
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="glass-input flex-1"
                      />
                    </div>
                  ) : (
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="glass-input w-full h-48 font-mono text-xs resize-none"
                    />
                  )}
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="btn-primary flex items-center gap-2 py-2 px-4 shadow-[0_0_10px_rgba(139,92,246,0.3)]"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
