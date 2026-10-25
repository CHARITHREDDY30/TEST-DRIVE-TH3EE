import React from 'react';
import { Check } from 'lucide-react';
import type { GarmentFitType, GarmentFitOption } from '../../types/customise';
import { GarmentSvg } from './GarmentIllustrations';

interface FitSelectionCardsProps {
  fitOptions: GarmentFitOption[];
  selectedFit: GarmentFitType;
  onSelectFit: (fit: GarmentFitType) => void;
  selectedColorHex: string;
}

export const FitSelectionCards: React.FC<FitSelectionCardsProps> = ({
  fitOptions,
  selectedFit,
  onSelectFit,
  selectedColorHex
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
          <span>Select Garment Fit Silhouette *</span>
          <span className="text-[10px] text-neutral-400 font-normal">Compare cut & proportions</span>
        </label>
        <span className="text-[11px] font-mono text-[#E51E2B] font-bold">
          Active: {selectedFit}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {fitOptions.map((option) => {
          const isSelected = selectedFit === option.id;
          return (
            <div
              key={option.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectFit(option.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectFit(option.id);
                }
              }}
              className={`relative border-2 p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between font-mono rounded-sm text-left ${
                isSelected
                  ? 'border-[#E51E2B] bg-red-50/20 shadow-md ring-1 ring-[#E51E2B]/50'
                  : 'border-neutral-200 bg-white hover:border-neutral-400 hover:shadow-xs'
              }`}
            >
              {/* Selected Badge */}
              {isSelected && (
                <div className="absolute top-3 right-3 bg-[#E51E2B] text-white p-1 rounded-full shadow-xs">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}

              {/* Consistent Front-View Technical Illustration */}
              <div className="w-full h-44 sm:h-48 flex items-center justify-center p-2 bg-neutral-50/60 border border-neutral-100 rounded-xs mb-3 overflow-hidden">
                <GarmentSvg
                  view="front"
                  fit={option.id}
                  sleeve="Half Sleeve"
                  neckType="Round Neck"
                  colorHex={selectedColorHex}
                  showHotspots={false}
                  className="max-h-full w-auto object-contain drop-shadow-xs"
                />
              </div>

              {/* Title & Tagline */}
              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <h4 className="text-sm font-black uppercase text-neutral-900 tracking-tight">
                    {option.name}
                  </h4>
                  <span className="text-[9px] font-bold uppercase text-[#E51E2B] tracking-wider">
                    {option.tagline}
                  </span>
                </div>

                {/* Silhouette Description */}
                <p className="text-[11px] text-neutral-600 leading-relaxed mb-3">
                  {option.silhouette}
                </p>

                {/* Technical Proportions Micro-Specs */}
                <div className="border-t border-neutral-100 pt-2 space-y-1 text-[10px] text-neutral-500">
                  <div className="flex items-center justify-between">
                    <span>Shoulder:</span>
                    <strong className="text-neutral-800 font-semibold">{option.shoulderStyle}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Drape:</span>
                    <strong className="text-neutral-800 font-semibold">{option.bodyDrape}</strong>
                  </div>
                </div>
              </div>

              {/* Bottom Selection Button */}
              <button
                type="button"
                className={`mt-4 w-full py-2 text-xs font-bold uppercase tracking-wider transition-colors rounded-xs ${
                  isSelected
                    ? 'bg-[#E51E2B] text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {isSelected ? 'Selected Fit' : `Choose ${option.name}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FitSelectionCards;
