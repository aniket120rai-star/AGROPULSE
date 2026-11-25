import type { WeatherTheme } from '../types/agro';

interface WeatherAnimatedBgProps {
  theme: WeatherTheme;
  isDaytime?: boolean;
}

const RAIN_STREAKS = [
  { left: '4%', delay: '0s', duration: '0.95s', height: '26px', opacity: 0.35 },
  { left: '10%', delay: '0.35s', duration: '1.15s', height: '32px', opacity: 0.45 },
  { left: '16%', delay: '0.15s', duration: '1.05s', height: '22px', opacity: 0.3 },
  { left: '22%', delay: '0.6s', duration: '0.9s', height: '30px', opacity: 0.5 },
  { left: '28%', delay: '0.25s', duration: '1.2s', height: '28px', opacity: 0.38 },
  { left: '34%', delay: '0.8s', duration: '1.0s', height: '34px', opacity: 0.48 },
  { left: '41%', delay: '0.05s', duration: '1.1s', height: '24px', opacity: 0.35 },
  { left: '48%', delay: '0.5s', duration: '0.92s', height: '30px', opacity: 0.5 },
  { left: '54%', delay: '0.2s', duration: '1.18s', height: '26px', opacity: 0.35 },
  { left: '61%', delay: '0.7s', duration: '0.98s', height: '34px', opacity: 0.45 },
  { left: '67%', delay: '0.4s', duration: '1.08s', height: '24px', opacity: 0.34 },
  { left: '74%', delay: '0.1s', duration: '0.88s', height: '32px', opacity: 0.52 },
  { left: '80%', delay: '0.55s', duration: '1.12s', height: '28px', opacity: 0.36 },
  { left: '86%', delay: '0.3s', duration: '0.96s', height: '30px', opacity: 0.46 },
  { left: '92%', delay: '0.75s', duration: '1.04s', height: '24px', opacity: 0.38 },
];

export function WeatherAnimatedBg({ theme, isDaytime = true }: WeatherAnimatedBgProps) {
  if (theme === 'rainy') {
    return (
      <div
        aria-hidden="true"
        data-weather-theme="rainy"
        className="pointer-events-none absolute inset-0 overflow-hidden bg-gradient-to-br from-[#EAF2F0] via-[#EEF5F4] to-[#DCE8EA]"
      >
        {/* Soft monsoon cloud canopy */}
        <div className="animate-agro-cloud-slow absolute -top-8 -left-10 w-80 h-28 rounded-full bg-slate-400/20 blur-xl" />
        <div className="animate-agro-cloud-fast absolute -top-6 right-8 w-96 h-32 rounded-full bg-[#2D6A4F]/12 blur-2xl" />

        {/* Falling rain streaks */}
        {RAIN_STREAKS.map((drop, idx) => (
          <span
            key={idx}
            className="animate-agro-rain absolute top-0 w-[1.5px] rounded-full bg-gradient-to-b from-transparent via-[#2D6A4F]/55 to-[#1B4332]/70"
            style={{
              left: drop.left,
              height: drop.height,
              opacity: drop.opacity,
              animationDelay: drop.delay,
              animationDuration: drop.duration,
            }}
          />
        ))}
      </div>
    );
  }

  if (theme === 'cloudy') {
    return (
      <div
        aria-hidden="true"
        data-weather-theme="cloudy"
        className="pointer-events-none absolute inset-0 overflow-hidden bg-gradient-to-br from-[#F4F7F5] via-[#EDF2EF] to-[#E2EAE6]"
      >
        {/* Drifting layered cloud banks */}
        <div className="animate-agro-cloud-slow absolute -top-8 left-[6%] flex items-end opacity-75">
          <div className="w-40 h-16 rounded-full bg-white/85 blur-[2px]" />
          <div className="-ml-16 w-56 h-24 rounded-full bg-white/80 blur-[3px]" />
          <div className="-ml-14 w-36 h-14 rounded-full bg-slate-200/75 blur-[2px]" />
        </div>

        <div className="animate-agro-cloud-fast absolute top-10 right-[4%] flex items-end opacity-65">
          <div className="w-44 h-16 rounded-full bg-white/85 blur-[2px]" />
          <div className="-ml-14 w-60 h-24 rounded-full bg-slate-100/85 blur-[3px]" />
        </div>

        <div className="animate-agro-cloud-slow absolute bottom-4 left-[28%] w-96 h-20 rounded-full bg-white/55 blur-xl" />
      </div>
    );
  }

  // Sunny / Clear
  return (
    <div
      aria-hidden="true"
      data-weather-theme="sunny"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${
        isDaytime
          ? 'bg-gradient-to-br from-[#FFFDF7] via-[#FAFBF5] to-[#FEF3C7]/65'
          : 'bg-gradient-to-br from-[#F3F6F4] via-[#ECF2EE] to-[#E2EAE5]'
      }`}
    >
      {/* Solar halo + slow rotating beam rays */}
      <div className="animate-agro-sun-pulse absolute -top-16 -right-14 w-64 h-64 rounded-full bg-amber-300/35 blur-2xl" />
      <div
        className="animate-agro-sun-spin absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-40"
        style={{
          background:
            'conic-gradient(from 0deg, transparent 0deg 18deg, rgba(217, 119, 6, 0.18) 22deg 36deg, transparent 40deg 65deg, rgba(245, 158, 11, 0.16) 70deg 86deg, transparent 90deg 120deg, rgba(217, 119, 6, 0.15) 125deg 142deg, transparent 146deg 185deg, rgba(245, 158, 11, 0.18) 190deg 210deg, transparent 215deg 255deg, rgba(217, 119, 6, 0.14) 260deg 280deg, transparent 285deg 360deg)',
        }}
      />
      <div className="animate-agro-mote-float absolute top-8 right-24 w-3 h-3 rounded-full bg-amber-400/45 blur-[1px]" />
      <div
        className="animate-agro-mote-float absolute bottom-12 right-44 w-2.5 h-2.5 rounded-full bg-amber-300/50 blur-[1px]"
        style={{ animationDelay: '2.2s' }}
      />
      <div
        className="animate-agro-mote-float absolute top-16 left-1/3 w-2 h-2 rounded-full bg-emerald-500/20 blur-[1px]"
        style={{ animationDelay: '4s' }}
      />
    </div>
  );
}
