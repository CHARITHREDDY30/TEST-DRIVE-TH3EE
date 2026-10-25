import React from 'react';
import { Info, Layers, Check, ShieldCheck } from 'lucide-react';
import type { FabricSpec, GarmentFitType } from '../../types/customise';

interface FabricGsmGuideProps {
  fabrics: FabricSpec[];
  selectedFabric: string;
  selectedGsm: string;
  onSelectFabric: (spec: FabricSpec) => void;
  currentFit: GarmentFitType;
}

export const FabricGsmGuide: React.FC<FabricGsmGuideProps> = ({
  fabrics,
  selectedFabric,
  selectedGsm,
  onSelectFabric,
  currentFit
}) => {
  return (
    <div className="space-y-4 font-mono">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#E51E2B]" />
          <span>Fabric Composition & Garment Weight (GSM) *</span>
        </label>
        <span className="text-[11px] text-[#E51E2B] font-bold">
          Active: {selectedGsm}
        </span>
      </div>

      {/* Educational Banner: GSM Meaning */}
      <div className="bg-neutral-50 border border-neutral-200 p-3.5 rounded-sm text-xs text-neutral-700 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold uppercase text-neutral-900 block text-[11px]">
            What is GSM? (Grams per Square Metre)
          </span>
          <p className="text-[11px] text-neutral-600 leading-relaxed">
            GSM measures the physical weight and density of the fabric weave. While higher GSM garments (240+ GSM) provide a heavy, structured streetwear drape, fabric yarn grade (combing, ring-spinning, and bio-wash) determines softness and durability. All TH3EE fabrics are 100% pure combed cotton.
          </p>
        </div>
      </div>

      {/* Fabric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {fabrics.map((spec) => {
          const isSelected = selectedGsm === spec.gsm;
          const isCompatibleWithFit = spec.fits.includes(currentFit);

          return (
            <div
              key={spec.name}
              role="button"
              tabIndex={0}
              onClick={() => onSelectFabric(spec)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectFabric(spec);
                }
              }}
              className={`relative border-2 p-4 rounded-sm text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-[#E51E2B] bg-red-50/20 shadow-xs ring-1 ring-[#E51E2B]/50'
                  : 'border-neutral-200 bg-white hover:border-neutral-400'
              } ${!isCompatibleWithFit ? 'opacity-70 bg-neutral-50/50' : ''}`}
            >
              {/* Badge */}
              <div className="flex items-start justify-between mb-2">
                <span className="inline-block bg-neutral-900 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-xs">
                  {spec.gsm}
                </span>
                {isSelected && (
                  <span className="bg-[#E51E2B] text-white p-0.5 rounded-full">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase text-neutral-900 mb-1 leading-snug">
                  {spec.name}
                </h4>
                <div className="text-[10px] text-[#E51E2B] font-bold uppercase mb-2 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{spec.composition}</span>
                </div>
                <p className="text-[11px] text-neutral-600 leading-relaxed mb-3">
                  {spec.description}
                </p>

                {/* Specs Box */}
                <div className="bg-neutral-50 p-2 border border-neutral-150 rounded-xs space-y-1 text-[10px] text-neutral-600">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Weave:</span>
                    <span className="font-semibold text-neutral-800 truncate max-w-[140px]">{spec.weave}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Feel:</span>
                    <span className="font-semibold text-neutral-800">{spec.feel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Supported Fits:</span>
                    <span className="font-semibold text-neutral-800">{spec.fits.join(', ')}</span>
                  </div>
                </div>
              </div>

              {!isCompatibleWithFit && (
                <div className="mt-2 text-[10px] text-amber-700 bg-amber-50 p-1.5 border border-amber-200 rounded-xs">
                  Note: Tailored primarily for {spec.fits.join(' & ')}.
                </div>
              )}

              <button
                type="button"
                className={`mt-3 w-full py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors rounded-xs ${
                  isSelected
                    ? 'bg-[#E51E2B] text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {isSelected ? 'Active Selection' : `Select ${spec.gsm}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FabricGsmGuide;
