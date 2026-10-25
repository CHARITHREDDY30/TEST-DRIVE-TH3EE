import React, { useState } from 'react';
import { Eye, RotateCw, Check, Sparkles, AlertCircle, Upload, Trash2 } from 'lucide-react';
import type {
  PrintPlacementDefinition,
  PrintSize,
  CustomRequestPlacement,
  GarmentFitType,
  SleeveType,
  NeckType,
  CustomRequestFile
} from '../../types/customise';
import { GarmentSvg } from './GarmentIllustrations';

interface PrintPlacementSelectorProps {
  placementsDef: PrintPlacementDefinition[];
  placements: CustomRequestPlacement[];
  onChangePlacements: (placements: CustomRequestPlacement[]) => void;
  fit: GarmentFitType;
  sleeve: SleeveType;
  neckType: NeckType;
  colorHex: string;
  uploadedFiles: CustomRequestFile[];
  onUploadFileForPlacement?: (placementId: string, file: File) => Promise<void>;
  isUploading?: boolean;
}

export const PrintPlacementSelector: React.FC<PrintPlacementSelectorProps> = ({
  placementsDef,
  placements,
  onChangePlacements,
  fit,
  sleeve,
  neckType,
  colorHex,
  uploadedFiles,
  onUploadFileForPlacement,
  isUploading = false
}) => {
  const [activeView, setActiveView] = useState<'front' | 'back'>('front');
  const [activePlacementId, setActivePlacementId] = useState<string | null>(
    placements.length > 0 ? placements[0].placementLocation : 'large_front'
  );

  const selectedLocations = placements.map(p => p.placementLocation);

  // Toggle placement selection
  const handleTogglePlacement = (placementId: string) => {
    setActivePlacementId(placementId);

    // Switch view to match zone if necessary
    const def = placementsDef.find(d => d.id === placementId);
    if (def?.zone === 'back' && activeView !== 'back') {
      setActiveView('back');
    } else if (def?.zone === 'front' && activeView !== 'front') {
      setActiveView('front');
    }

    const existingIndex = placements.findIndex(p => p.placementLocation === placementId);
    if (existingIndex !== -1) {
      // If at least one placement exists, allow removal; prevent removing all so form is never empty
      if (placements.length > 1) {
        const next = placements.filter(p => p.placementLocation !== placementId);
        onChangePlacements(next);
      }
    } else {
      // Add placement
      const newPlacement: CustomRequestPlacement = {
        placementLocation: placementId,
        printSize: def?.recommendedSizes[0] || 'medium',
        notes: ''
      };
      onChangePlacements([...placements, newPlacement]);
    }
  };

  // Update specific placement print size
  const handleUpdatePrintSize = (placementId: string, size: PrintSize) => {
    const next = placements.map(p => {
      if (p.placementLocation === placementId) {
        return { ...p, printSize: size };
      }
      return p;
    });
    onChangePlacements(next);
  };

  // Update custom dimensions
  const handleUpdateCustomDimensions = (placementId: string, dimensions: string) => {
    const next = placements.map(p => {
      if (p.placementLocation === placementId) {
        return { ...p, customDimensions: dimensions };
      }
      return p;
    });
    onChangePlacements(next);
  };

  // Associate an existing uploaded file with this placement
  const handleAssociateFile = (placementId: string, fileUrl: string, fileKey?: string) => {
    const next = placements.map(p => {
      if (p.placementLocation === placementId) {
        return { ...p, artworkUrl: fileUrl, artworkKey: fileKey };
      }
      return p;
    });
    onChangePlacements(next);
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-3">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#E51E2B]" />
            <span>Select Print Placement Hotspots *</span>
          </label>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Click on the technical garment hotspots or placement badges below to assign print zones.
          </p>
        </div>

        {/* Front / Back View Switcher Toggle */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-neutral-100 p-1 rounded-sm border border-neutral-200">
          <button
            type="button"
            onClick={() => setActiveView('front')}
            className={`px-3 py-1.5 text-xs font-bold uppercase rounded-xs transition-colors flex items-center gap-1.5 ${
              activeView === 'front'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-200/50'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Front View</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('back')}
            className={`px-3 py-1.5 text-xs font-bold uppercase rounded-xs transition-colors flex items-center gap-1.5 ${
              activeView === 'back'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-200/50'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Back View</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Diagram & Selection Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Interactive SVG Garment Diagram */}
        <div className="lg:col-span-5 bg-[#FAFAFA] border-2 border-neutral-200 rounded-sm p-4 sm:p-6 flex flex-col items-center justify-between">
          <div className="w-full max-w-[340px] relative">
            <GarmentSvg
              view={activeView}
              fit={fit}
              sleeve={sleeve}
              neckType={neckType}
              colorHex={colorHex}
              selectedPlacements={selectedLocations}
              activePlacement={activePlacementId}
              onSelectPlacement={handleTogglePlacement}
              showHotspots={true}
              className="w-full h-auto drop-shadow-sm select-none"
            />
          </div>

          {/* Diagram Note */}
          <div className="mt-4 pt-3 border-t border-neutral-200 text-center w-full">
            <span className="text-[10px] text-neutral-400 block uppercase font-bold tracking-wider">
              Technical Placement Guide
            </span>
            <span className="text-[10px] text-neutral-500 block mt-0.5">
              Click any designated hotspot to toggle. Precise production dimensions verified with digital proof.
            </span>
          </div>
        </div>

        {/* Right: Placements Selection List & Details Config */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Quick Select Placement Chips */}
          <div>
            <span className="text-[11px] font-bold uppercase text-neutral-500 block mb-2">
              Available Placement Zones ({placementsDef.length})
            </span>
            <div className="flex flex-wrap gap-2">
              {placementsDef.map((def) => {
                const isSelected = selectedLocations.includes(def.id);
                const isActive = activePlacementId === def.id;

                return (
                  <button
                    key={def.id}
                    type="button"
                    onClick={() => handleTogglePlacement(def.id)}
                    className={`px-3 py-2 text-xs font-bold uppercase rounded-sm border transition-all flex items-center gap-2 ${
                      isSelected
                        ? isActive
                          ? 'border-[#E51E2B] bg-[#E51E2B] text-white shadow-xs'
                          : 'border-[#E51E2B] bg-red-50 text-[#E51E2B]'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                    }`}
                  >
                    <span>{def.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Placement Specification & File Mapper */}
          <div className="space-y-3 pt-2">
            <span className="text-[11px] font-bold uppercase text-neutral-700 block">
              Configured Placement Specifications ({placements.length})
            </span>

            {placements.map((plc) => {
              const def = placementsDef.find(d => d.id === plc.placementLocation);
              const isActive = activePlacementId === plc.placementLocation;

              return (
                <div
                  key={plc.placementLocation}
                  className={`border-2 p-3.5 sm:p-4 rounded-sm transition-all bg-white ${
                    isActive ? 'border-[#E51E2B] ring-1 ring-[#E51E2B]/40' : 'border-neutral-200'
                  }`}
                >
                  {/* Title & Delete */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#E51E2B]" />
                      <h4 className="text-xs font-bold uppercase text-neutral-900">
                        {def?.label || plc.placementLocation}
                      </h4>
                      <span className="text-[10px] text-neutral-400 font-normal">
                        ({def?.defaultDimensions})
                      </span>
                    </div>

                    {placements.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleTogglePlacement(plc.placementLocation)}
                        className="text-neutral-400 hover:text-red-600 p-1 text-[11px] flex items-center gap-1 uppercase transition-colors"
                        title="Remove this placement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Remove</span>
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-neutral-500 mb-3">
                    {def?.description}
                  </p>

                  {/* Print Size Selection */}
                  <div className="space-y-1.5 mb-3">
                    <span className="text-[10px] font-bold text-neutral-600 uppercase block">
                      Preferred Print Scale:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs">
                      {(['small', 'medium', 'large', 'full_print', 'custom'] as PrintSize[]).map((sizeKey) => {
                        const isSizeActive = plc.printSize === sizeKey;
                        const labels: Record<PrintSize, string> = {
                          small: 'Small (Pocket)',
                          medium: 'Medium (A4)',
                          large: 'Large (A3)',
                          full_print: 'Full Print',
                          custom: 'Custom Dim.'
                        };

                        return (
                          <button
                            key={sizeKey}
                            type="button"
                            onClick={() => handleUpdatePrintSize(plc.placementLocation, sizeKey)}
                            className={`px-2 py-1.5 text-[11px] font-bold uppercase rounded-xs border text-center transition-colors ${
                              isSizeActive
                                ? 'bg-neutral-900 text-white border-neutral-900'
                                : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                            }`}
                          >
                            {labels[sizeKey]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Dimensions Input (When custom is selected) */}
                  {plc.printSize === 'custom' && (
                    <div className="mb-3 p-2.5 bg-neutral-50 border border-neutral-200 rounded-xs">
                      <label className="text-[10px] font-bold text-neutral-700 uppercase block mb-1">
                        Enter Custom Print Dimensions (e.g., 10" × 12" or 25 × 30 cm) *
                      </label>
                      <input
                        type="text"
                        value={plc.customDimensions || ''}
                        onChange={(e) => handleUpdateCustomDimensions(plc.placementLocation, e.target.value)}
                        placeholder="Width × Height with units (inches or cm)"
                        className="w-full p-2 text-xs border border-neutral-300 font-mono bg-white"
                      />
                    </div>
                  )}

                  {/* Dedicated Artwork Association for this placement */}
                  <div className="pt-2 border-t border-neutral-150">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase text-neutral-700">
                        Artwork for {def?.label}:
                      </span>
                      {plc.artworkUrl ? (
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Artwork Linked</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-neutral-400">
                          (Shared main artwork or assign specific file)
                        </span>
                      )}
                    </div>

                    {/* If files have already been uploaded in Step 1, allow quick mapping */}
                    {uploadedFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {uploadedFiles.map((f) => {
                          const isAssigned = plc.artworkUrl === f.fileUrl;
                          return (
                            <button
                              key={f.fileUrl}
                              type="button"
                              onClick={() => handleAssociateFile(plc.placementLocation, f.fileUrl, f.fileKey)}
                              className={`px-2 py-1 text-[10px] font-bold uppercase rounded-xs border truncate max-w-[200px] transition-colors ${
                                isAssigned
                                  ? 'bg-[#E51E2B] text-white border-[#E51E2B]'
                                  : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                              }`}
                            >
                              Use: {f.fileName}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Dedicated File Upload for this location */}
                    {onUploadFileForPlacement && (
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer inline-flex items-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 px-2.5 py-1.5 text-[10px] font-bold uppercase rounded-xs text-neutral-800 transition-colors">
                          <Upload className="w-3 h-3 text-[#E51E2B]" />
                          <span>{isUploading ? 'Uploading...' : `Upload Distinct Art for ${def?.label}`}</span>
                          <input
                            type="file"
                            accept=".png,.jpg,.jpeg,.webp,.pdf"
                            className="hidden"
                            disabled={isUploading}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                onUploadFileForPlacement(plc.placementLocation, file);
                              }
                            }}
                          />
                        </label>
                        {plc.artworkUrl && (
                          <a
                            href={plc.artworkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-[#E51E2B] underline truncate max-w-[150px]"
                          >
                            Preview Art
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
};

export default PrintPlacementSelector;
