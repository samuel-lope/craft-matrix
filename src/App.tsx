import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Settings, MousePointer2, PaintBucket, Image as ImageIcon, Eraser, Download, Square, Library, FolderOpen, Save, Type, Grid, Layout, Plus, X, Pipette, Cloud, Link, Loader2 } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { CellData, GridState, Tool, CellBorder, BorderAlignment, SavedAsset, SavedGrid } from './types';
import AssetManager from './AssetManager';
import GridManager from './GridManager';
import Modal from './Modal';
import { generateSimplifiedSvg } from './gridUtils';

const getBorderOffset = (border: CellBorder | undefined, lineThickness: number) => {
  if (!border) return 0;
  if (border.alignment === 'inner') return 0;
  if (border.alignment === 'center') return border.width / 2 + lineThickness / 2;
  return border.width + lineThickness;
};

const DEFAULT_WORKSPACE_TEXTURE = `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'>
  <rect width='40' height='40' fill='transparent'/>
  <rect width='20' height='20' fill='rgba(255,255,255,0.05)'/>
  <rect x='20' y='20' width='20' height='20' fill='rgba(255,255,255,0.05)'/>
</svg>`;

// --- Reusable UI Components ---

const ToolSection = ({ title, icon: Icon, children }: { title: string, icon?: React.ElementType, children: React.ReactNode }) => (
  <div className="space-y-4 pb-6 border-b border-neutral-800 last:border-0 last:pb-0">
    <div className="flex items-center gap-2 px-1">
      {Icon && <Icon className="w-3.5 h-3.5 text-sky-400" />}
      <h2 className={`text-[10px] font-bold uppercase tracking-widest ${Icon ? 'text-sky-400' : 'text-neutral-500'}`}>{title}</h2>
    </div>
    <div className="space-y-4 px-1">
      {children}
    </div>
  </div>
);

const ToolButton = ({ 
  icon: Icon, 
  title, 
  isActive, 
  onClick 
}: { 
  icon: React.ElementType, 
  title: string, 
  isActive: boolean, 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className={`p-2 rounded-lg flex justify-center items-center transition-all ${isActive ? 'tool-btn-active' : 'tool-btn-inactive'}`}
    title={title}
  >
    <Icon className="w-5 h-5" />
  </button>
);

// ------------------------------

const MemoizedCell = React.memo(({ rowIndex, colIndex, cellData, cellSize, lineThickness, onClick }: {
  rowIndex: number;
  colIndex: number;
  cellData: CellData | undefined;
  cellSize: number;
  lineThickness: number;
  onClick: (row: number, col: number) => void;
}) => {
  return (
    <div
      onClick={() => onClick(rowIndex, colIndex)}
      className="relative cursor-pointer group flex items-center justify-center transition-colors duration-200"
      style={{
        width: cellSize,
        height: cellSize,
      }}
    >
      {/* Hover Overlay (Z-index 5) - Placed below items so it doesn't affect them */}
      <div className="absolute inset-0 z-[5] pointer-events-none bg-black opacity-0 group-hover:opacity-10 transition-opacity" />

      {/* Background Layer (Z-index 0) */}
      {cellData?.bgType === 'color' && cellData.bgValue && (
        <div
          className="absolute z-0"
          style={{ 
            backgroundColor: cellData.bgValue,
            top: lineThickness === 0 ? '-0.5px' : 0,
            left: lineThickness === 0 ? '-0.5px' : 0,
            right: lineThickness === 0 ? '-0.5px' : 0,
            bottom: lineThickness === 0 ? '-0.5px' : 0,
          }}
        />
      )}
      {cellData?.bgType === 'svg' && cellData.bgValue && (
        <div
          className="absolute z-0 flex items-center justify-center pointer-events-none overflow-hidden"
          style={{ 
            top: lineThickness === 0 ? '-0.5px' : 0,
            left: lineThickness === 0 ? '-0.5px' : 0,
            right: lineThickness === 0 ? '-0.5px' : 0,
            bottom: lineThickness === 0 ? '-0.5px' : 0,
          }}
          dangerouslySetInnerHTML={{ __html: cellData.bgValue }}
        />
      )}

      {/* Cell Border Layer (Z-index 8) - Above background, below items */}
      {(cellData?.borderTop || cellData?.borderRight || cellData?.borderBottom || cellData?.borderLeft) && (
        (() => {
          const topOffset = getBorderOffset(cellData.borderTop, lineThickness);
          const rightOffset = getBorderOffset(cellData.borderRight, lineThickness);
          const bottomOffset = getBorderOffset(cellData.borderBottom, lineThickness);
          const leftOffset = getBorderOffset(cellData.borderLeft, lineThickness);

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

      {/* Label Layer (Z-index 20) - Topmost layer */}
      {cellData?.label && (
        <div
          className={`absolute z-[20] flex items-center pointer-events-none w-full h-full ${
            cellData.label.align === 'start' ? 'justify-start' : 
            cellData.label.align === 'end' ? 'justify-end' : 
            'justify-center'
          }`}
          style={{
            fontFamily: cellData.label.font,
            fontSize: `${cellData.label.size}px`,
            color: cellData.label.color,
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          {(cellData.label.frameBgColor || cellData.label.frameBorderWidth) ? (
            <span
              style={{
                backgroundColor: cellData.label.frameBgColor
                  ? (() => {
                      const opacity = cellData.label.frameBgOpacity ?? 1;
                      const hex = cellData.label.frameBgColor;
                      if (opacity >= 1) return hex;
                      const alphaHex = Math.round(opacity * 255).toString(16).padStart(2, '0');
                      return hex.length === 7 ? hex + alphaHex : hex;
                    })()
                  : 'transparent',
                border: cellData.label.frameBorderWidth
                  ? `${cellData.label.frameBorderWidth}px solid ${cellData.label.frameBorderColor || '#000000'}`
                  : 'none',
                borderRadius: `${cellData.label.frameRadius ?? 0}px`,
                padding: `${cellData.label.framePadding ?? 0}px`,
                display: 'inline-block',
              }}
            >
              {cellData.label.text}
            </span>
          ) : (
            cellData.label.text
          )}
        </div>
      )}
    </div>
  );
});



export default function App() {
  const [gridState, setGridState] = useState<GridState>({
    rows: 10,
    cols: 10,
    cellSize: 50,
    lineThickness: 1,
    lineColor: '#e5e7eb',
    borderThickness: 4,
    borderColor: '#1a1a1a',
    externalMargin: 0,
    externalMarginColor: '#ffffff',
    externalMarginOpacity: 0,
    innerBgColor: '#ffffff',
    innerBgOpacity: 1,
    workspaceBgColor: '#0f172a',
    workspaceBgImageUrl: DEFAULT_WORKSPACE_TEXTURE,
    cells: {},
  });

  const [activeTool, setActiveTool] = useState<Tool>('pointer');
  const [isEraserMode, setIsEraserMode] = useState<boolean>(false);
  const [currentColor, setCurrentColor] = useState<string>('rgba(59, 130, 246, 0.5)');
  const [currentBgSvg, setCurrentBgSvg] = useState<string>('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%"><rect width="100" height="100" fill="#fef08a" /></svg>');
  const [currentItemSvg, setCurrentItemSvg] = useState<string>('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="120" height="120"><circle cx="50" cy="50" r="40" fill="red" opacity="0.8" /></svg>');
  
  const [currentLabelText, setCurrentLabelText] = useState<string>('A');
  const [currentLabelFont, setCurrentLabelFont] = useState<string>('Inter, sans-serif');
  const [currentLabelSize, setCurrentLabelSize] = useState<number>(24);
  const [currentLabelColor, setCurrentLabelColor] = useState<string>('#ffffff');
  const [currentLabelAlign, setCurrentLabelAlign] = useState<'start' | 'center' | 'end'>('center');

  const [currentLabelFrameEnabled, setCurrentLabelFrameEnabled] = useState<boolean>(false);
  const [currentLabelFrameBgColor, setCurrentLabelFrameBgColor] = useState<string>('#ffffff');
  const [currentLabelFrameBgOpacity, setCurrentLabelFrameBgOpacity] = useState<number>(1);
  const [currentLabelFrameBorderColor, setCurrentLabelFrameBorderColor] = useState<string>('#000000');
  const [currentLabelFrameBorderWidth, setCurrentLabelFrameBorderWidth] = useState<number>(1);
  const [currentLabelFrameRadius, setCurrentLabelFrameRadius] = useState<number>(4);
  const [currentLabelFramePadding, setCurrentLabelFramePadding] = useState<number>(4);

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
  
  // Inline Asset Add Form state
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [newAssetValue, setNewAssetValue] = useState('');

  const [currentGridId, setCurrentGridId] = useState<string | null>(null);
  const [currentGridName, setCurrentGridName] = useState<string>('');
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);

  // Export modal states
  const [isPngExportModalOpen, setIsPngExportModalOpen] = useState(false);
  const [isSvgExportModalOpen, setIsSvgExportModalOpen] = useState(false);
  const [svgExportWidth, setSvgExportWidth] = useState<number>(500);
  const [svgExportHeight, setSvgExportHeight] = useState<number>(500);
  const [exportNoGridLines, setExportNoGridLines] = useState(false);
  const [exportSimplifiedSvg, setExportSimplifiedSvg] = useState(false);

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

  const handleDetectColorInline = async () => {
    if (!('EyeDropper' in window)) {
      alert('Seu navegador não suporta a função de detectar cores (EyeDropper API).');
      return;
    }
    try {
      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      setNewAssetValue(result.sRGBHex);
    } catch (e) {
      console.log('EyeDropper closed or failed', e);
    }
  };

  const handleAddAssetSave = () => {
    if (!newAssetValue.trim()) {
      setIsAddingAsset(false);
      return;
    }
    const newAsset: SavedAsset = {
      id: Date.now().toString(),
      name: `Added ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      value: newAssetValue
    };
    if (activeTool === 'bg-color') {
      const newAssets = [...savedColors, newAsset];
      setSavedColors(newAssets);
      setCurrentColor(newAsset.value);
      if (currentWorkspaceId) syncToCloud(currentWorkspaceId, gridState, Date.now(), { colors: newAssets });
    } else if (activeTool === 'bg-svg') {
      const newAssets = [...savedBgSvgs, newAsset];
      setSavedBgSvgs(newAssets);
      setCurrentBgSvg(newAsset.value);
      if (currentWorkspaceId) syncToCloud(currentWorkspaceId, gridState, Date.now(), { bgSvgs: newAssets });
    } else if (activeTool === 'item-svg') {
      const newAssets = [...savedItemSvgs, newAsset];
      setSavedItemSvgs(newAssets);
      setCurrentItemSvg(newAsset.value);
      if (currentWorkspaceId) syncToCloud(currentWorkspaceId, gridState, Date.now(), { itemSvgs: newAssets });
    }
    setIsAddingAsset(false);
    setNewAssetValue('');
  };


  const toolStateRef = useRef({
    activeTool,
    isEraserMode,
    currentColor,
    currentBgSvg,
    currentItemSvg,
    currentLabelText,
    currentLabelFont,
    currentLabelSize,
    currentLabelColor,
    currentLabelAlign,
    currentLabelFrameEnabled,
    currentLabelFrameBgColor,
    currentLabelFrameBgOpacity,
    currentLabelFrameBorderColor,
    currentLabelFrameBorderWidth,
    currentLabelFrameRadius,
    currentLabelFramePadding,
    currentCellBorderWidth,
    currentCellBorderColor,
    currentCellBorderAlignment,
    activeEdges
  });

  useEffect(() => {
    toolStateRef.current = {
      activeTool,
      isEraserMode,
      currentColor,
      currentBgSvg,
      currentItemSvg,
      currentLabelText,
      currentLabelFont,
      currentLabelSize,
      currentLabelColor,
      currentLabelAlign,
      currentLabelFrameEnabled,
      currentLabelFrameBgColor,
      currentLabelFrameBgOpacity,
      currentLabelFrameBorderColor,
      currentLabelFrameBorderWidth,
      currentLabelFrameRadius,
      currentLabelFramePadding,
      currentCellBorderWidth,
      currentCellBorderColor,
      currentCellBorderAlignment,
      activeEdges
    };
  }, [activeTool, isEraserMode, currentColor, currentBgSvg, currentItemSvg, currentLabelText, currentLabelFont, currentLabelSize, currentLabelColor, currentLabelAlign, currentLabelFrameEnabled, currentLabelFrameBgColor, currentLabelFrameBgOpacity, currentLabelFrameBorderColor, currentLabelFrameBorderWidth, currentLabelFrameRadius, currentLabelFramePadding, currentCellBorderWidth, currentCellBorderColor, currentCellBorderAlignment, activeEdges]);

  // Load assets from LocalStorage on mount
  useEffect(() => {
    // Cloudflare D1 Workspace Check
    const params = new URLSearchParams(window.location.search);
    const workspaceId = params.get('workspace');
    if (workspaceId) {
      setIsCloudSyncing(true);
      fetch(`/api/sync?id=${workspaceId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.data_json) {
            const loadedGridState = JSON.parse(data.data_json);
            setGridState(loadedGridState);
            
            if (data.colors_json) {
              setSavedColors(JSON.parse(data.colors_json));
              localStorage.setItem('savedColors', data.colors_json);
            }
            if (data.bg_svgs_json) {
              setSavedBgSvgs(JSON.parse(data.bg_svgs_json));
              localStorage.setItem('savedBgSvgs', data.bg_svgs_json);
            }
            if (data.item_svgs_json) {
              setSavedItemSvgs(JSON.parse(data.item_svgs_json));
              localStorage.setItem('savedItemSvgs', data.item_svgs_json);
            }

            setCurrentWorkspaceId(workspaceId);
            const stored = localStorage.getItem('savedGrids');
            let grids: SavedGrid[] = stored ? JSON.parse(stored) : [];
            const existing = grids.find(g => g.workspaceId === workspaceId);
            if (existing) {
              setCurrentGridId(existing.id);
              setCurrentGridName(existing.name);
            } else {
              const newSave: SavedGrid = {
                id: Date.now().toString(),
                name: `Shared Workspace`,
                updatedAt: data.updated_at || Date.now(),
                workspaceId,
                gridState: loadedGridState
              };
              grids.push(newSave);
              localStorage.setItem('savedGrids', JSON.stringify(grids));
              setCurrentGridId(newSave.id);
              setCurrentGridName(newSave.name);
            }
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        })
        .catch(console.error)
        .finally(() => setIsCloudSyncing(false));
    }

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

  const forceDownload = (dataUrl: string, filename: string) => {
    // Convert dataUrl to a Blob to prevent browsers from ignoring the 'download' attribute on raw data URLs
    fetch(dataUrl)
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.style.display = 'none';
        link.href = url;
        link.download = filename;
        link.rel = 'noopener';
        document.body.appendChild(link);
        
        // Dispatch real mouse event for better browser compatibility
        const clickEvent = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        });
        link.dispatchEvent(clickEvent);
        
        // Delay cleanup so browser can process the download attribute correctly
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 5000);
      });
  };

  const getGridPixelDimensions = useCallback(() => {
    const { rows, cols, cellSize, lineThickness, borderThickness, externalMargin } = gridState;
    const innerWidth = cols * cellSize + (cols - 1) * lineThickness;
    const innerHeight = rows * cellSize + (rows - 1) * lineThickness;
    const totalWidth = innerWidth + borderThickness * 2 + (externalMargin || 0) * 2;
    const totalHeight = innerHeight + borderThickness * 2 + (externalMargin || 0) * 2;
    return { width: totalWidth, height: totalHeight };
  }, [gridState]);

  const handleDownload = useCallback((pixelRatio: number) => {
    if (gridRef.current === null) {
      return;
    }

    const originalLineThickness = gridState.lineThickness;
    const doCapture = () => {
      htmlToImage.toPng(gridRef.current!, { cacheBust: true, pixelRatio })
        .then((dataUrl) => {
          forceDownload(dataUrl, 'image_grid.png');
        })
        .catch((err) => {
          console.error('Oops, something went wrong!', err);
        })
        .finally(() => {
          if (exportNoGridLines) {
            setGridState(prev => ({ ...prev, lineThickness: originalLineThickness }));
          }
        });
    };

    if (exportNoGridLines) {
      setGridState(prev => ({ ...prev, lineThickness: 0 }));
      requestAnimationFrame(() => requestAnimationFrame(doCapture));
    } else {
      doCapture();
    }
    setIsPngExportModalOpen(false);
  }, [gridRef, gridState.lineThickness, exportNoGridLines]);

  const handleExportSvg = useCallback(() => {
    if (gridRef.current === null) {
      return;
    }

    if (exportSimplifiedSvg) {
      const svgString = generateSimplifiedSvg(gridState, exportNoGridLines);
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, 'image/svg+xml');
      const svgEl = doc.querySelector('svg');
      if (svgEl) {
          svgEl.setAttribute('width', String(svgExportWidth));
          svgEl.setAttribute('height', String(svgExportHeight));
      }
      const serializer = new XMLSerializer();
      const updatedSvg = serializer.serializeToString(doc);
      const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(updatedSvg);
      forceDownload(dataUrl, 'simplified_grid.svg');
      setIsSvgExportModalOpen(false);
      return;
    }

    const originalLineThickness = gridState.lineThickness;
    const doCapture = () => {
      htmlToImage.toSvg(gridRef.current!, { cacheBust: true })
        .then((dataUrl) => {
          // Parse the SVG data URL, update width/height, preserve viewBox
          const svgContent = decodeURIComponent(dataUrl.split(',')[1]);
          const parser = new DOMParser();
          const doc = parser.parseFromString(svgContent, 'image/svg+xml');
          const svgEl = doc.querySelector('svg');
          if (svgEl) {
            // Set viewBox to original dimensions if not already present
            if (!svgEl.getAttribute('viewBox')) {
              const origW = svgEl.getAttribute('width') || String(svgExportWidth);
              const origH = svgEl.getAttribute('height') || String(svgExportHeight);
              svgEl.setAttribute('viewBox', `0 0 ${parseFloat(origW)} ${parseFloat(origH)}`);
            }
            svgEl.setAttribute('width', String(svgExportWidth));
            svgEl.setAttribute('height', String(svgExportHeight));
          }
          const serializer = new XMLSerializer();
          const updatedSvg = serializer.serializeToString(doc);
          const updatedDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(updatedSvg);
          forceDownload(updatedDataUrl, 'image_grid.svg');
        })
        .catch((err) => {
          console.error('Oops, something went wrong with SVG export!', err);
        })
        .finally(() => {
          if (exportNoGridLines) {
            setGridState(prev => ({ ...prev, lineThickness: originalLineThickness }));
          }
        });
    };

    if (exportNoGridLines) {
      setGridState(prev => ({ ...prev, lineThickness: 0 }));
      requestAnimationFrame(() => requestAnimationFrame(doCapture));
    } else {
      doCapture();
    }
    setIsSvgExportModalOpen(false);
  }, [gridRef, svgExportWidth, svgExportHeight, gridState, exportNoGridLines, exportSimplifiedSvg]);

  const handleGridChange = (key: keyof GridState, value: any) => {
    setGridState((prev) => ({ ...prev, [key]: value }));
  };

  const getWorkspaceBgStyle = () => {
    let bgImage = 'none';
    if (gridState.workspaceBgImageUrl) {
      if (gridState.workspaceBgImageUrl.trim().startsWith('<svg')) {
        bgImage = `url("data:image/svg+xml;utf8,${encodeURIComponent(gridState.workspaceBgImageUrl)}")`;
      } else {
        bgImage = `url("${gridState.workspaceBgImageUrl}")`;
      }
    }
    return {
      backgroundColor: gridState.workspaceBgColor || '#0f172a',
      backgroundImage: bgImage,
    };
  };

  const handleCellClick = useCallback((row: number, col: number) => {
    const key = `${row},${col}`;
    const {
      activeTool,
      isEraserMode,
      currentColor,
      currentBgSvg,
      currentItemSvg,
      currentLabelText,
      currentLabelFont,
      currentLabelSize,
      currentLabelColor,
      currentLabelAlign,
      currentLabelFrameEnabled,
      currentLabelFrameBgColor,
      currentLabelFrameBgOpacity,
      currentLabelFrameBorderColor,
      currentLabelFrameBorderWidth,
      currentLabelFrameRadius,
      currentLabelFramePadding,
      currentCellBorderWidth,
      currentCellBorderColor,
      currentCellBorderAlignment,
      activeEdges
    } = toolStateRef.current;

    setGridState((prev) => {
      const newCells = { ...prev.cells };
      const currentCell = newCells[key] || {};

      if (activeTool === 'bg-color' || activeTool === 'bg-svg') {
        if (isEraserMode) {
          newCells[key] = { ...currentCell, bgType: undefined, bgValue: undefined };
        } else {
          newCells[key] = { ...currentCell, bgType: activeTool === 'bg-color' ? 'color' : 'svg', bgValue: activeTool === 'bg-color' ? currentColor : currentBgSvg };
        }
      } else if (activeTool === 'item-svg') {
        if (isEraserMode) {
          newCells[key] = { ...currentCell, itemValue: undefined };
        } else {
          newCells[key] = { ...currentCell, itemValue: currentItemSvg };
        }
      } else if (activeTool === 'label') {
        if (isEraserMode) {
          newCells[key] = { ...currentCell, label: undefined };
        } else {
          newCells[key] = { 
            ...currentCell, 
            label: {
              text: currentLabelText,
              font: currentLabelFont,
              size: currentLabelSize,
              color: currentLabelColor,
              align: currentLabelAlign,
              ...(currentLabelFrameEnabled ? {
                frameBgColor: currentLabelFrameBgColor,
                frameBgOpacity: currentLabelFrameBgOpacity,
                frameBorderColor: currentLabelFrameBorderColor,
                frameBorderWidth: currentLabelFrameBorderWidth,
                frameRadius: currentLabelFrameRadius,
                framePadding: currentLabelFramePadding,
              } : {})
            } 
          };
        }
      } else if (activeTool === 'cell-border') {
        if (isEraserMode) {
          newCells[key] = {
            ...currentCell,
            borderTop: activeEdges.top ? undefined : currentCell.borderTop,
            borderRight: activeEdges.right ? undefined : currentCell.borderRight,
            borderBottom: activeEdges.bottom ? undefined : currentCell.borderBottom,
            borderLeft: activeEdges.left ? undefined : currentCell.borderLeft,
          };
        } else {
          newCells[key] = {
            ...currentCell,
            borderTop: activeEdges.top ? { width: currentCellBorderWidth, color: currentCellBorderColor, alignment: currentCellBorderAlignment } : currentCell.borderTop,
            borderRight: activeEdges.right ? { width: currentCellBorderWidth, color: currentCellBorderColor, alignment: currentCellBorderAlignment } : currentCell.borderRight,
            borderBottom: activeEdges.bottom ? { width: currentCellBorderWidth, color: currentCellBorderColor, alignment: currentCellBorderAlignment } : currentCell.borderBottom,
            borderLeft: activeEdges.left ? { width: currentCellBorderWidth, color: currentCellBorderColor, alignment: currentCellBorderAlignment } : currentCell.borderLeft,
          };
        }
      } else if (activeTool === 'eraser-all') {
        delete newCells[key];
      }

      // Clean up empty cells
      if (newCells[key] && !newCells[key].bgType && !newCells[key].itemValue && !newCells[key].label &&
        !newCells[key].borderTop && !newCells[key].borderRight &&
        !newCells[key].borderBottom && !newCells[key].borderLeft) {
        delete newCells[key];
      }

      return { ...prev, cells: newCells };
    });
  }, []);

  const syncToCloud = (
    workspaceId: string, 
    gridData: GridState, 
    updatedAt: number,
    overrideAssets?: { colors?: SavedAsset[], bgSvgs?: SavedAsset[], itemSvgs?: SavedAsset[] }
  ) => {
    setIsCloudSyncing(true);
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: workspaceId,
        data_json: JSON.stringify(gridData),
        colors_json: JSON.stringify(overrideAssets?.colors || savedColors),
        bg_svgs_json: JSON.stringify(overrideAssets?.bgSvgs || savedBgSvgs),
        item_svgs_json: JSON.stringify(overrideAssets?.itemSvgs || savedItemSvgs),
        updated_at: updatedAt
      })
    })
    .catch(console.error)
    .finally(() => setIsCloudSyncing(false));
  };

  const handleCloudShare = () => {
    if (currentWorkspaceId) {
      navigator.clipboard.writeText(`${window.location.origin}/?workspace=${currentWorkspaceId}`);
      alert('Link copiado para a área de transferência!');
      return;
    }
    
    // Fallback to crypto.randomUUID or simple manual generator
    const generateUUID = () => {
      if (crypto.randomUUID) return crypto.randomUUID();
      return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c: any) =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
      );
    }
    const newWorkspaceId = generateUUID();
    setCurrentWorkspaceId(newWorkspaceId);
    
    // Auto-save the current state to locals so we can link it
    const now = Date.now();
    let saveId = currentGridId;
    let saveNameVal = currentGridName;
    
    const stored = localStorage.getItem('savedGrids');
    let grids: SavedGrid[] = stored ? JSON.parse(stored) : [];
    
    if (saveId) {
      grids = grids.map(g => g.id === saveId ? { ...g, workspaceId: newWorkspaceId, updatedAt: now, gridState: gridState } : g);
    } else {
      saveId = Date.now().toString();
      saveNameVal = 'Cloud Workspace';
      const newSave: SavedGrid = {
        id: saveId,
        name: saveNameVal,
        updatedAt: now,
        workspaceId: newWorkspaceId,
        gridState: gridState
      };
      grids.push(newSave);
      setCurrentGridId(saveId);
      setCurrentGridName(saveNameVal);
    }
    localStorage.setItem('savedGrids', JSON.stringify(grids));
    
    syncToCloud(newWorkspaceId, gridState, now);
    navigator.clipboard.writeText(`${window.location.origin}/?workspace=${newWorkspaceId}`);
    alert('Workspace sync ativado! Link copiado para a área de transferência.');
  };

  const handleSaveGrid = () => {
    if (!saveName.trim()) return;

    const now = Date.now();
    const newSave: SavedGrid = {
      id: Date.now().toString(),
      name: saveName.trim(),
      updatedAt: now,
      workspaceId: currentWorkspaceId || undefined,
      gridState: gridState
    };

    const stored = localStorage.getItem('savedGrids');
    const grids: SavedGrid[] = stored ? JSON.parse(stored) : [];
    grids.push(newSave);
    localStorage.setItem('savedGrids', JSON.stringify(grids));

    if (currentWorkspaceId) syncToCloud(currentWorkspaceId, gridState, now);

    setCurrentGridId(newSave.id);
    setCurrentGridName(newSave.name);
    setIsSaveModalOpen(false);
    setSaveName('');
  };

  const handleOverwriteGrid = () => {
    if (!currentGridId) return;
    const stored = localStorage.getItem('savedGrids');
    if (!stored) return;
    const now = Date.now();
    
    let grids: SavedGrid[] = JSON.parse(stored);
    grids = grids.map(g => g.id === currentGridId ? {
      ...g,
      updatedAt: now,
      workspaceId: currentWorkspaceId || g.workspaceId,
      gridState: gridState
    } : g);
    localStorage.setItem('savedGrids', JSON.stringify(grids));
    
    if (currentWorkspaceId) syncToCloud(currentWorkspaceId, gridState, now);
    
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
    setCurrentWorkspaceId(loadedGrid.workspaceId || null);
    setShowGridManager(false);
  };

  const handleToolSelect = (tool: Tool) => {
    setActiveTool(tool);
    setIsEraserMode(false);
  };

  if (showAssetManager) {
    return (
      <AssetManager
        onClose={() => setShowAssetManager(false)}
        savedColors={savedColors}
        setSavedColors={(assets) => {
          setSavedColors(assets);
          if (currentWorkspaceId) syncToCloud(currentWorkspaceId, gridState, Date.now(), { colors: assets });
        }}
        savedBgSvgs={savedBgSvgs}
        setSavedBgSvgs={(assets) => {
          setSavedBgSvgs(assets);
          if (currentWorkspaceId) syncToCloud(currentWorkspaceId, gridState, Date.now(), { bgSvgs: assets });
        }}
        savedItemSvgs={savedItemSvgs}
        setSavedItemSvgs={(assets) => {
          setSavedItemSvgs(assets);
          if (currentWorkspaceId) syncToCloud(currentWorkspaceId, gridState, Date.now(), { itemSvgs: assets });
        }}
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
    <div className="flex h-screen w-full bg-neutral-950 text-neutral-200 font-sans overflow-hidden">
      
      {/* Left Toolbar (Tools) */}
      <aside className="w-16 flex flex-col items-center py-4 gap-4 z-20 border-r border-neutral-800 bg-black shrink-0 overflow-y-auto custom-scrollbar shadow-xl">
        <ToolButton icon={MousePointer2} title="Pointer" isActive={activeTool === 'pointer' && !isEraserMode} onClick={() => handleToolSelect('pointer')} />
        
        <div className="w-8 h-px bg-neutral-800 shrink-0" />
        
        <ToolButton icon={PaintBucket} title="Fill Background Color" isActive={activeTool === 'bg-color' && !isEraserMode} onClick={() => handleToolSelect('bg-color')} />
        <ToolButton icon={ImageIcon} title="Fill Background SVG" isActive={activeTool === 'bg-svg' && !isEraserMode} onClick={() => handleToolSelect('bg-svg')} />
        
        <div className="w-8 h-px bg-neutral-800 shrink-0" />
        
        <ToolButton icon={ImageIcon} title="Place Item SVG" isActive={activeTool === 'item-svg' && !isEraserMode} onClick={() => handleToolSelect('item-svg')} />
        
        <div className="w-8 h-px bg-neutral-800 shrink-0" />
        
        <ToolButton icon={Type} title="Place Text Label" isActive={activeTool === 'label' && !isEraserMode} onClick={() => handleToolSelect('label')} />
        
        <div className="w-8 h-px bg-neutral-800 shrink-0" />
        
        <ToolButton icon={Square} title="Apply Cell Borders" isActive={activeTool === 'cell-border' && !isEraserMode} onClick={() => handleToolSelect('cell-border')} />

        <div className="w-8 h-px bg-neutral-800 shrink-0" />
        
        <ToolButton 
          icon={Eraser} 
          title="Erase Mode (applies to active tool)" 
          isActive={isEraserMode} 
          onClick={() => {
            if (['bg-color', 'bg-svg', 'item-svg', 'label', 'cell-border'].includes(activeTool)) {
              setIsEraserMode(!isEraserMode);
            } else {
              handleToolSelect('bg-color');
              setIsEraserMode(true);
            }
          }} 
        />

        <div className="w-8 h-px bg-neutral-800 shrink-0" />
        
        <button
          onClick={() => setActiveTool('eraser-all')}
          className={`p-2 rounded-lg flex justify-center items-center transition-all ${activeTool === 'eraser-all' ? 'bg-rose-500/20 text-rose-400 ring-1 ring-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'tool-btn-inactive'}`}
          title="Erase All in Cell"
        >
          <Eraser className="w-5 h-5" />
        </button>
      </aside>

      {/* Secondary Left Sidebar (Tool Settings) */}
      {(['bg-color', 'bg-svg', 'item-svg', 'label', 'cell-border'].includes(activeTool) || isEraserMode) && (
        <aside className="w-72 bg-neutral-900 border-r border-neutral-800 z-10 flex flex-col shrink-0 shadow-2xl relative">
          <div className="flex items-center gap-2 p-4 border-b border-neutral-800 bg-neutral-950">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-sky-400"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            <h2 className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">Tool Settings</h2>
          </div>
          <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
          <div className="px-1">
            {isEraserMode ? (
              <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold p-3 text-center border border-dashed border-neutral-800 rounded-lg">
                Eraser Mode Active<br/>
                <span className="text-rose-400 mt-1 block">Erasing {
                  activeTool === 'bg-color' || activeTool === 'bg-svg' ? 'Backgrounds' :
                  activeTool === 'item-svg' ? 'Items' :
                  activeTool === 'label' ? 'Labels' :
                  activeTool === 'cell-border' ? 'Borders' : 'Content'
                }</span>
              </div>
            ) : (
              <>
                {activeTool === 'bg-color' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Select Color</label>
                  <div className="flex gap-2">
                    <button onClick={() => { setIsAddingAsset(!isAddingAsset); setNewAssetValue('#ffffff') }} className="text-neutral-400 hover:text-white transition-colors" title="Add Color">
                      {isAddingAsset ? <X size={14} /> : <Plus size={14} />}
                    </button>
                    <button onClick={() => setShowAssetManager(true)} className="text-[10px] text-neutral-400 hover:text-neutral-300 font-medium uppercase tracking-wider transition-colors">Manage</button>
                  </div>
                </div>
                
                {isAddingAsset ? (
                  <div className="space-y-3 bg-neutral-950 p-3 rounded border border-neutral-800">
                    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Add New Color</div>
                    {('EyeDropper' in window) && (
                      <button onClick={handleDetectColorInline} className="w-full flex items-center justify-center gap-2 h-8 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded border border-neutral-800 transition-colors text-[10px] font-bold uppercase tracking-widest">
                        <Pipette size={14} /> Detect Color
                      </button>
                    )}
                    <div className="flex h-8 bg-black border border-neutral-800 rounded focus-within:ring-1 focus-within:ring-white transition-all overflow-hidden">
                      <input
                        type="color"
                        value={newAssetValue || '#000000'}
                        onChange={(e) => setNewAssetValue(e.target.value)}
                        className="w-8 h-full p-0 border-0 cursor-pointer seamless-color"
                      />
                      <input
                        type="text"
                        value={newAssetValue}
                        onChange={(e) => setNewAssetValue(e.target.value)}
                        placeholder="#HEX"
                        className="flex-1 bg-transparent border-0 px-2 text-xs font-mono text-neutral-300 focus:outline-none"
                      />
                    </div>
                    <button onClick={handleAddAssetSave} className="w-full h-8 bg-white hover:bg-neutral-200 text-black text-[10px] font-bold uppercase tracking-widest rounded transition-colors" disabled={!newAssetValue.trim()}>
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {savedColors.map(color => (
                      <button
                        key={color.id}
                        onClick={() => setCurrentColor(color.value)}
                        className={`h-8 rounded-md border transition-all ${currentColor === color.value ? 'ring-2 ring-neutral-500 ring-offset-2 ring-offset-neutral-900 border-transparent scale-110 shadow-lg' : 'border-neutral-600/50 hover:border-neutral-400 hover:scale-105'}`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTool === 'bg-svg' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Select Background SVG</label>
                  <div className="flex gap-2">
                    <button onClick={() => { setIsAddingAsset(!isAddingAsset); setNewAssetValue('') }} className="text-neutral-400 hover:text-white transition-colors" title="Add SVG">
                      {isAddingAsset ? <X size={14} /> : <Plus size={14} />}
                    </button>
                    <button onClick={() => setShowAssetManager(true)} className="text-[10px] text-neutral-400 hover:text-neutral-300 font-medium uppercase tracking-wider transition-colors">Manage</button>
                  </div>
                </div>

                {isAddingAsset ? (
                  <div className="space-y-3 bg-neutral-950 p-3 rounded border border-neutral-800">
                    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Add New SVG</div>
                    <textarea
                      value={newAssetValue}
                      onChange={(e) => setNewAssetValue(e.target.value)}
                      placeholder="Paste SVG code here..."
                      className="w-full h-24 bg-black border border-neutral-800 rounded p-2 text-xs font-mono text-neutral-300 focus:outline-none focus:ring-1 focus:ring-white transition-all custom-scrollbar resize-none"
                    />
                    <button onClick={handleAddAssetSave} className="w-full h-8 bg-white hover:bg-neutral-200 text-black text-[10px] font-bold uppercase tracking-widest rounded transition-colors" disabled={!newAssetValue.trim()}>
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {savedBgSvgs.map(svg => (
                      <button
                        key={svg.id}
                        onClick={() => setCurrentBgSvg(svg.value)}
                        className={`h-12 rounded-md border flex items-center justify-center overflow-hidden transition-all bg-neutral-800 ${currentBgSvg === svg.value ? 'ring-2 ring-neutral-500 ring-offset-2 ring-offset-neutral-900 border-transparent shadow-lg' : 'border-neutral-600/50 hover:border-neutral-400'}`}
                        title={svg.name}
                        dangerouslySetInnerHTML={{ __html: svg.value }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          {activeTool === 'item-svg' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Select Item SVG</label>
                  <div className="flex gap-2">
                    <button onClick={() => { setIsAddingAsset(!isAddingAsset); setNewAssetValue('') }} className="text-neutral-400 hover:text-white transition-colors" title="Add SVG">
                      {isAddingAsset ? <X size={14} /> : <Plus size={14} />}
                    </button>
                    <button onClick={() => setShowAssetManager(true)} className="text-[10px] text-neutral-400 hover:text-neutral-300 font-medium uppercase tracking-wider transition-colors">Manage</button>
                  </div>
                </div>

                {isAddingAsset ? (
                  <div className="space-y-3 bg-neutral-950 p-3 rounded border border-neutral-800">
                    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Add New SVG</div>
                    <textarea
                      value={newAssetValue}
                      onChange={(e) => setNewAssetValue(e.target.value)}
                      placeholder="Paste SVG code here..."
                      className="w-full h-24 bg-black border border-neutral-800 rounded p-2 text-xs font-mono text-neutral-300 focus:outline-none focus:ring-1 focus:ring-white transition-all custom-scrollbar resize-none"
                    />
                    <button onClick={handleAddAssetSave} className="w-full h-8 bg-white hover:bg-neutral-200 text-black text-[10px] font-bold uppercase tracking-widest rounded transition-colors" disabled={!newAssetValue.trim()}>
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {savedItemSvgs.map(svg => (
                      <button
                        key={svg.id}
                        onClick={() => setCurrentItemSvg(svg.value)}
                        className={`h-12 rounded-md border flex items-center justify-center overflow-hidden transition-all bg-neutral-800 ${currentItemSvg === svg.value ? 'ring-2 ring-neutral-500 ring-offset-2 ring-offset-neutral-900 border-transparent shadow-lg' : 'border-neutral-600/50 hover:border-neutral-400'}`}
                        title={svg.name}
                        dangerouslySetInnerHTML={{ __html: svg.value }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          {activeTool === 'label' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Label Text</label>
                  <input
                    type="text"
                    value={currentLabelText}
                    onChange={(e) => setCurrentLabelText(e.target.value)}
                    placeholder="E.g. Room 1"
                    className="w-full px-3 py-2 glass-input"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Font Select</label>
                    <select
                      value={currentLabelFont}
                      onChange={(e) => setCurrentLabelFont(e.target.value)}
                      className="w-full px-2 py-2 glass-input text-xs"
                    >
                      <option value="Inter, sans-serif">Inter</option>
                      <option value="Arial, sans-serif">Arial</option>
                      <option value="'Courier New', Courier, monospace">Courier New</option>
                      <option value="'Times New Roman', Times, serif">Times New</option>
                      <option value="'Comic Sans MS', cursive, sans-serif">Comic Sans</option>
                      <option value="'Georgia', serif">Georgia</option>
                       <option value="'Trebuchet MS', sans-serif">Trebuchet</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Size (px)</label>
                    <input
                      type="number"
                      min="8" max="100"
                      value={currentLabelSize}
                      onChange={(e) => setCurrentLabelSize(parseInt(e.target.value) || 12)}
                      className="w-full px-3 py-2 glass-input"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 mt-2">
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Alignment</label>
                  <div className="flex bg-neutral-900/50 p-1 rounded-lg border border-neutral-700/50">
                    <button
                      onClick={() => setCurrentLabelAlign('start')}
                      className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-all ${currentLabelAlign === 'start' ? 'bg-neutral-500/20 text-neutral-400 shadow-sm' : 'text-neutral-400 hover:text-neutral-200'}`}
                    >
                      Start
                    </button>
                    <button
                      onClick={() => setCurrentLabelAlign('center')}
                      className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-all ${currentLabelAlign === 'center' ? 'bg-neutral-500/20 text-neutral-400 shadow-sm' : 'text-neutral-400 hover:text-neutral-200'}`}
                    >
                      Center
                    </button>
                    <button
                      onClick={() => setCurrentLabelAlign('end')}
                      className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-all ${currentLabelAlign === 'end' ? 'bg-neutral-500/20 text-neutral-400 shadow-sm' : 'text-neutral-400 hover:text-neutral-200'}`}
                    >
                      End
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-800">
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Text Color</label>
                  <div className="flex h-8 bg-black border border-neutral-800 rounded-sm focus-within:ring-1 focus-within:ring-white transition-all overflow-hidden">
                    <input
                      type="color"
                      value={currentLabelColor}
                      onChange={(e) => setCurrentLabelColor(e.target.value)}
                      className="w-10 h-full p-0 border-0 cursor-pointer seamless-color shrink-0 bg-transparent"
                    />
                    <div className="w-px h-full bg-neutral-800 shrink-0" />
                    <input
                      type="text"
                      value={currentLabelColor}
                      onChange={(e) => setCurrentLabelColor(e.target.value)}
                      className="flex-1 w-full bg-transparent border-0 px-2 text-[10px] font-bold text-neutral-200 outline-none uppercase tracking-widest"
                    />
                  </div>
                </div>

                {/* Label Frame / Background */}
                <div className="pt-4 border-t border-neutral-800 space-y-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={currentLabelFrameEnabled}
                      onChange={(e) => setCurrentLabelFrameEnabled(e.target.checked)}
                      className="w-4 h-4 accent-white cursor-pointer"
                    />
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Label Frame</span>
                  </label>

                  {currentLabelFrameEnabled && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Fill Color</label>
                          <div className="flex h-8 bg-black border border-neutral-800 rounded-sm focus-within:ring-1 focus-within:ring-white transition-all overflow-hidden">
                            <input
                              type="color"
                              value={currentLabelFrameBgColor}
                              onChange={(e) => setCurrentLabelFrameBgColor(e.target.value)}
                              className="w-10 h-full p-0 border-0 cursor-pointer seamless-color shrink-0 bg-transparent"
                            />
                            <div className="w-px h-full bg-neutral-800 shrink-0" />
                            <input
                              type="text"
                              value={currentLabelFrameBgColor}
                              onChange={(e) => setCurrentLabelFrameBgColor(e.target.value)}
                              className="flex-1 w-full bg-transparent border-0 px-2 text-[10px] font-bold text-neutral-200 outline-none uppercase tracking-widest"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Fill Opacity (%)</label>
                          <input
                            type="number"
                            min="0" max="100"
                            value={Math.round(currentLabelFrameBgOpacity * 100)}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                              setCurrentLabelFrameBgOpacity(val / 100);
                            }}
                            className="w-full h-8 px-3 bg-black border border-neutral-800 text-[10px] font-bold text-neutral-200 outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Border Color</label>
                          <div className="flex h-8 bg-black border border-neutral-800 rounded-sm focus-within:ring-1 focus-within:ring-white transition-all overflow-hidden">
                            <input
                              type="color"
                              value={currentLabelFrameBorderColor}
                              onChange={(e) => setCurrentLabelFrameBorderColor(e.target.value)}
                              className="w-10 h-full p-0 border-0 cursor-pointer seamless-color shrink-0 bg-transparent"
                            />
                            <div className="w-px h-full bg-neutral-800 shrink-0" />
                            <input
                              type="text"
                              value={currentLabelFrameBorderColor}
                              onChange={(e) => setCurrentLabelFrameBorderColor(e.target.value)}
                              className="flex-1 w-full bg-transparent border-0 px-2 text-[10px] font-bold text-neutral-200 outline-none uppercase tracking-widest"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Border Width</label>
                          <input
                            type="number"
                            min="0" max="20"
                            value={currentLabelFrameBorderWidth}
                            onChange={(e) => setCurrentLabelFrameBorderWidth(parseInt(e.target.value) || 0)}
                            className="w-full h-8 px-3 bg-black border border-neutral-800 text-[10px] font-bold text-neutral-200 outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Radius (px)</label>
                          <input
                            type="number"
                            min="0" max="100"
                            value={currentLabelFrameRadius}
                            onChange={(e) => setCurrentLabelFrameRadius(parseInt(e.target.value) || 0)}
                            className="w-full h-8 px-3 bg-black border border-neutral-800 text-[10px] font-bold text-neutral-200 outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Padding (px)</label>
                          <input
                            type="number"
                            min="0" max="50"
                            value={currentLabelFramePadding}
                            onChange={(e) => setCurrentLabelFramePadding(parseInt(e.target.value) || 0)}
                            className="w-full h-8 px-3 bg-black border border-neutral-800 text-[10px] font-bold text-neutral-200 outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          {activeTool === 'cell-border' && (
              <div className="space-y-5">
                <div className="space-y-3">
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider text-center block">Edges to Apply/Erase</label>
                  <div className="flex justify-center items-center gap-1 p-3 bg-neutral-900/50 rounded-xl border border-neutral-700/50 w-fit mx-auto shadow-inner">
                    <div className="grid grid-cols-3 grid-rows-3 gap-1 w-16 h-16">
                      <div />
                      <button
                        onClick={() => toggleEdge('top')}
                        className={`rounded-sm transition-all ${activeEdges.top ? 'bg-neutral-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-neutral-700 hover:bg-neutral-600'}`}
                        title="Top Edge"
                      />
                      <div />
                      <button
                        onClick={() => toggleEdge('left')}
                        className={`rounded-sm transition-all ${activeEdges.left ? 'bg-neutral-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-neutral-700 hover:bg-neutral-600'}`}
                        title="Left Edge"
                      />
                      <div className="bg-neutral-800 rounded-sm border border-neutral-600/50" />
                      <button
                        onClick={() => toggleEdge('right')}
                        className={`rounded-sm transition-all ${activeEdges.right ? 'bg-neutral-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-neutral-700 hover:bg-neutral-600'}`}
                        title="Right Edge"
                      />
                      <div />
                      <button
                        onClick={() => toggleEdge('bottom')}
                        className={`rounded-sm transition-all ${activeEdges.bottom ? 'bg-neutral-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-neutral-700 hover:bg-neutral-600'}`}
                        title="Bottom Edge"
                      />
                      <div />
                    </div>
                  </div>
                </div>

                {activeTool === 'cell-border' && (
                  <div className="pt-2 border-t border-neutral-700/50 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Border Width (px)</label>
                      <input
                        type="number"
                        min="1" max="20"
                        value={currentCellBorderWidth}
                        onChange={(e) => setCurrentCellBorderWidth(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 glass-input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Alignment</label>
                      <div className="flex bg-neutral-900/50 p-1 rounded-lg border border-neutral-700/50">
                        <button
                          onClick={() => setCurrentCellBorderAlignment('inner')}
                          className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-all ${currentCellBorderAlignment === 'inner' ? 'bg-neutral-500/20 text-neutral-400 shadow-sm' : 'text-neutral-400 hover:text-neutral-200'}`}
                        >
                          Inner
                        </button>
                        <button
                          onClick={() => setCurrentCellBorderAlignment('center')}
                          className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-all ${currentCellBorderAlignment === 'center' ? 'bg-neutral-500/20 text-neutral-400 shadow-sm' : 'text-neutral-400 hover:text-neutral-200'}`}
                        >
                          Center
                        </button>
                        <button
                          onClick={() => setCurrentCellBorderAlignment('outer')}
                          className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-all ${currentCellBorderAlignment === 'outer' ? 'bg-neutral-500/20 text-neutral-400 shadow-sm' : 'text-neutral-400 hover:text-neutral-200'}`}
                        >
                          Outer
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Border Color</label>
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
            </>
          )}
          </div>
          </div>
        </aside>
      )}

      {/* Main Grid Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-neutral-950">
        <header className="h-16 border-b border-neutral-800 bg-black flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-neutral-100 to-neutral-400 bg-clip-text text-transparent italic tracking-tight">craft_matrix</h1>
            <div className="h-6 w-px bg-neutral-800"></div>
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-mono text-neutral-200 tracking-wider font-bold">WORKSPACE ACTIVE</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCloudShare}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-bold uppercase tracking-widest rounded-lg transition-all border ${currentWorkspaceId ? 'bg-sky-500/10 text-sky-400 border-sky-500/30 hover:bg-sky-500/20' : 'text-slate-300 hover:text-white border-transparent hover:bg-neutral-800'}`}
              title={currentWorkspaceId ? 'Copy Share Link' : 'Sync to Cloud'}
            >
              {isCloudSyncing ? <Loader2 className="w-4 h-4 animate-spin text-sky-400" /> : <Cloud className={`w-4 h-4 ${currentWorkspaceId ? 'text-sky-400' : ''}`} />}
              <span>{currentWorkspaceId ? 'Cloud Sync On' : 'Cloud Sync'}</span>
            </button>
            <div className="w-px h-6 bg-slate-700/50 mx-1"></div>
            <button
              onClick={() => setShowGridManager(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-all border border-transparent hover:border-indigo-500/30"
            >
              <FolderOpen className="w-4 h-4" />
              Manage Saved Grids
            </button>
            <button
              onClick={() => setShowAssetManager(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-all border border-transparent hover:border-indigo-500/30"
            >
              <Library className="w-4 h-4" />
              Manage Assets
            </button>
            <div className="w-px h-6 bg-slate-700/50 mx-2"></div>
            <button
              onClick={onSaveClick}
              className="flex items-center gap-2 btn-secondary py-2 px-4 text-sm"
            >
              <Save className="w-4 h-4" />
              Save Grid
            </button>
            <button
              onClick={() => setIsPngExportModalOpen(true)}
              className="flex items-center gap-2 btn-primary py-2 px-4 text-sm"
            >
              <Download className="w-4 h-4" />
              PNG
            </button>
            <button
              onClick={() => {
                const dims = getGridPixelDimensions();
                setSvgExportWidth(dims.width);
                setSvgExportHeight(dims.height);
                setIsSvgExportModalOpen(true);
              }}
              className="flex items-center gap-2 btn-primary py-2 px-4 text-sm"
            >
              <Download className="w-4 h-4" />
              SVG
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto relative" style={getWorkspaceBgStyle()}>
          <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-50"></div>
          <div className="min-h-full min-w-full flex flex-col items-center justify-center p-8 w-max h-max relative z-10">

            {/* Grid Container */}
            {/* This wrapper ensures the external margin is captured during export */}
            <div
              ref={gridRef}
              className="shadow-2xl transition-all duration-300 relative"
              style={{
                padding: gridState.externalMargin || 0,
              }}
            >
              {/* The actual external margin background. Kept separate from main div to handle opacity cleanly. */}
              {(gridState.externalMargin ?? 0) > 0 && (
                <div
                  className="absolute inset-0 z-0 pointer-events-none box-border"
                  style={{
                    border: `${(gridState.externalMargin || 0) + 1}px solid ${gridState.externalMarginColor || '#ffffff'}`,
                    opacity: gridState.externalMarginOpacity ?? 0,
                    borderRadius: '0px'
                  }}
                />
              )}

              <div
                className="relative z-10 box-border"
                style={{
                  border: `${gridState.borderThickness}px solid ${gridState.borderColor}`,
                  // Outer padding and background color removed to prevent "fill" behavior
                }}
              >
                <div className="relative">
                  {/* Layer Z0: Global Inner Background */}
                  <div
                    className="absolute inset-0 pointer-events-none z-0"
                    style={{
                      backgroundColor: gridState.innerBgColor || '#ffffff',
                      opacity: gridState.innerBgOpacity ?? 1,
                    }}
                  />

                  {/* Layer Z1: Grid Lines */}
                  {gridState.lineThickness > 0 && (
                    <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden">
                      {/* Horizontal lines */}
                      {Array.from({ length: gridState.rows - 1 }).map((_, i) => (
                        <div
                          key={`h-line-${i}`}
                          className="absolute w-full"
                          style={{
                            height: gridState.lineThickness,
                            backgroundColor: gridState.lineColor,
                            top: (i + 1) * gridState.cellSize + i * gridState.lineThickness,
                          }}
                        />
                      ))}
                      {/* Vertical lines */}
                      {Array.from({ length: gridState.cols - 1 }).map((_, i) => (
                        <div
                          key={`v-line-${i}`}
                          className="absolute h-full"
                          style={{
                            width: gridState.lineThickness,
                            backgroundColor: gridState.lineColor,
                            left: (i + 1) * gridState.cellSize + i * gridState.lineThickness,
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Layer Z10: React Cells Container */}
                  <div
                    className="grid relative z-10"
                    style={{
                      gridTemplateColumns: `repeat(${gridState.cols}, ${gridState.cellSize}px)`,
                      gridTemplateRows: `repeat(${gridState.rows}, ${gridState.cellSize}px)`,
                      gap: gridState.lineThickness,
                    }}
                  >
                  {Array.from({ length: gridState.rows }).map((_, rowIndex) => (
                    Array.from({ length: gridState.cols }).map((_, colIndex) => {
                      const key = `${rowIndex},${colIndex}`;
                      const cellData = gridState.cells[key];

                      return (
                        <MemoizedCell
                          key={key}
                          rowIndex={rowIndex}
                          colIndex={colIndex}
                          cellData={cellData}
                          cellSize={gridState.cellSize}
                          lineThickness={gridState.lineThickness}
                          onClick={handleCellClick}
                        />
                      );
                    })
                  ))}
                  </div>
                </div>
              </div>
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
          <p className="text-neutral-400 text-xs">
            You are editing <strong className="text-white">{currentGridName}</strong>. Do you want to overwrite the existing save or create a new one?
          </p>
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleOverwriteGrid}
              className="btn-primary w-full py-2.5 text-center"
            >
              Save (Overwrite)
            </button>
            <button
              onClick={handlePromptSaveAs}
              className="btn-secondary w-full py-2.5 text-center"
            >
              Save As (New Copy)
            </button>
            <button
              onClick={() => setIsSavePromptModalOpen(false)}
              className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white transition-colors mt-1"
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
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Grid Name</label>
            <input
              type="text"
              autoFocus
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveGrid()}
              placeholder="e.g., My Awesome Matrix"
              className="w-full h-8 px-3 bg-black border border-neutral-800 text-[10px] font-bold text-neutral-200 outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setIsSaveModalOpen(false)}
              className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveGrid}
              disabled={!saveName.trim()}
              className="btn-primary py-2 px-4"
            >
              {currentGridId ? "Save Copy" : "Save"}
            </button>
          </div>
        </div>
      </Modal>

      {/* PNG Export Modal */}
      <Modal
        isOpen={isPngExportModalOpen}
        onClose={() => setIsPngExportModalOpen(false)}
        title="Export PNG"
      >
        <div className="space-y-3">
          <p className="text-neutral-400 text-xs">Escolha o tamanho da imagem PNG para exportação.</p>
          <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={exportNoGridLines}
              onChange={(e) => setExportNoGridLines(e.target.checked)}
              className="w-4 h-4 accent-white cursor-pointer"
            />
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">No Grid Lines</span>
          </label>
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={() => handleDownload(0.5)}
              className="btn-secondary w-full py-2.5 text-center"
            >
              Small (0.5×)
            </button>
            <button
              onClick={() => handleDownload(1)}
              className="btn-primary w-full py-2.5 text-center"
            >
              Original Size (1×)
            </button>
            <button
              onClick={() => handleDownload(300 / 96)}
              className="btn-primary w-full py-2.5 text-center"
            >
              Print (300 DPI)
            </button>
          </div>
        </div>
      </Modal>

      {/* SVG Export Modal */}
      <Modal
        isOpen={isSvgExportModalOpen}
        onClose={() => setIsSvgExportModalOpen(false)}
        title="Export SVG"
      >
        <div className="space-y-4">
          <p className="text-neutral-400 text-xs">Defina as dimensões do arquivo SVG exportado (em pixels).</p>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={exportNoGridLines}
              onChange={(e) => setExportNoGridLines(e.target.checked)}
              className="w-4 h-4 accent-white cursor-pointer"
            />
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">No Grid Lines</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={exportSimplifiedSvg}
              onChange={(e) => setExportSimplifiedSvg(e.target.checked)}
              className="w-4 h-4 accent-white cursor-pointer"
            />
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Simplified SVG (Fast, Backgrounds only)</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Largura (px)</label>
              <input
                type="number"
                min="1"
                value={svgExportWidth}
                onChange={(e) => setSvgExportWidth(parseInt(e.target.value) || 1)}
                className="w-full h-8 px-3 bg-black border border-neutral-800 text-[10px] font-bold text-neutral-200 outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Altura (px)</label>
              <input
                type="number"
                min="1"
                value={svgExportHeight}
                onChange={(e) => setSvgExportHeight(parseInt(e.target.value) || 1)}
                className="w-full h-8 px-3 bg-black border border-neutral-800 text-[10px] font-bold text-neutral-200 outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setIsSvgExportModalOpen(false)}
              className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExportSvg}
              className="btn-primary py-2 px-4 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export SVG
            </button>
          </div>
        </div>
      </Modal>
    

      {/* Properties Sidebar (Right) */}
      <aside className="w-80 flex-col overflow-y-auto z-20 custom-scrollbar border-l border-neutral-800 bg-black shrink-0 shadow-2xl">
        <div className="p-4 space-y-6 pb-24">
          <div className="flex items-center justify-between px-1 mb-2">
            <div className="flex items-center gap-2">
              <Layout className="w-4 h-4 text-white" />
              <h1 className="text-xs font-bold text-white tracking-widest uppercase">Grid & Properties</h1>
            </div>
            <button
              onClick={() => setGridState(prev => ({ ...prev, cells: {} }))}
              className="text-[10px] font-bold text-rose-400 hover:text-rose-300 uppercase tracking-widest transition-colors px-2 py-1 rounded hover:bg-rose-500/10"
              title="Clear entire grid content"
            >
              Clear Grid
            </button>
          </div>
          
          <div className="w-full h-px bg-neutral-800" />

          {/* Grid Parameters Base */}
          {/* Grid Parameters - Optimized */}
          <ToolSection title="Grid Parameters" icon={Grid}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 border-none">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Rows</label>
                <input
                  type="number"
                  min="1" max="100"
                  value={gridState.rows}
                  onChange={(e) => handleGridChange('rows', parseInt(e.target.value) || 1)}
                  className="w-full h-8 px-3 bg-black border border-neutral-800 text-[10px] font-bold text-neutral-200 outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                />
              </div>
              <div className="space-y-1.5 border-none">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Cols</label>
                <input
                  type="number"
                  min="1" max="100"
                  value={gridState.cols}
                  onChange={(e) => handleGridChange('cols', parseInt(e.target.value) || 1)}
                  className="w-full h-8 px-3 bg-black border border-neutral-800 text-[10px] font-bold text-neutral-200 outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                />
              </div>
              <div className="space-y-1.5 border-none">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Cell Size (px)</label>
                <input
                  type="number"
                  min="10" max="200"
                  value={gridState.cellSize}
                  onChange={(e) => handleGridChange('cellSize', parseInt(e.target.value) || 10)}
                  className="w-full h-8 px-3 bg-black border border-neutral-800 text-[10px] font-bold text-neutral-200 outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                />
              </div>
              <div className="space-y-1.5 border-none">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Line Width</label>
                <input
                  type="number"
                  min="0" max="20"
                  value={gridState.lineThickness}
                  onChange={(e) => handleGridChange('lineThickness', parseInt(e.target.value) || 0)}
                  className="w-full h-8 px-3 bg-black border border-neutral-800 text-[10px] font-bold text-neutral-200 outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Line Color</label>
                <div className="flex h-8 bg-black border border-neutral-800 rounded-sm focus-within:ring-1 focus-within:ring-white transition-all overflow-hidden">
                  <input
                    type="color"
                    value={gridState.lineColor}
                    onChange={(e) => handleGridChange('lineColor', e.target.value)}
                    className="w-10 h-full p-0 border-0 cursor-pointer seamless-color shrink-0 bg-transparent"
                  />
                  <div className="w-px h-full bg-neutral-800 shrink-0" />
                  <input
                    type="text"
                    value={gridState.lineColor}
                    onChange={(e) => handleGridChange('lineColor', e.target.value)}
                    className="flex-1 w-full bg-transparent border-0 px-2 text-[10px] font-bold text-neutral-200 outline-none uppercase uppercase tracking-widest"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Border Color</label>
                <div className="flex h-8 bg-black border border-neutral-800 rounded-sm focus-within:ring-1 focus-within:ring-white transition-all overflow-hidden">
                  <input
                    type="color"
                    value={gridState.borderColor}
                    onChange={(e) => handleGridChange('borderColor', e.target.value)}
                    className="w-10 h-full p-0 border-0 cursor-pointer seamless-color shrink-0 bg-transparent"
                  />
                  <div className="w-px h-full bg-neutral-800 shrink-0" />
                  <input
                    type="text"
                    value={gridState.borderColor}
                    onChange={(e) => handleGridChange('borderColor', e.target.value)}
                    className="flex-1 w-full bg-transparent border-0 px-2 text-[10px] font-bold text-neutral-200 outline-none uppercase uppercase tracking-widest"
                  />
                </div>
              </div>
            </div>
          </ToolSection>

          <div className="border-b border-neutral-800 pb-6">
            <div className="space-y-1.5 px-1">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Outer Border Width</label>
              <input
                type="number"
                min="0" max="50"
                value={gridState.borderThickness}
                onChange={(e) => handleGridChange('borderThickness', parseInt(e.target.value) || 0)}
                className="w-full h-8 px-3 bg-black border border-neutral-800 text-[10px] font-bold text-neutral-200 outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
              />
            </div>
          </div>

          {/* Global Inner Background Setting */}
          <div className="border-b border-neutral-800 pb-6 px-1">
            <h3 className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-4">Global Inner</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Color</label>
                <div className="flex h-8 bg-black border border-neutral-800 rounded-sm focus-within:ring-1 focus-within:ring-white transition-all overflow-hidden">
                  <input
                    type="color"
                    value={gridState.innerBgColor || '#ffffff'}
                    onChange={(e) => handleGridChange('innerBgColor', e.target.value)}
                    className="w-10 h-full p-0 border-0 cursor-pointer seamless-color shrink-0 bg-transparent"
                  />
                  <div className="w-px h-full bg-neutral-800 shrink-0" />
                  <input
                    type="text"
                    value={gridState.innerBgColor || '#ffffff'}
                    onChange={(e) => handleGridChange('innerBgColor', e.target.value)}
                    className="flex-1 w-full bg-transparent border-0 px-2 text-[10px] font-bold text-neutral-200 outline-none uppercase uppercase tracking-widest"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Opacity (0-100%)</label>
                <input
                  type="number"
                  min="0" max="100"
                  value={Math.round((gridState.innerBgOpacity ?? 1) * 100)}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                    handleGridChange('innerBgOpacity', val / 100);
                  }}
                  className="w-full h-8 px-3 bg-black border border-neutral-800 text-[10px] font-bold text-neutral-200 outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* External Margin Setting */}
          <div className="border-b border-neutral-800 pb-6 px-1">
            <h3 className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-4">External Margin</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Size (px)</label>
                <input
                  type="number"
                  min="0" max="500"
                  value={gridState.externalMargin || 0}
                  onChange={(e) => handleGridChange('externalMargin', parseInt(e.target.value) || 0)}
                  className="w-full h-8 px-3 bg-black border border-neutral-800 text-[10px] font-bold text-neutral-200 outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Color</label>
                  <div className="flex h-8 bg-black border border-neutral-800 rounded-sm focus-within:ring-1 focus-within:ring-white transition-all overflow-hidden">
                    <input
                      type="color"
                      value={gridState.externalMarginColor || '#ffffff'}
                      onChange={(e) => handleGridChange('externalMarginColor', e.target.value)}
                      className="w-10 h-full p-0 border-0 cursor-pointer seamless-color shrink-0 bg-transparent"
                    />
                    <div className="w-px h-full bg-neutral-800 shrink-0" />
                    <input
                      type="text"
                      value={gridState.externalMarginColor || '#ffffff'}
                      onChange={(e) => handleGridChange('externalMarginColor', e.target.value)}
                      className="flex-1 w-full bg-transparent border-0 px-2 text-[10px] font-bold text-neutral-200 outline-none uppercase uppercase tracking-widest"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Opacity (0-100%)</label>
                  <input
                    type="number"
                    min="0" max="100"
                    value={Math.round((gridState.externalMarginOpacity ?? 0) * 100)}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                      handleGridChange('externalMarginOpacity', val / 100);
                    }}
                    className="w-full h-8 px-3 bg-black border border-neutral-800 text-[10px] font-bold text-neutral-200 outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Workspace Background Setting */}
          <div className="px-1">
            <h3 className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-4">Workspace Background</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Color</label>
                  <div className="flex h-8 bg-black border border-neutral-800 rounded-sm focus-within:ring-1 focus-within:ring-white transition-all overflow-hidden">
                    <input
                      type="color"
                      value={gridState.workspaceBgColor || '#000000'}
                      onChange={(e) => handleGridChange('workspaceBgColor', e.target.value)}
                      className="w-10 h-full p-0 border-0 cursor-pointer seamless-color shrink-0 bg-transparent"
                    />
                    <div className="w-px h-full bg-neutral-800 shrink-0" />
                    <input
                      type="text"
                      value={gridState.workspaceBgColor || '#000000'}
                      onChange={(e) => handleGridChange('workspaceBgColor', e.target.value)}
                      className="flex-1 w-full bg-transparent border-0 px-2 text-[10px] font-bold text-neutral-200 outline-none uppercase uppercase tracking-widest"
                    />
                  </div>
                </div>
                <div className="space-y-1.5 flex flex-col justify-end">
                  <button
                    onClick={() => handleGridChange('workspaceBgImageUrl', '')}
                    className="btn-danger w-full py-1 text-[10px] h-8"
                  >
                    Clear Texture
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Texture (URL or SVG code)</label>
                <textarea
                  value={gridState.workspaceBgImageUrl || ''}
                  onChange={(e) => handleGridChange('workspaceBgImageUrl', e.target.value)}
                  placeholder="Paste image URL or <svg> code"
                  className="w-full px-3 py-2 bg-black border border-neutral-800 text-[10px] font-bold text-neutral-200 outline-none focus:border-white focus:ring-1 focus:ring-white transition-all h-16 resize-none font-mono tracking-wider"
                />
              </div>
            </div>
          </div>

          
          
        </div>
      </aside>
    </div>
  );
}
