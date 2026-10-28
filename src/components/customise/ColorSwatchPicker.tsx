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
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-neutral-900">
          Color *
        </label>
        <span className="text-xs font-bold text-[#FF2E2E] flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-full border border-neutral-300 inline-block shadow-2xs"
            style={{ backgroundColor: currentColor?.hex }}
          />
          <span>{currentColor?.name}</span>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {colors.map((color) => {
          const isSelected = selectedColorName === color.name;
          const isDark = ['#111111', '#27272A', '#58111A', '#3E2723', '#152238', '#1B4332', '#4B5320', '#1E40AF'].includes(color.hex.toUpperCase());

          return (
            <button
              key={color.name}
              type="button"
              onClick={() => onSelectColor(color)}
              aria-label={`Select ${color.name}`}
              className={`p-2 border-2 rounded-2xl text-left transition-all flex items-center gap-2 cursor-pointer min-h-[44px] ${
                isSelected
                  ? 'border-[#FF2E2E] bg-red-50/20 ring-2 ring-[#FF2E2E]/20 shadow-2xs'
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}
            >
              <div
                className="w-6 h-6 rounded-full border border-neutral-300 shrink-0 flex items-center justify-center shadow-2xs"
                style={{ backgroundColor: color.hex }}
              >
                {isSelected && (
                  <Check
                    className={`w-3.5 h-3.5 ${isDark ? 'text-white' : 'text-neutral-900'}`}
                    strokeWidth={3}
                  />
                )}
              </div>

              <span className="block text-xs font-bold uppercase text-neutral-900 truncate">
                {color.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ColorSwatchPicker;
