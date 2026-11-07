import React from 'react';
import type { GenderFit } from '../../types/sizing';

interface HumanBodyIllustrationProps {
  gender: GenderFit;
  activeArea?: 'chest' | 'waist' | 'hips' | 'height' | 'weight' | null;
  chestVal?: number;
  waistVal?: number;
  hipsVal?: number;
}

export const HumanBodyIllustration: React.FC<HumanBodyIllustrationProps> = ({
  gender,
  activeArea,
  chestVal,
  waistVal,
  hipsVal
}) => {
  const isFemale = gender === 'womens';

  return (
    <div className="relative w-full max-w-[240px] mx-auto select-none flex flex-col items-center">
      <svg
        viewBox="0 0 240 380"
        className="w-full h-auto drop-shadow-xs"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="silhouetteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E1E1E" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#E51E2B" stopOpacity="0.07" />
          </linearGradient>
          <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#E51E2B" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* Head & Neck */}
        <ellipse cx="120" cy="42" rx="19" ry="24" className="stroke-neutral-800" strokeWidth="1.75" fill="url(#silhouetteGrad)" />
        <path d="M113 65 L113 80 M127 65 L127 80" className="stroke-neutral-800" strokeWidth="1.75" />

        {/* Torso & Arms Silhouettes */}
        {isFemale ? (
          // Female Silhouetted Contours
          <path
            d="
              M113 80 
              C95 82, 75 92, 68 114 
              C63 130, 60 170, 58 220 
              C57 232, 64 235, 68 224 
              C72 200, 77 165, 80 148 
              C82 145, 84 150, 84 165 
              C85 185, 96 200, 104 225 
              L104 250 
              L136 250 
              L136 225 
              C144 200, 155 185, 156 165 
              C156 150, 158 145, 160 148 
              C163 165, 168 200, 172 224 
              C176 235, 183 232, 182 220 
              C180 170, 177 130, 172 114 
              C165 92, 145 82, 127 80 
              Z
            "
            className="stroke-neutral-800"
            strokeWidth="1.75"
            fill="url(#silhouetteGrad)"
            strokeLinejoin="round"
          />
        ) : (
          // Male & Unisex Athletic Proportions
          <path
            d="
              M113 80 
              C92 82, 68 94, 60 118 
              C54 135, 52 175, 50 226 
              C49 238, 56 242, 61 230 
              C66 205, 72 168, 76 150 
              C77 147, 81 152, 81 170 
              C83 192, 94 212, 102 240 
              L102 254 
              L138 254 
              L138 240 
              C146 212, 157 192, 159 170 
              C159 152, 163 147, 164 150 
              C168 168, 174 205, 179 230 
              C184 242, 191 238, 190 226 
              C188 175, 186 135, 180 118 
              C172 94, 148 82, 127 80 
              Z
            "
            className="stroke-neutral-800"
            strokeWidth="1.75"
            fill="url(#silhouetteGrad)"
            strokeLinejoin="round"
          />
        )}

        {/* Lower Torso / Leg Anchors */}
        <path d="M104 250 L100 340 M136 250 L140 340 M120 252 L120 330" className="stroke-neutral-300" strokeWidth="1.5" strokeDasharray="3 3" />

        {/* ZONE 1: CHEST / BUST LINE (Y = 126) */}
        <g className={activeArea === 'chest' ? 'transition-all duration-300' : 'opacity-85'}>
          <line
            x1="30"
            y1="126"
            x2="210"
            y2="126"
            stroke={activeArea === 'chest' ? '#E51E2B' : '#737373'}
            strokeWidth={activeArea === 'chest' ? '2' : '1.25'}
            strokeDasharray={activeArea === 'chest' ? 'none' : '4 3'}
            filter={activeArea === 'chest' ? 'url(#glowEffect)' : undefined}
          />
          <circle
            cx="30"
            cy="126"
            r={activeArea === 'chest' ? '4.5' : '3'}
            fill={activeArea === 'chest' ? '#E51E2B' : '#737373'}
          />
          <circle
            cx="210"
            cy="126"
            r={activeArea === 'chest' ? '4.5' : '3'}
            fill={activeArea === 'chest' ? '#E51E2B' : '#737373'}
          />
          <text
            x="218"
            y="130"
            className={`text-[9px] font-mono font-bold uppercase tracking-wider ${activeArea === 'chest' ? 'fill-[#E51E2B]' : 'fill-neutral-600'}`}
          >
            CHEST {chestVal ? `(${chestVal}cm)` : ''}
          </text>
        </g>

        {/* ZONE 2: WAIST LINE (Y = 175) */}
        <g className={activeArea === 'waist' ? 'transition-all duration-300' : 'opacity-85'}>
          <line
            x1="45"
            y1="175"
            x2="195"
            y2="175"
            stroke={activeArea === 'waist' ? '#E51E2B' : '#737373'}
            strokeWidth={activeArea === 'waist' ? '2' : '1.25'}
            strokeDasharray={activeArea === 'waist' ? 'none' : '4 3'}
            filter={activeArea === 'waist' ? 'url(#glowEffect)' : undefined}
          />
          <circle
            cx="45"
            cy="175"
            r={activeArea === 'waist' ? '4.5' : '3'}
            fill={activeArea === 'waist' ? '#E51E2B' : '#737373'}
          />
          <circle
            cx="195"
            cy="175"
            r={activeArea === 'waist' ? '4.5' : '3'}
            fill={activeArea === 'waist' ? '#E51E2B' : '#737373'}
          />
          <text
            x="203"
            y="179"
            className={`text-[9px] font-mono font-bold uppercase tracking-wider ${activeArea === 'waist' ? 'fill-[#E51E2B]' : 'fill-neutral-600'}`}
          >
            WAIST {waistVal ? `(${waistVal}cm)` : ''}
          </text>
        </g>

        {/* ZONE 3: HIPS LINE (Y = 224) */}
        <g className={activeArea === 'hips' ? 'transition-all duration-300' : 'opacity-85'}>
          <line
            x1="40"
            y1="224"
            x2="200"
            y2="224"
            stroke={activeArea === 'hips' ? '#E51E2B' : '#737373'}
            strokeWidth={activeArea === 'hips' ? '2' : '1.25'}
            strokeDasharray={activeArea === 'hips' ? 'none' : '4 3'}
            filter={activeArea === 'hips' ? 'url(#glowEffect)' : undefined}
          />
          <circle
            cx="40"
            cy="224"
            r={activeArea === 'hips' ? '4.5' : '3'}
            fill={activeArea === 'hips' ? '#E51E2B' : '#737373'}
          />
          <circle
            cx="200"
            cy="224"
            r={activeArea === 'hips' ? '4.5' : '3'}
            fill={activeArea === 'hips' ? '#E51E2B' : '#737373'}
          />
          <text
            x="208"
            y="228"
            className={`text-[9px] font-mono font-bold uppercase tracking-wider ${activeArea === 'hips' ? 'fill-[#E51E2B]' : 'fill-neutral-600'}`}
          >
            HIPS {hipsVal ? `(${hipsVal}cm)` : ''}
          </text>
        </g>

        {/* Minimal Atelier Brand Stamp */}
        <text
          x="120"
          y="370"
          textAnchor="middle"
          className="text-[8px] font-mono tracking-widest fill-neutral-400 uppercase font-semibold"
        >
          TH3EE · ATELIER PROPORTIONS
        </text>
      </svg>
    </div>
  );
};

