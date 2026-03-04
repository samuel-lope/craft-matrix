import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Settings, MousePointer2, PaintBucket, Image as ImageIcon, Eraser, Download, Square, Library, FolderOpen, Save } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { CellData, GridState, Tool, CellBorder, BorderAlignment, SavedAsset, SavedGrid } from './types';
import AssetManager from './AssetManager';
import GridManager from './GridManager';
import Modal from './Modal';

const getBorderOffset = (border: CellBorder | undefined, lineThickness: number) => {
  if (!border) return 0;
  if (border.alignment === 'inner') return 0;
  if (border.alignment === 'center') return border.width / 2 + lineThickness / 2;
  return border.width + lineThickness;
};

export default function App() {
  const [gridState, setGridState] = useState<GridState>({
    rows: 10,
    cols: 10,
    cellSize: 50,
    lineThickness: 1,
    lineColor: '#e5e7eb',
    borderThickness: 4,
    borderColor: '#1a1a1a',
    cells: {},
  });

  const [activeTool, setActiveTool] = useState<Tool>('pointer');
  const [currentColor, setCurrentColor] = useState<string>('rgba(59, 130, 246, 0.5)');
  const [currentBgSvg, setCurrentBgSvg] = useState<string>('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%"><rect width="100" height="100" fill="#fef08a" /></svg>');
  const [currentItemSvg, setCurrentItemSvg] = useState<string>('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="120" height="120"><circle cx="50" cy="50" r="40" fill="red" opacity="0.8" /></svg>');

  const [savedColors, setSavedColors] = useState<SavedAsset[]>([
    { id: 'c1', name: 'Blue Semi-transparent', value: 'rgba(59, 130, 246, 0.5)' },
    { id: 'c2', name: 'Red Solid', value: '#ef4444' },
    { id: 'c3', name: 'Green Solid', value: '#22c55e' },
  ]);
  const [savedBgSvgs, setSavedBgSvgs] = useState<SavedAsset[]>([
    { id: 'b1', name: 'Yellow Square', value: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%"><rect width="100" height="100" fill="#fef08a" /></svg>' }
  ]);
  const [savedItemSvgs, setSavedItemSvgs] = useState<SavedAsset[]>([
    { id: 'i1', name: 'Red Circle', value: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="120" height="120"><circle cx="50" cy="50" r="40" fill="red" opacity="0.8" /></svg>' }
  ]);
  const [showAssetManager, setShowAssetManager] = useState(false);
  const [showGridManager, setShowGridManager] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSavePromptModalOpen, setIsSavePromptModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [currentGridId, setCurrentGridId] = useState<string | null>(null);
  const [currentGridName, setCurrentGridName] = useState<string>('');

  const [currentCellBorderWidth, setCurrentCellBorderWidth] = useState<number>(2);
  const [currentCellBorderColor, setCurrentCellBorderColor] = useState<string>('#000000');
  const [currentCellBorderAlignment, setCurrentCellBorderAlignment] = useState<BorderAlignment>('inner');
  const [activeEdges, setActiveEdges] = useState({
    top: true,
    right: true,
    bottom: true,
    left: true,
  });

  const toggleEdge = (edge: keyof typeof activeEdges) => {
    setActiveEdges(prev => ({ ...prev, [edge]: !prev[edge] }));
  };

  const gridRef = useRef<HTMLDivElement>(null);

  // Load assets from LocalStorage on mount
  useEffect(() => {
    const storedColors = localStorage.getItem('savedColors');
    const storedBgSvgs = localStorage.getItem('savedBgSvgs');
    const storedItemSvgs = localStorage.getItem('savedItemSvgs');

    if (storedColors) setSavedColors(JSON.parse(storedColors));
    if (storedBgSvgs) setSavedBgSvgs(JSON.parse(storedBgSvgs));
    if (storedItemSvgs) setSavedItemSvgs(JSON.parse(storedItemSvgs));
  }, []);

  // Save assets to LocalStorage on change
  useEffect(() => {
    localStorage.setItem('savedColors', JSON.stringify(savedColors));
  }, [savedColors]);
  useEffect(() => {
    localStorage.setItem('savedBgSvgs', JSON.stringify(savedBgSvgs));
  }, [savedBgSvgs]);
  useEffect(() => {
    localStorage.setItem('savedItemSvgs', JSON.stringify(savedItemSvgs));
  }, [savedItemSvgs]);

  const handleDownload = useCallback(() => {
    if (gridRef.current === null) {
      return;
    }

    htmlToImage.toPng(gridRef.current, { cacheBust: true })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = 'grid-matrix.png';
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Oops, something went wrong!', err);
      });
  }, [gridRef]);

  const handleGridChange = (key: keyof GridState, value: any) => {
    setGridState((prev) => ({ ...prev, [key]: value }));
  };

  const handleCellClick = useCallback((row: number, col: number) => {
    const key = `${row},${col}`;

    setGridState((prev) => {
      const newCells = { ...prev.cells };
      const currentCell = newCells[key] || {};

      if (activeTool === 'bg-color') {
        newCells[key] = { ...currentCell, bgType: 'color', bgValue: currentColor };
      } else if (activeTool === 'bg-svg') {
        newCells[key] = { ...currentCell, bgType: 'svg', bgValue: currentBgSvg };
      } else if (activeTool === 'bg-eraser') {
        newCells[key] = { ...currentCell, bgType: undefined, bgValue: undefined };
      } else if (activeTool === 'item-svg') {
        newCells[key] = { ...currentCell, itemValue: currentItemSvg };
      } else if (activeTool === 'item-eraser') {
        newCells[key] = { ...currentCell, itemValue: undefined };
      } else if (activeTool === 'cell-border') {
        newCells[key] = {
          ...currentCell,
          borderTop: activeEdges.top ? { width: currentCellBorderWidth, color: currentCellBorderColor, alignment: currentCellBorderAlignment } : currentCell.borderTop,
          borderRight: activeEdges.right ? { width: currentCellBorderWidth, color: currentCellBorderColor, alignment: currentCellBorderAlignment } : currentCell.borderRight,
          borderBottom: activeEdges.bottom ? { width: currentCellBorderWidth, color: currentCellBorderColor, alignment: currentCellBorderAlignment } : currentCell.borderBottom,
          borderLeft: activeEdges.left ? { width: currentCellBorderWidth, color: currentCellBorderColor, alignment: currentCellBorderAlignment } : currentCell.borderLeft,
        };
      } else if (activeTool === 'cell-border-eraser') {
        newCells[key] = {
          ...currentCell,
          borderTop: activeEdges.top ? undefined : currentCell.borderTop,
          borderRight: activeEdges.right ? undefined : currentCell.borderRight,
          borderBottom: activeEdges.bottom ? undefined : currentCell.borderBottom,
          borderLeft: activeEdges.left ? undefined : currentCell.borderLeft,
        };
      } else if (activeTool === 'eraser-all') {
        delete newCells[key];
      }

      // Clean up empty cells
      if (newCells[key] && !newCells[key].bgType && !newCells[key].itemValue &&
        !newCells[key].borderTop && !newCells[key].borderRight &&
        !newCells[key].borderBottom && !newCells[key].borderLeft) {
        delete newCells[key];
      }

      return { ...prev, cells: newCells };
    });
  }, [activeTool, currentColor, currentBgSvg, currentItemSvg, currentCellBorderWidth, currentCellBorderColor, activeEdges, currentCellBorderAlignment]);

  const handleSaveGrid = () => {
    if (!saveName.trim()) return;

    const newSave: SavedGrid = {
      id: Date.now().toString(),
      name: saveName.trim(),
      updatedAt: Date.now(),
      gridState: gridState
    };

    const stored = localStorage.getItem('savedGrids');
    const grids: SavedGrid[] = stored ? JSON.parse(stored) : [];
    grids.push(newSave);
    localStorage.setItem('savedGrids', JSON.stringify(grids));

    setCurrentGridId(newSave.id);
    setCurrentGridName(newSave.name);
    setIsSaveModalOpen(false);
    setSaveName('');
  };

  const handleOverwriteGrid = () => {
    if (!currentGridId) return;
    const stored = localStorage.getItem('savedGrids');
    if (!stored) return;
    let grids: SavedGrid[] = JSON.parse(stored);
    grids = grids.map(g => g.id === currentGridId ? {
      ...g,
      updatedAt: Date.now(),
      gridState: gridState
    } : g);
    localStorage.setItem('savedGrids', JSON.stringify(grids));
    setIsSavePromptModalOpen(false);
  };

  const handlePromptSaveAs = () => {
    setIsSavePromptModalOpen(false);
    setSaveName(currentGridName + ' (Copy)');
    setIsSaveModalOpen(true);
  };

  const onSaveClick = () => {
    if (currentGridId) {
      setIsSavePromptModalOpen(true);
    } else {
      setSaveName('');
      setIsSaveModalOpen(true);
    }
  };

  const handleLoadGrid = (loadedGrid: SavedGrid) => {
    setGridState(loadedGrid.gridState);
    setCurrentGridId(loadedGrid.id);
    setCurrentGridName(loadedGrid.name);
    setShowGridManager(false);
  };

  if (showAssetManager) {
    return (
      <AssetManager
        onClose={() => setShowAssetManager(false)}
        savedColors={savedColors}
        setSavedColors={setSavedColors}
        savedBgSvgs={savedBgSvgs}
        setSavedBgSvgs={setSavedBgSvgs}
        savedItemSvgs={savedItemSvgs}
        setSavedItemSvgs={setSavedItemSvgs}
      />
    );
  }

  if (showGridManager) {
    return (
      <GridManager
        onClose={() => setShowGridManager(false)}
        onLoad={handleLoadGrid}
      />
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 font-sans overflow-hidden">
      {/* Sidebar Controls */}
      <aside className="w-80 glass-panel flex flex-col h-full overflow-y-auto z-10 relative">
        {/* Glow effect for sidebar */}
        <div className="absolute top-0 left-0 w-full h-32 bg-indigo-500/10 blur-3xl pointer-events-none"></div>
        <div className="p-5 border-b border-slate-700/50 relative z-10">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-lg font-bold flex items-center gap-2 truncate bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400" title={currentGridName || 'Grid Matrix'}>
              <Settings className="w-5 h-5 shrink-0 text-indigo-400" />
              <span className="truncate tracking-wide">{currentGridName || 'Grid Matrix'}</span>
            </h1>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowGridManager(true)}
                className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-md transition-all"
                title="Manage Saved Grids"
              >
                <FolderOpen className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowAssetManager(true)}
                className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-md transition-all"
                title="Manage Assets"
              >
                <Library className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onSaveClick}
              className="w-full flex items-center justify-center gap-2 btn-secondary py-2 px-3 text-sm"
            >
              <Save className="w-4 h-4" />
              Save Grid
            </button>
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 btn-primary py-2 px-3 text-sm"
            >
              <Download className="w-4 h-4" />
              Export PNG
            </button>
          </div>
        </div>

        <div className="p-5 space-y-8 flex-1 relative z-10">
          {/* Grid Parameters - Optimized */}
          <section className="space-y-4">
            <h2 className="text-[11px] font-bold text-indigo-400/80 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Grid Parameters
            </h2>

            <div className="glass-card p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Rows</label>
                  <input
                    type="number"
                    min="1" max="100"
                    value={gridState.rows}
                    onChange={(e) => handleGridChange('rows', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 glass-input"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Cols</label>
                  <input
                    type="number"
                    min="1" max="100"
                    value={gridState.cols}
                    onChange={(e) => handleGridChange('cols', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 glass-input"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Cell Size (px)</label>
                  <input
                    type="number"
                    min="10" max="200"
                    value={gridState.cellSize}
                    onChange={(e) => handleGridChange('cellSize', parseInt(e.target.value) || 10)}
                    className="w-full px-3 py-2 glass-input"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Line Width</label>
                  <input
                    type="number"
                    min="0" max="20"
                    value={gridState.lineThickness}
                    onChange={(e) => handleGridChange('lineThickness', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 glass-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Line Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={gridState.lineColor}
                      onChange={(e) => handleGridChange('lineColor', e.target.value)}
                      className="w-7 h-7 rounded border-0 p-0 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={gridState.lineColor}
                      onChange={(e) => handleGridChange('lineColor', e.target.value)}
                      className="w-full px-2 py-1.5 glass-input text-xs uppercase"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Border Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={gridState.borderColor}
                      onChange={(e) => handleGridChange('borderColor', e.target.value)}
                      className="w-7 h-7 rounded border-0 p-0 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={gridState.borderColor}
                      onChange={(e) => handleGridChange('borderColor', e.target.value)}
                      className="w-full px-2 py-1.5 glass-input text-xs uppercase"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Outer Border Width</label>
                <input
                  type="number"
                  min="0" max="50"
                  value={gridState.borderThickness}
                  onChange={(e) => handleGridChange('borderThickness', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 glass-input"
                />
              </div>
            </div>
          </section>

          {/* Background Tools */}
          <section className="space-y-4">
            <h2 className="text-[11px] font-bold text-indigo-400/80 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Background Tools
            </h2>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setActiveTool('bg-color')}
                className={`p-2 rounded-lg flex justify-center items-center transition-all ${activeTool === 'bg-color' ? 'tool-btn-active' : 'tool-btn-inactive'}`}
                title="Fill Background Color"
              >
                <PaintBucket className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveTool('bg-svg')}
                className={`p-2 rounded-lg flex justify-center items-center transition-all ${activeTool === 'bg-svg' ? 'tool-btn-active' : 'tool-btn-inactive'}`}
                title="Fill Background SVG"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveTool('bg-eraser')}
                className={`p-2 rounded-lg flex justify-center items-center transition-all ${activeTool === 'bg-eraser' ? 'tool-btn-active' : 'tool-btn-inactive'}`}
                title="Erase Background"
              >
                <Eraser className="w-5 h-5" />
              </button>
            </div>

            {activeTool === 'bg-color' && (
              <div className="space-y-3 p-4 glass-card">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Select Color</label>
                  <button onClick={() => setShowAssetManager(true)} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium uppercase tracking-wider transition-colors">Manage</button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {savedColors.map(color => (
                    <button
                      key={color.id}
                      onClick={() => setCurrentColor(color.value)}
                      className={`h-8 rounded-md border transition-all ${currentColor === color.value ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900 border-transparent scale-110 shadow-lg' : 'border-slate-600/50 hover:border-slate-400 hover:scale-105'}`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {activeTool === 'bg-svg' && (
              <div className="space-y-3 p-4 glass-card">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Select Background SVG</label>
                  <button onClick={() => setShowAssetManager(true)} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium uppercase tracking-wider transition-colors">Manage</button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {savedBgSvgs.map(svg => (
                    <button
                      key={svg.id}
                      onClick={() => setCurrentBgSvg(svg.value)}
                      className={`h-12 rounded-md border flex items-center justify-center overflow-hidden transition-all bg-slate-800 ${currentBgSvg === svg.value ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900 border-transparent shadow-lg' : 'border-slate-600/50 hover:border-slate-400'}`}
                      title={svg.name}
                      dangerouslySetInnerHTML={{ __html: svg.value }}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Item Tools */}
          <section className="space-y-4">
            <h2 className="text-[11px] font-bold text-indigo-400/80 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Item Tools
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveTool('item-svg')}
                className={`p-2 rounded-lg flex justify-center items-center transition-all ${activeTool === 'item-svg' ? 'tool-btn-active' : 'tool-btn-inactive'}`}
                title="Place Item SVG"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveTool('item-eraser')}
                className={`p-2 rounded-lg flex justify-center items-center transition-all ${activeTool === 'item-eraser' ? 'tool-btn-active' : 'tool-btn-inactive'}`}
                title="Erase Item"
              >
                <Eraser className="w-5 h-5" />
              </button>
            </div>

            {activeTool === 'item-svg' && (
              <div className="space-y-3 p-4 glass-card">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Select Item SVG</label>
                  <button onClick={() => setShowAssetManager(true)} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium uppercase tracking-wider transition-colors">Manage</button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {savedItemSvgs.map(svg => (
                    <button
                      key={svg.id}
                      onClick={() => setCurrentItemSvg(svg.value)}
                      className={`h-12 rounded-md border flex items-center justify-center overflow-hidden transition-all bg-slate-800 ${currentItemSvg === svg.value ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900 border-transparent shadow-lg' : 'border-slate-600/50 hover:border-slate-400'}`}
                      title={svg.name}
                      dangerouslySetInnerHTML={{ __html: svg.value }}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Cell Border Tools */}
          <section className="space-y-4">
            <h2 className="text-[11px] font-bold text-indigo-400/80 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Cell Border Tools
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveTool('cell-border')}
                className={`p-2 rounded-lg flex justify-center items-center transition-all ${activeTool === 'cell-border' ? 'tool-btn-active' : 'tool-btn-inactive'}`}
                title="Apply Cell Border"
              >
                <Square className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveTool('cell-border-eraser')}
                className={`p-2 rounded-lg flex justify-center items-center transition-all ${activeTool === 'cell-border-eraser' ? 'tool-btn-active' : 'tool-btn-inactive'}`}
                title="Erase Cell Border"
              >
                <Eraser className="w-5 h-5" />
              </button>
            </div>

            {(activeTool === 'cell-border' || activeTool === 'cell-border-eraser') && (
              <div className="space-y-5 p-4 glass-card">
                <div className="space-y-3">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-center block">Edges to Apply/Erase</label>
                  <div className="flex justify-center items-center gap-1 p-3 bg-slate-900/50 rounded-xl border border-slate-700/50 w-fit mx-auto shadow-inner">
                    <div className="grid grid-cols-3 grid-rows-3 gap-1 w-16 h-16">
                      <div />
                      <button
                        onClick={() => toggleEdge('top')}
                        className={`rounded-sm transition-all ${activeEdges.top ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-slate-700 hover:bg-slate-600'}`}
                        title="Top Edge"
                      />
                      <div />
                      <button
                        onClick={() => toggleEdge('left')}
                        className={`rounded-sm transition-all ${activeEdges.left ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-slate-700 hover:bg-slate-600'}`}
                        title="Left Edge"
                      />
                      <div className="bg-slate-800 rounded-sm border border-slate-600/50" />
                      <button
                        onClick={() => toggleEdge('right')}
                        className={`rounded-sm transition-all ${activeEdges.right ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-slate-700 hover:bg-slate-600'}`}
                        title="Right Edge"
                      />
                      <div />
                      <button
                        onClick={() => toggleEdge('bottom')}
                        className={`rounded-sm transition-all ${activeEdges.bottom ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-slate-700 hover:bg-slate-600'}`}
                        title="Bottom Edge"
                      />
                      <div />
                    </div>
                  </div>
                </div>

                {activeTool === 'cell-border' && (
                  <div className="pt-2 border-t border-slate-700/50 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Border Width (px)</label>
                      <input
                        type="number"
                        min="1" max="20"
                        value={currentCellBorderWidth}
                        onChange={(e) => setCurrentCellBorderWidth(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 glass-input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Alignment</label>
                      <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-700/50">
                        <button
                          onClick={() => setCurrentCellBorderAlignment('inner')}
                          className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-all ${currentCellBorderAlignment === 'inner' ? 'bg-indigo-500/20 text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                          Inner
                        </button>
                        <button
                          onClick={() => setCurrentCellBorderAlignment('center')}
                          className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-all ${currentCellBorderAlignment === 'center' ? 'bg-indigo-500/20 text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                          Center
                        </button>
                        <button
                          onClick={() => setCurrentCellBorderAlignment('outer')}
                          className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-all ${currentCellBorderAlignment === 'outer' ? 'bg-indigo-500/20 text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                          Outer
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Border Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={currentCellBorderColor}
                          onChange={(e) => setCurrentCellBorderColor(e.target.value)}
                          className="w-8 h-8 rounded border-0 p-0 cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={currentCellBorderColor}
                          onChange={(e) => setCurrentCellBorderColor(e.target.value)}
                          className="w-full px-3 py-2 glass-input text-xs uppercase"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* General Tools */}
          <section className="space-y-4 pt-2 border-t border-slate-700/50 mt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-bold text-indigo-400/80 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> General Tools
              </h2>
              <button
                onClick={() => setGridState(prev => ({ ...prev, cells: {} }))}
                className="text-[10px] font-bold text-rose-400 hover:text-rose-300 uppercase tracking-widest transition-colors px-2 py-1 rounded hover:bg-rose-500/10"
              >
                Clear Grid
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveTool('pointer')}
                className={`p-2 rounded-lg flex justify-center items-center transition-all ${activeTool === 'pointer' ? 'tool-btn-active' : 'tool-btn-inactive'}`}
                title="Pointer"
              >
                <MousePointer2 className="w-5 h-5" />
                <span className="ml-2 text-xs font-semibold">Pointer</span>
              </button>
              <button
                onClick={() => setActiveTool('eraser-all')}
                className={`p-2 rounded-lg flex justify-center items-center transition-all ${activeTool === 'eraser-all' ? 'bg-rose-500/20 text-rose-400 ring-1 ring-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'tool-btn-inactive'}`}
                title="Erase All in Cell"
              >
                <Eraser className="w-5 h-5" />
                <span className="ml-2 text-xs font-semibold">Erase Area</span>
              </button>
            </div>
          </section>
        </div>
      </aside>

      {/* Main Grid Area */}
      <main className="flex-1 overflow-auto bg-slate-950 relative">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-50"></div>
        <div className="min-h-full min-w-full flex flex-col items-center justify-center p-8 w-max h-max relative z-10">

          {/* Grid Container */}
          <div className="mb-6 px-4 py-2 glass-panel rounded-full flex items-center gap-2 max-w-fit mx-auto border border-indigo-500/20 shadow-[0_0_15px_rgba(79,70,229,0.15)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-mono text-indigo-200 tracking-wider">WORKSPACE ACTIVE</span>
          </div>

          <div
            ref={gridRef}
            className="shadow-2xl transition-all duration-300"
            style={{
              padding: gridState.borderThickness,
              backgroundColor: gridState.borderColor,
            }}
          >
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${gridState.cols}, ${gridState.cellSize}px)`,
                gridTemplateRows: `repeat(${gridState.rows}, ${gridState.cellSize}px)`,
                gap: gridState.lineThickness,
                backgroundColor: gridState.lineColor,
              }}
            >
              {Array.from({ length: gridState.rows }).map((_, rowIndex) => (
                Array.from({ length: gridState.cols }).map((_, colIndex) => {
                  const key = `${rowIndex},${colIndex}`;
                  const cellData = gridState.cells[key];

                  return (
                    <div
                      key={key}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                      className="bg-white relative cursor-pointer group flex items-center justify-center transition-colors duration-200 hover:bg-neutral-50"
                      style={{
                        width: gridState.cellSize,
                        height: gridState.cellSize,
                      }}
                    >
                      {/* Hover Overlay (Z-index 5) - Placed below items so it doesn't affect them */}
                      <div className="absolute inset-0 z-[5] pointer-events-none bg-black opacity-0 group-hover:opacity-10 transition-opacity" />

                      {/* Background Layer (Z-index 0) */}
                      {cellData?.bgType === 'color' && cellData.bgValue && (
                        <div
                          className="absolute inset-0 z-0"
                          style={{ backgroundColor: cellData.bgValue }}
                        />
                      )}
                      {cellData?.bgType === 'svg' && cellData.bgValue && (
                        <div
                          className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden"
                          dangerouslySetInnerHTML={{ __html: cellData.bgValue }}
                        />
                      )}

                      {/* Cell Border Layer (Z-index 8) - Above background, below items */}
                      {(cellData?.borderTop || cellData?.borderRight || cellData?.borderBottom || cellData?.borderLeft) && (
                        (() => {
                          const topOffset = getBorderOffset(cellData.borderTop, gridState.lineThickness);
                          const rightOffset = getBorderOffset(cellData.borderRight, gridState.lineThickness);
                          const bottomOffset = getBorderOffset(cellData.borderBottom, gridState.lineThickness);
                          const leftOffset = getBorderOffset(cellData.borderLeft, gridState.lineThickness);

                          const extTopLeft = Math.max(topOffset, leftOffset);
                          const extTopRight = Math.max(topOffset, rightOffset);
                          const extBottomLeft = Math.max(bottomOffset, leftOffset);
                          const extBottomRight = Math.max(bottomOffset, rightOffset);

                          return (
                            <>
                              {/* Top Border */}
                              {cellData.borderTop && (
                                <div
                                  className="absolute z-[8] pointer-events-none"
                                  style={{
                                    top: -topOffset,
                                    left: -extTopLeft,
                                    right: -extTopRight,
                                    height: cellData.borderTop.width,
                                    backgroundColor: cellData.borderTop.color,
                                  }}
                                />
                              )}
                              {/* Right Border */}
                              {cellData.borderRight && (
                                <div
                                  className="absolute z-[8] pointer-events-none"
                                  style={{
                                    top: -extTopRight,
                                    bottom: -extBottomRight,
                                    right: -rightOffset,
                                    width: cellData.borderRight.width,
                                    backgroundColor: cellData.borderRight.color,
                                  }}
                                />
                              )}
                              {/* Bottom Border */}
                              {cellData.borderBottom && (
                                <div
                                  className="absolute z-[8] pointer-events-none"
                                  style={{
                                    left: -extBottomLeft,
                                    right: -extBottomRight,
                                    bottom: -bottomOffset,
                                    height: cellData.borderBottom.width,
                                    backgroundColor: cellData.borderBottom.color,
                                  }}
                                />
                              )}
                              {/* Left Border */}
                              {cellData.borderLeft && (
                                <div
                                  className="absolute z-[8] pointer-events-none"
                                  style={{
                                    top: -extTopLeft,
                                    bottom: -extBottomLeft,
                                    left: -leftOffset,
                                    width: cellData.borderLeft.width,
                                    backgroundColor: cellData.borderLeft.color,
                                  }}
                                />
                              )}
                            </>
                          );
                        })()
                      )}

                      {/* Item Layer (Z-index 10) */}
                      {cellData?.itemValue && (
                        <div
                          className="absolute z-10 flex items-center justify-center pointer-events-none"
                          dangerouslySetInnerHTML={{ __html: cellData.itemValue }}
                        />
                      )}
                    </div>
                  );
                })
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Save Prompt Modal (Save vs Save As) */}
      <Modal
        isOpen={isSavePromptModalOpen}
        onClose={() => setIsSavePromptModalOpen(false)}
        title="Save Grid"
      >
        <div className="space-y-4">
          <p className="text-slate-300 text-sm">
            You are editing <strong className="text-indigo-400">{currentGridName}</strong>. Do you want to overwrite the existing save or create a new one?
          </p>
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleOverwriteGrid}
              className="btn-primary w-full shadow-[0_0_10px_rgba(139,92,246,0.3)]"
            >
              Save (Overwrite)
            </button>
            <button
              onClick={handlePromptSaveAs}
              className="btn-secondary w-full"
            >
              Save As (New Copy)
            </button>
            <button
              onClick={() => setIsSavePromptModalOpen(false)}
              className="w-full px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors mt-2"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Save Grid Modal */}
      <Modal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        title={currentGridId ? "Save As" : "Save Grid"}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Grid Name</label>
            <input
              type="text"
              autoFocus
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveGrid()}
              placeholder="e.g., My Awesome Matrix"
              className="glass-input w-full"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setIsSaveModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveGrid}
              disabled={!saveName.trim()}
              className="btn-primary"
            >
              {currentGridId ? "Save Copy" : "Save"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
