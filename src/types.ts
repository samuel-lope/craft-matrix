export type BorderAlignment = 'inner' | 'center' | 'outer';

export type CellBorder = {
  width: number;
  color: string;
  alignment: BorderAlignment;
};

export type CellData = {
  bgType?: 'color' | 'svg';
  bgValue?: string;
  itemValue?: string;
  borderTop?: CellBorder;
  borderRight?: CellBorder;
  borderBottom?: CellBorder;
  borderLeft?: CellBorder;
};

export type GridState = {
  rows: number;
  cols: number;
  cellSize: number;
  lineThickness: number;
  lineColor: string;
  borderThickness: number;
  borderColor: string;
  externalMargin?: number;
  externalMarginColor?: string;
  externalMarginOpacity?: number;
  cells: Record<string, CellData>;
};

export type Tool = 'pointer' | 'bg-color' | 'bg-svg' | 'bg-eraser' | 'item-svg' | 'item-eraser' | 'cell-border' | 'cell-border-eraser' | 'eraser-all';

export type SavedAsset = {
  id: string;
  name: string;
  value: string;
};

export type SavedGrid = {
  id: string;
  name: string;
  updatedAt: number;
  gridState: GridState;
};
