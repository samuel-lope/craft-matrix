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
    <div className="flex flex-col h-full bg-white">
      <header className="flex items-center gap-4 p-6 border-b border-neutral-200">
        <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-semibold">Asset Manager</h1>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-neutral-200 bg-neutral-50 p-4 space-y-2">
          <button 
            onClick={() => { setActiveTab('colors'); setEditingId(null); }}
            className={`w-full text-left px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'colors' ? 'bg-blue-100 text-blue-700' : 'hover:bg-neutral-200 text-neutral-700'}`}
          >
            Colors
          </button>
          <button 
            onClick={() => { setActiveTab('bg-svgs'); setEditingId(null); }}
            className={`w-full text-left px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'bg-svgs' ? 'bg-blue-100 text-blue-700' : 'hover:bg-neutral-200 text-neutral-700'}`}
          >
            Background SVGs
          </button>
          <button 
            onClick={() => { setActiveTab('item-svgs'); setEditingId(null); }}
            className={`w-full text-left px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'item-svgs' ? 'bg-blue-100 text-blue-700' : 'hover:bg-neutral-200 text-neutral-700'}`}
          >
            Item SVGs
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto flex gap-8">
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium capitalize">{activeTab.replace('-', ' ')}</h2>
              <button 
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add New
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {getActiveAssets().map(asset => (
                <div key={asset.id} className="border border-neutral-200 rounded-lg p-4 bg-white shadow-sm flex flex-col gap-3">
                  <div className="h-24 rounded border border-neutral-100 flex items-center justify-center bg-neutral-50 overflow-hidden relative">
                    {activeTab === 'colors' ? (
                      <div className="absolute inset-0" style={{ backgroundColor: asset.value }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" dangerouslySetInnerHTML={{ __html: asset.value }} />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm truncate pr-2">{asset.name}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(asset)} className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(asset.id)} className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {getActiveAssets().length === 0 && (
                <div className="col-span-full py-12 text-center text-neutral-500 border-2 border-dashed border-neutral-200 rounded-lg">
                  No assets found. Click "Add New" to create one.
                </div>
              )}
            </div>
          </div>

          {/* Editor Panel */}
          {editingId && (
            <div className="w-96 bg-white border border-neutral-200 rounded-xl shadow-lg flex flex-col h-fit sticky top-0">
              <div className="flex items-center justify-between p-4 border-b border-neutral-200">
                <h3 className="font-medium">Edit Asset</h3>
                <button onClick={() => setEditingId(null)} className="p-1 text-neutral-400 hover:text-neutral-600 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-neutral-700">Name</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-neutral-700">
                    {activeTab === 'colors' ? 'Color Value (Hex, RGB, RGBA)' : 'SVG Code'}
                  </label>
                  {activeTab === 'colors' ? (
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={editValue.startsWith('#') ? editValue.slice(0, 7) : '#000000'}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                      />
                      <input 
                        type="text" 
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  ) : (
                    <textarea 
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md text-xs font-mono h-48 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    />
                  )}
                </div>

                <div className="pt-4 border-t border-neutral-100 flex justify-end gap-2">
                  <button 
                    onClick={() => setEditingId(null)}
                    className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
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
