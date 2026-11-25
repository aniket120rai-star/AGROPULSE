import { useEffect } from 'react';
import {
  Bell,
  BellOff,
  BellRing,
  CalendarDays,
  CheckCircle2,
  CloudRain,
  Droplets,
  Send,
  ShieldAlert,
  Sprout,
  ThermometerSun,
  X,
} from 'lucide-react';
import type {
  BrowserNotificationPermission,
  Crop,
  CropWeatherAlert,
  CropWeatherHazard,
  NotificationPrefs,
  WeatherProfile,
} from '../types/agro';
import { getCropThresholdSummary } from '../utils/cropWeatherAlerts';
import { StatusBadge } from './StatusBadge';

interface CropAlertsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  weather: WeatherProfile;
  farmPlanCrops: Crop[];
  alerts: CropWeatherAlert[];
  dismissedCount: number;
  prefs: NotificationPrefs;
  permission: BrowserNotificationPermission;
  onRequestPermission: () => void;
  onToggleBrowserAlerts: () => void;
  onUpdatePrefs: (patch: Partial<NotificationPrefs>) => void;
  onDismissAlert: (alertId: string) => void;
  onRestoreDismissed: () => void;
  onSendTestAlert: () => void;
  onOpenAdvisor: () => void;
  onOpenCalendarForCrop: (cropId: string) => void;
}

function HazardIcon({ hazard }: { hazard: CropWeatherHazard }) {
  if (hazard === 'humidity') {
    return <Droplets className="w-4 h-4 text-[#2D6A4F] shrink-0" aria-hidden="true" />;
  }
  if (hazard === 'heat' || hazard === 'frost') {
    return <ThermometerSun className="w-4 h-4 text-[#D97706] shrink-0" aria-hidden="true" />;
  }
  return <CloudRain className="w-4 h-4 text-[#1B4332] shrink-0" aria-hidden="true" />;
}

export function CropAlertsDrawer({
  isOpen,
  onClose,
  weather,
  farmPlanCrops,
  alerts,
  dismissedCount,
  prefs,
  permission,
  onRequestPermission,
  onToggleBrowserAlerts,
  onUpdatePrefs,
  onDismissAlert,
  onRestoreDismissed,
  onSendTestAlert,
  onOpenAdvisor,
  onOpenCalendarForCrop,
}: CropAlertsDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isPushActive = permission === 'granted' && prefs.browserAlertsEnabled;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="crop-alerts-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#F4F6F4] h-full overflow-y-auto border-l border-[#DCE3DE] shadow-2xl flex flex-col"
      >
        {/* Top Bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-[#DCE3DE] px-5 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-[#1B4332] text-white flex items-center justify-center shrink-0">
              <BellRing className="w-4 h-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 id="crop-alerts-title" className="text-base font-bold text-[#1E293B] truncate">
                Crop Risk Alerts
              </h2>
              <p className="text-xs text-slate-500 truncate">
                {weather.locationLabel} · {farmPlanCrops.length}{' '}
                {farmPlanCrops.length === 1 ? 'crop' : 'crops'} in Farm Plan
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close crop alerts"
            className="p-2 rounded-lg text-slate-500 hover:text-[#1E293B] hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 flex-1">
          {/* Browser Notification Settings Card */}
          <section
            aria-label="Browser notification settings"
            className="rounded-2xl bg-white border border-[#DCE3DE] p-4 space-y-3.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isPushActive
                      ? 'bg-emerald-50 text-[#1B4332]'
                      : permission === 'denied'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-amber-50 text-[#D97706]'
                  }`}
                >
                  {isPushActive ? (
                    <BellRing className="w-4 h-4" aria-hidden="true" />
                  ) : permission === 'denied' ? (
                    <BellOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Bell className="w-4 h-4" aria-hidden="true" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1E293B]">Browser Weather Push Alerts</h3>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    {isPushActive &&
                      'Active — pushes browser alerts automatically when heat, humidity, or storm rain threatens your planted crops.'}
                    {permission === 'granted' &&
                      !prefs.browserAlertsEnabled &&
                      'Paused — turn push back on anytime to receive background browser alerts.'}
                    {permission === 'default' &&
                      'Allow browser notifications to receive instant warnings when weather conditions risk your Farm Plan crops.'}
                    {permission === 'denied' &&
                      'Browser notifications are blocked in browser site settings. Active risks still appear here and as in-app banners.'}
                    {permission === 'unsupported' &&
                      'Browser push notifications are unavailable in this context. Active crop risks appear below.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {permission === 'default' && (
                <button
                  type="button"
                  onClick={onRequestPermission}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-semibold transition-colors"
                >
                  <BellRing className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Enable Browser Alerts</span>
                </button>
              )}

              {permission === 'granted' && (
                <button
                  type="button"
                  onClick={onToggleBrowserAlerts}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                    prefs.browserAlertsEnabled
                      ? 'bg-emerald-50 border-emerald-200 text-[#1B4332] hover:bg-emerald-100'
                      : 'bg-[#1B4332] border-[#1B4332] text-white hover:bg-[#2D6A4F]'
                  }`}
                >
                  {prefs.browserAlertsEnabled ? (
                    <>
                      <BellOff className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Pause Push Alerts</span>
                    </>
                  ) : (
                    <>
                      <BellRing className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Resume Push Alerts</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={onSendTestAlert}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAFBF9] border border-[#DCE3DE] hover:border-[#2D6A4F] text-xs font-semibold text-[#1E293B] transition-colors"
              >
                <Send className="w-3.5 h-3.5 text-[#D97706]" aria-hidden="true" />
                <span>Send Test Alert</span>
              </button>
            </div>

            {/* Hazard Filters */}
            <div className="pt-2.5 border-t border-[#E5EAE6]">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Monitored Weather Hazards
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-[#1E293B]">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.monitorHumidity}
                    onChange={(e) => onUpdatePrefs({ monitorHumidity: e.target.checked })}
                    className="rounded border-slate-300 text-[#1B4332] focus:ring-[#2D6A4F]"
                  />
                  <span>High Humidity</span>
                </label>

                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.monitorHeat}
                    onChange={(e) => onUpdatePrefs({ monitorHeat: e.target.checked })}
                    className="rounded border-slate-300 text-[#1B4332] focus:ring-[#2D6A4F]"
                  />
                  <span>Extreme Heat &amp; Cold</span>
                </label>

                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.monitorRain}
                    onChange={(e) => onUpdatePrefs({ monitorRain: e.target.checked })}
                    className="rounded border-slate-300 text-[#1B4332] focus:ring-[#2D6A4F]"
                  />
                  <span>Heavy Rain</span>
                </label>
              </div>
            </div>
          </section>

          {/* Crop Risk Feed */}
          <section aria-label="Crop plan weather risk feed" className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[#1E293B]">
                Farm Plan Risk Assessment ({alerts.length})
              </h3>
              {dismissedCount > 0 && (
                <button
                  type="button"
                  onClick={onRestoreDismissed}
                  className="text-xs font-semibold text-[#2D6A4F] hover:text-[#1B4332]"
                >
                  Restore dismissed ({dismissedCount})
                </button>
              )}
            </div>

            {farmPlanCrops.length === 0 ? (
              <div className="rounded-2xl bg-white border border-[#DCE3DE] p-5 text-center space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#1B4332] flex items-center justify-center mx-auto">
                  <Sprout className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-bold text-[#1E293B]">
                    No crops in your Farm Plan yet
                  </div>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto">
                    Add crops from Dashboard or Crop Advisor so AgroPulse monitors temperature,
                    humidity, and rainfall against each crop&apos;s tolerance limits.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdvisor();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-semibold transition-colors"
                >
                  <Sprout className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Open Crop Advisor</span>
                </button>
              </div>
            ) : alerts.length === 0 ? (
              <div className="rounded-2xl bg-white border border-[#DCE3DE] p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#2D6A4F] shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <div className="text-sm font-bold text-[#1E293B]">
                      All Farm Plan crops are within safe limits
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Current {weather.currentTemp}°C, {weather.humidity}% humidity, and 7-day
                      forecast do not trigger enabled hazards for your selected crops.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E5EAE6] space-y-2">
                  {farmPlanCrops.map((crop) => (
                    <div
                      key={crop.id}
                      className="flex items-center justify-between gap-2 text-xs bg-[#FAFBF9] rounded-xl px-3 py-2 border border-[#E5EAE6]"
                    >
                      <span className="font-semibold text-[#1E293B]">
                        {crop.iconEmoji} {crop.name}
                      </span>
                      <span className="text-slate-500 tabular-nums">
                        {getCropThresholdSummary(crop.id)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3" data-testid="crop-alert-list">
                {alerts.map((alert) => (
                  <article
                    key={alert.id}
                    className={`rounded-2xl bg-white border p-4 space-y-2.5 ${
                      alert.severity === 'Risk' ? 'border-red-200' : 'border-amber-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg shrink-0" aria-hidden="true">
                          {alert.cropEmoji}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-[#1E293B] leading-snug">
                            {alert.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600 mt-0.5 tabular-nums">
                            <HazardIcon hazard={alert.hazard} />
                            <span>{alert.triggerMetric}</span>
                            <span aria-hidden="true">·</span>
                            <span>{alert.dayLabel}</span>
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={alert.severity} label={alert.severity} />
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed">{alert.message}</p>

                    <div className="rounded-xl bg-[#FAFBF9] border border-[#E5EAE6] px-3 py-2 text-xs text-[#1E293B]">
                      <span className="font-semibold text-[#1B4332]">Recommended action: </span>
                      <span>{alert.actionStep}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenCalendarForCrop(alert.cropId);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B4332] hover:text-[#2D6A4F]"
                      >
                        <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>View Crop Stage</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDismissAlert(alert.id)}
                        aria-label={`Dismiss ${alert.cropName} alert`}
                        className="text-xs font-medium text-slate-500 hover:text-[#1E293B] px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

interface CropAlertToastProps {
  alert: CropWeatherAlert | null;
  onDismiss: () => void;
  onOpenAlerts: () => void;
}

export function CropAlertToast({ alert, onDismiss, onOpenAlerts }: CropAlertToastProps) {
  if (!alert) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      data-testid="crop-alert-toast"
      className="fixed bottom-20 lg:bottom-5 right-4 left-4 sm:left-auto sm:w-96 z-40 rounded-2xl bg-[#141816] text-white border border-[#2C352F] shadow-xl p-4 flex items-start gap-3"
    >
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          alert.severity === 'Risk'
            ? 'bg-red-500/20 text-red-300'
            : 'bg-amber-500/20 text-amber-300'
        }`}
      >
        <ShieldAlert className="w-5 h-5" aria-hidden="true" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wide text-amber-300">
            {alert.severity === 'Risk' ? 'Crop Weather Risk' : 'Weather Caution'}
          </span>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close alert notification"
            className="text-slate-400 hover:text-white p-0.5 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="text-sm font-bold text-white mt-0.5 truncate">
          {alert.cropEmoji} {alert.title}
        </div>
        <p className="text-xs text-slate-300 mt-1 line-clamp-2">{alert.message}</p>
        <button
          type="button"
          onClick={() => {
            onDismiss();
            onOpenAlerts();
          }}
          className="mt-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
        >
          View Crop Alerts &rarr;
        </button>
      </div>
    </div>
  );
}
