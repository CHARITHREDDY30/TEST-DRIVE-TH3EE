import React, { useState, useEffect } from 'react';
import {
  Ruler,
  Save,
  RotateCcw,
  Check,
  Plus,
  Trash2,
  AlertCircle,
  Eye,
  Info,
  Layers,
  Sparkles,
  Search
} from 'lucide-react';
import type { Product } from '../../types/store';
import type {
  ProductSizeChart,
  GarmentMeasurementEntry,
  MeasurementUnit
} from '../../types/sizing';
import { sizingService } from '../../services/sizing.service';
import { cmToInches, inchesToCm } from '../../services/sizingEngine.service';
import { getBaselineSizeChartForProduct } from '../../data/defaultSizeCharts';

interface AdminSizeChartManagerProps {
  products: Product[];
  showNotification?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdminSizeChartManager: React.FC<AdminSizeChartManagerProps> = ({
  products,
  showNotification = () => {}
}) => {
  const [allSizeCharts, setAllSizeCharts] = useState<Record<string, ProductSizeChart>>({});
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || 'default');
  const [currentChart, setCurrentChart] = useState<ProductSizeChart | null>(null);
  const [previewUnit, setPreviewUnit] = useState<MeasurementUnit>('cm');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Load size charts on mount
  useEffect(() => {
    sizingService.getAllSizeCharts().then(charts => {
      setAllSizeCharts(charts);
    });
  }, []);

  // When selected product changes, load its custom chart or baseline
  useEffect(() => {
    const targetProduct = products.find(p => p.id === selectedProductId || p.slug === selectedProductId) || products[0];
    if (!targetProduct) return;

    if (allSizeCharts[targetProduct.id]) {
      setCurrentChart(JSON.parse(JSON.stringify(allSizeCharts[targetProduct.id])));
    } else if (targetProduct.slug && allSizeCharts[targetProduct.slug]) {
      setCurrentChart(JSON.parse(JSON.stringify(allSizeCharts[targetProduct.slug])));
    } else {
      const baseline = getBaselineSizeChartForProduct(targetProduct);
      setCurrentChart({
        ...baseline,
        productId: targetProduct.id,
        productName: targetProduct.name
      });
    }
    setHasUnsavedChanges(false);
  }, [selectedProductId, allSizeCharts, products]);

  // Update a single measurement row
  const handleUpdateMeasurement = (
    index: number,
    field: keyof GarmentMeasurementEntry,
    value: any
  ) => {
    if (!currentChart) return;
    const updated = [...currentChart.measurements];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setCurrentChart({
      ...currentChart,
      measurements: updated
    });
    setHasUnsavedChanges(true);
  };

  // Add new size row
  const handleAddSizeRow = () => {
    if (!currentChart) return;
    const existingSizes = currentChart.measurements.map(m => m.size);
    const standardSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
    const nextSize = standardSizes.find(s => !existingSizes.includes(s)) || `Size ${existingSizes.length + 1}`;

    const newRow: GarmentMeasurementEntry = {
      size: nextSize,
      chestCm: 110,
      shoulderCm: 55,
      lengthCm: 75,
      sleeveCm: 24,
      waistCm: 108,
      hipCm: 110,
      isAvailable: true
    };

    setCurrentChart({
      ...currentChart,
      measurements: [...currentChart.measurements, newRow]
    });
    setHasUnsavedChanges(true);
  };

  // Delete size row
  const handleDeleteSizeRow = (index: number) => {
    if (!currentChart) return;
    const updated = currentChart.measurements.filter((_, i) => i !== index);
    setCurrentChart({
      ...currentChart,
      measurements: updated
    });
    setHasUnsavedChanges(true);
  };

  // Save chart
  const handleSaveChart = async () => {
    if (!currentChart) return;
    setIsSaving(true);
    try {
      const saved = await sizingService.saveProductSizeChart(currentChart);
      setAllSizeCharts(prev => ({
        ...prev,
        [saved.productId]: saved
      }));
      setHasUnsavedChanges(false);
      showNotification(`Size chart for "${currentChart.productName}" saved successfully.`, 'success');
    } catch (err: any) {
      showNotification(`Failed to save size chart: ${err.message || 'Network error'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default baseline specs
  const handleResetToBaseline = async () => {
    const targetProduct = products.find(p => p.id === selectedProductId || p.slug === selectedProductId);
    if (!targetProduct) return;

    if (window.confirm(`Reset "${targetProduct.name}" size chart back to factory baseline specs?`)) {
      await sizingService.deleteProductSizeChart(targetProduct.id);
      const baseline = getBaselineSizeChartForProduct(targetProduct);
      setCurrentChart({
        ...baseline,
        productId: targetProduct.id,
        productName: targetProduct.name
      });
      setAllSizeCharts(prev => {
        const copy = { ...prev };
        delete copy[targetProduct.id];
        return copy;
      });
      setHasUnsavedChanges(false);
      showNotification('Reverted to factory baseline specifications.', 'info');
    }
  };

  // Filtered products list for selector
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.category.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.id.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const activeProduct = products.find(p => p.id === selectedProductId) || products[0];

  return (
    <div className="space-y-6 font-mono text-neutral-900">
      
      {/* Top Banner / Header */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-[#E51E2B]/10 text-[#E51E2B] text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-1">
            <Ruler className="w-3.5 h-3.5" />
            <span>Garment Size Chart Management</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-neutral-900">
            Silhouette Dimensions & Fit Rules
          </h2>
          <p className="text-xs text-neutral-500 font-sans mt-0.5">
            Configure product-specific flat garment dimensions in centimetres. Storefront Size Finder calculates live recommendations directly from these values.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full animate-pulse">
              ● Unsaved Changes
            </span>
          )}
          <button
            type="button"
            onClick={handleSaveChart}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-[#E51E2B] hover:bg-[#c91823] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm hover:shadow cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Measurements</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Product Selector & Silhouette Settings */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Product Picker */}
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                Select Product
              </label>
              <span className="text-[10px] text-neutral-400">
                {products.length} Drops
              </span>
            </div>

            {/* Quick search filter */}
            <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1.5">
              <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <input
                type="text"
                placeholder="Search silhouettes..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="w-full text-xs font-mono bg-transparent focus:outline-none"
              />
            </div>

            {/* Product list */}
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
              {filteredProducts.map(prod => {
                const isSelected = selectedProductId === prod.id;
                const hasCustomChart = Boolean(allSizeCharts[prod.id]);

                return (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => setSelectedProductId(prod.id)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-0.5 ${
                      isSelected
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                        : 'border-neutral-200/70 bg-white hover:border-neutral-400 text-neutral-800'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold uppercase truncate max-w-[200px]">
                        {prod.name}
                      </span>
                      {hasCustomChart && (
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-[#E51E2B] text-white' : 'bg-neutral-100 text-neutral-700'}`}>
                          Customized
                        </span>
                      )}
                    </div>
                    <div className={`text-[10px] flex items-center gap-2 ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      <span>{prod.category}</span>
                      <span>•</span>
                      <span>{prod.fit || 'Oversized'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Silhouette & Fit Properties */}
          {currentChart && (
            <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Fit & Cut Configuration
                </span>
                <span className="text-[10px] text-neutral-400">Atelier Specs</span>
              </div>

              {/* Fit Type Selection */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-neutral-500">
                  Fit Archetype
                </label>
                <select
                  value={currentChart.fitType}
                  onChange={e => {
                    setCurrentChart({ ...currentChart, fitType: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-black"
                >
                  <option value="Oversized">Oversized (Drop-Shoulder Box Cut)</option>
                  <option value="Regular Fit">Regular Fit (Classic Atelier Standard)</option>
                  <option value="Boxy Fit">Boxy Fit (Japanese Wide Crop)</option>
                  <option value="Slim Fit">Slim Fit (Tailored Contour)</option>
                </select>
              </div>

              {/* Fabric & GSM */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-500">
                    Fabric GSM
                  </label>
                  <input
                    type="text"
                    value={currentChart.gsm || ''}
                    placeholder="e.g. 290 GSM"
                    onChange={e => {
                      setCurrentChart({ ...currentChart, gsm: e.target.value });
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-500">
                    Fabric Weave
                  </label>
                  <input
                    type="text"
                    value={currentChart.fabric || ''}
                    placeholder="e.g. Combed Cotton"
                    onChange={e => {
                      setCurrentChart({ ...currentChart, fabric: e.target.value });
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* Preferred Fit / Drape Note */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-neutral-500">
                  Preferred Fit Guidance Note
                </label>
                <textarea
                  rows={2}
                  value={currentChart.preferredFitRecommendation || ''}
                  placeholder="e.g. Designed for a relaxed streetwear fit. Stay true to size."
                  onChange={e => {
                    setCurrentChart({ ...currentChart, preferredFitRecommendation: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-2.5 text-xs font-sans focus:outline-none"
                />
              </div>

              {/* Reset to Factory Defaults */}
              <button
                type="button"
                onClick={handleResetToBaseline}
                className="w-full py-2 px-3 rounded-xl border border-neutral-200 hover:border-red-300 hover:text-red-600 text-neutral-500 text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Revert to Factory Baseline</span>
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Garment Measurements Matrix & Live Preview */}
        <div className="lg:col-span-8 space-y-4">
          
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 block">
                  Garment Dimension Matrix (Flat Laid)
                </span>
                <span className="text-[10px] text-neutral-500 font-sans">
                  Standard unit: <strong className="font-bold text-black font-mono">Centimetres (CM)</strong>. Preview converts automatically to inches for reference.
                </span>
              </div>

              {/* Unit Toggle for Preview */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-neutral-400">View In:</span>
                <div className="inline-flex p-0.5 bg-neutral-100 rounded-full border border-neutral-200 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setPreviewUnit('cm')}
                    className={`px-3 py-1 rounded-full cursor-pointer transition-all ${
                      previewUnit === 'cm' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600'
                    }`}
                  >
                    CM
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewUnit('in')}
                    className={`px-3 py-1 rounded-full cursor-pointer transition-all ${
                      previewUnit === 'in' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600'
                    }`}
                  >
                    INCHES
                  </button>
                </div>
              </div>
            </div>

            {/* Editable Measurements Table */}
            {currentChart && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 text-[10px] uppercase font-bold text-neutral-500">
                      <th className="py-2.5 px-2">Size</th>
                      <th className="py-2.5 px-2">Chest ({previewUnit})</th>
                      <th className="py-2.5 px-2">Length ({previewUnit})</th>
                      <th className="py-2.5 px-2">Shoulder ({previewUnit})</th>
                      <th className="py-2.5 px-2">Sleeve ({previewUnit})</th>
                      <th className="py-2.5 px-2">Waist ({previewUnit})</th>
                      <th className="py-2.5 px-2">Hips ({previewUnit})</th>
                      <th className="py-2.5 px-2 text-center">In Stock</th>
                      <th className="py-2.5 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {currentChart.measurements.map((row, idx) => {
                      // Helper to display in selected unit while editing in cm
                      const displayChest = previewUnit === 'in' ? cmToInches(row.chestCm) : row.chestCm;
                      const displayLength = previewUnit === 'in' ? cmToInches(row.lengthCm) : row.lengthCm;
                      const displayShoulder = previewUnit === 'in' ? cmToInches(row.shoulderCm) : row.shoulderCm;
                      const displaySleeve = previewUnit === 'in' ? cmToInches(row.sleeveCm) : row.sleeveCm;
                      const displayWaist = row.waistCm ? (previewUnit === 'in' ? cmToInches(row.waistCm) : row.waistCm) : '';
                      const displayHip = row.hipCm ? (previewUnit === 'in' ? cmToInches(row.hipCm) : row.hipCm) : '';

                      return (
                        <tr key={idx} className="hover:bg-neutral-50/70 transition-colors">
                          {/* Size Name */}
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={row.size}
                              onChange={e => handleUpdateMeasurement(idx, 'size', e.target.value.toUpperCase())}
                              className="w-12 font-bold text-xs bg-neutral-50 border border-neutral-200 rounded-lg p-1 text-center uppercase"
                            />
                          </td>

                          {/* Chest */}
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              step="0.5"
                              value={displayChest}
                              onChange={e => {
                                const val = Number(e.target.value);
                                const inCm = previewUnit === 'in' ? inchesToCm(val) : val;
                                handleUpdateMeasurement(idx, 'chestCm', inCm);
                              }}
                              className="w-16 font-mono text-xs bg-white border border-neutral-300 rounded-lg p-1 text-center focus:border-black"
                            />
                          </td>

                          {/* Length */}
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              step="0.5"
                              value={displayLength}
                              onChange={e => {
                                const val = Number(e.target.value);
                                const inCm = previewUnit === 'in' ? inchesToCm(val) : val;
                                handleUpdateMeasurement(idx, 'lengthCm', inCm);
                              }}
                              className="w-16 font-mono text-xs bg-white border border-neutral-300 rounded-lg p-1 text-center focus:border-black"
                            />
                          </td>

                          {/* Shoulder */}
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              step="0.5"
                              value={displayShoulder}
                              onChange={e => {
                                const val = Number(e.target.value);
                                const inCm = previewUnit === 'in' ? inchesToCm(val) : val;
                                handleUpdateMeasurement(idx, 'shoulderCm', inCm);
                              }}
                              className="w-16 font-mono text-xs bg-white border border-neutral-300 rounded-lg p-1 text-center focus:border-black"
                            />
                          </td>

                          {/* Sleeve */}
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              step="0.5"
                              value={displaySleeve}
                              onChange={e => {
                                const val = Number(e.target.value);
                                const inCm = previewUnit === 'in' ? inchesToCm(val) : val;
                                handleUpdateMeasurement(idx, 'sleeveCm', inCm);
                              }}
                              className="w-16 font-mono text-xs bg-white border border-neutral-300 rounded-lg p-1 text-center focus:border-black"
                            />
                          </td>

                          {/* Waist (Optional) */}
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              step="0.5"
                              value={displayWaist}
                              placeholder="—"
                              onChange={e => {
                                const val = e.target.value ? Number(e.target.value) : undefined;
                                const inCm = val !== undefined ? (previewUnit === 'in' ? inchesToCm(val) : val) : undefined;
                                handleUpdateMeasurement(idx, 'waistCm', inCm);
                              }}
                              className="w-16 font-mono text-xs bg-white border border-neutral-300 rounded-lg p-1 text-center focus:border-black"
                            />
                          </td>

                          {/* Hip (Optional) */}
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              step="0.5"
                              value={displayHip}
                              placeholder="—"
                              onChange={e => {
                                const val = e.target.value ? Number(e.target.value) : undefined;
                                const inCm = val !== undefined ? (previewUnit === 'in' ? inchesToCm(val) : val) : undefined;
                                handleUpdateMeasurement(idx, 'hipCm', inCm);
                              }}
                              className="w-16 font-mono text-xs bg-white border border-neutral-300 rounded-lg p-1 text-center focus:border-black"
                            />
                          </td>

                          {/* Availability Toggle */}
                          <td className="py-2 px-2 text-center">
                            <input
                              type="checkbox"
                              checked={row.isAvailable !== false}
                              onChange={e => handleUpdateMeasurement(idx, 'isAvailable', e.target.checked)}
                              className="w-4 h-4 accent-neutral-900 rounded cursor-pointer"
                            />
                          </td>

                          {/* Delete row */}
                          <td className="py-2 px-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteSizeRow(idx)}
                              disabled={currentChart.measurements.length <= 1}
                              className="p-1 text-neutral-400 hover:text-red-600 disabled:opacity-30 cursor-pointer"
                              title="Delete size row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add Size Row Button */}
            <div className="pt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={handleAddSizeRow}
                className="px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Size Row</span>
              </button>

              <span className="text-[10px] text-neutral-400">
                All measurements stored in Postgres backend as canonical centimetres.
              </span>
            </div>
          </div>

          {/* Size Chart Customer Preview Card */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-neutral-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                Customer Storefront Size Guide Preview
              </span>
            </div>
            <p className="text-xs text-neutral-600 font-sans">
              This is how your customers will experience this silhouette's size guide on <strong className="font-mono text-black">th3ee.in/products/{activeProduct?.slug}</strong>.
            </p>
            <div className="p-3 bg-white border border-neutral-200 rounded-xl text-xs space-y-1">
              <div className="font-bold uppercase text-neutral-900">
                {currentChart?.fitType || 'Oversized'} Silhouette Guide · {currentChart?.gsm || 'Heavyweight'}
              </div>
              <p className="text-[11px] text-neutral-500 font-sans">
                {currentChart?.preferredFitRecommendation || 'Standard drop-shoulder streetwear fit.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

