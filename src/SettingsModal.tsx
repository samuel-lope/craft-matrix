import React, { useState, useEffect } from 'react';
import {
  X, Plus, Trash2, Edit2, Save, Pipette, Link, Check, Play, Cloud, Download, Loader2, Columns3
} from 'lucide-react';
import { SavedAsset, SavedGrid } from './types';
import { generateSimplifiedSvg } from './gridUtils';
import Modal from './Modal';

// ─── Types ────────────────────────────────────────────────────────────────────

declare global {
  interface EyeDropper { open(): Promise<{ sRGBHex: string }>; }
  interface Window { EyeDropper: { new(): EyeDropper }; }
}

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'grids' | 'assets';
  currentUser: { id: string; login: string } | null;
  // Asset props
  savedColors: SavedAsset[];
  setSavedColors: (assets: SavedAsset[]) => void;
  savedBgSvgs: SavedAsset[];
  setSavedBgSvgs: (assets: SavedAsset[]) => void;
  savedItemSvgs: SavedAsset[];
  setSavedItemSvgs: (assets: SavedAsset[]) => void;
  // Grid props
  onLoadGrid: (grid: SavedGrid) => void;
};

// ─── Column Selector ─────────────────────────────────────────────────────────

const COLUMN_OPTIONS = [3, 4, 5, 6] as const;
const LS_KEY_COLUMNS = 'settingsColumnCount';

function ColumnSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <Columns3 className="w-3.5 h-3.5 text-neutral-500" />
      {COLUMN_OPTIONS.map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`w-7 h-7 flex items-center justify-center text-[10px] font-bold tracking-widest transition-colors rounded-sm ${
            value === n
              ? 'bg-white text-black'
              : 'bg-neutral-900 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 border border-neutral-800'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

// ─── Assets Tab ──────────────────────────────────────────────────────────────

function AssetsTab({
  savedColors, setSavedColors,
  savedBgSvgs, setSavedBgSvgs,
  savedItemSvgs, setSavedItemSvgs,
  columnCount, currentUser
}: Omit<SettingsModalProps, 'isOpen' | 'onClose' | 'initialTab' | 'onLoadGrid'> & { columnCount: number }) {
  const [assetSection, setAssetSection] = useState<'colors' | 'bg-svgs' | 'item-svgs'>('colors');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editValue, setEditValue] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const getActiveAssets = (): SavedAsset[] => {
    if (assetSection === 'colors') return savedColors;
    if (assetSection === 'bg-svgs') return savedBgSvgs;
    return savedItemSvgs;
  };

  const setActiveAssets = (assets: SavedAsset[]) => {
    if (assetSection === 'colors') setSavedColors(assets);
    else if (assetSection === 'bg-svgs') setSavedBgSvgs(assets);
    else setSavedItemSvgs(assets);
  };

  const handleAdd = () => {
    const newAsset: SavedAsset = {
      id: Date.now().toString(),
      name: `New ${assetSection === 'colors' ? 'Color' : 'SVG'}`,
      value: assetSection === 'colors' ? '#000000' : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="currentColor"/></svg>'
    };
    setActiveAssets([...getActiveAssets(), newAsset]);
    setEditingId(newAsset.id);
    setEditName(newAsset.name);
    setEditValue(newAsset.value);
  };

  const handleDetectColor = async () => {
    if (!('EyeDropper' in window)) return;
    try {
      const result = await new window.EyeDropper().open();
      const nc: SavedAsset = { id: Date.now().toString(), name: `Color ${savedColors.length + 1}`, value: result.sRGBHex };
      setSavedColors([...savedColors, nc]);
      setAssetSection('colors');
      setEditingId(nc.id); setEditName(nc.name); setEditValue(nc.value);
    } catch {}
  };

  const handleSave = () => {
    if (!editingId) return;
    setActiveAssets(getActiveAssets().map(a => a.id === editingId ? { ...a, name: editName, value: editValue } : a));
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setActiveAssets(getActiveAssets().filter(a => a.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleFetchCloudAssets = async () => {
    setIsFetching(true);
    try {
      const res = await fetch('/api/sync/list');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      const workspaces = data.workspaces || [];

      // Consolidate assets from all workspaces
      let allColors: SavedAsset[] = [];
      let allBgSvgs: SavedAsset[] = [];
      let allItemSvgs: SavedAsset[] = [];

      for (const ws of workspaces) {
        if (ws.colors_json) {
          try { allColors = [...allColors, ...JSON.parse(ws.colors_json)]; } catch {}
        }
        if (ws.bg_svgs_json) {
          try { allBgSvgs = [...allBgSvgs, ...JSON.parse(ws.bg_svgs_json)]; } catch {}
        }
        if (ws.item_svgs_json) {
          try { allItemSvgs = [...allItemSvgs, ...JSON.parse(ws.item_svgs_json)]; } catch {}
        }
      }

      // Deduplicate by id
      const dedup = (arr: SavedAsset[]) => {
        const seen = new Set<string>();
        return arr.filter(a => { if (seen.has(a.id)) return false; seen.add(a.id); return true; });
      };

      setSavedColors(dedup(allColors));
      setSavedBgSvgs(dedup(allBgSvgs));
      setSavedItemSvgs(dedup(allItemSvgs));

      localStorage.setItem('savedColors', JSON.stringify(dedup(allColors)));
      localStorage.setItem('savedBgSvgs', JSON.stringify(dedup(allBgSvgs)));
      localStorage.setItem('savedItemSvgs', JSON.stringify(dedup(allItemSvgs)));
    } catch (err) {
      console.error('Failed to fetch cloud assets:', err);
    } finally {
      setIsFetching(false);
      setShowConfirm(false);
    }
  };

  const sectionLabel = { colors: 'Colors', 'bg-svgs': 'Background SVGs', 'item-svgs': 'Item SVGs' }[assetSection];

  return (
    <div className="flex flex-1 overflow-hidden min-h-0">
      {/* Left nav */}
      <aside className="w-48 shrink-0 border-r border-neutral-800 bg-neutral-950 p-3 space-y-1">
        {(['colors', 'bg-svgs', 'item-svgs'] as const).map(s => (
          <button
            key={s}
            onClick={() => { setAssetSection(s); setEditingId(null); }}
            className={`w-full text-left px-3 py-2 font-bold text-[10px] uppercase tracking-widest transition-colors rounded-sm ${assetSection === s ? 'bg-white text-black' : 'hover:bg-neutral-900 text-neutral-500 hover:text-neutral-300'}`}
          >
            {{ colors: 'Colors', 'bg-svgs': 'Background SVGs', 'item-svgs': 'Item SVGs' }[s]}
          </button>
        ))}
      </aside>

      {/* Main grid */}
      <main className="flex-1 overflow-y-auto p-6 flex gap-6">
        <div className="flex-1 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
            <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-200">{sectionLabel}</h2>
            <div className="flex items-center gap-2">
              {currentUser && (
                <button onClick={() => setShowConfirm(true)} disabled={isFetching} className="btn-secondary flex items-center gap-2 py-1.5 px-3 text-[10px]">
                  {isFetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  Fetch Cloud
                </button>
              )}
              {assetSection === 'colors' && 'EyeDropper' in window && (
                <button onClick={handleDetectColor} className="btn-secondary flex items-center gap-2 py-1.5 px-3 text-[10px]">
                  <Pipette className="w-3.5 h-3.5" /> Detect
                </button>
              )}
              <button onClick={handleAdd} className="btn-primary flex items-center gap-2 py-1.5 px-3 text-[10px]">
                <Plus className="w-3.5 h-3.5" /> Add New
              </button>
            </div>
          </div>

          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}>
            {getActiveAssets().map(asset => (
              <div key={asset.id} className="bg-neutral-950 border border-neutral-800 p-3 flex flex-col gap-2 group transition-colors hover:border-neutral-500 rounded-sm">
                <div className="h-20 border border-neutral-800 flex items-center justify-center bg-black overflow-hidden relative rounded-sm">
                  {assetSection === 'colors'
                    ? <div className="absolute inset-0" style={{ backgroundColor: asset.value }} />
                    : <div className="w-full h-full flex items-center justify-center" dangerouslySetInnerHTML={{ __html: asset.value }} />
                  }
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[10px] uppercase tracking-widest truncate pr-1 text-neutral-400 group-hover:text-neutral-100">{asset.name}</span>
                  <div className="flex items-center gap-0.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => { setEditingId(asset.id); setEditName(asset.name); setEditValue(asset.value); }} className="p-1 text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors rounded">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(asset.id)} className="p-1 text-neutral-500 hover:text-rose-500 hover:bg-rose-950/30 transition-colors rounded">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {getActiveAssets().length === 0 && (
              <div className="col-span-full py-10 text-center text-[10px] font-bold tracking-widest uppercase text-neutral-600 border border-dashed border-neutral-800">
                No assets. Click "Add New" to create one.
              </div>
            )}
          </div>
        </div>

        {/* Edit panel */}
        {editingId && (
          <div className="w-80 shrink-0 bg-black border border-neutral-800 flex flex-col h-fit sticky top-0 rounded-sm">
            <div className="flex items-center justify-between p-4 border-b border-neutral-800">
              <h3 className="font-bold text-[10px] uppercase tracking-widest text-neutral-200">Edit Asset</h3>
              <button onClick={() => setEditingId(null)} className="p-1 text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Name</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="glass-input w-full" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                  {assetSection === 'colors' ? 'Color Value' : 'SVG Code'}
                </label>
                {assetSection === 'colors' ? (
                  <div className="flex gap-2">
                    <input type="color" value={editValue.startsWith('#') ? editValue.slice(0, 7) : '#000000'} onChange={e => setEditValue(e.target.value)} className="w-10 h-10 cursor-pointer border-0 p-0 bg-transparent ring-1 ring-neutral-800 rounded" />
                    <input type="text" value={editValue} onChange={e => setEditValue(e.target.value)} className="glass-input flex-1" />
                  </div>
                ) : (
                  <textarea value={editValue} onChange={e => setEditValue(e.target.value)} className="glass-input w-full h-40 font-mono text-xs resize-none" />
                )}
              </div>
              <div className="pt-4 border-t border-neutral-800 flex justify-end gap-2">
                <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} className="btn-primary flex items-center gap-2 py-1.5 px-3 text-[10px]">
                  <Save className="w-3.5 h-3.5" /> Save
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Confirm replace modal */}
      <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)} title="Substituir Assets Locais">
        <div className="space-y-4">
          <p className="text-neutral-400 text-xs">
            Isso substituirá todos os seus assets locais (cores, SVGs de fundo e SVGs de itens) pelos dados salvos na nuvem. Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
            <button onClick={() => setShowConfirm(false)} className="px-4 py-2 text-[10px] uppercase tracking-widest font-bold text-neutral-500 hover:text-white transition-colors">Cancelar</button>
            <button onClick={handleFetchCloudAssets} disabled={isFetching} className="px-4 py-2 text-[10px] uppercase tracking-widest font-bold bg-white text-black hover:bg-neutral-200 transition-colors rounded-sm flex items-center gap-2">
              {isFetching && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Confirmar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Grids Tab ────────────────────────────────────────────────────────────────

function GridsTab({ onLoadGrid, onClose, columnCount, currentUser }: { onLoadGrid: (g: SavedGrid) => void; onClose: () => void; columnCount: number; currentUser: { id: string; login: string } | null }) {
  const [savedGrids, setSavedGrids] = useState<SavedGrid[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('savedGrids');
    if (stored) { try { setSavedGrids(JSON.parse(stored)); } catch {} }
  }, []);

  const persist = (grids: SavedGrid[]) => {
    localStorage.setItem('savedGrids', JSON.stringify(grids));
    setSavedGrids(grids);
  };

  const handleRename = (id: string) => {
    if (!editName.trim()) return;
    persist(savedGrids.map(g => g.id === id ? { ...g, name: editName.trim(), updatedAt: Date.now() } : g));
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    persist(savedGrids.filter(g => g.id !== id));
    setDeleteConfirmId(null);
  };

  const handleCopyLink = (workspaceId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/?workspace=${workspaceId}`);
    setCopiedId(workspaceId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFetchCloudGrids = async () => {
    setIsFetching(true);
    try {
      const res = await fetch('/api/sync/list');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      const workspaces = data.workspaces || [];

      const cloudGrids: SavedGrid[] = workspaces.map((ws: any) => {
        let gridState;
        try { gridState = JSON.parse(ws.data_json); } catch { return null; }
        return {
          id: ws.id,
          name: `Cloud Workspace`,
          updatedAt: ws.updated_at || Date.now(),
          workspaceId: ws.id,
          gridState
        } as SavedGrid;
      }).filter(Boolean) as SavedGrid[];

      // Merge: keep names from existing local grids when workspaceId matches
      const localGrids = savedGrids;
      const merged = cloudGrids.map(cg => {
        const local = localGrids.find(lg => lg.workspaceId === cg.workspaceId);
        return local ? { ...cg, name: local.name, id: local.id } : cg;
      });

      persist(merged);
    } catch (err) {
      console.error('Failed to fetch cloud grids:', err);
    } finally {
      setIsFetching(false);
      setShowConfirm(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-neutral-800">
        <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-200">Saved Grids</h2>
        {currentUser && (
          <button onClick={() => setShowConfirm(true)} disabled={isFetching} className="btn-secondary flex items-center gap-2 py-1.5 px-3 text-[10px]">
            {isFetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Fetch Cloud
          </button>
        )}
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}>
        {savedGrids.length === 0 ? (
          <div className="col-span-full py-12 text-center text-[10px] font-bold tracking-widest uppercase text-neutral-600 border border-dashed border-neutral-800">
            No saved grids. Save your work from the main editor.
          </div>
        ) : (
          savedGrids.sort((a, b) => b.updatedAt - a.updatedAt).map(grid => (
            <div key={grid.id} className="bg-neutral-950 border border-neutral-800 p-4 flex flex-col gap-4 group transition-colors hover:border-neutral-500 rounded-sm">
              {/* Thumbnail */}
              <div className="w-full aspect-square bg-black border border-neutral-800 rounded-sm overflow-hidden flex items-center justify-center p-2 relative">
                <div className="w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain"
                  dangerouslySetInnerHTML={{ __html: generateSimplifiedSvg(grid.gridState, false) }} />
                {grid.workspaceId && (
                  <div className="absolute top-2 right-2 bg-black/80 border border-neutral-800 rounded-sm px-1.5 py-1 flex items-center gap-1 text-sky-400">
                    <Cloud className="w-3 h-3" />
                    <span className="text-[8px] font-bold uppercase tracking-widest hidden sm:inline">Synced</span>
                  </div>
                )}
              </div>

              {/* Name + actions */}
              <div className="flex items-start justify-between gap-2">
                {editingId === grid.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text" autoFocus value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleRename(grid.id)}
                      className="glass-input flex-1 px-2 py-1 uppercase text-[10px] tracking-widest"
                    />
                    <button onClick={() => handleRename(grid.id)} className="p-1 text-white hover:bg-neutral-800 transition-colors rounded">
                      <Save className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-xs uppercase tracking-widest text-neutral-300 truncate group-hover:text-white transition-colors">{grid.name}</h3>
                    <p className="text-[10px] tracking-widest uppercase text-neutral-500 mt-1">{new Date(grid.updatedAt).toLocaleString()}</p>
                  </div>
                )}

                {editingId !== grid.id && (
                  <div className="flex items-center gap-1 shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    {grid.workspaceId && (
                      <button onClick={() => handleCopyLink(grid.workspaceId!)} title="Copy Link"
                        className="p-1.5 text-neutral-500 hover:text-sky-400 hover:bg-sky-950/30 transition-colors rounded">
                        {copiedId === grid.workspaceId ? <Check className="w-4 h-4 text-emerald-500" /> : <Link className="w-4 h-4" />}
                      </button>
                    )}
                    <button onClick={() => { setEditingId(grid.id); setEditName(grid.name); }} title="Rename"
                      className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors rounded">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteConfirmId(grid.id)} title="Delete"
                      className="p-1.5 text-neutral-500 hover:text-rose-500 hover:bg-rose-950/30 transition-colors rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-2 text-[10px] uppercase tracking-widest text-neutral-500 bg-black p-3 border border-neutral-800 rounded-sm">
                <div><span className="font-bold text-neutral-400">Size:</span> {grid.gridState.cols}×{grid.gridState.rows}</div>
                <div><span className="font-bold text-neutral-400">Cells:</span> {Object.keys(grid.gridState.cells).length}</div>
              </div>

              <button
                onClick={() => { onLoadGrid(grid); onClose(); }}
                className="w-full flex items-center justify-center gap-2 py-2 bg-white hover:bg-neutral-200 text-black text-[10px] uppercase tracking-widest font-bold transition-colors mt-auto rounded-sm"
              >
                <Play className="w-4 h-4 fill-current" /> Load Grid
              </button>
            </div>
          ))
        )}
      </div>

      {/* Delete confirm */}
      <Modal isOpen={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title="Delete Saved Grid">
        <div className="space-y-4">
          <p className="text-neutral-400 text-xs">Are you sure you want to delete this saved grid? This action cannot be undone.</p>
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
            <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 text-[10px] uppercase tracking-widest font-bold text-neutral-500 hover:text-white transition-colors">Cancel</button>
            <button onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)} className="px-4 py-2 text-[10px] uppercase tracking-widest font-bold bg-neutral-900 text-rose-500 hover:bg-rose-950 border border-rose-900/50 transition-colors rounded-sm">Delete</button>
          </div>
        </div>
      </Modal>

      {/* Fetch cloud confirm */}
      <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)} title="Substituir Grids Locais">
        <div className="space-y-4">
          <p className="text-neutral-400 text-xs">
            Isso substituirá seus grids locais pelos dados salvos na nuvem. Grids que compartilham o mesmo workspace ID terão seus dados atualizados, mantendo nomes locais. Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
            <button onClick={() => setShowConfirm(false)} className="px-4 py-2 text-[10px] uppercase tracking-widest font-bold text-neutral-500 hover:text-white transition-colors">Cancelar</button>
            <button onClick={handleFetchCloudGrids} disabled={isFetching} className="px-4 py-2 text-[10px] uppercase tracking-widest font-bold bg-white text-black hover:bg-neutral-200 transition-colors rounded-sm flex items-center gap-2">
              {isFetching && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Confirmar
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
}

// ─── Main SettingsModal ────────────────────────────────────────────────────────

export default function SettingsModal({
  isOpen, onClose, initialTab = 'grids',
  currentUser,
  savedColors, setSavedColors,
  savedBgSvgs, setSavedBgSvgs,
  savedItemSvgs, setSavedItemSvgs,
  onLoadGrid
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'grids' | 'assets'>(initialTab);
  const [columnCount, setColumnCount] = useState<number>(() => {
    const stored = localStorage.getItem(LS_KEY_COLUMNS);
    const parsed = stored ? parseInt(stored) : NaN;
    return !isNaN(parsed) && parsed >= 3 && parsed <= 6 ? parsed : 3;
  });

  useEffect(() => { if (isOpen) setActiveTab(initialTab); }, [isOpen, initialTab]);

  const handleColumnChange = (n: number) => {
    setColumnCount(n);
    localStorage.setItem(LS_KEY_COLUMNS, String(n));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-neutral-200">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-6">
          <h1 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Settings</h1>
          <nav className="flex items-center gap-1">
            {(['grids', 'assets'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors rounded-sm ${
                  activeTab === tab
                    ? 'bg-white text-black'
                    : 'text-neutral-500 hover:text-white hover:bg-neutral-900'
                }`}
              >
                {tab === 'grids' ? 'Saved Grids' : 'Assets'}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <ColumnSelector value={columnCount} onChange={handleColumnChange} />
          <button
            onClick={onClose}
            className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-900 transition-colors rounded-sm"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Tab content */}
      {activeTab === 'grids' ? (
        <GridsTab onLoadGrid={onLoadGrid} onClose={onClose} columnCount={columnCount} currentUser={currentUser} />
      ) : (
        <AssetsTab
          savedColors={savedColors} setSavedColors={setSavedColors}
          savedBgSvgs={savedBgSvgs} setSavedBgSvgs={setSavedBgSvgs}
          savedItemSvgs={savedItemSvgs} setSavedItemSvgs={setSavedItemSvgs}
          columnCount={columnCount} currentUser={currentUser}
        />
      )}
    </div>
  );
}
