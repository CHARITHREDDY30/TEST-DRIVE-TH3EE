import React, { useState, useEffect } from 'react';
import { X, Ruler, Check, HelpCircle } from 'lucide-react';
import type { GarmentFitType, GarmentSizeMeasurement, GarmentFitOption } from '../../types/customise';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFit: GarmentFitType;
  fitOptions: GarmentFitOption[];
  onSelectFit?: (fit: GarmentFitType) => void;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({
  isOpen,
  onClose,
  selectedFit,
  fitOptions,
  onSelectFit
}) => {
  const [activeTabFit, setActiveTabFit] = useState<GarmentFitType>(selectedFit);
  const [unit, setUnit] = useState<'cm' | 'in'>('in'); // Inches default for Indian apparel standard, toggle to cm

  useEffect(() => {
    if (isOpen) {
      setActiveTabFit(selectedFit);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, selectedFit]);

  if (!isOpen) return null;

  const currentFitOption = fitOptions.find(f => f.id === activeTabFit) || fitOptions[0];
  const measurements: GarmentSizeMeasurement[] = currentFitOption?.measurements || [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="size-guide-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs font-mono"
    >
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Container */}
      <div className="relative bg-white border border-neutral-200/90 rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl p-5 sm:p-8 z-10 flex flex-col justify-between font-sans">
        
        {/* Header */}
        <div>
          <div className="flex items-start justify-between border-b border-neutral-200 pb-4 mb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#FF2E2E] to-[#E51E2B] text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-1.5 shadow-2xs font-mono">
                <Ruler className="w-3 h-3" />
                <span>Atelier Sizing Guide</span>
              </div>
              <h2 id="size-guide-title" className="text-xl sm:text-2xl font-black uppercase text-neutral-900 tracking-tight">
                Garment Measurement Specification
              </h2>
              <p className="text-xs text-neutral-600 mt-1">
                Verified garment dimensions crafted at Tirupati Atelier. Measurements taken with garment laid flat.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
              aria-label="Close Size Guide"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Unit Toggle & Fit Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 bg-neutral-50/80 p-2 border border-neutral-200/80 rounded-2xl">
            {/* Fit Selector Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {fitOptions.map((f) => {
                const isActive = activeTabFit === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setActiveTabFit(f.id)}
                    className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors rounded-full flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-neutral-900 text-white shadow-xs'
                        : 'text-neutral-600 hover:text-black hover:bg-neutral-200/60'
                    }`}
                  >
                    <span>{f.name}</span>
                    {isActive && <Check className="w-3 h-3 text-[#FF2E2E]" />}
                  </button>
                );
              })}
            </div>

            {/* Unit Switcher */}
            <div className="flex items-center self-end sm:self-center gap-1 bg-white border border-neutral-300 p-0.5 rounded-full text-xs font-bold shadow-2xs">
              <button
                type="button"
                onClick={() => setUnit('in')}
                className={`px-3 py-1 uppercase rounded-full transition-colors cursor-pointer ${
                  unit === 'in' ? 'bg-[#FF2E2E] text-white shadow-xs' : 'text-neutral-600 hover:text-black'
                }`}
              >
                Inches (in)
              </button>
              <button
                type="button"
                onClick={() => setUnit('cm')}
                className={`px-3 py-1 uppercase rounded-full transition-colors cursor-pointer ${
                  unit === 'cm' ? 'bg-[#FF2E2E] text-white shadow-xs' : 'text-neutral-600 hover:text-black'
                }`}
              >
                Centimetres (cm)
              </button>
            </div>
          </div>

          {/* Technical Measurement Illustration Diagram */}
          <div className="bg-[#FAFAFA] border border-neutral-200 p-4 rounded-sm mb-6 flex flex-col md:flex-row items-center gap-6">
            {/* SVG Measurement Map */}
            <div className="w-48 sm:w-56 shrink-0">
              <svg viewBox="0 0 300 280" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                {/* Silhouette contour */}
                <path
                  d="M 115 50 C 130 65 170 65 185 50 L 250 80 L 270 140 L 235 155 L 225 120 L 225 240 L 75 240 L 75 120 L 65 155 L 30 140 L 50 80 Z"
                  fill="#EAEAEA"
                  stroke="#444444"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />

                {/* [A] Chest Width Line */}
                <line x1="75" y1="125" x2="225" y2="125" stroke="#E51E2B" strokeWidth="2.5" strokeDasharray="4 2" />
                <circle cx="75" cy="125" r="3.5" fill="#E51E2B" />
                <circle cx="225" cy="125" r="3.5" fill="#E51E2B" />
                <rect x="135" y="113" width="30" height="18" fill="#E51E2B" rx="3" />
                <text x="150" y="126" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">A</text>

                {/* [B] Body Length Line */}
                <line x1="120" y1="53" x2="120" y2="240" stroke="#0070F3" strokeWidth="2.5" strokeDasharray="4 2" />
                <circle cx="120" cy="53" r="3.5" fill="#0070F3" />
                <circle cx="120" cy="240" r="3.5" fill="#0070F3" />
                <rect x="105" y="140" width="30" height="18" fill="#0070F3" rx="3" />
                <text x="120" y="153" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">B</text>

                {/* [C] Shoulder Width Line */}
                <line x1="50" y1="80" x2="250" y2="80" stroke="#10B981" strokeWidth="2" strokeDasharray="4 2" />
                <circle cx="50" cy="80" r="3" fill="#10B981" />
                <circle cx="250" cy="80" r="3" fill="#10B981" />
                <rect x="135" y="70" width="30" height="18" fill="#10B981" rx="3" />
                <text x="150" y="83" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">C</text>

                {/* [D] Sleeve Length Line */}
                <line x1="250" y1="80" x2="270" y2="140" stroke="#F59E0B" strokeWidth="2" strokeDasharray="4 2" />
                <circle cx="270" cy="140" r="3" fill="#F59E0B" />
                <rect x="265" y="100" width="26" height="18" fill="#F59E0B" rx="3" />
                <text x="278" y="113" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">D</text>
              </svg>
            </div>

            {/* Explanatory Legend */}
            <div className="flex-1 space-y-2 text-xs">
              <h4 className="font-bold text-neutral-900 uppercase tracking-wider text-sm flex items-center gap-1.5">
                <span>{currentFitOption.name}</span>
                <span className="text-[#E51E2B] font-mono text-xs font-normal">({currentFitOption.tagline})</span>
              </h4>
              <p className="text-neutral-600 leading-relaxed text-[11px] mb-3">
                {currentFitOption.silhouette}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-start gap-2 bg-white p-2.5 border border-neutral-200 rounded-xl">
                  <span className="bg-[#E51E2B] text-white px-2 py-0.5 text-[9px] font-bold rounded-lg shrink-0">A</span>
                  <div>
                    <span className="font-bold text-neutral-900 block">Chest Circumference</span>
                    <span className="text-neutral-500 text-[10px]">Total circumference (measured armpit to armpit × 2).</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-white p-2.5 border border-neutral-200 rounded-xl">
                  <span className="bg-[#0070F3] text-white px-2 py-0.5 text-[9px] font-bold rounded-lg shrink-0">B</span>
                  <div>
                    <span className="font-bold text-neutral-900 block">Body Length</span>
                    <span className="text-neutral-500 text-[10px]">Highest point of shoulder to the bottom hem.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-white p-2.5 border border-neutral-200 rounded-xl">
                  <span className="bg-[#10B981] text-white px-2 py-0.5 text-[9px] font-bold rounded-lg shrink-0">C</span>
                  <div>
                    <span className="font-bold text-neutral-900 block">Shoulder Width</span>
                    <span className="text-neutral-500 text-[10px]">Distance between the left and right shoulder seams.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-white p-2.5 border border-neutral-200 rounded-xl">
                  <span className="bg-[#F59E0B] text-white px-2 py-0.5 text-[9px] font-bold rounded-lg shrink-0">D</span>
                  <div>
                    <span className="font-bold text-neutral-900 block">Sleeve Length</span>
                    <span className="text-neutral-500 text-[10px]">Shoulder seam down to the outer sleeve cuff.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sizing Table */}
          <div className="overflow-x-auto border border-neutral-200 rounded-2xl mb-6 shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-900 text-white font-bold uppercase text-[11px] tracking-wider">
                  <th className="py-2.5 px-3 border-r border-neutral-800">Size</th>
                  <th className="py-2.5 px-3 border-r border-neutral-800 text-center">
                    [A] Chest ({unit})
                  </th>
                  <th className="py-2.5 px-3 border-r border-neutral-800 text-center">
                    [B] Length ({unit})
                  </th>
                  <th className="py-2.5 px-3 border-r border-neutral-800 text-center">
                    [C] Shoulder ({unit})
                  </th>
                  <th className="py-2.5 px-3 text-center">
                    [D] Sleeve ({unit})
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {measurements.length > 0 ? (
                  measurements.map((row) => (
                    <tr key={row.size} className="hover:bg-neutral-50 font-mono transition-colors">
                      <td className="py-2 px-3 font-bold text-neutral-900 bg-neutral-50/50 border-r border-neutral-200">
                        {row.size}
                      </td>
                      <td className="py-2 px-3 text-center border-r border-neutral-200 font-bold">
                        {unit === 'in' ? `${row.chestIn}"` : `${row.chestCm} cm`}
                      </td>
                      <td className="py-2 px-3 text-center border-r border-neutral-200 font-bold">
                        {unit === 'in' ? `${row.lengthIn}"` : `${row.lengthCm} cm`}
                      </td>
                      <td className="py-2 px-3 text-center border-r border-neutral-200 text-neutral-600">
                        {unit === 'in' ? `${row.shoulderIn}"` : `${row.shoulderCm} cm`}
                      </td>
                      <td className="py-2 px-3 text-center text-neutral-600">
                        {unit === 'in' ? `${row.sleeveIn}"` : `${row.sleeveCm} cm`}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-neutral-500 italic">
                      Size chart for this silhouette is currently being configured by the atelier team.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Measuring Guidance Tips */}
          <div className="bg-red-50/40 border border-red-200 p-4 rounded-2xl text-[11px] text-neutral-700 flex items-start gap-2.5 shadow-2xs">
            <HelpCircle className="w-4 h-4 text-[#E51E2B] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold uppercase text-neutral-900 block">How to find your best fit:</span>
              <p className="leading-relaxed">
                Take a well-fitting T-shirt you currently own, lay it flat on a table, and measure armpit to armpit.
                Multiply by 2 to compare with our chest chart. For an authentic drop-shoulder streetwear aesthetic, we recommend ordering your true size in <strong>Oversized</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 pt-4 border-t border-neutral-200 flex flex-col sm:flex-row justify-between items-center gap-3">
          {onSelectFit && activeTabFit !== selectedFit ? (
            <button
              type="button"
              onClick={() => {
                onSelectFit(activeTabFit);
                onClose();
              }}
              className="w-full sm:w-auto rounded-full bg-gradient-to-r from-[#FF2E2E] to-[#E51E2B] hover:from-black hover:to-neutral-900 text-white px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Apply {activeTabFit} to My Garment
            </button>
          ) : (
            <span className="text-[11px] text-neutral-500">
              Viewing sizing for: <strong className="text-neutral-900">{activeTabFit}</strong>
            </span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto rounded-full bg-neutral-900 hover:bg-neutral-800 text-white px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
          >
            Got It, Back to Customise
          </button>
        </div>

      </div>
    </div>
  );
};

export default SizeGuideModal;
