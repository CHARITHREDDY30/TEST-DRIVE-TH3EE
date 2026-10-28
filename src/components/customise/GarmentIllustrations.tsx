import React from 'react';
import type { GarmentFitType, SleeveType, NeckType, GarmentCategoryType } from '../../types/customise';

interface GarmentSvgProps {
  view: 'front' | 'back';
  fit: GarmentFitType;
  sleeve: SleeveType;
  neckType: NeckType;
  colorHex: string;
  selectedPlacements?: string[];
  activePlacement?: string | null;
  onSelectPlacement?: (placementId: string) => void;
  className?: string;
  showHotspots?: boolean;
  artworkPreviewUrl?: string | null;
  frontArtworkUrl?: string | null;
  backArtworkUrl?: string | null;
  category?: GarmentCategoryType;
}

export const GarmentSvg: React.FC<GarmentSvgProps> = ({
  view,
  fit,
  sleeve,
  neckType,
  colorHex,
  selectedPlacements = [],
  activePlacement = null,
  onSelectPlacement,
  className = 'w-full h-auto',
  showHotspots = true,
  artworkPreviewUrl = null,
  frontArtworkUrl = null,
  backArtworkUrl = null,
  category = 'T-Shirt'
}) => {
  // Determine silhouette geometry parameters based on fit
  // Oversized: dropped shoulders, wide torso, longer half-sleeve
  // Regular Fit: standard shoulder slope, tapered body
  // Boxy Fit: wide chest, cropped length
  const isHoodie = category === 'Hoodie';
  const isOversized = fit === 'Oversized' || isHoodie;
  const isBoxy = fit === 'Boxy Fit';
  const isFullSleeve = sleeve === 'Full Sleeve' || isHoodie;
  const isPolo = neckType === 'Polo Neck' && !isHoodie;

  // Adjust SVG paths based on fit
  let bodyLeftX = 140;
  let bodyRightX = 360;
  let bodyBottomY = 480;
  let shoulderLeftX = 85;
  let shoulderRightX = 415;
  let armpitY = 240;

  if (isOversized) {
    bodyLeftX = 130;
    bodyRightX = 370;
    shoulderLeftX = 70;
    shoulderRightX = 430;
    armpitY = 260;
    bodyBottomY = 490;
  } else if (isBoxy) {
    bodyLeftX = 125;
    bodyRightX = 375;
    shoulderLeftX = 75;
    shoulderRightX = 425;
    armpitY = 250;
    bodyBottomY = 445; // Cropped length
  }

  // Determine sleeve end coordinates
  const halfSleeveEndY = isOversized ? 330 : 300;
  const sleeveEndY = isFullSleeve ? 460 : halfSleeveEndY;
  const sleeveLeftEndX = isFullSleeve ? 60 : 70;
  const sleeveRightEndX = isFullSleeve ? 440 : 430;

  // Neck parameters
  const neckCenterY = view === 'front' ? 140 : 110;
  const neckCurveDepth = view === 'front' ? (isPolo ? 150 : 145) : 105;

  // Active or selected check
  const isSelected = (id: string) => selectedPlacements.includes(id);
  const isActive = (id: string) => activePlacement === id;

  const getHotspotClasses = (id: string) => {
    const active = isActive(id);
    const selected = isSelected(id);
    if (active) {
      return 'stroke-[#E51E2B] fill-[#E51E2B]/30 stroke-[2.5] stroke-dasharray-none filter drop-shadow(0 0 6px rgba(229,30,43,0.5))';
    }
    if (selected) {
      return 'stroke-[#E51E2B] fill-[#E51E2B]/15 stroke-[2] stroke-dasharray-4-2';
    }
    return 'stroke-neutral-400/80 fill-transparent stroke-[1.2] stroke-dashed hover:stroke-[#E51E2B] hover:fill-[#E51E2B]/10';
  };

  // Garment base fill color and tone calculations
  const isDarkGarment = ['#111111', '#58111A', '#3E2723', '#152238'].includes(colorHex.toUpperCase());
  const outlineColor = isDarkGarment ? '#333333' : '#B0B0B0';
  const seamColor = isDarkGarment ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
  const innerCollarColor = isDarkGarment ? '#080808' : '#D0D0D0';

  // Resolved Front and Back Artworks with fallbacks
  const hasBackPlacement = selectedPlacements.some(p => p.includes('back'));
  const activeFrontArt = frontArtworkUrl || (view === 'front' && !hasBackPlacement ? artworkPreviewUrl : null);
  const activeBackArt = backArtworkUrl || (view === 'back' && hasBackPlacement ? artworkPreviewUrl : null);
  const currentViewArt = view === 'front' ? activeFrontArt : activeBackArt;

  return (
    <svg
      viewBox="0 0 500 520"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      role="img"
      aria-label={`${fit} ${sleeve} ${neckType} Technical Illustration (${view === 'front' ? 'Front' : 'Back'} View)`}
    >
      <defs>
        {/* Soft fabric shadow gradient */}
        <linearGradient id={`fabricShadow-${view}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.12" />
          <stop offset="15%" stopColor="#000000" stopOpacity="0.02" />
          <stop offset="85%" stopColor="#000000" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.12" />
        </linearGradient>

        {/* Drop shoulder indicator gradient */}
        <linearGradient id="shoulderGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.15" />
        </linearGradient>
      </defs>

      {/* Main Garment Silhouette Path */}
      <g id="garment-body">
        {/* Main Body & Sleeve Unified Contour */}
        <path
          d={`
            M 195 95
            C 215 ${neckCurveDepth} 285 ${neckCurveDepth} 305 95
            L ${shoulderRightX} ${isOversized ? 150 : 135}
            L ${sleeveRightEndX + (isFullSleeve ? 20 : 15)} ${sleeveEndY - 15}
            L ${sleeveRightEndX - (isFullSleeve ? 15 : 20)} ${sleeveEndY}
            L ${bodyRightX + 10} ${armpitY}
            L ${bodyRightX} ${bodyBottomY}
            L ${bodyLeftX} ${bodyBottomY}
            L ${bodyLeftX - 10} ${armpitY}
            L ${sleeveLeftEndX + (isFullSleeve ? 15 : 20)} ${sleeveEndY}
            L ${sleeveLeftEndX - (isFullSleeve ? 20 : 15)} ${sleeveEndY - 15}
            L ${shoulderLeftX} ${isOversized ? 150 : 135}
            Z
          `}
          fill={colorHex}
          stroke={outlineColor}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Subtle fabric drape shadow overlay */}
        <path
          d={`
            M 195 95
            C 215 ${neckCurveDepth} 285 ${neckCurveDepth} 305 95
            L ${shoulderRightX} ${isOversized ? 150 : 135}
            L ${sleeveRightEndX + (isFullSleeve ? 20 : 15)} ${sleeveEndY - 15}
            L ${sleeveRightEndX - (isFullSleeve ? 15 : 20)} ${sleeveEndY}
            L ${bodyRightX + 10} ${armpitY}
            L ${bodyRightX} ${bodyBottomY}
            L ${bodyLeftX} ${bodyBottomY}
            L ${bodyLeftX - 10} ${armpitY}
            L ${sleeveLeftEndX + (isFullSleeve ? 15 : 20)} ${sleeveEndY}
            L ${sleeveLeftEndX - (isFullSleeve ? 20 : 15)} ${sleeveEndY - 15}
            L ${shoulderLeftX} ${isOversized ? 150 : 135}
            Z
          `}
          fill={`url(#fabricShadow-${view})`}
        />

        {/* Left Sleeve Inset Seam */}
        <path
          d={`M ${isOversized ? 135 : 150} 115 Q ${isOversized ? 120 : 130} 180 ${bodyLeftX - 10} ${armpitY}`}
          stroke={seamColor}
          strokeWidth="1.5"
          fill="none"
          strokeDasharray={isOversized ? '3 2' : 'none'}
        />

        {/* Right Sleeve Inset Seam */}
        <path
          d={`M ${isOversized ? 365 : 350} 115 Q ${isOversized ? 380 : 370} 180 ${bodyRightX + 10} ${armpitY}`}
          stroke={seamColor}
          strokeWidth="1.5"
          fill="none"
          strokeDasharray={isOversized ? '3 2' : 'none'}
        />

        {/* Dropped Shoulder Seam Highlight (Exclusive for Oversized & Boxy fits) */}
        {(isOversized || isBoxy) && (
          <g id="dropped-shoulder-marks" opacity="0.6">
            <line x1={shoulderLeftX + 5} y1={isOversized ? 148 : 138} x2={shoulderLeftX + 35} y2={isOversized ? 168 : 158} stroke={seamColor} strokeWidth="1.5" strokeDasharray="3 2" />
            <line x1={shoulderRightX - 5} y1={isOversized ? 148 : 138} x2={shoulderRightX - 35} y2={isOversized ? 168 : 158} stroke={seamColor} strokeWidth="1.5" strokeDasharray="3 2" />
          </g>
        )}

        {/* Bottom Hem Seam Line */}
        <line
          x1={bodyLeftX + 2}
          y1={bodyBottomY - 18}
          x2={bodyRightX - 2}
          y2={bodyBottomY - 18}
          stroke={seamColor}
          strokeWidth="1.5"
          strokeDasharray="4 2"
        />

        {/* Sleeve Cuffs Seam Lines */}
        <line
          x1={sleeveLeftEndX - 10}
          y1={sleeveEndY - 15}
          x2={sleeveLeftEndX + 15}
          y2={sleeveEndY - 4}
          stroke={seamColor}
          strokeWidth="1.5"
          strokeDasharray="4 2"
        />
        <line
          x1={sleeveRightEndX + 10}
          y1={sleeveEndY - 15}
          x2={sleeveRightEndX - 15}
          y2={sleeveEndY - 4}
          stroke={seamColor}
          strokeWidth="1.5"
          strokeDasharray="4 2"
        />

        {/* Neckline Details */}
        {view === 'front' ? (
          <>
            {/* Inner neck collar crescent */}
            <path
              d="M 195 95 C 220 120 280 120 305 95 C 285 85 215 85 195 95 Z"
              fill={innerCollarColor}
              opacity="0.8"
            />

            {/* Front Collar Ribbing */}
            <path
              d={`M 195 95 C 215 ${neckCurveDepth} 285 ${neckCurveDepth} 305 95`}
              stroke={outlineColor}
              strokeWidth="2.5"
              fill="none"
            />
            <path
              d={`M 198 102 C 218 ${neckCurveDepth + 7} 282 ${neckCurveDepth + 7} 302 102`}
              stroke={seamColor}
              strokeWidth="1.5"
              strokeDasharray="2 2"
              fill="none"
            />

            {/* Polo Neck Collar & Placket (When Polo Neck is selected) */}
            {isPolo && (
              <g id="polo-collar-placket">
                {/* Left Collar Flap */}
                <path
                  d="M 195 95 L 240 145 L 210 165 L 180 100 Z"
                  fill={colorHex}
                  stroke={outlineColor}
                  strokeWidth="2"
                />
                {/* Right Collar Flap */}
                <path
                  d="M 305 95 L 260 145 L 290 165 L 320 100 Z"
                  fill={colorHex}
                  stroke={outlineColor}
                  strokeWidth="2"
                />
                {/* Central Button Placket */}
                <rect
                  x="242"
                  y="125"
                  width="16"
                  height="90"
                  fill={colorHex}
                  stroke={outlineColor}
                  strokeWidth="1.8"
                />
                {/* Placket Buttons */}
                <circle cx="250" cy="145" r="2.5" fill="#FFFFFF" stroke="#333333" strokeWidth="1" />
                <circle cx="250" cy="170" r="2.5" fill="#FFFFFF" stroke="#333333" strokeWidth="1" />
                <circle cx="250" cy="195" r="2.5" fill="#FFFFFF" stroke="#333333" strokeWidth="1" />
              </g>
            )}

            {/* Hoodie Hood Draping, Drawstrings & Kangaroo Pouch */}
            {isHoodie && (
              <g id="hoodie-features">
                {/* Double Layer Hood Collar Drape */}
                <path
                  d="M 180 92 C 195 48 305 48 320 92 C 300 135 200 135 180 92 Z"
                  fill={colorHex}
                  stroke={outlineColor}
                  strokeWidth="2.2"
                />
                <path
                  d="M 210 88 C 228 65 272 65 290 88 C 280 115 220 115 210 88 Z"
                  fill={innerCollarColor}
                  opacity="0.8"
                />
                {/* White Aglet Drawstrings */}
                <path d="M 232 120 L 230 178" stroke="#F5F5F5" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="230" cy="180" r="2.5" fill="#C0C0C0" stroke="#333" strokeWidth="0.5" />
                <path d="M 268 120 L 270 178" stroke="#F5F5F5" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="270" cy="180" r="2.5" fill="#C0C0C0" stroke="#333" strokeWidth="0.5" />

                {/* Kangaroo Pocket */}
                <path
                  d="M 175 410 L 205 365 L 295 365 L 325 410 L 315 450 L 185 450 Z"
                  fill={colorHex}
                  stroke={outlineColor}
                  strokeWidth="2"
                />
                <path
                  d="M 205 365 L 295 365"
                  stroke={seamColor}
                  strokeWidth="1.5"
                  strokeDasharray="3 2"
                />
              </g>
            )}
          </>
        ) : (
          /* Back View Collar */
          <>
            <path
              d="M 195 95 C 215 110 285 110 305 95"
              stroke={outlineColor}
              strokeWidth="2.5"
              fill="none"
            />
            <path
              d="M 197 100 C 217 115 283 115 303 100"
              stroke={seamColor}
              strokeWidth="1.5"
              strokeDasharray="2 2"
              fill="none"
            />
            {/* Atelier Nape Loop / Hanger Tag */}
            <rect x="244" y="99" width="12" height="6" fill="#E51E2B" rx="1" />

            {/* Back Hood Silhouette for Hoodie */}
            {isHoodie && (
              <g id="back-hood-drape">
                <path
                  d="M 185 92 C 205 50 295 50 315 92 C 322 135 305 160 250 165 C 195 160 178 135 185 92 Z"
                  fill={colorHex}
                  stroke={outlineColor}
                  strokeWidth="2.2"
                />
                <line x1="250" y1="88" x2="250" y2="160" stroke={seamColor} strokeWidth="1.5" strokeDasharray="3 2" />
              </g>
            )}
          </>
        )}
      </g>

      {/* Interactive Print Placement Hotspots */}
      {showHotspots && (
        <g id="print-placement-hotspots">
          {view === 'front' ? (
            <>
              {/* 1. Left Chest (Front View - wearer's left, viewer's right) */}
              <g
                id="hotspot-front_chest"
                className="cursor-pointer group"
                onClick={() => onSelectPlacement && onSelectPlacement('front_chest')}
              >
                <rect
                  x="305"
                  y={isPolo ? "185" : "175"}
                  width="55"
                  height="55"
                  rx="10"
                  className={`transition-all duration-200 ${getHotspotClasses('front_chest')}`}
                />
                {currentViewArt && (isActive('front_chest') || isSelected('front_chest')) ? (
                  <image
                    href={currentViewArt}
                    xlinkHref={currentViewArt}
                    x="308"
                    y={isPolo ? "188" : "178"}
                    width="49"
                    height="49"
                    preserveAspectRatio="xMidYMid meet"
                    className="filter drop-shadow-md pointer-events-none"
                  />
                ) : (
                  <text
                    x="332"
                    y={isPolo ? "216" : "206"}
                    textAnchor="middle"
                    className={`text-[9px] font-mono font-bold uppercase transition-colors pointer-events-none select-none ${
                      isActive('front_chest') || isSelected('front_chest') ? 'fill-red-600 font-extrabold' : 'fill-neutral-500'
                    }`}
                  >
                    LEFT CHEST
                  </text>
                )}
              </g>

              {/* 2. Center Chest */}
              <g
                id="hotspot-center_chest"
                className="cursor-pointer group"
                onClick={() => onSelectPlacement && onSelectPlacement('center_chest')}
              >
                <rect
                  x="195"
                  y={isPolo ? "225" : "180"}
                  width="110"
                  height="75"
                  rx="12"
                  className={`transition-all duration-200 ${getHotspotClasses('center_chest')}`}
                />
                {currentViewArt && (isActive('center_chest') || isSelected('center_chest')) ? (
                  <image
                    href={currentViewArt}
                    xlinkHref={currentViewArt}
                    x="198"
                    y={isPolo ? "228" : "183"}
                    width="104"
                    height="69"
                    preserveAspectRatio="xMidYMid meet"
                    className="filter drop-shadow-md pointer-events-none"
                  />
                ) : (
                  <text
                    x="250"
                    y={isPolo ? "266" : "222"}
                    textAnchor="middle"
                    className={`text-[10px] font-mono font-bold uppercase transition-colors pointer-events-none select-none ${
                      isActive('center_chest') || isSelected('center_chest') ? 'fill-red-600 font-extrabold' : 'fill-neutral-500'
                    }`}
                  >
                    CENTER CHEST
                  </text>
                )}
              </g>

              {/* 3. Large Front Print */}
              <g
                id="hotspot-large_front"
                className="cursor-pointer group"
                onClick={() => onSelectPlacement && onSelectPlacement('large_front')}
              >
                <rect
                  x="170"
                  y={isPolo ? "215" : "170"}
                  width="160"
                  height="195"
                  rx="16"
                  className={`transition-all duration-200 ${getHotspotClasses('large_front')}`}
                />
                {currentViewArt && (isActive('large_front') || isSelected('large_front') || (!isSelected('front_chest') && !isSelected('center_chest'))) ? (
                  <image
                    href={currentViewArt}
                    xlinkHref={currentViewArt}
                    x="175"
                    y={isPolo ? "220" : "175"}
                    width="150"
                    height="185"
                    preserveAspectRatio="xMidYMid meet"
                    className="filter drop-shadow-md pointer-events-none"
                  />
                ) : (
                  <text
                    x="250"
                    y={isPolo ? "330" : "285"}
                    textAnchor="middle"
                    className={`text-[11px] font-mono font-bold uppercase transition-colors pointer-events-none select-none ${
                      isActive('large_front') || isSelected('large_front') ? 'fill-red-600 font-extrabold' : 'fill-neutral-500'
                    }`}
                  >
                    LARGE FRONT PRINT
                  </text>
                )}
              </g>

              {/* 4. Left Sleeve (Viewer's Right) */}
              <g
                id="hotspot-left_sleeve"
                className="cursor-pointer group"
                onClick={() => onSelectPlacement && onSelectPlacement('left_sleeve')}
              >
                <rect
                  x="400"
                  y="200"
                  width="45"
                  height="55"
                  rx="8"
                  className={`transition-all duration-200 ${getHotspotClasses('left_sleeve')}`}
                />
                <text
                  x="422"
                  y="230"
                  textAnchor="middle"
                  className={`text-[8px] font-mono font-bold uppercase transition-colors pointer-events-none select-none ${
                    isActive('left_sleeve') || isSelected('left_sleeve') ? 'fill-red-600' : 'fill-neutral-500'
                  }`}
                >
                  L.SLEEVE
                </text>
              </g>

              {/* 5. Right Sleeve (Viewer's Left) */}
              <g
                id="hotspot-right_sleeve"
                className="cursor-pointer group"
                onClick={() => onSelectPlacement && onSelectPlacement('right_sleeve')}
              >
                <rect
                  x="55"
                  y="200"
                  width="45"
                  height="55"
                  rx="8"
                  className={`transition-all duration-200 ${getHotspotClasses('right_sleeve')}`}
                />
                <text
                  x="78"
                  y="230"
                  textAnchor="middle"
                  className={`text-[8px] font-mono font-bold uppercase transition-colors pointer-events-none select-none ${
                    isActive('right_sleeve') || isSelected('right_sleeve') ? 'fill-red-600' : 'fill-neutral-500'
                  }`}
                >
                  R.SLEEVE
                </text>
              </g>
            </>
          ) : (
            /* BACK VIEW HOTSPOTS */
            <>
              {/* 6. Upper Back / Nape */}
              <g
                id="hotspot-upper_back"
                className="cursor-pointer group"
                onClick={() => onSelectPlacement && onSelectPlacement('upper_back')}
              >
                <rect
                  x="180"
                  y="125"
                  width="140"
                  height="55"
                  rx="10"
                  className={`transition-all duration-200 ${getHotspotClasses('upper_back')}`}
                />
                {currentViewArt && (isActive('upper_back') || isSelected('upper_back')) ? (
                  <image
                    href={currentViewArt}
                    xlinkHref={currentViewArt}
                    x="184"
                    y="129"
                    width="132"
                    height="47"
                    preserveAspectRatio="xMidYMid meet"
                    className="filter drop-shadow-md pointer-events-none"
                  />
                ) : (
                  <text
                    x="250"
                    y="157"
                    textAnchor="middle"
                    className={`text-[10px] font-mono font-bold uppercase transition-colors pointer-events-none select-none ${
                      isActive('upper_back') || isSelected('upper_back') ? 'fill-red-600 font-extrabold' : 'fill-neutral-500'
                    }`}
                  >
                    UPPER BACK / NAPE
                  </text>
                )}
              </g>

              {/* 7. Full Back Masterpiece */}
              <g
                id="hotspot-full_back"
                className="cursor-pointer group"
                onClick={() => onSelectPlacement && onSelectPlacement('full_back')}
              >
                <rect
                  x="160"
                  y="140"
                  width="180"
                  height="250"
                  rx="16"
                  className={`transition-all duration-200 ${getHotspotClasses('full_back')}`}
                />
                {currentViewArt && (isActive('full_back') || isSelected('full_back') || !isSelected('upper_back')) ? (
                  <image
                    href={currentViewArt}
                    xlinkHref={currentViewArt}
                    x="165"
                    y="145"
                    width="170"
                    height="240"
                    preserveAspectRatio="xMidYMid meet"
                    className="filter drop-shadow-md pointer-events-none"
                  />
                ) : (
                  <text
                    x="250"
                    y="275"
                    textAnchor="middle"
                    className={`text-[12px] font-mono font-bold uppercase transition-colors pointer-events-none select-none ${
                      isActive('full_back') || isSelected('full_back') ? 'fill-red-600 font-extrabold' : 'fill-neutral-500'
                    }`}
                  >
                    FULL BACK CANVAS
                  </text>
                )}
              </g>

              {/* Both Sleeves Indicator */}
              <g
                id="hotspot-both_sleeves"
                className="cursor-pointer group"
                onClick={() => onSelectPlacement && onSelectPlacement('both_sleeves')}
              >
                <rect
                  x="55"
                  y="200"
                  width="45"
                  height="55"
                  rx="4"
                  className={`transition-all duration-200 ${getHotspotClasses('both_sleeves')}`}
                />
                <rect
                  x="400"
                  y="200"
                  width="45"
                  height="55"
                  rx="4"
                  className={`transition-all duration-200 ${getHotspotClasses('both_sleeves')}`}
                />
              </g>
            </>
          )}
        </g>
      )}

      {/* View Indicator Label */}
      <text
        x="250"
        y="508"
        textAnchor="middle"
        className="fill-neutral-400 font-mono text-[10px] uppercase font-bold tracking-widest pointer-events-none select-none"
      >
        {view === 'front' ? '— FRONT VIEW —' : '— BACK VIEW —'}
      </text>
    </svg>
  );
};

export default GarmentSvg;
