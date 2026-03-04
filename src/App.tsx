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
    <div className="flex h-screen w-full bg-neutral-100 text-neutral-900 font-sans">
      {/* Sidebar Controls */}
      <aside className="w-80 bg-white border-r border-neutral-200 flex flex-col h-full overflow-y-auto shadow-sm z-10">
        <div className="p-4 border-b border-neutral-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-semibold flex items-center gap-2 truncate" title={currentGridName || 'Grid Matrix'}>
              <Settings className="w-5 h-5 shrink-0" />
              <span className="truncate">{currentGridName || 'Grid Matrix'}</span>
            </h1>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setShowGridManager(true)}
                className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                title="Manage Saved Grids"
              >
                <FolderOpen className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setShowAssetManager(true)}
                className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                title="Manage Assets"
              >
                <Library className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={onSaveClick}
              className="w-full flex items-center justify-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 py-2 px-3 rounded-md text-sm font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Grid
            </button>
            <button 
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-md text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Export PNG
            </button>
          </div>
        </div>

        <div className="p-4 space-y-6 flex-1">
          {/* Grid Parameters - Optimized */}
          <section className="space-y-3">
            <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Grid Parameters</h2>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-600">Rows</label>
                <input 
                  type="number" 
                  min="1" max="100"
                  value={gridState.rows}
                  onChange={(e) => handleGridChange('rows', parseInt(e.target.value) || 1)}
                  className="w-full px-2 py-1.5 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-600">Cols</label>
                <input 
                  type="number" 
                  min="1" max="100"
                  value={gridState.cols}
                  onChange={(e) => handleGridChange('cols', parseInt(e.target.value) || 1)}
                  className="w-full px-2 py-1.5 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-600">Cell Size (px)</label>
                <input 
                  type="number" 
                  min="10" max="200"
                  value={gridState.cellSize}
                  onChange={(e) => handleGridChange('cellSize', parseInt(e.target.value) || 10)}
                  className="w-full px-2 py-1.5 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-600">Line Width</label>
                <input 
                  type="number" 
                  min="0" max="20"
                  value={gridState.lineThickness}
                  onChange={(e) => handleGridChange('lineThickness', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-600">Line Color</label>
                <div className="flex items-center gap-1">
                  <input 
                    type="color" 
                    value={gridState.lineColor}
                    onChange={(e) => handleGridChange('lineColor', e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                  />
                  <input 
                    type="text" 
                    value={gridState.lineColor}
                    onChange={(e) => handleGridChange('lineColor', e.target.value)}
                    className="w-full px-2 py-1 border border-neutral-300 rounded-md text-xs uppercase"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-600">Border Color</label>
                <div className="flex items-center gap-1">
                  <input 
                    type="color" 
                    value={gridState.borderColor}
                    onChange={(e) => handleGridChange('borderColor', e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                  />
                  <input 
                    type="text" 
                    value={gridState.borderColor}
                    onChange={(e) => handleGridChange('borderColor', e.target.value)}
                    className="w-full px-2 py-1 border border-neutral-300 rounded-md text-xs uppercase"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-600">Outer Border Width</label>
              <input 
                type="number" 
                min="0" max="50"
                value={gridState.borderThickness}
                onChange={(e) => handleGridChange('borderThickness', parseInt(e.target.value) || 0)}
                className="w-full px-2 py-1.5 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </section>

          {/* Background Tools */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Background Tools</h2>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => setActiveTool('bg-color')}
                className={`p-2 rounded-md flex justify-center items-center transition-colors ${activeTool === 'bg-color' ? 'bg-blue-100 text-blue-600 ring-1 ring-blue-500' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
                title="Fill Background Color"
              >
                <PaintBucket className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setActiveTool('bg-svg')}
                className={`p-2 rounded-md flex justify-center items-center transition-colors ${activeTool === 'bg-svg' ? 'bg-blue-100 text-blue-600 ring-1 ring-blue-500' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
                title="Fill Background SVG"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setActiveTool('bg-eraser')}
                className={`p-2 rounded-md flex justify-center items-center transition-colors ${activeTool === 'bg-eraser' ? 'bg-blue-100 text-blue-600 ring-1 ring-blue-500' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
                title="Erase Background"
              >
                <Eraser className="w-5 h-5" />
              </button>
            </div>

            {activeTool === 'bg-color' && (
              <div className="space-y-2 p-3 bg-neutral-50 rounded-md border border-neutral-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-neutral-600">Select Color</label>
                  <button onClick={() => setShowAssetManager(true)} className="text-xs text-blue-600 hover:underline">Manage</button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {savedColors.map(color => (
                    <button
                      key={color.id}
                      onClick={() => setCurrentColor(color.value)}
                      className={`h-8 rounded border transition-all ${currentColor === color.value ? 'ring-2 ring-blue-500 ring-offset-1 border-transparent' : 'border-neutral-300 hover:border-neutral-400'}`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {activeTool === 'bg-svg' && (
              <div className="space-y-2 p-3 bg-neutral-50 rounded-md border border-neutral-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-neutral-600">Select Background SVG</label>
                  <button onClick={() => setShowAssetManager(true)} className="text-xs text-blue-600 hover:underline">Manage</button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {savedBgSvgs.map(svg => (
                    <button
                      key={svg.id}
                      onClick={() => setCurrentBgSvg(svg.value)}
                      className={`h-12 rounded border flex items-center justify-center overflow-hidden transition-all ${currentBgSvg === svg.value ? 'ring-2 ring-blue-500 ring-offset-1 border-transparent bg-white' : 'border-neutral-300 hover:border-neutral-400 bg-white'}`}
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
            <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Item Tools</h2>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setActiveTool('item-svg')}
                className={`p-2 rounded-md flex justify-center items-center transition-colors ${activeTool === 'item-svg' ? 'bg-blue-100 text-blue-600 ring-1 ring-blue-500' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
                title="Place Item SVG"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setActiveTool('item-eraser')}
                className={`p-2 rounded-md flex justify-center items-center transition-colors ${activeTool === 'item-eraser' ? 'bg-blue-100 text-blue-600 ring-1 ring-blue-500' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
                title="Erase Item"
              >
                <Eraser className="w-5 h-5" />
              </button>
            </div>

            {activeTool === 'item-svg' && (
              <div className="space-y-2 p-3 bg-neutral-50 rounded-md border border-neutral-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-neutral-600">Select Item SVG</label>
                  <button onClick={() => setShowAssetManager(true)} className="text-xs text-blue-600 hover:underline">Manage</button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {savedItemSvgs.map(svg => (
                    <button
                      key={svg.id}
                      onClick={() => setCurrentItemSvg(svg.value)}
                      className={`h-12 rounded border flex items-center justify-center overflow-hidden transition-all ${currentItemSvg === svg.value ? 'ring-2 ring-blue-500 ring-offset-1 border-transparent bg-white' : 'border-neutral-300 hover:border-neutral-400 bg-white'}`}
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
            <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Cell Border Tools</h2>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setActiveTool('cell-border')}
                className={`p-2 rounded-md flex justify-center items-center transition-colors ${activeTool === 'cell-border' ? 'bg-blue-100 text-blue-600 ring-1 ring-blue-500' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
                title="Apply Cell Border"
              >
                <Square className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setActiveTool('cell-border-eraser')}
                className={`p-2 rounded-md flex justify-center items-center transition-colors ${activeTool === 'cell-border-eraser' ? 'bg-blue-100 text-blue-600 ring-1 ring-blue-500' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
                title="Erase Cell Border"
              >
                <Eraser className="w-5 h-5" />
              </button>
            </div>

            {(activeTool === 'cell-border' || activeTool === 'cell-border-eraser') && (
              <div className="space-y-4 p-3 bg-neutral-50 rounded-md border border-neutral-200">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Edges to Apply/Erase</label>
                  <div className="flex justify-center items-center gap-1 p-2 bg-white rounded border border-neutral-200 w-fit mx-auto">
                    <div className="grid grid-cols-3 grid-rows-3 gap-1 w-16 h-16">
                      <div />
                      <button 
                        onClick={() => toggleEdge('top')}
                        className={`rounded transition-colors ${activeEdges.top ? 'bg-blue-500' : 'bg-neutral-200 hover:bg-neutral-300'}`}
                        title="Top Edge"
                      />
                      <div />
                      <button 
                        onClick={() => toggleEdge('left')}
                        className={`rounded transition-colors ${activeEdges.left ? 'bg-blue-500' : 'bg-neutral-200 hover:bg-neutral-300'}`}
                        title="Left Edge"
                      />
                      <div className="bg-neutral-100 rounded border border-neutral-200" />
                      <button 
                        onClick={() => toggleEdge('right')}
                        className={`rounded transition-colors ${activeEdges.right ? 'bg-blue-500' : 'bg-neutral-200 hover:bg-neutral-300'}`}
                        title="Right Edge"
                      />
                      <div />
                      <button 
                        onClick={() => toggleEdge('bottom')}
                        className={`rounded transition-colors ${activeEdges.bottom ? 'bg-blue-500' : 'bg-neutral-200 hover:bg-neutral-300'}`}
                        title="Bottom Edge"
                      />
                      <div />
                    </div>
                  </div>
                </div>

                {activeTool === 'cell-border' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Border Width (px)</label>
                      <input 
                        type="number" 
                        min="1" max="20"
                        value={currentCellBorderWidth}
                        onChange={(e) => setCurrentCellBorderWidth(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Alignment</label>
                      <div className="flex bg-neutral-100 p-1 rounded-md border border-neutral-200">
                        <button
                          onClick={() => setCurrentCellBorderAlignment('inner')}
                          className={`flex-1 py-1 text-xs font-medium rounded transition-colors ${currentCellBorderAlignment === 'inner' ? 'bg-white shadow-sm text-blue-600' : 'text-neutral-600 hover:text-neutral-900'}`}
                        >
                          Inner
                        </button>
                        <button
                          onClick={() => setCurrentCellBorderAlignment('center')}
                          className={`flex-1 py-1 text-xs font-medium rounded transition-colors ${currentCellBorderAlignment === 'center' ? 'bg-white shadow-sm text-blue-600' : 'text-neutral-600 hover:text-neutral-900'}`}
                        >
                          Center
                        </button>
                        <button
                          onClick={() => setCurrentCellBorderAlignment('outer')}
                          className={`flex-1 py-1 text-xs font-medium rounded transition-colors ${currentCellBorderAlignment === 'outer' ? 'bg-white shadow-sm text-blue-600' : 'text-neutral-600 hover:text-neutral-900'}`}
                        >
                          Outer
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Border Color</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={currentCellBorderColor}
                          onChange={(e) => setCurrentCellBorderColor(e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                        />
                        <input 
                          type="text" 
                          value={currentCellBorderColor}
                          onChange={(e) => setCurrentCellBorderColor(e.target.value)}
                          className="w-full px-2 py-1.5 border border-neutral-300 rounded-md text-xs uppercase"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </section>

          {/* General Tools */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-wider">General</h2>
              <button 
                onClick={() => setGridState(prev => ({ ...prev, cells: {} }))}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Clear Grid
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setActiveTool('pointer')}
                className={`p-2 rounded-md flex justify-center items-center transition-colors ${activeTool === 'pointer' ? 'bg-blue-100 text-blue-600 ring-1 ring-blue-500' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
                title="Pointer"
              >
                <MousePointer2 className="w-5 h-5" />
                <span className="ml-2 text-sm font-medium">Pointer</span>
              </button>
              <button 
                onClick={() => setActiveTool('eraser-all')}
                className={`p-2 rounded-md flex justify-center items-center transition-colors ${activeTool === 'eraser-all' ? 'bg-red-100 text-red-600 ring-1 ring-red-500' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
                title="Erase All in Cell"
              >
                <Eraser className="w-5 h-5" />
                <span className="ml-2 text-sm font-medium">Erase Cell</span>
              </button>
            </div>
          </section>
        </div>
      </aside>

      {/* Main Grid Area */}
      <main className="flex-1 overflow-auto bg-neutral-100 relative">
        <div className="min-h-full min-w-full flex items-center justify-center p-8 w-max h-max">
          {/* We will render the grid here */}
          <div 
            ref={gridRef}
            className="bg-white shadow-xl transition-all duration-300"
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
                    className="bg-white relative cursor-pointer group flex items-center justify-center"
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
          <p className="text-neutral-600 text-sm">
            You are editing <strong className="text-neutral-900">{currentGridName}</strong>. Do you want to overwrite the existing save or create a new one?
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <button 
              onClick={handleOverwriteGrid}
              className="w-full px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
            >
              Save (Overwrite)
            </button>
            <button 
              onClick={handlePromptSaveAs}
              className="w-full px-4 py-2 text-sm font-medium bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors"
            >
              Save As (New Copy)
            </button>
            <button 
              onClick={() => setIsSavePromptModalOpen(false)}
              className="w-full px-4 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-50 rounded-lg transition-colors mt-2"
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
            <label className="text-sm font-medium text-neutral-700">Grid Name</label>
            <input 
              type="text" 
              autoFocus
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveGrid()}
              placeholder="e.g., My Awesome Matrix"
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button 
              onClick={() => setIsSaveModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveGrid}
              disabled={!saveName.trim()}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
