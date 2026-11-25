import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAdvisoryFromForecast,
  classifyWeatherTheme,
  formatPlaceLocalTime,
  mapWmoCodeToWeather,
} from './weatherHelpers.ts';

test('classifyWeatherTheme distinguishes sunny, cloudy, and rainy conditions', () => {
  assert.equal(classifyWeatherTheme('Clear & Sunny', 10, 5), 'sunny');
  assert.equal(classifyWeatherTheme('Partly Cloudy', 18, 60), 'cloudy');
  assert.equal(classifyWeatherTheme('Light Showers', 55, 80), 'rainy');
  assert.equal(classifyWeatherTheme('Mostly Clear', 72, 20), 'rainy');
});

test('mapWmoCodeToWeather maps WMO meteorological codes accurately', () => {
  assert.equal(mapWmoCodeToWeather(0, 5).theme, 'sunny');
  assert.equal(mapWmoCodeToWeather(3, 15).theme, 'cloudy');
  assert.equal(mapWmoCodeToWeather(63, 75).theme, 'rainy');
  assert.equal(mapWmoCodeToWeather(95, 85).dayCondition, 'Heavy Rain');
});

test('formatPlaceLocalTime formats exact time for target IANA timezone', () => {
  // 2026-11-21T06:30:00Z is 12:00:00 PM in Asia/Kolkata (+05:30)
  const utcMs = Date.UTC(2026, 10, 21, 6, 30, 0);
  const ist = formatPlaceLocalTime(utcMs, 'Asia/Kolkata', 'en');
  assert.match(ist.timeText.toLowerCase(), /12:00:00/);
  assert.match(ist.dateText, /21/);

  // Same instant in America/Los_Angeles (UTC-8 in Nov) is 10:30:00 PM on Nov 20
  const pst = formatPlaceLocalTime(utcMs, 'America/Los_Angeles', 'en');
  assert.match(pst.timeText.toLowerCase(), /10:30:00/);
  assert.match(pst.dateText, /20/);
});

test('buildAdvisoryFromForecast produces Risk alert for heavy rain days', () => {
  const advisory = buildAdvisoryFromForecast(
    [
      {
        day: 'Sat',
        dateLabel: 'Nov 21',
        tempHigh: 26,
        tempLow: 18,
        rainProb: 78,
        humidity: 82,
        condition: 'Heavy Rain',
      },
    ],
    20
  );
  assert.equal(advisory.alertStatus, 'Risk');
  assert.match(advisory.alertTitle, /Heavy rain expected Sat/);
});
