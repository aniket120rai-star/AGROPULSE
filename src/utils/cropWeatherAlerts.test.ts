import assert from 'node:assert/strict';
import test from 'node:test';
import { CROPS_CATALOG } from '../data/agroData';
import type { WeatherProfile } from '../types/agro';
import {
  DEFAULT_NOTIFICATION_PREFS,
  evaluateCropWeatherAlerts,
  getCropThresholdSummary,
} from './cropWeatherAlerts';

const MILD_WEATHER: WeatherProfile = {
  locationLabel: 'Ludhiana, Punjab',
  currentTemp: 23,
  condition: 'Clear & Sunny',
  humidity: 50,
  rainProb: 10,
  windKmh: 8,
  alertStatus: 'Good',
  alertTitle: 'Clear window',
  alertAdvice: 'Ideal conditions.',
  forecast: [
    { day: 'Sat', dateLabel: 'Nov 21', tempHigh: 24, tempLow: 12, rainProb: 10, humidity: 52, condition: 'Sunny' },
    { day: 'Sun', dateLabel: 'Nov 22', tempHigh: 25, tempLow: 13, rainProb: 15, humidity: 54, condition: 'Sunny' },
  ],
};

test('evaluateCropWeatherAlerts returns empty array when farm plan has no crops', () => {
  const extremeWeather: WeatherProfile = {
    ...MILD_WEATHER,
    currentTemp: 41,
    humidity: 90,
    rainProb: 85,
  };
  const alerts = evaluateCropWeatherAlerts([], CROPS_CATALOG, extremeWeather);
  assert.equal(alerts.length, 0);
});

test('triggers high-humidity Late Blight Risk alert for Potato in Farm Plan', () => {
  const humidWeather: WeatherProfile = {
    ...MILD_WEATHER,
    locationLabel: 'Kamrup, Assam',
    humidity: 86,
    forecast: [
      { day: 'Sat', dateLabel: 'Nov 21', tempHigh: 24, tempLow: 14, rainProb: 20, humidity: 86, condition: 'Partly Cloudy' },
    ],
  };

  const alerts = evaluateCropWeatherAlerts(['potato'], CROPS_CATALOG, humidWeather);
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].cropId, 'potato');
  assert.equal(alerts[0].hazard, 'humidity');
  assert.equal(alerts[0].severity, 'Risk');
  assert.match(alerts[0].title, /Late Blight/i);
});

test('triggers extreme heat alert from upcoming 7-day forecast even when today is mild', () => {
  const heatwaveForecast: WeatherProfile = {
    ...MILD_WEATHER,
    currentTemp: 27,
    forecast: [
      { day: 'Sat', dateLabel: 'Nov 21', tempHigh: 28, tempLow: 16, rainProb: 5, humidity: 45, condition: 'Sunny' },
      { day: 'Tue', dateLabel: 'Nov 24', tempHigh: 37, tempLow: 21, rainProb: 5, humidity: 40, condition: 'Sunny' },
    ],
  };

  const alerts = evaluateCropWeatherAlerts(['wheat'], CROPS_CATALOG, heatwaveForecast);
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].hazard, 'heat');
  assert.equal(alerts[0].severity, 'Risk');
  assert.match(alerts[0].dayLabel, /Tue/);
});

test('respects notification preference filters and sorts Risk before Caution', () => {
  const multiHazardWeather: WeatherProfile = {
    ...MILD_WEATHER,
    currentTemp: 33, // Caution heat for potato (>=29, <33 is false -> 33 is extreme! Wait: extremeTempC is 33 so Risk)
    humidity: 77, // Caution humidity for potato (>=75, <82)
    rainProb: 75, // Risk rain for potato (>=70)
    forecast: [
      { day: 'Sat', dateLabel: 'Nov 21', tempHigh: 31, tempLow: 18, rainProb: 75, humidity: 77, condition: 'Heavy Rain' },
    ],
  };

  const allAlerts = evaluateCropWeatherAlerts(
    ['potato'],
    CROPS_CATALOG,
    multiHazardWeather,
    DEFAULT_NOTIFICATION_PREFS
  );
  assert.equal(allAlerts.length, 3);
  assert.equal(allAlerts[0].severity, 'Risk');

  const noHumidityAlerts = evaluateCropWeatherAlerts(
    ['potato'],
    CROPS_CATALOG,
    multiHazardWeather,
    { ...DEFAULT_NOTIFICATION_PREFS, monitorHumidity: false }
  );
  assert.equal(
    noHumidityAlerts.some((a) => a.hazard === 'humidity'),
    false
  );
  assert.equal(noHumidityAlerts.length, 2);
});

test('getCropThresholdSummary returns readable crop limits', () => {
  const summary = getCropThresholdSummary('tomato');
  assert.match(summary, /33°C/);
  assert.match(summary, /75%/);
});
