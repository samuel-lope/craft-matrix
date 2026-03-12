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
    <div className="flex flex-col h-full bg-black text-neutral-200">
      <header className="flex items-center gap-4 p-6 border-b border-neutral-800">
        <button onClick={onClose} className="p-2 hover:bg-neutral-900 rounded-full transition-colors text-neutral-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-bold uppercase tracking-widest text-neutral-100">Asset Manager</h1>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-neutral-800 bg-neutral-950 p-4 space-y-2">
          <button
            onClick={() => { setActiveTab('colors'); setEditingId(null); }}
            className={`w-full text-left px-4 py-2 font-bold text-[10px] uppercase tracking-widest transition-colors ${activeTab === 'colors' ? 'bg-white text-black' : 'hover:bg-neutral-900 text-neutral-500 hover:text-neutral-300'}`}
          >
            Colors
          </button>
          <button
            onClick={() => { setActiveTab('bg-svgs'); setEditingId(null); }}
            className={`w-full text-left px-4 py-2 font-bold text-[10px] uppercase tracking-widest transition-colors ${activeTab === 'bg-svgs' ? 'bg-white text-black' : 'hover:bg-neutral-900 text-neutral-500 hover:text-neutral-300'}`}
          >
            Background SVGs
          </button>
          <button
            onClick={() => { setActiveTab('item-svgs'); setEditingId(null); }}
            className={`w-full text-left px-4 py-2 font-bold text-[10px] uppercase tracking-widest transition-colors ${activeTab === 'item-svgs' ? 'bg-white text-black' : 'hover:bg-neutral-900 text-neutral-500 hover:text-neutral-300'}`}
          >
            Item SVGs
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto flex gap-8">
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <h2 className="text-xl font-bold capitalize text-neutral-200 tracking-tight">{activeTab.replace('-', ' ')}</h2>
              <button
                onClick={handleAdd}
                className="btn-primary flex items-center gap-2 py-2 px-4"
              >
                <Plus className="w-4 h-4" />
                Add New
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {getActiveAssets().map(asset => (
                <div key={asset.id} className="bg-neutral-950 border border-neutral-800 p-4 flex flex-col gap-3 group relative overflow-hidden transition-colors hover:border-neutral-500">
                  <div className="h-24 border border-neutral-800 flex items-center justify-center bg-black overflow-hidden relative">
                    {activeTab === 'colors' ? (
                      <div className="absolute inset-0" style={{ backgroundColor: asset.value }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" dangerouslySetInnerHTML={{ __html: asset.value }} />
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-bold text-[10px] uppercase tracking-widest truncate pr-2 text-neutral-400 group-hover:text-neutral-100">{asset.name}</span>
                    <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(asset)} className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(asset.id)} className="p-1.5 text-neutral-500 hover:text-rose-500 hover:bg-rose-950/30 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {getActiveAssets().length === 0 && (
                <div className="col-span-full py-12 text-center text-[10px] font-bold tracking-widest uppercase text-neutral-600 border border-dashed border-neutral-800 bg-neutral-950">
                  No assets found. Click "Add New" to create one.
                </div>
              )}
            </div>
          </div>

          {/* Editor Panel */}
          {editingId && (
            <div className="w-96 bg-black border border-neutral-800 flex flex-col h-fit sticky top-0">
              <div className="flex items-center justify-between p-4 border-b border-neutral-800">
                <h3 className="font-bold text-neutral-200 uppercase tracking-widest text-[10px]">Edit Asset</h3>
                <button onClick={() => setEditingId(null)} className="p-1 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="glass-input w-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                    {activeTab === 'colors' ? 'Color Value (Hex, RGB, RGBA)' : 'SVG Code'}
                  </label>
                  {activeTab === 'colors' ? (
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={editValue.startsWith('#') ? editValue.slice(0, 7) : '#000000'}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-10 h-10 cursor-pointer border-0 p-0 bg-transparent ring-1 ring-neutral-800"
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

                <div className="pt-4 mt-6 border-t border-neutral-800 flex justify-end gap-3">
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="btn-primary flex items-center gap-2 py-2 px-4 shadow-none"
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
