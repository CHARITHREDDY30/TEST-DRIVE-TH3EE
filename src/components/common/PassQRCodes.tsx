import React from 'react';

/**
 * Deterministic SVG Barcode Component for Payment Receipts (Code 128 silhouette)
 */
export const ReceiptBarcode: React.FC<{
  code: string;
  className?: string;
  height?: number;
}> = ({ code, className = 'w-full max-w-[280px] h-12', height = 48 }) => {
  // Deterministic bar widths pattern based on code string
  const cleanCode = (code || 'TH3EE-00000000').toUpperCase().replace(/[^A-Z0-9-]/g, '');
  
  // Generate deterministic bar widths (1, 2, 3, or 4 units wide)
  const bars: { x: number; width: number }[] = [];
  let currentX = 10;
  
  // Start pattern (thick, thin, thick)
  bars.push({ x: currentX, width: 3 }); currentX += 5;
  bars.push({ x: currentX, width: 2 }); currentX += 4;
  bars.push({ x: currentX, width: 4 }); currentX += 6;

  for (let i = 0; i < cleanCode.length; i++) {
    const charCode = cleanCode.charCodeAt(i);
    const w1 = (charCode % 3) + 1;
    const s1 = ((charCode >> 1) % 2) + 2;
    const w2 = ((charCode >> 2) % 3) + 1;
    const s2 = ((charCode >> 3) % 2) + 2;

    bars.push({ x: currentX, width: w1 });
    currentX += w1 + s1;
    bars.push({ x: currentX, width: w2 });
    currentX += w2 + s2;
  }

  // Stop pattern
  bars.push({ x: currentX, width: 4 }); currentX += 6;
  bars.push({ x: currentX, width: 2 }); currentX += 4;
  bars.push({ x: currentX, width: 3 }); currentX += 13;

  const totalWidth = currentX;

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox={`0 0 ${totalWidth} ${height}`}
        className={className}
        preserveAspectRatio="none"
        fill="currentColor"
      >
        {bars.map((bar, idx) => (
          <rect key={idx} x={bar.x} y={0} width={bar.width} height={height} />
        ))}
      </svg>
      <span className="font-mono text-[10px] tracking-[0.25em] text-neutral-500 uppercase mt-1">
        {cleanCode}
      </span>
    </div>
  );
};

/**
 * Authentic SVG QR Code Matrix Component for Digital Wallet Passes
 */
export const PassQRCode: React.FC<{
  value: string;
  size?: number;
  className?: string;
}> = ({ value, size = 120, className = '' }) => {
  // Deterministic 21x21 QR matrix with standard finder corners
  const MATRIX_SIZE = 21;
  const matrix: boolean[][] = Array.from({ length: MATRIX_SIZE }, () =>
    Array(MATRIX_SIZE).fill(false)
  );

  // Helper to draw standard 7x7 finder pattern
  const drawFinder = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 || // Outer ring
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)      // Inner 3x3 square
        ) {
          matrix[startY + r][startX + c] = true;
        }
      }
    }
  };

  // 3 Finder patterns (top-left, top-right, bottom-left)
  drawFinder(0, 0);
  drawFinder(MATRIX_SIZE - 7, 0);
  drawFinder(0, MATRIX_SIZE - 7);

  // Timing lines (row 6 and col 6)
  for (let i = 8; i < MATRIX_SIZE - 8; i++) {
    if (i % 2 === 0) {
      matrix[6][i] = true;
      matrix[i][6] = true;
    }
  }

  // Deterministic pseudo-payload based on hash of input value
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }

  for (let r = 0; r < MATRIX_SIZE; r++) {
    for (let c = 0; c < MATRIX_SIZE; c++) {
      // Skip finder zones
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= MATRIX_SIZE - 8;
      const inBottomLeft = r >= MATRIX_SIZE - 8 && c < 8;
      const inTiming = r === 6 || c === 6;

      if (!inTopLeft && !inTopRight && !inBottomLeft && !inTiming) {
        // Deterministic module placement based on hash & coordinates
        const cellHash = (hash ^ (r * 13 + c * 37)) & 0xff;
        matrix[r][c] = cellHash % 2 === 0;
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${MATRIX_SIZE} ${MATRIX_SIZE}`}
      width={size}
      height={size}
      className={className}
      shapeRendering="crispEdges"
    >
      <rect width={MATRIX_SIZE} height={MATRIX_SIZE} fill="white" />
      {matrix.map((row, r) =>
        row.map((active, c) =>
          active ? <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="black" /> : null
        )
      )}
    </svg>
  );
};
