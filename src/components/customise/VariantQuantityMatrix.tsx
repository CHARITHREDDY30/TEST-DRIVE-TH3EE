import React from 'react';
import { Plus, Trash2, Calendar, Target, AlertTriangle, Layers, Minus, Palette } from 'lucide-react';
import type { CustomRequestVariant, ColorSwatch } from '../../types/customise';

interface VariantQuantityMatrixProps {
  variants: CustomRequestVariant[];
  onChangeVariants: (variants: CustomRequestVariant[]) => void;
  colors: ColorSwatch[];
  availableSizes?: string[];
  intendedUse: string;
  onChangeIntendedUse: (use: string) => void;
  requiredDate: string;
  onChangeRequiredDate: (date: string) => void;
  additionalNotes: string;
  onChangeAdditionalNotes: (notes: string) => void;
}

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const INTENDED_USE_OPTIONS = [
  { id: 'personal', label: 'Personal Wardrobe Statement' },
  { id: 'event', label: 'Event / Festival Drop' },
  { id: 'group', label: 'Group / Team / College Society' },
  { id: 'business', label: 'Brand Merchandise / Business Uniform' },
  { id: 'other', label: 'Other Custom Project' }
];

export const VariantQuantityMatrix: React.FC<VariantQuantityMatrixProps> = ({
  variants,
  onChangeVariants,
  colors,
  availableSizes = DEFAULT_SIZES,
  intendedUse,
  onChangeIntendedUse,
  requiredDate,
  onChangeRequiredDate,
  additionalNotes,
  onChangeAdditionalNotes
}) => {
  // Add new variant row
  const handleAddRow = () => {
    const defaultColor = colors[0]?.name || 'Jet Black';
    const defaultSize = availableSizes[2] || 'L'; // L default
    const newRow: CustomRequestVariant = {
      color: defaultColor,
      size: defaultSize,
      quantity: 1,
      notes: ''
    };
    onChangeVariants([...variants, newRow]);
  };

  // Remove variant row
  const handleRemoveRow = (index: number) => {
    if (variants.length <= 1) return; // Keep at least one
    const next = variants.filter((_, i) => i !== index);
    onChangeVariants(next);
  };

  // Update specific row property
  const handleUpdateRow = (index: number, field: keyof CustomRequestVariant, value: any) => {
    const next = [...variants];
    next[index] = { ...next[index], [field]: value };
    onChangeVariants(next);
  };

  // Compute total quantity
  const totalQuantity = variants.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);

  return (
    <div className="space-y-5 font-mono">
      {/* Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#E51E2B]" />
              <span>Multi-Size & Color Breakdown</span>
            </label>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Specify different colorway and size allocations for your run in a single request.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddRow}
            className="self-stretch sm:self-auto bg-neutral-900 hover:bg-[#E51E2B] text-white px-3.5 py-2 sm:py-1.5 text-xs font-bold uppercase tracking-wider transition-colors rounded-xs flex items-center justify-center gap-1.5 shadow-2xs min-h-[40px] sm:min-h-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Size / Color Row</span>
          </button>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* MOBILE VIEW: TOUCH-FRIENDLY CARDS (below sm breakpoint) */}
        {/* ----------------------------------------------------------------- */}
        <div className="block sm:hidden space-y-3">
          {variants.map((v, idx) => {
            const currentColor = colors.find((c) => c.name === v.color);
            return (
              <div
                key={idx}
                className="bg-neutral-50/90 border border-neutral-300 rounded-xs p-3.5 space-y-3 relative shadow-xs"
              >
                {/* Card Title & Delete */}
                <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                  <span className="text-[11px] font-black uppercase text-neutral-800 tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span>Piece Group #{idx + 1}</span>
                  </span>

                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(idx)}
                      className="text-red-500 hover:text-red-700 p-1 flex items-center gap-1 text-[11px] font-bold uppercase"
                      title="Remove row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>

                {/* 2-Column: Colorway & Size */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1 flex items-center gap-1">
                      <Palette className="w-3 h-3 text-[#E51E2B]" />
                      <span>Colorway</span>
                    </label>
                    <div className="relative">
                      <select
                        value={v.color}
                        onChange={(e) => handleUpdateRow(idx, 'color', e.target.value)}
                        className="w-full pl-7 pr-2 py-2 border border-neutral-300 rounded-xs bg-white text-xs font-bold uppercase"
                      >
                        {colors.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      {currentColor && (
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-neutral-400 absolute left-2 top-2.5 pointer-events-none"
                          style={{ backgroundColor: currentColor.hex }}
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
                      Size
                    </label>
                    <select
                      value={v.size}
                      onChange={(e) => handleUpdateRow(idx, 'size', e.target.value)}
                      className="w-full p-2 border border-neutral-300 rounded-xs bg-white text-xs font-bold uppercase"
                    >
                      {availableSizes.map((s) => (
                        <option key={s} value={s}>
                          Size {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Quantity Stepper */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-bold uppercase text-neutral-700">Quantity:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateRow(idx, 'quantity', Math.max(1, (v.quantity || 1) - 1))}
                      disabled={(v.quantity || 1) <= 1}
                      className="w-8 h-8 rounded-xs border border-neutral-300 bg-white flex items-center justify-center hover:bg-neutral-100 disabled:opacity-40"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={v.quantity}
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                        handleUpdateRow(idx, 'quantity', val);
                      }}
                      className="w-12 py-1.5 text-center border border-neutral-300 rounded-xs font-bold text-xs bg-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateRow(idx, 'quantity', (v.quantity || 1) + 1)}
                      className="w-8 h-8 rounded-xs border border-neutral-300 bg-white flex items-center justify-center hover:bg-neutral-100"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Specific Notes */}
                <div>
                  <input
                    type="text"
                    placeholder="Notes (e.g. back number, custom name)"
                    value={v.notes || ''}
                    onChange={(e) => handleUpdateRow(idx, 'notes', e.target.value)}
                    className="w-full p-2 border border-neutral-200 rounded-xs text-[11px] bg-white"
                  />
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={handleAddRow}
            className="w-full py-2.5 border-2 border-dashed border-neutral-300 hover:border-black rounded-xs text-xs font-bold uppercase tracking-wider text-neutral-700 bg-neutral-50/50 flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            <Plus className="w-4 h-4 text-[#E51E2B]" />
            <span>+ Add Another Variant Row</span>
          </button>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* DESKTOP TABLE VIEW (sm breakpoint and above) */}
        {/* ----------------------------------------------------------------- */}
        <div className="hidden sm:block border border-neutral-200 overflow-x-auto rounded-sm bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-900 text-white font-bold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3 border-r border-neutral-800">Colourway</th>
                <th className="py-2.5 px-3 border-r border-neutral-800 w-32">Size</th>
                <th className="py-2.5 px-3 border-r border-neutral-800 w-28 text-center">Quantity</th>
                <th className="py-2.5 px-3">Notes / Placement Specs</th>
                <th className="py-2.5 px-2 w-10 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {variants.map((v, idx) => (
                <tr key={idx} className="hover:bg-neutral-50 transition-colors">
                  {/* Colourway Select */}
                  <td className="p-2 border-r border-neutral-200 min-w-[160px]">
                    <select
                      value={v.color}
                      onChange={(e) => handleUpdateRow(idx, 'color', e.target.value)}
                      className="w-full p-2 border border-neutral-300 rounded-xs bg-neutral-50 font-bold uppercase text-xs"
                    >
                      {colors.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Size Select */}
                  <td className="p-2 border-r border-neutral-200">
                    <select
                      value={v.size}
                      onChange={(e) => handleUpdateRow(idx, 'size', e.target.value)}
                      className="w-full p-2 border border-neutral-300 rounded-xs bg-neutral-50 font-bold uppercase text-xs"
                    >
                      {availableSizes.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Quantity Input */}
                  <td className="p-2 border-r border-neutral-200 text-center">
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={v.quantity}
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                        handleUpdateRow(idx, 'quantity', val);
                      }}
                      className="w-20 p-2 text-center border border-neutral-300 rounded-xs font-bold text-xs bg-white font-mono"
                    />
                  </td>

                  {/* Specific notes */}
                  <td className="p-2">
                    <input
                      type="text"
                      placeholder="e.g. Back print only, or custom name"
                      value={v.notes || ''}
                      onChange={(e) => handleUpdateRow(idx, 'notes', e.target.value)}
                      className="w-full p-2 border border-neutral-200 rounded-xs text-[11px] bg-neutral-50/50"
                    />
                  </td>

                  {/* Remove Button */}
                  <td className="p-2 text-center">
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
                        className="p-1 text-neutral-400 hover:text-red-600 transition-colors"
                        title="Remove row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total Quantity Tally Summary */}
        <div className="mt-3 p-3 bg-neutral-900 text-white rounded-sm flex items-center justify-between text-xs font-bold uppercase">
          <span>Total Garment Run Count:</span>
          <span className="text-base font-black text-[#E51E2B] tracking-wider font-mono">
            {totalQuantity} {totalQuantity === 1 ? 'Garment' : 'Garments'}
          </span>
        </div>
      </div>

      {/* Intended Use & Delivery Deadline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
        {/* Intended Use */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5 mb-1.5">
            <Target className="w-3.5 h-3.5 text-[#E51E2B]" />
            <span>Intended Order Purpose:</span>
          </label>
          <select
            value={intendedUse}
            onChange={(e) => onChangeIntendedUse(e.target.value)}
            className="w-full p-2.5 border border-neutral-300 rounded-sm bg-neutral-50 font-bold uppercase text-xs"
          >
            {INTENDED_USE_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Required Delivery Date */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5 mb-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#E51E2B]" />
            <span>Required Delivery Date (Optional):</span>
          </label>
          <input
            type="date"
            value={requiredDate}
            min={new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]} // minimum 3 days out
            onChange={(e) => onChangeRequiredDate(e.target.value)}
            className="w-full p-2.5 border border-neutral-300 rounded-sm bg-neutral-50 text-xs font-bold"
          />
          <div className="mt-1 text-[10px] text-neutral-500 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
            <span>Standard Tirupati atelier turnaround is 4–7 business days pan-India.</span>
          </div>
        </div>
      </div>

      {/* Additional Instructions */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-neutral-800 block mb-1.5">
          Additional Production & Packaging Notes (Optional):
        </label>
        <textarea
          rows={2}
          value={additionalNotes}
          onChange={(e) => onChangeAdditionalNotes(e.target.value)}
          placeholder="e.g. Individual bag packing, festival deadline, special brand tag requirements, or specific CMYK color matching instructions..."
          className="w-full p-2.5 border border-neutral-300 rounded-sm text-xs bg-neutral-50/50"
        />
      </div>
    </div>
  );
};

export default VariantQuantityMatrix;
