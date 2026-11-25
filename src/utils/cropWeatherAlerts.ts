import type {
  BrowserNotificationPermission,
  Crop,
  CropWeatherAlert,
  CropWeatherHazard,
  NotificationPrefs,
  WeatherProfile,
} from '../types/agro';

export interface CropWeatherThreshold {
  maxTempC: number;
  extremeTempC: number;
  minTempC?: number;
  maxHumidityPct: number;
  highHumidityPct: number;
  maxRainProbPct: number;
  maxWindKmh?: number;
  humidityRiskLabel: string;
  humidityAction: string;
  heatRiskLabel: string;
  heatAction: string;
  rainRiskLabel: string;
  rainAction: string;
  frostAction?: string;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  browserAlertsEnabled: true,
  monitorHumidity: true,
  monitorHeat: true,
  monitorRain: true,
};

export const CROP_WEATHER_THRESHOLDS: Record<string, CropWeatherThreshold> = {
  wheat: {
    maxTempC: 32,
    extremeTempC: 35,
    minTempC: 4,
    maxHumidityPct: 75,
    highHumidityPct: 82,
    maxRainProbPct: 65,
    maxWindKmh: 28,
    humidityRiskLabel: 'Yellow Rust & Fungal Pressure',
    humidityAction:
      'Inspect lower leaves for yellow rust streaks and withhold late afternoon irrigation.',
    heatRiskLabel: 'Terminal Heat / Grain Shriveling Risk',
    heatAction:
      'Give a light evening irrigation at grain-fill stage to cool the canopy and prevent shriveling.',
    rainRiskLabel: 'Lodging & Waterlogging Risk',
    rainAction:
      'Skip irrigation ahead of heavy showers to keep wheat stalks upright in wet soil.',
    frostAction:
      'Apply light surface irrigation at dusk to protect heading spikes from cold injury.',
  },
  mustard: {
    maxTempC: 31,
    extremeTempC: 34,
    minTempC: 4,
    maxHumidityPct: 72,
    highHumidityPct: 80,
    maxRainProbPct: 60,
    humidityRiskLabel: 'Mustard Aphid & White Rust Outbreak',
    humidityAction:
      'Check flower buds for aphid clusters and apply preventive Neem oil spray after 4 PM.',
    heatRiskLabel: 'Forced Pod Maturity / Heat Stress',
    heatAction:
      'Provide a light protective irrigation during siliqua filling to prevent premature pod drying.',
    rainRiskLabel: 'Pod Shattering & Downy Mildew Risk',
    rainAction:
      'Clear field boundary drains immediately; mustard tolerates zero standing water.',
    frostAction: 'Generate light orchard smoke or irrigate lightly before dawn during frost.',
  },
  potato: {
    maxTempC: 29,
    extremeTempC: 33,
    minTempC: 3,
    maxHumidityPct: 75,
    highHumidityPct: 82,
    maxRainProbPct: 60,
    humidityRiskLabel: 'Late Blight Fungal Alert',
    humidityAction:
      'Spray preventive Mancozeb (2 g/L) or Copper Oxychloride before foggy/humid conditions worsen.',
    heatRiskLabel: 'Tuber Bulking Heat Stress',
    heatAction:
      'Maintain ridge moisture with light evening furrow irrigation and keep tubers well covered.',
    rainRiskLabel: 'Ridge Erosion & Tuber Rot Risk',
    rainAction:
      'Open furrow outlets so rainwater drains within 4 hours and halt irrigation.',
    frostAction:
      'Light evening sprinkler/furrow irrigation shields tender foliage from ground frost.',
  },
  chickpea: {
    maxTempC: 32,
    extremeTempC: 36,
    minTempC: 5,
    maxHumidityPct: 76,
    highHumidityPct: 84,
    maxRainProbPct: 55,
    humidityRiskLabel: 'Ascochyta Blight & Botrytis Mold Risk',
    humidityAction:
      'Avoid overhead wetting and scout dense canopy patches for stem/pod lesions.',
    heatRiskLabel: 'Flower Drop & Pod Fill Heat Stress',
    heatAction:
      'Apply a foliar spray of 2% DAP or light evening irrigation if winter heat spikes.',
    rainRiskLabel: 'Root Wilt & Pod Rot Risk',
    rainAction:
      'Ensure perimeter drainage furrows stay open to prevent root asphyxiation.',
  },
  'paddy-kharif': {
    maxTempC: 36,
    extremeTempC: 39,
    maxHumidityPct: 82,
    highHumidityPct: 88,
    maxRainProbPct: 85,
    maxWindKmh: 34,
    humidityRiskLabel: 'Leaf Blast & Sheath Blight Surge',
    humidityAction:
      'Drain excess standing water briefly and avoid extra urea top-dressing until humidity drops.',
    heatRiskLabel: 'Panicle Spikelet Sterility Heat Risk',
    heatAction:
      'Keep 5 cm standing water during flowering/anthesis to buffer canopy temperature.',
    rainRiskLabel: 'Bund Overflow & Flash Flood Risk',
    rainAction:
      'Open spillway notches in paddy bunds to safely release heavy storm runoff.',
  },
  maize: {
    maxTempC: 35,
    extremeTempC: 38,
    maxHumidityPct: 80,
    highHumidityPct: 86,
    maxRainProbPct: 65,
    maxWindKmh: 30,
    humidityRiskLabel: 'Banded Leaf & Sheath Blight Alert',
    humidityAction:
      'Ensure clean furrow airflow and watch lower leaf sheaths for water-soaked blotches.',
    heatRiskLabel: 'Pollen Desiccation & Silk Stress',
    heatAction:
      'Irrigate immediately during tasseling/silking so hot dry air does not reduce kernel set.',
    rainRiskLabel: 'Maize Root Waterlogging Risk',
    rainAction:
      'Clear ridge-furrow outlets promptly — maize suffers yield loss after 24h waterlogging.',
  },
  soybean: {
    maxTempC: 34,
    extremeTempC: 37,
    maxHumidityPct: 80,
    highHumidityPct: 86,
    maxRainProbPct: 65,
    humidityRiskLabel: 'Anthracnose & Pod Blight Risk',
    humidityAction:
      'Monitor lower canopy and rogue yellow mosaic leaves before fungal spread accelerates.',
    heatRiskLabel: 'Pod Set Moisture & Heat Stress',
    heatAction:
      'Give 1 protective irrigation if high heat persists during R3–R5 pod filling.',
    rainRiskLabel: 'Broad-Bed Waterlogging & Shattering Risk',
    rainAction:
      'Maintain broad-bed furrow drainage channels and harvest mature pods prior to storm rain.',
  },
  moong: {
    maxTempC: 38,
    extremeTempC: 41,
    maxHumidityPct: 78,
    highHumidityPct: 84,
    maxRainProbPct: 55,
    humidityRiskLabel: 'Powdery Mildew & Cercospora Leaf Spot',
    humidityAction:
      'Scout older leaves and apply preventive Neem oil or Wettable Sulphur in cool evening hours.',
    heatRiskLabel: 'Blossom Drop Extreme Heat Risk',
    heatAction:
      'Give a light irrigation during flowering and monitor thrips activity.',
    rainRiskLabel: 'Mature Pod Sprouting Risk',
    rainAction:
      'Pick ripe black pods ahead of rain showers to prevent in-pod seed sprouting.',
  },
  watermelon: {
    maxTempC: 38,
    extremeTempC: 41,
    maxHumidityPct: 76,
    highHumidityPct: 83,
    maxRainProbPct: 55,
    humidityRiskLabel: 'Powdery & Downy Mildew Alert',
    humidityAction:
      'Spray Wettable Sulphur (2 g/L) at dusk and stop late-evening drip cycles.',
    heatRiskLabel: 'Fruit Sunscald & Vine Wilt Risk',
    heatAction:
      'Maintain scheduled morning drip fertigation and shelter exposed fruits with vine cover.',
    rainRiskLabel: 'Fruit Cracking & Sweetness Dilution Risk',
    rainAction:
      'Drain bed alleys fast and pause drip irrigation immediately before rainfall.',
  },
  tomato: {
    maxTempC: 33,
    extremeTempC: 36,
    minTempC: 6,
    maxHumidityPct: 75,
    highHumidityPct: 82,
    maxRainProbPct: 60,
    humidityRiskLabel: 'Early/Late Blight & Bacterial Wilt Risk',
    humidityAction:
      'Prune lower leaves touching damp soil and spray preventive Azoxystrobin or Copper fungicide.',
    heatRiskLabel: 'Pollen Sterility & Blossom Drop Alert',
    heatAction:
      'Run morning drip irrigation and apply foliar Calcium Nitrate + shade net if heat climbs.',
    rainRiskLabel: 'Fruit Cracking & Splash Blight Risk',
    rainAction:
      'Check bamboo stakes/ties and improve bed drainage before heavy showers arrive.',
  },
};

const GENERIC_THRESHOLD: CropWeatherThreshold = {
  maxTempC: 34,
  extremeTempC: 38,
  minTempC: 4,
  maxHumidityPct: 78,
  highHumidityPct: 85,
  maxRainProbPct: 65,
  maxWindKmh: 30,
  humidityRiskLabel: 'High Fungal & Pest Pressure',
  humidityAction: 'Monitor lower foliage closely and schedule preventive sprays for dry calm hours.',
  heatRiskLabel: 'Crop Heat Stress Warning',
  heatAction: 'Schedule light evening irrigation to cool root-zone and canopy temperatures.',
  rainRiskLabel: 'Excess Moisture & Drainage Risk',
  rainAction: 'Clear field drainage outlets and postpone urea or foliar sprays.',
  frostAction: 'Provide light evening irrigation to buffer night cold.',
};

export function getCropThreshold(cropId: string): CropWeatherThreshold {
  return CROP_WEATHER_THRESHOLDS[cropId] ?? GENERIC_THRESHOLD;
}

export function getCropThresholdSummary(cropId: string): string {
  const th = getCropThreshold(cropId);
  return `Heat >${th.maxTempC}°C · Humidity >${th.maxHumidityPct}% · Rain ≥${th.maxRainProbPct}%`;
}

export function evaluateCropWeatherAlerts(
  farmPlanIds: string[],
  crops: Crop[],
  weather: WeatherProfile,
  prefs: NotificationPrefs = DEFAULT_NOTIFICATION_PREFS
): CropWeatherAlert[] {
  if (!farmPlanIds.length || !weather) return [];

  const cropMap = new Map(crops.map((c) => [c.id, c]));
  const alerts: CropWeatherAlert[] = [];
  const locationSlug = weather.locationLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  for (const cropId of farmPlanIds) {
    const crop = cropMap.get(cropId);
    if (!crop) continue;
    const th = getCropThreshold(cropId);

    // Find worst heat, humidity, rain, frost across current + 7-day forecast
    const peakTempDay = weather.forecast.reduce<{
      temp: number;
      dayLabel: string;
    }>(
      (best, d) =>
        d.tempHigh > best.temp ? { temp: d.tempHigh, dayLabel: `${d.day} (${d.dateLabel})` } : best,
      { temp: weather.currentTemp, dayLabel: 'Today' }
    );

    const peakHumidityDay = weather.forecast.reduce<{
      humidity: number;
      dayLabel: string;
    }>(
      (best, d) =>
        d.humidity > best.humidity
          ? { humidity: d.humidity, dayLabel: `${d.day} (${d.dateLabel})` }
          : best,
      { humidity: weather.humidity, dayLabel: 'Today' }
    );

    const peakRainDay = weather.forecast.reduce<{
      rainProb: number;
      dayLabel: string;
    }>(
      (best, d) =>
        d.rainProb > best.rainProb
          ? { rainProb: d.rainProb, dayLabel: `${d.day} (${d.dateLabel})` }
          : best,
      { rainProb: weather.rainProb, dayLabel: 'Today' }
    );

    const lowestTempDay = weather.forecast.reduce<{
      temp: number;
      dayLabel: string;
    }>(
      (best, d) =>
        d.tempLow < best.temp ? { temp: d.tempLow, dayLabel: `${d.day} (${d.dateLabel})` } : best,
      { temp: weather.currentTemp, dayLabel: 'Today' }
    );

    if (prefs.monitorHumidity && peakHumidityDay.humidity >= th.maxHumidityPct) {
      const isHigh = peakHumidityDay.humidity >= th.highHumidityPct;
      const hazard: CropWeatherHazard = 'humidity';
      alerts.push({
        id: `${crop.id}-${hazard}-${locationSlug}`,
        fingerprint: `${crop.id}:${hazard}:${isHigh ? 'risk' : 'caution'}:${locationSlug}`,
        cropId: crop.id,
        cropName: crop.name,
        cropEmoji: crop.iconEmoji,
        hazard,
        severity: isHigh ? 'Risk' : 'Caution',
        title: `${crop.name}: ${th.humidityRiskLabel}`,
        message: `Humidity reaches ${peakHumidityDay.humidity}% (${peakHumidityDay.dayLabel}), above ${crop.name}'s ${th.maxHumidityPct}% safe limit.`,
        actionStep: th.humidityAction,
        triggerMetric: `${peakHumidityDay.humidity}% RH (limit ${th.maxHumidityPct}%)`,
        dayLabel: peakHumidityDay.dayLabel,
      });
    }

    if (prefs.monitorHeat && peakTempDay.temp >= th.maxTempC) {
      const isExtreme = peakTempDay.temp >= th.extremeTempC;
      const hazard: CropWeatherHazard = 'heat';
      alerts.push({
        id: `${crop.id}-${hazard}-${locationSlug}`,
        fingerprint: `${crop.id}:${hazard}:${isExtreme ? 'risk' : 'caution'}:${locationSlug}`,
        cropId: crop.id,
        cropName: crop.name,
        cropEmoji: crop.iconEmoji,
        hazard,
        severity: isExtreme ? 'Risk' : 'Caution',
        title: `${crop.name}: ${th.heatRiskLabel}`,
        message: `Temperature hits ${peakTempDay.temp}°C (${peakTempDay.dayLabel}), exceeding ${crop.name}'s ${th.maxTempC}°C threshold.`,
        actionStep: th.heatAction,
        triggerMetric: `${peakTempDay.temp}°C (limit ${th.maxTempC}°C)`,
        dayLabel: peakTempDay.dayLabel,
      });
    }

    if (prefs.monitorRain && peakRainDay.rainProb >= th.maxRainProbPct) {
      const isHeavy = peakRainDay.rainProb >= Math.max(70, th.maxRainProbPct + 10);
      const hazard: CropWeatherHazard = 'rain';
      alerts.push({
        id: `${crop.id}-${hazard}-${locationSlug}`,
        fingerprint: `${crop.id}:${hazard}:${isHeavy ? 'risk' : 'caution'}:${locationSlug}`,
        cropId: crop.id,
        cropName: crop.name,
        cropEmoji: crop.iconEmoji,
        hazard,
        severity: isHeavy ? 'Risk' : 'Caution',
        title: `${crop.name}: ${th.rainRiskLabel}`,
        message: `Rain probability climbs to ${peakRainDay.rainProb}% (${peakRainDay.dayLabel}), posing runoff/disease risk for ${crop.name}.`,
        actionStep: th.rainAction,
        triggerMetric: `${peakRainDay.rainProb}% rain (limit ${th.maxRainProbPct}%)`,
        dayLabel: peakRainDay.dayLabel,
      });
    }

    if (prefs.monitorHeat && th.minTempC !== undefined && lowestTempDay.temp <= th.minTempC) {
      const hazard: CropWeatherHazard = 'frost';
      alerts.push({
        id: `${crop.id}-${hazard}-${locationSlug}`,
        fingerprint: `${crop.id}:${hazard}:risk:${locationSlug}`,
        cropId: crop.id,
        cropName: crop.name,
        cropEmoji: crop.iconEmoji,
        hazard,
        severity: 'Risk',
        title: `${crop.name}: Cold / Frost Injury Alert`,
        message: `Night low dips to ${lowestTempDay.temp}°C (${lowestTempDay.dayLabel}), near ${crop.name}'s frost limit (${th.minTempC}°C).`,
        actionStep:
          th.frostAction ||
          'Apply light evening irrigation or cover young nursery rows before midnight.',
        triggerMetric: `${lowestTempDay.temp}°C low (min ${th.minTempC}°C)`,
        dayLabel: lowestTempDay.dayLabel,
      });
    }
  }

  return alerts.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'Risk' ? -1 : 1;
    return a.cropName.localeCompare(b.cropName);
  });
}

export function getBrowserNotificationPermission(): BrowserNotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return window.Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<BrowserNotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const result = await window.Notification.requestPermission();
    return result;
  } catch {
    return window.Notification.permission ?? 'denied';
  }
}

export function dispatchBrowserNotification(alert: CropWeatherAlert): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (window.Notification.permission !== 'granted') {
    return false;
  }
  try {
    const prefix = alert.severity === 'Risk' ? 'RISK ALERT' : 'WEATHER CAUTION';
    const notif = new window.Notification(`${alert.cropEmoji} ${prefix}: ${alert.title}`, {
      body: `${alert.message} Action: ${alert.actionStep}`,
      tag: alert.fingerprint,
      requireInteraction: alert.severity === 'Risk',
    });
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
    return true;
  } catch {
    return false;
  }
}
