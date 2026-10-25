import React from 'react';
import { Check } from 'lucide-react';
import type { ColorSwatch } from '../../types/customise';

interface ColorSwatchPickerProps {
  colors: ColorSwatch[];
  selectedColorName: string;
  onSelectColor: (color: ColorSwatch) => void;
}

export const ColorSwatchPicker: React.FC<ColorSwatchPickerProps> = ({
  colors,
  selectedColorName,
  onSelectColor
}) => {
  const currentColor = colors.find(c => c.name === selectedColorName) || colors[0];

  return (
    <div className="space-y-3 font-mono">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
          <span>Primary Garment Blank Colour *</span>
          <span className="text-[10px] text-neutral-400 font-normal">Reactive dyed cotton</span>
        </label>
        <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-full border border-neutral-300 inline-block shadow-2xs"
            style={{ backgroundColor: currentColor?.hex }}
          />
          <span className="text-[#E51E2B]">{currentColor?.name}</span>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {colors.map((color) => {
          const isSelected = selectedColorName === color.name;
          const isWhite = color.hex.toUpperCase() === '#FFFFFF';
          const isDark = ['#111111', '#58111A', '#3E2723', '#152238'].includes(color.hex.toUpperCase());

          return (
            <button
              key={color.name}
              type="button"
              onClick={() => onSelectColor(color)}
              aria-label={`Select garment colour ${color.name}`}
              className={`p-2.5 border-2 rounded-sm text-left transition-all duration-150 flex items-center gap-2.5 cursor-pointer ${
                isSelected
                  ? 'border-[#E51E2B] bg-red-50/20 shadow-xs ring-1 ring-[#E51E2B]'
                  : 'border-neutral-200 bg-white hover:border-neutral-400'
              }`}
            >
              {/* Color Swatch Circle */}
              <div
                className="w-7 h-7 rounded-full border border-neutral-300 shrink-0 flex items-center justify-center shadow-2xs transition-transform"
                style={{ backgroundColor: color.hex }}
              >
                {isSelected && (
                  <Check
                    className={`w-4 h-4 ${isDark ? 'text-white' : 'text-neutral-900'}`}
                    strokeWidth={3}
                  />
                )}
              </div>

              {/* Color Name & Badge */}
              <div className="truncate">
                <span className="block text-xs font-bold uppercase text-neutral-900 truncate">
                  {color.name}
                </span>
                {color.badge && (
                  <span className="text-[9px] text-neutral-400 font-mono block truncate">
                    {color.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ColorSwatchPicker;
