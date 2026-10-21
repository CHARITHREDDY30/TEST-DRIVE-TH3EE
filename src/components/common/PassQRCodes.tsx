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
 * Generates an authentic, luxury digital Boarding Pass PNG matching the TH3EE theme
 * containing the scannable QR Code, member details, stamps, and explicit date.
 */
export async function downloadPassBadge(opts: DownloadPassBadgeOptions): Promise<void> {
  if (typeof window === 'undefined') return;

  const width = 720;
  const height = 1040;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background: Sleek Luxury Atelier Studio Backdrop
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#18181B');
  bgGrad.addColorStop(0.5, '#0F0F12');
  bgGrad.addColorStop(1, '#08080A');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Boarding Pass White Card
  const cardW = 580;
  const cardH = 830;
  const cardX = (width - cardW) / 2;
  const cardY = 50;
  const cardRadius = 32;

  // Soft Card Shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 32;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 16;

  // Draw Card Body
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, cardRadius);
  ctx.fill();

  // Reset shadow for card contents
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // 1. Card Header: TH3EE Logo & Pass ID
  ctx.fillStyle = '#111113';
  ctx.font = '900 24px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('TH', cardX + 36, cardY + 54);

  const thWidth = ctx.measureText('TH').width;
  ctx.fillStyle = '#E51E2B';
  ctx.fillText('3', cardX + 36 + thWidth, cardY + 54);

  const threeWidth = ctx.measureText('3').width;
  ctx.fillStyle = '#111113';
  ctx.fillText('EE', cardX + 36 + thWidth + threeWidth, cardY + 54);

  // Small Atelier Badge
  ctx.fillStyle = '#FEF2F2';
  ctx.beginPath();
  ctx.roundRect(cardX + 36 + thWidth + threeWidth + 34, cardY + 36, 74, 22, 6);
  ctx.fill();
  ctx.fillStyle = '#E51E2B';
  ctx.font = '700 11px monospace';
  ctx.fillText('ATELIER', cardX + 36 + thWidth + threeWidth + 44, cardY + 51);

  // Pass ID on Right
  const cleanCode = opts.memberCode.replace(/^TH3EE-/i, '').toUpperCase();
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '700 14px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`ID TH3EE-${cleanCode}`, cardX + cardW - 36, cardY + 52);

  // Header Divider
  ctx.strokeStyle = '#F3F4F6';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cardX + 36, cardY + 76);
  ctx.lineTo(cardX + cardW - 36, cardY + 76);
  ctx.stroke();

  // 2. Hero Route Block: PATRON -> CULT
  ctx.fillStyle = '#111113';
  ctx.font = '900 32px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('PATRON', cardX + 36, cardY + 128);

  ctx.fillStyle = '#9CA3AF';
  ctx.font = '600 12px sans-serif';
  ctx.fillText('ATELIER MEMBER', cardX + 36, cardY + 148);

  // Center Arrow Badge
  const badgeCenterX = cardX + cardW / 2;
  const badgeCenterY = cardY + 130;
  ctx.fillStyle = '#E51E2B';
  ctx.beginPath();
  ctx.arc(badgeCenterX, badgeCenterY, 20, 0, Math.PI * 2);
  ctx.fill();

  // Draw arrow inside badge
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(badgeCenterX - 8, badgeCenterY);
  ctx.lineTo(badgeCenterX + 8, badgeCenterY);
  ctx.lineTo(badgeCenterX + 3, badgeCenterY - 5);
  ctx.moveTo(badgeCenterX + 8, badgeCenterY);
  ctx.lineTo(badgeCenterX + 3, badgeCenterY + 5);
  ctx.stroke();

  // Right Side: CULT VIP
  ctx.fillStyle = '#E51E2B';
  ctx.font = '900 32px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('CULT', cardX + cardW - 36, cardY + 128);

  ctx.fillStyle = '#9CA3AF';
  ctx.font = '600 12px sans-serif';
  ctx.fillText('VIP TIER PASS', cardX + cardW - 36, cardY + 148);

  // Divider
  ctx.strokeStyle = '#F3F4F6';
  ctx.beginPath();
  ctx.moveTo(cardX + 36, cardY + 172);
  ctx.lineTo(cardX + cardW - 36, cardY + 172);
  ctx.stroke();

  // 3. Details Row 1 (3 Columns: Stamps | Reward | Status)
  const col1X = cardX + 36;
  const col2X = cardX + 220;
  const col3X = cardX + cardW - 36;

  ctx.textAlign = 'left';
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '600 12px sans-serif';
  ctx.fillText('STAMPS', col1X, cardY + 200);
  ctx.fillStyle = '#111113';
  ctx.font = '900 18px monospace';
  ctx.fillText(`${opts.stampsCount.toString().padStart(2, '0')} / ${(opts.totalStamps || 7).toString().padStart(2, '0')}`, col1X, cardY + 226);

  ctx.fillStyle = '#9CA3AF';
  ctx.font = '600 12px sans-serif';
  ctx.fillText('REWARD', col2X, cardY + 200);
  ctx.fillStyle = '#E51E2B';
  ctx.font = '900 18px monospace';
  const remainingCount = Math.max(0, (opts.totalStamps || 7) - opts.stampsCount);
  ctx.fillText(opts.stampsCount >= (opts.totalStamps || 7) ? 'READY' : `${remainingCount} LEFT`, col2X, cardY + 226);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '600 12px sans-serif';
  ctx.fillText('STATUS', col3X, cardY + 200);
  ctx.fillStyle = '#059669';
  ctx.font = '900 18px monospace';
  ctx.fillText('VERIFIED', col3X, cardY + 226);

  // Divider
  ctx.strokeStyle = '#F3F4F6';
  ctx.beginPath();
  ctx.moveTo(cardX + 36, cardY + 246);
  ctx.lineTo(cardX + cardW - 36, cardY + 246);
  ctx.stroke();

  // 4. Details Row 2 (Passenger & Date)
  ctx.textAlign = 'left';
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '600 12px sans-serif';
  ctx.fillText('CARDHOLDER / PASSENGER', col1X, cardY + 274);
  ctx.fillStyle = '#111113';
  ctx.font = '900 18px sans-serif';
  const displayName = (opts.memberName || 'TH3EE PATRON').toUpperCase();
  ctx.fillText(displayName, col1X, cardY + 300);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '600 12px sans-serif';
  ctx.fillText('DATE', col3X, cardY + 274);
  ctx.fillStyle = '#111113';
  ctx.font = '900 18px monospace';
  ctx.fillText(opts.dateStr, col3X, cardY + 300);

  // 5. Perforation Ticket Notch Line
  const notchY = cardY + 340;
  const notchRadius = 18;

  // Left notch cutout (drawn with background color)
  ctx.fillStyle = '#121215';
  ctx.beginPath();
  ctx.arc(cardX, notchY, notchRadius, -Math.PI / 2, Math.PI / 2);
  ctx.fill();

  // Right notch cutout
  ctx.beginPath();
  ctx.arc(cardX + cardW, notchY, notchRadius, Math.PI / 2, -Math.PI / 2);
  ctx.fill();

  // Dashed ticket separator line
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(cardX + notchRadius + 6, notchY);
  ctx.lineTo(cardX + cardW - notchRadius - 6, notchY);
  ctx.stroke();
  ctx.setLineDash([]); // Reset dash

  // 6. Centered Authentic QR Code
  const qrBoxY = cardY + 375;
  const qrTargetSize = 250;
  const qrBoxX = (width - qrTargetSize) / 2;

  try {
    const qr = QRCode.create(opts.verificationUrl, { errorCorrectionLevel: 'M' });
    const moduleCount = qr.modules.size;
    const margin = 2;
    const totalModules = moduleCount + margin * 2;
    const cellSize = Math.floor(qrTargetSize / totalModules);
    const actualQrSize = cellSize * totalModules;
    const qrStartX = (width - actualQrSize) / 2;
    const qrStartY = qrBoxY;

    // Draw white QR backing
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(qrStartX - 8, qrStartY - 8, actualQrSize + 16, actualQrSize + 16);

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

  // QR subtext
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '600 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SCAN WITH ANY PHONE CAMERA', width / 2, qrBoxY + qrTargetSize + 22);

  // 7. Bottom Ticket Details Strip (Signature Crimson Red Bar)
  const stripW = cardW - 56;
  const stripH = 68;
  const stripX = cardX + 28;
  const stripY = cardY + cardH - 104;

  ctx.fillStyle = '#E51E2B';
  ctx.beginPath();
  ctx.roundRect(stripX, stripY, stripW, stripH, 18);
  ctx.fill();

  // 3 strip columns
  const sCol1 = stripX + stripW * 0.17;
  const sCol2 = stripX + stripW * 0.5;
  const sCol3 = stripX + stripW * 0.83;

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = '600 11px sans-serif';
  ctx.fillText('TIER', sCol1, stripY + 24);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 14px sans-serif';
  ctx.fillText('CULT VIP', sCol1, stripY + 48);

  // Column divider 1
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(stripX + stripW * 0.33, stripY + 14);
  ctx.lineTo(stripX + stripW * 0.33, stripY + stripH - 14);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = '600 11px sans-serif';
  ctx.fillText('PERK', sCol2, stripY + 24);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 14px sans-serif';
  ctx.fillText('FREE TEE', sCol2, stripY + 48);

  // Column divider 2
  ctx.beginPath();
  ctx.moveTo(stripX + stripW * 0.66, stripY + 14);
  ctx.lineTo(stripX + stripW * 0.66, stripY + stripH - 14);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = '600 11px sans-serif';
  ctx.fillText('CYCLE', sCol3, stripY + 24);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 14px sans-serif';
  ctx.fillText(opts.stampsCount >= (opts.totalStamps || 7) ? 'UNLOCKED' : `${remainingCount} LEFT`, sCol3, stripY + 48);

  // 8. Bottom Full-width Pill Button: "Save and Download"
  const btnW = cardW;
  const btnH = 58;
  const btnX = cardX;
  const btnY = cardY + cardH + 24;

  ctx.fillStyle = '#171717';
  ctx.beginPath();
  ctx.roundRect(btnX, btnY, btnW, btnH, 29);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SAVE AND DOWNLOAD PASS', width / 2, btnY + 36);

  // Footer copyright
  ctx.fillStyle = '#71717A';
  ctx.font = '600 12px monospace';
  ctx.fillText('TH3EE™ CLOTHING CO. // ATELIER CULT PASS', width / 2, height - 32);

  // Convert to image download
  const cleanDate = (opts.dateStr || 'DATE').replace(/[^a-zA-Z0-9-]/g, '-');
  const filename = `TH3EE-BOARDING-PASS-${cleanCode}-${cleanDate}.png`;

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


