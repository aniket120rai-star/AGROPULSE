import { useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Droplets,
  Shield,
  Sprout,
  Tractor,
  Wheat,
} from 'lucide-react';
import { CROPS_CATALOG, MONTH_NAMES } from '../data/agroData';
import type { TranslationBundle } from '../data/translations';
import type { LifecycleStage, SeasonType } from '../types/agro';

interface FarmCalendarViewProps {
  selectedSeason: SeasonType;
  onChangeSeason: (season: SeasonType) => void;
  selectedCropId: string;
  onChangeCropId: (cropId: string) => void;
  completedStages: Record<string, number[]>;
  onToggleStageComplete: (cropId: string, stageNumber: number) => void;
  t: TranslationBundle;
}

function StageIcon({ name }: { name: LifecycleStage['iconName'] }) {
  if (name === 'tractor') return <Tractor className="w-4 h-4 text-[#2D6A4F]" aria-hidden="true" />;
  if (name === 'sprout') return <Sprout className="w-4 h-4 text-[#2D6A4F]" aria-hidden="true" />;
  if (name === 'droplets') return <Droplets className="w-4 h-4 text-[#2D6A4F]" aria-hidden="true" />;
  if (name === 'shield') return <Shield className="w-4 h-4 text-[#D97706]" aria-hidden="true" />;
  return <Wheat className="w-4 h-4 text-[#D97706]" aria-hidden="true" />;
}

export function FarmCalendarView({
  selectedSeason,
  onChangeSeason,
  selectedCropId,
  onChangeCropId,
  completedStages,
  onToggleStageComplete,
  t,
}: FarmCalendarViewProps) {
  const [selectedMonth, setSelectedMonth] = useState<number>(10); // Nov default matching screenshot
  const [expandedStage, setExpandedStage] = useState<number>(1);

  const seasonCrops = useMemo(
    () => CROPS_CATALOG.filter((crop) => crop.seasons.includes(selectedSeason)),
    [selectedSeason]
  );

  const activeCrop = useMemo(() => {
    const found =
      seasonCrops.find((c) => c.id === selectedCropId) ??
      seasonCrops[0] ??
      CROPS_CATALOG[0];
    return found;
  }, [seasonCrops, selectedCropId]);

  const handleSeasonSwitch = (season: SeasonType) => {
    onChangeSeason(season);
    const matching = CROPS_CATALOG.filter((c) => c.seasons.includes(season));
    if (matching.length > 0 && !matching.some((c) => c.id === selectedCropId)) {
      onChangeCropId(matching[0].id);
      if (matching[0].sowingMonths.length > 0) {
        setSelectedMonth(matching[0].sowingMonths[0]);
      }
    }
  };

  const monthAdvice = useMemo(() => {
    const m = selectedMonth;
    if (activeCrop.sowingMonths.includes(m)) {
      return `Prime sowing window for ${activeCrop.name}. Focus on land preparation, basal fertilizer, and seed treatment.`;
    }
    if (activeCrop.harvestMonths.includes(m)) {
      return `Harvest & post-harvest window for ${activeCrop.name}. Check grain moisture and arrange clean tarpaulin drying.`;
    }
    if (activeCrop.activeMonths.includes(m)) {
      return `Active vegetative/reproductive growth month for ${activeCrop.name}. Maintain irrigation intervals and weekly pest scouting.`;
    }
    return `Off-season month for ${activeCrop.name}. Ideal time for green manuring, soil testing, or rotating a short-duration pulse.`;
  }, [activeCrop, selectedMonth]);

  const completedForCrop = completedStages[activeCrop.id] ?? [];

  return (
    <div className="space-y-6">
      {/* Header matching Screenshot 3 */}
      <div>
        <div className="flex items-center gap-2.5">
          <CalendarDays className="w-6 h-6 text-[#D97706]" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-[#1E293B] tracking-tight">
            {t.headings.calendarTitle}
          </h1>
        </div>
        <p className="text-sm text-slate-600 mt-1">{t.headings.calendarSubtitle}</p>
      </div>

      {/* Season Tabs (3 equal segmented buttons matching Screenshot 3) */}
      <div
        role="tablist"
        aria-label="Cropping Seasons"
        className="grid grid-cols-3 gap-3"
      >
        {(['Kharif', 'Rabi', 'Zaid'] as SeasonType[]).map((season) => {
          const isActive = selectedSeason === season;
          return (
            <button
              key={season}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleSeasonSwitch(season)}
              className={`py-3 px-4 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-[#1B4332] text-white shadow-sm'
                  : 'bg-[#FAFBF9] border border-[#DCE3DE] text-[#1E293B] hover:border-[#2D6A4F]'
              }`}
            >
              {t.seasons[season]}
            </button>
          );
        })}
      </div>

      {/* 12-Month Strip matching Screenshot 3 */}
      <div className="rounded-2xl bg-[#FAFBF9] border border-[#DCE3DE] p-4 space-y-3">
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
          {MONTH_NAMES.map((monthName, idx) => {
            const isCropActiveMonth = activeCrop.activeMonths.includes(idx);
            const isSelected = selectedMonth === idx;
            return (
              <button
                key={monthName}
                type="button"
                onClick={() => setSelectedMonth(idx)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-semibold transition-colors border-2 ${
                  isCropActiveMonth
                    ? 'bg-[#1B4332] text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                } ${
                  isSelected
                    ? 'border-[#D97706]'
                    : isCropActiveMonth
                    ? 'border-[#1B4332]'
                    : 'border-transparent'
                }`}
              >
                <span>{monthName}</span>
                {isCropActiveMonth && (
                  <Sprout className="w-3 h-3 mt-1 text-emerald-300" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-slate-600 px-1">
          <span className="font-semibold text-[#1B4332]">{MONTH_NAMES[selectedMonth]} advisory: </span>
          {monthAdvice}
        </p>
      </div>

      {/* Crop Selector Dropdown */}
      <div className="max-w-sm">
        <label htmlFor="calendar-crop-select" className="sr-only">
          Select crop lifecycle
        </label>
        <select
          id="calendar-crop-select"
          value={activeCrop.id}
          onChange={(e) => onChangeCropId(e.target.value)}
          className="w-full rounded-xl border border-[#DCE3DE] bg-[#FAFBF9] px-4 py-2.5 text-sm font-semibold text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
        >
          {seasonCrops.map((crop) => (
            <option key={crop.id} value={crop.id}>
              {crop.iconEmoji} {crop.name} ({crop.localName})
            </option>
          ))}
        </select>
      </div>

      {/* Selected Crop Overview Banner matching Screenshot 3 */}
      <section className="rounded-2xl bg-[#FAFBF9] border border-[#DCE3DE] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white border border-[#E5EAE6] flex items-center justify-center text-2xl shrink-0">
            {activeCrop.iconEmoji}
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1E293B]">
              {activeCrop.name}{' '}
              <span className="text-sm font-normal text-slate-500">({activeCrop.localName})</span>
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">{activeCrop.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-700 shrink-0">
          <div className="rounded-xl bg-white border border-[#E5EAE6] px-3 py-2">
            <span className="text-slate-500">Sowing: </span>
            <span className="font-semibold text-[#1E293B]">{activeCrop.sowingWindow}</span>
          </div>
          <div className="rounded-xl bg-white border border-[#E5EAE6] px-3 py-2">
            <span className="text-slate-500">Harvest: </span>
            <span className="font-semibold text-[#1E293B]">{activeCrop.harvestWindow}</span>
          </div>
          <div className="rounded-xl bg-white border border-[#E5EAE6] px-3 py-2">
            <span className="text-slate-500">Water: </span>
            <span className="font-semibold text-[#1E293B]">{activeCrop.waterRequirement}</span>
          </div>
        </div>
      </section>

      {/* 5 Lifecycle Stages Accordion with Progress Bars */}
      <section aria-label="Crop Lifecycle Stages" className="space-y-3">
        {activeCrop.stages.map((stage) => {
          const isExpanded = expandedStage === stage.stageNumber;
          const isCompleted = completedForCrop.includes(stage.stageNumber);
          const progressPct = isCompleted
            ? 100
            : Math.round((stage.stageNumber / activeCrop.stages.length) * 100);

          return (
            <div
              key={stage.stageNumber}
              className="rounded-2xl bg-[#FAFBF9] border border-[#DCE3DE] overflow-hidden"
            >
              <button
                type="button"
                aria-expanded={isExpanded}
                onClick={() =>
                  setExpandedStage(isExpanded ? 0 : stage.stageNumber)
                }
                className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-white/70 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-white border border-[#E5EAE6] flex items-center justify-center shrink-0">
                    <StageIcon name={stage.iconName} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      <span>
                        Stage {stage.stageNumber} · {stage.timeframe}
                      </span>
                      {isCompleted && (
                        <span className="text-[#2D6A4F] inline-flex items-center gap-1 normal-case">
                          <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                          Done
                        </span>
                      )}
                    </div>
                    <div className="text-base font-bold text-[#1E293B] mt-0.5">
                      {stage.title}
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full max-w-xs h-1.5 rounded-full bg-[#E2E8E4] mt-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isCompleted ? 'bg-[#1B4332]' : 'bg-[#2D6A4F]'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
                )}
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-[#E5EAE6] bg-white space-y-3">
                  <p className="text-sm font-medium text-[#1E293B]">{stage.summary}</p>
                  <ul className="space-y-2 text-sm text-slate-600">
                    {stage.instructions.map((step, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-50 text-[#1B4332] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div className="rounded-xl bg-amber-50 border border-amber-200/80 px-3.5 py-2 text-xs font-medium text-amber-950">
                      <span className="font-bold text-[#D97706]">Dosage & Timing Tip: </span>
                      {stage.dosageTip}
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleStageComplete(activeCrop.id, stage.stageNumber)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-50 border-emerald-300 text-[#1B4332]'
                          : 'bg-[#1B4332] border-[#1B4332] text-white hover:bg-[#2D6A4F]'
                      }`}
                    >
                      {isCompleted ? '✓ Stage Completed' : 'Mark Stage Complete'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
