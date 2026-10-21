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

import QRCode from 'qrcode';

/**
 * Genuine ISO/IEC 18004 SVG QR Code Component for Digital Wallet Passes
 * Scannable by any phone camera (iOS Camera, Android Google Lens / QR Scanner).
 */
export const PassQRCode: React.FC<{
  value: string;
  size?: number;
  className?: string;
  margin?: number;
}> = ({ value, size = 120, className = '', margin = 2 }) => {
  const qrData = React.useMemo(() => {
    try {
      const qr = QRCode.create(value || 'TH3EE-PASS', {
        errorCorrectionLevel: 'M',
      });
      const moduleCount = qr.modules.size;
      const totalSize = moduleCount + margin * 2;
      const cells: { r: number; c: number }[] = [];
      for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
          if (qr.modules.get(r, c)) {
            cells.push({ r: r + margin, c: c + margin });
          }
        }
      }
      return { totalSize, cells };
    } catch (err) {
      console.error('Failed to generate real QR code matrix:', err);
      return null;
    }
  }, [value, margin]);

  if (!qrData) {
    return (
      <div
        style={{ width: size, height: size }}
        className="bg-neutral-100 flex items-center justify-center text-[10px] text-neutral-400 font-mono rounded"
      >
        QR CODE ERROR
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${qrData.totalSize} ${qrData.totalSize}`}
      width={size}
      height={size}
      className={className}
      shapeRendering="crispEdges"
      aria-label="Official Scannable Member Pass QR Code"
    >
      <rect width={qrData.totalSize} height={qrData.totalSize} fill="#FFFFFF" />
      {qrData.cells.map((cell) => (
        <rect
          key={`${cell.r}-${cell.c}`}
          x={cell.c}
          y={cell.r}
          width={1}
          height={1}
          fill="#000000"
        />
      ))}
    </svg>
  );
};

export interface DownloadPassBadgeOptions {
  memberName: string;
  memberEmail: string;
  memberCode: string;
  stampsCount: number;
  totalStamps?: number;
  dateStr: string;
  verificationUrl: string;
}

/**
 * Client-side High-Resolution Pass Card Exporter
 * Generates an authentic, high-res digital pass PNG containing the scannable QR Code,
 * member details, stamps balance, and explicit date of verification.
 */
export async function downloadPassBadge(opts: DownloadPassBadgeOptions): Promise<void> {
  if (typeof window === 'undefined') return;

  const width = 720;
  const height = 980;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background gradient: Luxury Obsidian Black
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#161619');
  bgGrad.addColorStop(0.5, '#0E0E11');
  bgGrad.addColorStop(1, '#060608');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Outer Border
  ctx.strokeStyle = '#27272A';
  ctx.lineWidth = 4;
  ctx.strokeRect(16, 16, width - 32, height - 32);

  // Top Red Accent Line
  ctx.fillStyle = '#E51E2B';
  ctx.fillRect(16, 16, width - 32, 6);

  // Header: TH3EE REWARD CLUB • CULT PASS
  ctx.fillStyle = '#E51E2B';
  ctx.beginPath();
  ctx.arc(54, 62, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#F4F4F5';
  ctx.font = '900 17px monospace, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('TH3EE REWARD CLUB • CULT PASS', 72, 68);

  ctx.fillStyle = '#A1A1AA';
  ctx.font = '700 14px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`PASS #${opts.memberCode}`, width - 54, 68);

  // Divider
  ctx.strokeStyle = '#27272A';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, 95);
  ctx.lineTo(width - 50, 95);
  ctx.stroke();

  // Member Information
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 32px sans-serif';
  ctx.textAlign = 'left';
  const displayName = (opts.memberName || 'TH3EE PATRON').toUpperCase();
  ctx.fillText(displayName, 50, 142);

  ctx.fillStyle = '#A1A1AA';
  ctx.font = '500 16px monospace';
  ctx.fillText(opts.memberEmail || '', 50, 172);

  // Stamps Pill Badge
  ctx.fillStyle = '#260B0E';
  ctx.strokeStyle = '#E51E2B';
  ctx.lineWidth = 1.5;
  const pillText = `● ${opts.stampsCount.toString().padStart(2, '0')} / ${(opts.totalStamps || 7).toString().padStart(2, '0')} STAMPS COLLECTED`;
  ctx.font = '900 14px monospace';
  const pillWidth = ctx.measureText(pillText).width + 32;
  
  // Draw rounded pill
  const pillX = 50;
  const pillY = 194;
  const pillH = 34;
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillWidth, pillH, 17);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FF384D';
  ctx.fillText(pillText, pillX + 16, pillY + 22);

  // White Container for QR Code (High contrast for instant camera scan)
  const qrBoxSize = 390;
  const qrBoxX = (width - qrBoxSize) / 2;
  const qrBoxY = 250;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize + 70, 24);
  ctx.fill();

  // Generate real QR code onto canvas
  try {
    const qr = QRCode.create(opts.verificationUrl, { errorCorrectionLevel: 'M' });
    const moduleCount = qr.modules.size;
    const margin = 2;
    const totalModules = moduleCount + margin * 2;
    const qrTargetSize = 340;
    const cellSize = Math.floor(qrTargetSize / totalModules);
    const actualQrSize = cellSize * totalModules;
    const qrStartX = qrBoxX + Math.floor((qrBoxSize - actualQrSize) / 2);
    const qrStartY = qrBoxY + 22;

    ctx.fillStyle = '#000000';
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (qr.modules.get(r, c)) {
          ctx.fillRect(
            qrStartX + (c + margin) * cellSize,
            qrStartY + (r + margin) * cellSize,
            cellSize,
            cellSize
          );
        }
      }
    }
  } catch (err) {
    console.error('Error drawing QR code on canvas:', err);
  }

  // QR Label inside white container
  ctx.fillStyle = '#111113';
  ctx.font = '900 17px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TH3EE MEMBER PASS', width / 2, qrBoxY + qrBoxSize + 32);

  ctx.fillStyle = '#71717A';
  ctx.font = '700 12px monospace';
  ctx.fillText('ATELIER VERIFIED • SCAN WITH PHONE CAMERA', width / 2, qrBoxY + qrBoxSize + 52);

  // PROMINENT DATE SECTION (MANDATORY REQUIREMENT)
  const dateBoxW = 540;
  const dateBoxH = 64;
  const dateBoxX = (width - dateBoxW) / 2;
  const dateBoxY = 745;

  ctx.fillStyle = '#18181B';
  ctx.strokeStyle = '#3F3F46';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(dateBoxX, dateBoxY, dateBoxW, dateBoxH, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#10B981';
  ctx.beginPath();
  ctx.arc(dateBoxX + 30, dateBoxY + dateBoxH / 2, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 18px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`ISSUED / VERIFIED: ${opts.dateStr}`, dateBoxX + 48, dateBoxY + 38);

  // Footer Instructions
  ctx.fillStyle = '#A1A1AA';
  ctx.font = '500 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Scan with any smartphone camera to view live balance & redemption status.', width / 2, 855);

  ctx.fillStyle = '#71717A';
  ctx.font = '600 12px monospace';
  ctx.fillText('Each stamp valid 12 months • Non-transferable • th3ee.in', width / 2, 885);

  ctx.fillStyle = '#3F3F46';
  ctx.font = '500 11px monospace';
  ctx.fillText('TH3EE™ CLOTHING CO. // ALL RIGHTS RESERVED', width / 2, 925);

  // Convert to image download
  const cleanDate = (opts.dateStr || 'DATE').replace(/[^a-zA-Z0-9-]/g, '-');
  const filename = `TH3EE-PASS-${opts.memberCode}-${cleanDate}.png`;

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
}

