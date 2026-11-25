import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Bell,
  BellRing,
  BookOpen,
  Bot,
  CalendarDays,
  Check,
  Clock,
  Cloud,
  CloudRain,
  Droplets,
  Loader2,
  LocateFixed,
  MapPin,
  Plus,
  RefreshCw,
  ShieldAlert,
  Sprout,
  Sun,
  TrendingUp,
  Wind,
} from 'lucide-react';
import type { TranslationBundle } from '../data/translations';
import type {
  BrowserNotificationPermission,
  ChecklistTask,
  CropRecommendation,
  CropWeatherAlert,
  FarmProfile,
  LanguageCode,
  NavTab,
  SeasonType,
  WeatherDay,
  WeatherProfile,
} from '../types/agro';
import { classifyWeatherTheme, formatPlaceLocalTime } from '../utils/weatherHelpers';
import { FarmMapCard } from './FarmMapCard';
import { MatchRing, StatusBadge } from './StatusBadge';
import { WeatherAnimatedBg } from './WeatherAnimatedBg';

interface DashboardViewProps {
  farmProfile: FarmProfile;
  language: LanguageCode;
  weather: WeatherProfile;
  isLocating?: boolean;
  isWeatherLoading?: boolean;
  onDetectLiveLocation?: () => void;
  onRefreshWeather?: () => void;
  currentSeason: SeasonType;
  recommendations: CropRecommendation[];
  farmPlanIds: string[];
  tasks: ChecklistTask[];
  onToggleTask: (taskId: string) => void;
  onAddTask: (title: string) => void;
  onToggleFarmPlan: (cropId: string) => void;
  onOpenFarmSetup: () => void;
  onNavigate: (tab: NavTab) => void;
  cropAlerts?: CropWeatherAlert[];
  notificationPermission?: BrowserNotificationPermission;
  onOpenAlerts?: () => void;
  onEnableBrowserAlerts?: () => void;
  t: TranslationBundle;
}

function WeatherDayIcon({ condition }: { condition: WeatherDay['condition'] }) {
  if (condition === 'Heavy Rain' || condition === 'Light Rain') {
    return <CloudRain className="w-4 h-4 text-[#2D6A4F]" aria-hidden="true" />;
  }
  if (condition === 'Partly Cloudy') {
    return <Cloud className="w-4 h-4 text-slate-500" aria-hidden="true" />;
  }
  return <Sun className="w-4 h-4 text-[#D97706]" aria-hidden="true" />;
}

export function DashboardView({
  farmProfile,
  language,
  weather,
  isLocating = false,
  isWeatherLoading = false,
  onDetectLiveLocation,
  onRefreshWeather,
  currentSeason,
  recommendations,
  farmPlanIds,
  tasks,
  onToggleTask,
  onAddTask,
  onToggleFarmPlan,
  onOpenFarmSetup,
  onNavigate,
  cropAlerts = [],
  notificationPermission = 'default',
  onOpenAlerts,
  onEnableBrowserAlerts,
  t,
}: DashboardViewProps) {
  const [newTaskText, setNewTaskText] = useState('');
  const [nowMs, setNowMs] = useState(() => Date.now());
  const topCrops = recommendations.slice(0, 4);
  const completedCount = tasks.filter((item) => item.completed).length;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const activeTheme =
    weather.weatherTheme ?? classifyWeatherTheme(weather.condition, weather.rainProb);
  const placeClock = formatPlaceLocalTime(nowMs, weather.timeZoneId, language);

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTaskText.trim();
    if (!trimmed) return;
    onAddTask(trimmed);
    setNewTaskText('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B] tracking-tight">
            {t.headings.dashboardTitle}
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">{t.headings.dashboardSubtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {onOpenAlerts && (
            <button
              type="button"
              onClick={onOpenAlerts}
              data-testid="dashboard-alerts-btn"
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                cropAlerts.length > 0
                  ? 'bg-amber-50 border-amber-300 text-amber-950 hover:border-amber-500'
                  : 'bg-white border-[#DCE3DE] text-[#1E293B] hover:border-[#2D6A4F]'
              }`}
            >
              {cropAlerts.length > 0 ? (
                <BellRing className="w-3.5 h-3.5 text-[#D97706]" aria-hidden="true" />
              ) : (
                <Bell className="w-3.5 h-3.5 text-[#2D6A4F]" aria-hidden="true" />
              )}
              <span>
                {cropAlerts.length > 0
                  ? `${cropAlerts.length} Crop ${cropAlerts.length === 1 ? 'Risk' : 'Risks'}`
                  : 'Crop Alerts'}
              </span>
            </button>
          )}

          {onDetectLiveLocation && (
            <button
              type="button"
              onClick={onDetectLiveLocation}
              disabled={isLocating}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 hover:border-[#2D6A4F] text-xs font-semibold text-[#1B4332] transition-colors whitespace-nowrap shrink-0 disabled:opacity-60"
            >
              {isLocating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2D6A4F]" aria-hidden="true" />
              ) : (
                <LocateFixed className="w-3.5 h-3.5 text-[#2D6A4F]" aria-hidden="true" />
              )}
              <span>{isLocating ? 'Locating...' : 'Use Live Location'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenFarmSetup}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#DCE3DE] hover:border-[#2D6A4F] text-sm font-medium text-[#1E293B] transition-colors whitespace-nowrap shrink-0"
          >
            <MapPin className="w-4 h-4 text-[#2D6A4F]" aria-hidden="true" />
            <span>{farmProfile.location}</span>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span className="text-slate-600 tabular-nums">
              {farmProfile.landSize} {farmProfile.landUnit}
            </span>
          </button>
        </div>
      </div>

      {/* Location, Local Time & Animated Weather Banner */}
      <section
        aria-label="Local Weather and Field Advisory"
        className="relative overflow-hidden rounded-2xl border border-[#DCE3DE] p-5"
      >
        <WeatherAnimatedBg theme={activeTheme} isDaytime={weather.isDaytime} />

        <div className="relative z-10 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            {/* Current Weather Summary + Live Place Clock */}
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#1B4332] text-white flex items-center justify-center shrink-0 shadow-sm">
                {activeTheme === 'rainy' ? (
                  <CloudRain className="w-7 h-7 text-sky-200" aria-hidden="true" />
                ) : activeTheme === 'cloudy' ? (
                  <Cloud className="w-7 h-7 text-slate-200" aria-hidden="true" />
                ) : (
                  <Sun className="w-7 h-7 text-amber-300" aria-hidden="true" />
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-medium text-slate-600">
                  <span className="font-semibold text-[#1B4332]">
                    {weather.locationLabel}
                    {farmProfile.liveLocated ? ' (Live GPS)' : ''}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{t.seasons[currentSeason]}</span>
                  {onRefreshWeather && (
                    <button
                      type="button"
                      onClick={onRefreshWeather}
                      disabled={isWeatherLoading}
                      aria-label="Refresh live weather"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2D6A4F] hover:text-[#1B4332] ml-1"
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${isWeatherLoading ? 'animate-spin' : ''}`}
                        aria-hidden="true"
                      />
                      <span>{isWeatherLoading ? 'Updating' : 'Refresh'}</span>
                    </button>
                  )}
                </div>

                {/* Live Local Time of the Place */}
                <div
                  className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#1E293B] mt-1 tabular-nums"
                  data-testid="place-local-clock"
                >
                  <Clock className="w-3.5 h-3.5 text-[#D97706] shrink-0" aria-hidden="true" />
                  <span>{placeClock.timeText}</span>
                  <span className="text-slate-400" aria-hidden="true">·</span>
                  <span className="text-slate-700 font-medium">{placeClock.dateText}</span>
                  <span className="text-slate-400" aria-hidden="true">·</span>
                  <span className="text-slate-500 font-normal">
                    {weather.timeZoneId ? `${placeClock.zoneLabel} (${weather.timeZoneId})` : placeClock.zoneLabel}
                  </span>
                </div>

                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-3xl font-bold text-[#1E293B] tabular-nums">
                    {weather.currentTemp}°C
                  </span>
                  <span className="text-sm font-semibold text-slate-700">{weather.condition}</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-1.5 text-xs text-slate-700 tabular-nums">
                  <span className="inline-flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-[#2D6A4F]" aria-hidden="true" />
                    Humidity {weather.humidity}%
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CloudRain className="w-3.5 h-3.5 text-[#2D6A4F]" aria-hidden="true" />
                    Rain {weather.rainProb}%
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Wind className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
                    Wind {weather.windKmh} km/h
                  </span>
                </div>
              </div>
            </div>

            {/* 7-Day Forecast Strip */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 flex-1 lg:max-w-xl">
              {weather.forecast.map((day) => (
                <div
                  key={day.day}
                  className="flex flex-col items-center justify-between rounded-xl bg-white/90 backdrop-blur-[2px] border border-[#E5EAE6] px-1.5 py-2.5 text-center"
                >
                  <span className="text-[11px] font-semibold text-slate-600">{day.day}</span>
                  <div className="my-1.5">
                    <WeatherDayIcon condition={day.condition} />
                  </div>
                  <div className="text-xs font-bold text-[#1E293B] tabular-nums">
                    {day.tempHigh}°
                  </div>
                  <div className="text-[10px] text-slate-500 tabular-nums mt-0.5">
                    {day.rainProb}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick-action Farming Weather Alert */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-white/92 backdrop-blur-[2px] border border-[#E5EAE6] px-4 py-3">
            <div className="flex items-start sm:items-center gap-3">
              <StatusBadge
                status={weather.alertStatus}
                label={t.status[weather.alertStatus]}
              />
              <div className="text-sm">
                <span className="font-semibold text-[#1E293B]">{weather.alertTitle}: </span>
                <span className="text-slate-600">{weather.alertAdvice}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('calendar')}
              className="text-xs font-semibold text-[#1B4332] hover:text-[#2D6A4F] inline-flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <span>Check Calendar</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* Personalized Farm-Plan Crop Weather Risk Strip */}
      {cropAlerts.length > 0 && (
        <section
          aria-label="Farm Plan Weather Risks"
          data-testid="dashboard-crop-risk-strip"
          className="rounded-2xl bg-amber-50/90 border border-amber-200 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-amber-100 text-[#D97706] flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-bold text-[#1E293B]">
                {cropAlerts[0].cropEmoji} {cropAlerts[0].title}
                {cropAlerts.length > 1 ? ` (+${cropAlerts.length - 1} more)` : ''}
              </div>
              <p className="text-xs text-slate-700 mt-0.5">{cropAlerts[0].message}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {notificationPermission === 'default' && onEnableBrowserAlerts && (
              <button
                type="button"
                onClick={onEnableBrowserAlerts}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-semibold transition-colors whitespace-nowrap"
              >
                <BellRing className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Enable Browser Push</span>
              </button>
            )}
            {onOpenAlerts && (
              <button
                type="button"
                onClick={onOpenAlerts}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-amber-300 hover:border-amber-500 text-xs font-semibold text-[#1E293B] transition-colors whitespace-nowrap"
              >
                <span>View Crop Alerts</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </section>
      )}

      {/* Top Recommended Crops Right Now */}
      <section aria-label={t.headings.topRecommendedCrops} className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#1E293B]">{t.headings.topRecommendedCrops}</h2>
            <p className="text-xs text-slate-500">
              Ranked for {farmProfile.soilType} soil (pH {farmProfile.soilPh.toFixed(1)}) ·{' '}
              {farmProfile.irrigation} · {farmProfile.goal}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('advisor')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1B4332] hover:text-[#2D6A4F] whitespace-nowrap shrink-0"
          >
            <span>{t.actions.viewAllAdvisor}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {topCrops.map(({ crop, matchScore, status }) => {
            const inPlan = farmPlanIds.includes(crop.id);
            return (
              <div
                key={crop.id}
                className="rounded-2xl bg-[#FAFBF9] border border-[#DCE3DE] p-4 flex flex-col justify-between gap-3 hover:border-[#2D6A4F]/60 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-10 h-10 rounded-xl bg-white border border-[#E5EAE6] flex items-center justify-center text-xl shrink-0"
                        aria-hidden="true"
                      >
                        {crop.iconEmoji}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-[#1E293B] truncate">
                          {crop.name}
                        </h3>
                        <p className="text-xs text-slate-500 truncate">{crop.localName}</p>
                      </div>
                    </div>
                    <MatchRing score={matchScore} size={44} />
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <StatusBadge status={status} label={t.status[status]} />
                    <span className="text-xs text-slate-500 tabular-nums">
                      {crop.durationDays}
                    </span>
                  </div>

                  <dl className="mt-3 pt-3 border-t border-[#E5EAE6] space-y-1.5 text-xs">
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500">Expected yield</dt>
                      <dd className="font-semibold text-[#1E293B] tabular-nums">
                        {crop.expectedYield}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500">Water need</dt>
                      <dd className="font-semibold text-[#1E293B]">{crop.waterRequirement}</dd>
                    </div>
                  </dl>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleFarmPlan(crop.id)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-semibold transition-colors ${
                    inPlan
                      ? 'bg-emerald-50 text-[#1B4332] border border-emerald-200'
                      : 'bg-[#1B4332] hover:bg-[#2D6A4F] text-white'
                  }`}
                >
                  {inPlan ? `✓ ${t.actions.addedToPlan}` : '+ Add to Farm Plan'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Checklist + Quick Access Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Action Checklist */}
        <section
          aria-label={t.headings.todaysChecklist}
          className="lg:col-span-7 rounded-2xl bg-[#FAFBF9] border border-[#DCE3DE] p-5 space-y-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#1E293B]">{t.headings.todaysChecklist}</h2>
              <p className="text-xs text-slate-500 tabular-nums">
                {completedCount} of {tasks.length} seasonal tasks completed
              </p>
            </div>
            <div className="w-28 h-2 rounded-full bg-[#E2E8E4] overflow-hidden">
              <div
                className="h-full bg-[#2D6A4F] transition-[width] duration-200"
                style={{
                  width: `${tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0}%`,
                }}
              />
            </div>
          </div>

          <ul className="space-y-2">
            {tasks.map((task) => (
              <li key={task.id}>
                <label className="flex items-start gap-3 rounded-xl bg-white border border-[#E5EAE6] px-3.5 py-2.5 cursor-pointer hover:border-[#2D6A4F]/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => onToggleTask(task.id)}
                    className="sr-only"
                  />
                  <span
                    className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                      task.completed
                        ? 'bg-[#2D6A4F] border-[#2D6A4F] text-white'
                        : 'bg-white border-slate-300'
                    }`}
                    aria-hidden="true"
                  >
                    {task.completed && <Check className="w-3.5 h-3.5" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm font-medium ${
                        task.completed ? 'line-through text-slate-400' : 'text-[#1E293B]'
                      }`}
                    >
                      {task.title}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {task.category} · {task.dueLabel}
                    </div>
                  </div>
                </label>
              </li>
            ))}
          </ul>

          <form onSubmit={handleTaskSubmit} className="flex gap-2 pt-1">
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Add a field reminder (e.g., Check drip filter pressure)..."
              aria-label="Add field task"
              className="flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>{t.actions.addTask}</span>
            </button>
          </form>
        </section>

        {/* Quick Access Tiles */}
        <section
          aria-label={t.headings.quickAccess}
          className="lg:col-span-5 rounded-2xl bg-[#FAFBF9] border border-[#DCE3DE] p-5 space-y-3"
        >
          <h2 className="text-lg font-bold text-[#1E293B]">{t.headings.quickAccess}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            <button
              type="button"
              onClick={() => onNavigate('advisor')}
              className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-white border border-[#E5EAE6] hover:border-[#2D6A4F] text-left transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#1B4332] flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#1E293B]">Crop Recommender</div>
                  <div className="text-xs text-slate-500">
                    Compare yields, ROI & rotation fit
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('calendar')}
              className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-white border border-[#E5EAE6] hover:border-[#2D6A4F] text-left transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#D97706] flex items-center justify-center shrink-0">
                  <CalendarDays className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#1E293B]">Seasonal Calendar</div>
                  <div className="text-xs text-slate-500">
                    Stage-by-stage sowing & fertilizer guide
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('doctor')}
              className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-white border border-[#E5EAE6] hover:border-[#2D6A4F] text-left transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#2D6A4F] flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#1E293B]">Pest & Disease Help</div>
                  <div className="text-xs text-slate-500">
                    Upload leaf photo or ask AI advisor
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('knowledge')}
              className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-white border border-[#E5EAE6] hover:border-[#2D6A4F] text-left transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#1E293B] flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#1E293B]">Market & Soil Insights</div>
                  <div className="text-xs text-slate-500">
                    Soil health cards, compost & schemes
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
            </button>
          </div>
        </section>
      </div>

      {/* Field Map & Nearby Agricultural Hubs (Google Maps Platform) */}
      <section
        aria-label="Field Map and Nearby Agricultural Hubs"
        className="rounded-2xl bg-[#FAFBF9] border border-[#DCE3DE] p-5 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-[#1E293B]">
              Field Location &amp; Nearby Agro Hubs
            </h2>
            <p className="text-xs text-slate-500">
              Pinned to {farmProfile.location} · Search real mandis, KVKs, and seed stores nearby
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenFarmSetup}
            className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-white border border-[#DCE3DE] hover:border-[#2D6A4F] text-xs font-semibold text-[#1E293B] transition-colors"
          >
            Adjust Farm Pin
          </button>
        </div>

        <FarmMapCard
          lat={farmProfile.latitude ?? 26.1445}
          lng={farmProfile.longitude ?? 91.7362}
          locationLabel={farmProfile.location}
          soilType={farmProfile.soilType}
          language={language}
          showNearbyHubs
          heightClass="h-64"
        />
      </section>
    </div>
  );
}
