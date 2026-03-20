import { GridState } from './types';

export const generateSimplifiedSvg = (state: GridState, noGridLines: boolean) => {
  const { 
    rows, cols, cellSize, lineThickness, borderThickness, externalMargin = 0, 
    externalMarginColor = '#ffffff', externalMarginOpacity = 0, 
    innerBgColor = '#ffffff', innerBgOpacity = 1, lineColor, borderColor, cells 
  } = state;
  const effectiveLineThickness = noGridLines ? 0 : lineThickness;

  const innerWidth = cols * cellSize + (cols - 1) * effectiveLineThickness;
  const innerHeight = rows * cellSize + (rows - 1) * effectiveLineThickness;
  const totalWidth = innerWidth + borderThickness * 2 + externalMargin * 2;
  const totalHeight = innerHeight + borderThickness * 2 + externalMargin * 2;

  let elements = '';

  // 1. External Margin
  if (externalMargin > 0 && externalMarginOpacity > 0) {
    const halfM = externalMargin / 2;
    elements += `  <rect x="${halfM}" y="${halfM}" width="${totalWidth - externalMargin}" height="${totalHeight - externalMargin}" fill="none" stroke="${externalMarginColor}" stroke-width="${externalMargin}" stroke-opacity="${externalMarginOpacity}" />\n`;
  }

  const gridStartX = externalMargin + borderThickness;
  const gridStartY = externalMargin + borderThickness;

  // 2. Outer Border
  if (borderThickness > 0) {
    const halfB = borderThickness / 2;
    elements += `  <rect x="${externalMargin + halfB}" y="${externalMargin + halfB}" width="${totalWidth - externalMargin*2 - borderThickness}" height="${totalHeight - externalMargin*2 - borderThickness}" fill="none" stroke="${borderColor}" stroke-width="${borderThickness}" />\n`;
  }

  // 3. Inner Background
  if (innerBgOpacity > 0) {
    elements += `  <rect x="${gridStartX}" y="${gridStartY}" width="${innerWidth}" height="${innerHeight}" fill="${innerBgColor}" fill-opacity="${innerBgOpacity}" />\n`;
  }

  // 4. Cells Background Colors
  const cellRenderSize = effectiveLineThickness === 0 ? cellSize + 0.5 : cellSize;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = cells[`${r},${c}`];
      if (cell && cell.bgType === 'color' && cell.bgValue) {
        const cx = gridStartX + c * cellSize + c * effectiveLineThickness;
        const cy = gridStartY + r * cellSize + r * effectiveLineThickness;
        elements += `  <rect x="${cx}" y="${cy}" width="${cellRenderSize}" height="${cellRenderSize}" fill="${cell.bgValue}" />\n`;
      }
    }
  }

  // 5. Grid Lines
  if (effectiveLineThickness > 0) {
    for (let r = 1; r < rows; r++) {
       const ly = gridStartY + r * cellSize + (r - 1) * effectiveLineThickness;
       elements += `  <rect x="${gridStartX}" y="${ly}" width="${innerWidth}" height="${effectiveLineThickness}" fill="${lineColor}" />\n`;
    }
    for (let c = 1; c < cols; c++) {
       const lx = gridStartX + c * cellSize + (c - 1) * effectiveLineThickness;
       elements += `  <rect x="${lx}" y="${gridStartY}" width="${effectiveLineThickness}" height="${innerHeight}" fill="${lineColor}" />\n`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}">\n${elements}</svg>`;
};
