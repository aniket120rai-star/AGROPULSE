import type { LanguageCode, StatusLevel, WeatherDay, WeatherTheme } from '../types/agro';

export function classifyWeatherTheme(
  conditionText: string,
  rainProb = 0,
  cloudCover = 0
): WeatherTheme {
  const lower = (conditionText || '').toLowerCase();
  if (
    lower.includes('rain') ||
    lower.includes('shower') ||
    lower.includes('drizzle') ||
    lower.includes('storm') ||
    lower.includes('thunder') ||
    rainProb >= 45
  ) {
    return 'rainy';
  }
  if (
    lower.includes('cloud') ||
    lower.includes('overcast') ||
    lower.includes('fog') ||
    lower.includes('mist') ||
    lower.includes('haze') ||
    cloudCover >= 55
  ) {
    return 'cloudy';
  }
  return 'sunny';
}

export function mapWmoCodeToWeather(
  code: number,
  rainProb = 0
): { label: string; dayCondition: WeatherDay['condition']; theme: WeatherTheme } {
  if (code >= 95) {
    return { label: 'Thunderstorms', dayCondition: 'Heavy Rain', theme: 'rainy' };
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    const heavy = code === 65 || code === 82 || rainProb >= 65;
    return {
      label: heavy ? 'Rain Showers' : 'Light Rain',
      dayCondition: heavy ? 'Heavy Rain' : 'Light Rain',
      theme: 'rainy',
    };
  }
  if (code === 3 || code === 45 || code === 48) {
    return { label: 'Cloudy', dayCondition: 'Partly Cloudy', theme: 'cloudy' };
  }
  if (code === 2) {
    return { label: 'Partly Cloudy', dayCondition: 'Partly Cloudy', theme: 'cloudy' };
  }
  if (code === 1) {
    return { label: 'Mostly Sunny', dayCondition: 'Sunny', theme: 'sunny' };
  }
  return { label: 'Clear & Sunny', dayCondition: 'Sunny', theme: 'sunny' };
}

export function mapGoogleWeatherType(
  type: string,
  description: string,
  rainProb = 0
): { label: string; dayCondition: WeatherDay['condition']; theme: WeatherTheme } {
  const upper = (type || '').toUpperCase();
  if (
    upper.includes('RAIN') ||
    upper.includes('SHOWER') ||
    upper.includes('STORM') ||
    upper.includes('DRIZZLE')
  ) {
    const heavy = upper.includes('HEAVY') || upper.includes('STORM') || rainProb >= 65;
    return {
      label: description || (heavy ? 'Rain Showers' : 'Light Rain'),
      dayCondition: heavy ? 'Heavy Rain' : 'Light Rain',
      theme: 'rainy',
    };
  }
  if (upper.includes('CLOUD') || upper.includes('OVERCAST') || upper.includes('FOG')) {
    return {
      label: description || 'Cloudy',
      dayCondition: 'Partly Cloudy',
      theme: 'cloudy',
    };
  }
  return {
    label: description || 'Clear & Sunny',
    dayCondition: 'Sunny',
    theme: 'sunny',
  };
}

export function buildAdvisoryFromForecast(
  forecast: WeatherDay[],
  currentRainProb: number
): { alertStatus: StatusLevel; alertTitle: string; alertAdvice: string } {
  const heavyRainDay = forecast.find((d) => d.rainProb >= 65);
  if (heavyRainDay) {
    return {
      alertStatus: 'Risk',
      alertTitle: `Heavy rain expected ${heavyRainDay.day} (${heavyRainDay.rainProb}% probability)`,
      alertAdvice:
        'Delay top-dressing urea and foliar pesticide sprays. Clear field drainage channels before rainfall.',
    };
  }

  const moderateRainDay = forecast.find((d) => d.rainProb >= 40);
  if (moderateRainDay || currentRainProb >= 40) {
    const targetDay = moderateRainDay ?? forecast[0];
    return {
      alertStatus: 'Caution',
      alertTitle: targetDay
        ? `Light showers likely on ${targetDay.day} (${targetDay.rainProb}% chance)`
        : 'Light showers expected today',
      alertAdvice:
        'Schedule herbicide or micronutrient spraying for early morning before wind picks up; postpone heavy irrigation.',
    };
  }

  return {
    alertStatus: 'Good',
    alertTitle: 'Clear dry window across the next 5 days',
    alertAdvice:
      'Ideal weather for basal fertilizer application, sowing, and preventive neem oil sprays.',
  };
}

const INTL_LOCALE_BY_LANG: Record<LanguageCode, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  as: 'as-IN',
  bn: 'bn-IN',
};

export function formatPlaceLocalTime(
  nowMs: number,
  timeZoneId?: string,
  language: LanguageCode = 'en'
): { timeText: string; dateText: string; zoneLabel: string } {
  const locale = INTL_LOCALE_BY_LANG[language] || 'en-IN';
  const date = new Date(nowMs);
  const resolvedTz = timeZoneId || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  try {
    const timeText = new Intl.DateTimeFormat(locale, {
      timeZone: resolvedTz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(date);

    const dateText = new Intl.DateTimeFormat(locale, {
      timeZone: resolvedTz,
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(date);

    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: resolvedTz,
      timeZoneName: 'short',
    }).formatToParts(date);
    const zoneLabel = parts.find((p) => p.type === 'timeZoneName')?.value || resolvedTz;

    return { timeText, dateText, zoneLabel };
  } catch {
    return {
      timeText: date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      dateText: date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' }),
      zoneLabel: 'Local',
    };
  }
}
