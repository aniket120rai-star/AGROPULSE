import { useMemo, useState } from 'react';
import {
  Check,
  Columns3,
  Plus,
  TrendingUp,
  X,
} from 'lucide-react';
import { CROPS_CATALOG } from '../data/agroData';
import type { TranslationBundle } from '../data/translations';
import type {
  BudgetLevel,
  FarmGoal,
  IrrigationType,
  RecommenderFilters,
  SeasonType,
  SoilType,
} from '../types/agro';
import {
  calculateNetProfitPerAcre,
  formatINR,
  getRecommendedCrops,
  toggleCompareCropSelection,
} from '../utils/recommendations';
import { MatchRing, StatusBadge } from './StatusBadge';

interface CropAdvisorViewProps {
  filters: RecommenderFilters;
  onChangeFilters: (next: RecommenderFilters) => void;
  farmPlanIds: string[];
  onToggleFarmPlan: (cropId: string) => void;
  onOpenCalendarForCrop: (cropId: string, season: SeasonType) => void;
  t: TranslationBundle;
}

const SOIL_OPTIONS: SoilType[] = ['Alluvial', 'Clay', 'Loam', 'Sandy', 'Red', 'Black'];
const SEASON_OPTIONS: SeasonType[] = ['Rabi', 'Kharif', 'Zaid'];
const WATER_OPTIONS: IrrigationType[] = ['Canal', 'Borewell', 'Drip', 'Rainfed'];
const BUDGET_OPTIONS: BudgetLevel[] = ['Low', 'Medium', 'High'];
const PREVIOUS_CROP_OPTIONS = [
  'None',
  'Paddy (Rice)',
  'Wheat',
  'Mustard',
  'Maize',
  'Soybean',
  'Potato',
  'Pulses',
];
const GOAL_OPTIONS: FarmGoal[] = ['High Yield', 'Low Water', 'Cash Crop', 'Organic'];

export function CropAdvisorView({
  filters,
  onChangeFilters,
  farmPlanIds,
  onToggleFarmPlan,
  onOpenCalendarForCrop,
  t,
}: CropAdvisorViewProps) {
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showComparePanel, setShowComparePanel] = useState(false);

  const recommendations = useMemo(
    () => getRecommendedCrops(CROPS_CATALOG, filters),
    [filters]
  );

  const comparedCrops = useMemo(
    () =>
      compareIds
        .map((id) => recommendations.find((r) => r.crop.id === id))
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    [compareIds, recommendations]
  );

  const handleToggleCompare = (cropId: string) => {
    setCompareIds((prev) => toggleCompareCropSelection(prev, cropId, 3));
  };

  return (
    <div className="space-y-6">
      {/* Page Title matching Screenshot 2 */}
      <div>
        <div className="flex items-center gap-2.5">
          <TrendingUp className="w-6 h-6 text-[#D97706]" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-[#1E293B] tracking-tight">
            {t.headings.advisorTitle}
          </h1>
        </div>
        <p className="text-sm text-slate-600 mt-1">{t.headings.advisorSubtitle}</p>
      </div>

      {/* Filter Card matching Screenshot 2 */}
      <section
        aria-label="Field Conditions Filter"
        className="rounded-2xl bg-[#FAFBF9] border border-[#DCE3DE] p-5 sm:p-6 space-y-5"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Soil pH Slider */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label htmlFor="advisor-soil-ph" className="text-xs font-semibold text-[#1E293B]">
                Soil pH
              </label>
              <span className="text-sm font-bold text-[#D97706] tabular-nums">
                {filters.soilPh.toFixed(1)}
              </span>
            </div>
            <input
              id="advisor-soil-ph"
              type="range"
              min="4.5"
              max="8.5"
              step="0.1"
              value={filters.soilPh}
              onChange={(e) =>
                onChangeFilters({ ...filters, soilPh: Number(e.target.value) })
              }
              style={{
                background: `linear-gradient(to right, #2D6A4F ${
                  ((filters.soilPh - 4.5) / 4.0) * 100
                }%, #D8E0DB ${((filters.soilPh - 4.5) / 4.0) * 100}%)`,
              }}
              className="w-full agro-slider"
            />
          </div>

          {/* Soil Type */}
          <div>
            <label htmlFor="advisor-soil-type" className="block text-xs font-semibold text-[#1E293B] mb-2">
              Soil type
            </label>
            <select
              id="advisor-soil-type"
              value={filters.soilType}
              onChange={(e) =>
                onChangeFilters({ ...filters, soilType: e.target.value as SoilType })
              }
              className="w-full rounded-xl border border-[#DCE3DE] bg-white px-3.5 py-2.5 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
            >
              {SOIL_OPTIONS.map((soil) => (
                <option key={soil} value={soil}>
                  {soil}
                </option>
              ))}
            </select>
          </div>

          {/* Season */}
          <div>
            <label htmlFor="advisor-season" className="block text-xs font-semibold text-[#1E293B] mb-2">
              Season
            </label>
            <select
              id="advisor-season"
              value={filters.season}
              onChange={(e) =>
                onChangeFilters({ ...filters, season: e.target.value as SeasonType })
              }
              className="w-full rounded-xl border border-[#DCE3DE] bg-white px-3.5 py-2.5 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
            >
              {SEASON_OPTIONS.map((season) => (
                <option key={season} value={season}>
                  {t.seasons[season]}
                </option>
              ))}
            </select>
          </div>

          {/* Water availability */}
          <div>
            <label htmlFor="advisor-water" className="block text-xs font-semibold text-[#1E293B] mb-2">
              Water availability
            </label>
            <select
              id="advisor-water"
              value={filters.waterAvailability}
              onChange={(e) =>
                onChangeFilters({
                  ...filters,
                  waterAvailability: e.target.value as IrrigationType,
                })
              }
              className="w-full rounded-xl border border-[#DCE3DE] bg-white px-3.5 py-2.5 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
            >
              {WATER_OPTIONS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          {/* Budget level */}
          <div>
            <label htmlFor="advisor-budget" className="block text-xs font-semibold text-[#1E293B] mb-2">
              Budget level
            </label>
            <select
              id="advisor-budget"
              value={filters.budgetLevel}
              onChange={(e) =>
                onChangeFilters({ ...filters, budgetLevel: e.target.value as BudgetLevel })
              }
              className="w-full rounded-xl border border-[#DCE3DE] bg-white px-3.5 py-2.5 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
            >
              {BUDGET_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Previous crop */}
          <div>
            <label htmlFor="advisor-prev-crop" className="block text-xs font-semibold text-[#1E293B] mb-2">
              Previous crop (for rotation advice)
            </label>
            <select
              id="advisor-prev-crop"
              value={filters.previousCrop}
              onChange={(e) =>
                onChangeFilters({ ...filters, previousCrop: e.target.value })
              }
              className="w-full rounded-xl border border-[#DCE3DE] bg-white px-3.5 py-2.5 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
            >
              {PREVIOUS_CROP_OPTIONS.map((prev) => (
                <option key={prev} value={prev}>
                  {prev === 'None' ? 'None / first season' : prev}
                </option>
              ))}
            </select>
          </div>

          {/* Primary Goal */}
          <div className="md:col-span-1">
            <label htmlFor="advisor-goal" className="block text-xs font-semibold text-[#1E293B] mb-2">
              What is your primary goal this year?
            </label>
            <select
              id="advisor-goal"
              value={filters.goal}
              onChange={(e) =>
                onChangeFilters({ ...filters, goal: e.target.value as FarmGoal })
              }
              className="w-full rounded-xl border border-[#DCE3DE] bg-white px-3.5 py-2.5 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
            >
              {GOAL_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Results Header + Comparison Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-base font-bold text-[#1E293B] tabular-nums">
          Recommended crops ({recommendations.length})
        </h2>

        <div className="flex items-center gap-2">
          {compareIds.length > 0 && (
            <button
              type="button"
              onClick={() => setCompareIds([])}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Clear ({compareIds.length})
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowComparePanel((prev) => !prev)}
            disabled={compareIds.length < 2}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              compareIds.length >= 2
                ? 'bg-[#1B4332] hover:bg-[#2D6A4F] text-white'
                : 'bg-white border border-[#DCE3DE] text-slate-400 cursor-not-allowed'
            }`}
          >
            <Columns3 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              {showComparePanel
                ? 'Hide Comparison'
                : `${t.actions.openComparison} (${compareIds.length}/3)`}
            </span>
          </button>
        </div>
      </div>

      {/* Side-by-Side Comparison Matrix (up to 3 crops) */}
      {showComparePanel && comparedCrops.length >= 2 && (
        <section
          aria-label="Side-by-side crop comparison"
          className="rounded-2xl bg-white border border-[#2D6A4F]/40 p-5 space-y-4 overflow-x-auto"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#1E293B]">
              Side-by-Side Crop Comparison
            </h3>
            <button
              type="button"
              onClick={() => setShowComparePanel(false)}
              aria-label="Close comparison"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <table className="w-full text-sm border-collapse min-w-[540px]">
            <thead>
              <tr className="border-b border-[#E2E8E4]">
                <th className="py-2.5 pr-4 text-left text-xs font-semibold text-slate-500">
                  Metric
                </th>
                {comparedCrops.map(({ crop, matchScore }) => (
                  <th key={crop.id} className="py-2.5 px-3 text-left font-bold text-[#1E293B]">
                    <div className="flex items-center gap-2">
                      <span aria-hidden="true">{crop.iconEmoji}</span>
                      <span>{crop.name}</span>
                      <span className="text-xs font-semibold text-[#2D6A4F] tabular-nums">
                        ({matchScore}%)
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF2EF]">
              <tr>
                <td className="py-2.5 pr-4 text-xs text-slate-500 font-medium">Expected Yield</td>
                {comparedCrops.map(({ crop }) => (
                  <td key={crop.id} className="py-2.5 px-3 font-semibold tabular-nums">
                    {crop.expectedYield}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 pr-4 text-xs text-slate-500 font-medium">Water Need</td>
                {comparedCrops.map(({ crop }) => (
                  <td key={crop.id} className="py-2.5 px-3">
                    {crop.waterRequirement}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 pr-4 text-xs text-slate-500 font-medium">Duration</td>
                {comparedCrops.map(({ crop }) => (
                  <td key={crop.id} className="py-2.5 px-3 tabular-nums">
                    {crop.durationDays}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 pr-4 text-xs text-slate-500 font-medium">Risk Level</td>
                {comparedCrops.map(({ crop, status }) => (
                  <td key={crop.id} className="py-2.5 px-3">
                    <StatusBadge status={status} label={t.status[status]} />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 pr-4 text-xs text-slate-500 font-medium">Input Cost / Acre</td>
                {comparedCrops.map(({ crop }) => (
                  <td key={crop.id} className="py-2.5 px-3 tabular-nums">
                    {formatINR(crop.inputCostPerAcre)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 pr-4 text-xs text-slate-500 font-medium">Est. Net Return / Acre</td>
                {comparedCrops.map(({ crop }) => (
                  <td key={crop.id} className="py-2.5 px-3 font-bold text-[#1B4332] tabular-nums">
                    {formatINR(calculateNetProfitPerAcre(crop))}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 pr-4 text-xs text-slate-500 font-medium">Sowing Window</td>
                {comparedCrops.map(({ crop }) => (
                  <td key={crop.id} className="py-2.5 px-3 text-slate-600">
                    {crop.sowingWindow}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </section>
      )}

      {/* Ranked Crop Cards (3-column grid matching Screenshot 2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {recommendations.map(({ crop, matchScore, status, reasons, cautionNote }) => {
          const isInPlan = farmPlanIds.includes(crop.id);
          const isCompared = compareIds.includes(crop.id);
          const netReturn = calculateNetProfitPerAcre(crop);

          return (
            <article
              key={crop.id}
              className="rounded-2xl bg-[#FAFBF9] border border-[#DCE3DE] p-5 flex flex-col justify-between gap-4 hover:border-[#2D6A4F]/60 transition-colors"
            >
              <div className="space-y-3.5">
                {/* Card Top Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-11 h-11 rounded-xl bg-white border border-[#E5EAE6] flex items-center justify-center text-2xl shrink-0"
                      aria-hidden="true"
                    >
                      {crop.iconEmoji}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-[#1E293B] truncate">
                        {crop.name}
                      </h3>
                      <p className="text-xs text-slate-500 truncate">{crop.localName}</p>
                    </div>
                  </div>
                  <MatchRing score={matchScore} size={48} />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <StatusBadge status={status} label={t.status[status]} />
                  <span className="text-xs text-slate-500">
                    {crop.category} · {crop.durationDays}
                  </span>
                </div>

                {/* Why it fits your farm */}
                <div className="rounded-xl bg-white border border-[#E5EAE6] p-3 space-y-1.5">
                  <div className="text-xs font-semibold text-[#1B4332]">
                    Why it fits your farm
                  </div>
                  <ul className="space-y-1 text-xs text-slate-600">
                    {reasons.map((reason) => (
                      <li key={reason} className="flex items-start gap-1.5">
                        <span className="text-[#2D6A4F] font-bold" aria-hidden="true">
                          •
                        </span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                  {cautionNote && (
                    <p className="text-xs text-[#D97706] pt-1 border-t border-slate-100">
                      Note: {cautionNote}
                    </p>
                  )}
                </div>

                {/* Cost vs Return & Sowing Window */}
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs pt-1">
                  <div>
                    <dt className="text-slate-500">Input cost / acre</dt>
                    <dd className="font-semibold text-[#1E293B] tabular-nums">
                      {formatINR(crop.inputCostPerAcre)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Est. net return</dt>
                    <dd className="font-bold text-[#1B4332] tabular-nums">
                      {formatINR(netReturn)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Expected yield</dt>
                    <dd className="font-semibold text-[#1E293B] tabular-nums">
                      {crop.expectedYield}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Sowing window</dt>
                    <dd className="font-semibold text-[#1E293B]">{crop.sowingWindow}</dd>
                  </div>
                </dl>
              </div>

              {/* Card Actions */}
              <div className="space-y-2 pt-2 border-t border-[#E5EAE6]">
                <button
                  type="button"
                  onClick={() => onToggleFarmPlan(crop.id)}
                  className={`w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-colors ${
                    isInPlan
                      ? 'bg-emerald-50 text-[#1B4332] border border-emerald-200'
                      : 'bg-[#1B4332] hover:bg-[#2D6A4F] text-white'
                  }`}
                >
                  {isInPlan ? (
                    <>
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{t.actions.addedToPlan}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{t.actions.addToPlan}</span>
                    </>
                  )}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleCompare(crop.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors ${
                      isCompared
                        ? 'bg-amber-50 border-[#D97706] text-amber-900'
                        : 'bg-white border-[#DCE3DE] text-slate-700 hover:border-[#2D6A4F]'
                    }`}
                  >
                    {isCompared ? `✓ ${t.actions.comparing}` : t.actions.compare}
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenCalendarForCrop(crop.id, crop.seasons[0])}
                    className="py-2 px-3 rounded-xl text-xs font-medium bg-white border border-[#DCE3DE] text-slate-700 hover:border-[#2D6A4F] transition-colors"
                  >
                    Lifecycle Guide
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
