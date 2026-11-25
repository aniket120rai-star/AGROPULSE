import 'dotenv/config';
import http from 'http';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import {
  GoogleGenAI,
  LiveServerMessage,
  Modality,
  ThinkingLevel,
  Type,
} from '@google/genai';
import { requireAuth, optionalAuth, type AuthRequest } from './src/middleware/auth.ts';
import {
  appendChatMessages,
  clearChatMessages,
  getUserFullState,
  replaceBookmarkedGuides,
  replaceChecklistTasks,
  replaceFarmPlan,
  replaceStageCompletions,
  saveDiagnosisRecord,
  upsertFarmProfile,
} from './src/db/queries.ts';
import { resolveAssistantRoute } from './src/utils/assistantRouting.ts';
import {
  buildAdvisoryFromForecast,
  classifyWeatherTheme,
  mapGoogleWeatherType,
  mapWmoCodeToWeather,
} from './src/utils/weatherHelpers.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const DEFAULT_MODEL = 'gemini-4-hydrogen';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please add your Gemini API key in Settings > Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getMapsApiKey(): string {
  const key = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!key || key === 'MY_GOOGLE_MAPS_API_KEY') {
    throw new Error('Google Maps API key is not configured.');
  }
  return key;
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi (Devanagari script, simple farmer-friendly wording)',
  as: 'Assamese (Assamese script, simple farmer-friendly wording)',
  bn: 'Bengali (Bengali script, simple farmer-friendly wording)',
};

const THINKING_ENUM_MAP: Record<string, ThinkingLevel> = {
  MINIMAL: ThinkingLevel.MINIMAL,
  LOW: ThinkingLevel.LOW,
  HIGH: ThinkingLevel.HIGH,
  XHIGH: ThinkingLevel.XHIGH,
};

function extractReadableGeminiError(err: unknown, fallback: string): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : fallback;
  if (raw.includes('GEMINI_API_KEY')) {
    return { status: 503, message: raw };
  }
  try {
    const parsed = JSON.parse(raw);
    const code = Number(parsed?.error?.code) || 500;
    const msg = typeof parsed?.error?.message === 'string' ? parsed.error.message : fallback;
    if (code === 503 || parsed?.error?.status === 'UNAVAILABLE') {
      return {
        status: 503,
        message: 'The AI advisor is temporarily busy. Please try again in a few seconds.',
      };
    }
    if (code === 429 || parsed?.error?.status === 'RESOURCE_EXHAUSTED') {
      return {
        status: 429,
        message: 'AI rate limit reached. Please wait a moment before sending another question.',
      };
    }
    return { status: code >= 400 && code < 600 ? code : 500, message: msg };
  } catch {
    if (raw.includes('UNAVAILABLE') || raw.includes('503')) {
      return {
        status: 503,
        message: 'The AI advisor is temporarily busy. Please try again in a few seconds.',
      };
    }
    return { status: 500, message: raw || fallback };
  }
}

function isTransientOverload(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  return msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('high demand');
}

async function runWithTransientRetry<T>(fn: () => Promise<T>): Promise<T> {
  const delays = [400, 900];
  let lastError: unknown;
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!isTransientOverload(err) || attempt === delays.length) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // ---------------------------------------------------------------------------
  // Authenticated Cloud SQL User State & Persistence Routes
  // ---------------------------------------------------------------------------
  app.get('/api/me/state', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.dbUser) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const state = await getUserFullState(req.dbUser.id);
      res.json({ user: req.dbUser, state });
    } catch (error: unknown) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unable to load farm profile.',
      });
    }
  });

  app.put('/api/me/profile', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.dbUser) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const body = req.body ?? {};
      const location = typeof body.location === 'string' ? body.location.trim() : '';
      const landSize = Number(body.landSize);
      if (!location || !Number.isFinite(landSize) || landSize <= 0) {
        res.status(400).json({ error: 'Valid location and land size are required.' });
        return;
      }
      const saved = await upsertFarmProfile(req.dbUser.id, {
        location,
        district: typeof body.district === 'string' ? body.district.trim() : location,
        state: typeof body.state === 'string' ? body.state.trim() : 'India',
        latitude: typeof body.latitude === 'number' ? body.latitude : null,
        longitude: typeof body.longitude === 'number' ? body.longitude : null,
        landSize,
        landUnit: typeof body.landUnit === 'string' ? body.landUnit : 'Acre',
        soilType: typeof body.soilType === 'string' ? body.soilType : 'Alluvial',
        irrigation: typeof body.irrigation === 'string' ? body.irrigation : 'Canal',
        goal: typeof body.goal === 'string' ? body.goal : 'High Yield',
        soilPh: Number.isFinite(Number(body.soilPh)) ? Number(body.soilPh) : 6.8,
        language: typeof body.language === 'string' ? body.language : 'en',
        customized: Boolean(body.customized ?? true),
      });
      res.json({ profile: saved });
    } catch (error: unknown) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to save farm profile.',
      });
    }
  });

  app.put('/api/me/plan', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.dbUser) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const cropIds = Array.isArray(req.body?.cropIds)
        ? req.body.cropIds.filter((x: unknown): x is string => typeof x === 'string')
        : [];
      const saved = await replaceFarmPlan(req.dbUser.id, cropIds);
      res.json({ cropIds: saved });
    } catch (error: unknown) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to update farm plan.',
      });
    }
  });

  app.put('/api/me/tasks', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.dbUser) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const tasks = Array.isArray(req.body?.tasks) ? req.body.tasks : [];
      const sanitized = tasks
        .filter((t: any) => t && typeof t.title === 'string' && t.title.trim())
        .map((t: any) => ({
          id: String(t.id || `task-${Date.now()}`),
          title: t.title.trim(),
          category: String(t.category || 'Field Note'),
          season: String(t.season || 'All'),
          completed: Boolean(t.completed),
          dueLabel: String(t.dueLabel || 'Today'),
        }));
      await replaceChecklistTasks(req.dbUser.id, sanitized);
      res.json({ ok: true });
    } catch (error: unknown) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to save tasks.',
      });
    }
  });

  app.put('/api/me/stages', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.dbUser) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const raw = req.body?.completedStages;
      const sanitized: Record<string, number[]> = {};
      if (raw && typeof raw === 'object') {
        for (const [cropId, val] of Object.entries(raw)) {
          if (Array.isArray(val)) {
            sanitized[cropId] = val.filter((n): n is number => typeof n === 'number');
          }
        }
      }
      await replaceStageCompletions(req.dbUser.id, sanitized);
      res.json({ ok: true });
    } catch (error: unknown) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to save stage progress.',
      });
    }
  });

  app.put('/api/me/bookmarks', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.dbUser) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const guideIds = Array.isArray(req.body?.guideIds)
        ? req.body.guideIds.filter((x: unknown): x is string => typeof x === 'string')
        : [];
      const saved = await replaceBookmarkedGuides(req.dbUser.id, guideIds);
      res.json({ guideIds: saved });
    } catch (error: unknown) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to save bookmarks.',
      });
    }
  });

  app.post('/api/me/diagnoses', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.dbUser) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const d = req.body?.diagnosis;
      if (!d || typeof d.detectedIssue !== 'string') {
        res.status(400).json({ error: 'Invalid diagnosis payload.' });
        return;
      }
      await saveDiagnosisRecord(req.dbUser.id, {
        id: String(d.id || `diag-${Date.now()}`),
        timestamp: String(d.timestamp || new Date().toLocaleDateString()),
        cropName: String(d.cropName || 'Crop'),
        detectedIssue: d.detectedIssue,
        confidence: Number(d.confidence) || 85,
        status: String(d.status || 'Caution'),
        summary: String(d.summary || ''),
        organicTreatment: Array.isArray(d.organicTreatment) ? d.organicTreatment : [],
        chemicalTreatment: Array.isArray(d.chemicalTreatment) ? d.chemicalTreatment : [],
        preventionSteps: Array.isArray(d.preventionSteps) ? d.preventionSteps : [],
      });
      res.json({ ok: true });
    } catch (error: unknown) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to save diagnosis.',
      });
    }
  });

  app.delete('/api/me/chat', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.dbUser) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      await clearChatMessages(req.dbUser.id);
      res.json({ ok: true });
    } catch (error: unknown) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to clear conversation.',
      });
    }
  });

  // ---------------------------------------------------------------------------
  // Google Maps Platform Server-Side Proxy Routes (CORS-safe, Key protected)
  // ---------------------------------------------------------------------------
  app.get('/api/maps/reverse-geocode', async (req, res) => {
    try {
      const lat = Number(req.query.lat);
      const lng = Number(req.query.lng);
      const languageCode = typeof req.query.language === 'string' ? req.query.language : 'en';
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        res.status(400).json({ error: 'Valid lat and lng coordinates are required.' });
        return;
      }

      const apiKey = getMapsApiKey();
      const url = new URL('https://geocode.googleapis.com/v4/geocode/location');
      url.searchParams.append('location.latitude', String(lat));
      url.searchParams.append('location.longitude', String(lng));
      url.searchParams.append('languageCode', languageCode);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask':
            'results.placeId,results.formattedAddress,results.addressComponents',
          'X-Goog-Maps-Solution-ID': 'gmp_mcp_codeassist_v1_aistudio',
        },
      });

      const payload = await response.json().catch(() => ({}));
      if (response.status === 429 || payload?.error?.status === 'RESOURCE_EXHAUSTED') {
        res.status(429).json({
          error: 'RESOURCE_EXHAUSTED',
          message: 'Google Maps quota reached.',
        });
        return;
      }
      if (!response.ok) {
        res.status(response.status).json({
          error: payload?.error?.message || 'Reverse geocoding request failed.',
        });
        return;
      }

      const first = Array.isArray(payload.results) ? payload.results[0] : undefined;
      if (!first) {
        res.json({ formattedAddress: '', district: '', state: '', placeId: '' });
        return;
      }

      const components: Array<{ longText?: string; types?: string[] }> = Array.isArray(
        first.addressComponents
      )
        ? first.addressComponents
        : [];
      const districtComp =
        components.find((c) => c.types?.includes('administrative_area_level_3')) ||
        components.find((c) => c.types?.includes('administrative_area_level_2')) ||
        components.find((c) => c.types?.includes('locality'));
      const stateComp = components.find((c) =>
        c.types?.includes('administrative_area_level_1')
      );

      res.json({
        placeId: first.placeId || '',
        formattedAddress: first.formattedAddress || '',
        district: districtComp?.longText || '',
        state: stateComp?.longText || '',
      });
    } catch (error: unknown) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unable to reverse geocode location.',
      });
    }
  });

  app.post('/api/maps/nearby-agro-hubs', async (req, res) => {
    try {
      const lat = Number(req.body?.lat);
      const lng = Number(req.body?.lng);
      const query =
        typeof req.body?.query === 'string' && req.body.query.trim()
          ? req.body.query.trim()
          : 'agricultural market mandi krishi vigyan kendra seed fertilizer store';
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        res.status(400).json({ error: 'Valid lat and lng are required.' });
        return;
      }

      const apiKey = getMapsApiKey();
      const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask':
            'places.id,places.displayName,places.formattedAddress,places.location,places.primaryTypeDisplayName,places.rating,places.googleMapsUri',
          'X-Goog-Maps-Solution-ID': 'gmp_mcp_codeassist_v1_aistudio',
        },
        body: JSON.stringify({
          textQuery: query,
          pageSize: 8,
          regionCode: 'IN',
          locationBias: {
            circle: {
              center: { latitude: lat, longitude: lng },
              radius: 25000.0,
            },
          },
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (response.status === 429 || payload?.error?.status === 'RESOURCE_EXHAUSTED') {
        res.status(429).json({
          error: 'RESOURCE_EXHAUSTED',
          message: 'Google Maps quota reached.',
        });
        return;
      }
      if (!response.ok) {
        res.status(response.status).json({
          error: payload?.error?.message || 'Unable to search nearby agricultural hubs.',
        });
        return;
      }

      const places = Array.isArray(payload.places)
        ? payload.places
            .filter((p: any) => p?.location?.latitude && p?.location?.longitude)
            .map((p: any) => ({
              id: p.id || `${p.location.latitude}-${p.location.longitude}`,
              name: p.displayName?.text || 'Agricultural Center',
              address: p.formattedAddress || '',
              lat: Number(p.location.latitude),
              lng: Number(p.location.longitude),
              primaryType: p.primaryTypeDisplayName?.text || undefined,
              rating: typeof p.rating === 'number' ? p.rating : undefined,
              googleMapsUri: typeof p.googleMapsUri === 'string' ? p.googleMapsUri : undefined,
            }))
        : [];

      res.json({ places });
    } catch (error: unknown) {
      res.status(500).json({
        error:
          error instanceof Error ? error.message : 'Unable to fetch nearby agricultural hubs.',
      });
    }
  });

  // ---------------------------------------------------------------------------
  // Real-Time Weather & Place Time Zone Route
  // (Google Maps Weather + Time Zone APIs with Open-Meteo real-time fallback)
  // ---------------------------------------------------------------------------
  app.get('/api/weather/live', async (req, res) => {
    try {
      const lat = Number(req.query.lat);
      const lng = Number(req.query.lng);
      const locationLabel =
        typeof req.query.location === 'string' && req.query.location.trim()
          ? req.query.location.trim()
          : 'Selected Farm';
      const languageCode = typeof req.query.language === 'string' ? req.query.language : 'en';

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        res.status(400).json({ error: 'Valid lat and lng coordinates are required.' });
        return;
      }

      // 1. Try Google Maps Platform Weather API + Time Zone API when key is configured
      try {
        const apiKey = getMapsApiKey();
        const currentUrl = new URL('https://weather.googleapis.com/v1/currentConditions:lookup');
        currentUrl.searchParams.append('key', apiKey);
        currentUrl.searchParams.append('location.latitude', String(lat));
        currentUrl.searchParams.append('location.longitude', String(lng));
        currentUrl.searchParams.append('unitsSystem', 'METRIC');

        const forecastUrl = new URL('https://weather.googleapis.com/v1/forecast/days:lookup');
        forecastUrl.searchParams.append('key', apiKey);
        forecastUrl.searchParams.append('location.latitude', String(lat));
        forecastUrl.searchParams.append('location.longitude', String(lng));
        forecastUrl.searchParams.append('days', '7');
        forecastUrl.searchParams.append('pageSize', '7');

        const tzUrl = new URL('https://maps.googleapis.com/maps/api/timezone/json');
        tzUrl.searchParams.append('location', `${lat},${lng}`);
        tzUrl.searchParams.append('timestamp', String(Math.floor(Date.now() / 1000)));
        tzUrl.searchParams.append('language', languageCode);
        tzUrl.searchParams.append('key', apiKey);

        const [curRes, fcRes, tzRes] = await Promise.all([
          fetch(currentUrl.toString(), {
            headers: { 'X-Goog-Maps-Solution-ID': 'gmp_mcp_codeassist_v1_aistudio' },
          }),
          fetch(forecastUrl.toString(), {
            headers: { 'X-Goog-Maps-Solution-ID': 'gmp_mcp_codeassist_v1_aistudio' },
          }),
          fetch(tzUrl.toString(), {
            headers: { 'X-Goog-Maps-Solution-ID': 'gmp_mcp_codeassist_v1_aistudio' },
          }),
        ]);

        if (curRes.ok && fcRes.ok) {
          const curData: any = await curRes.json();
          const fcData: any = await fcRes.json();
          const tzData: any = tzRes.ok ? await tzRes.json().catch(() => null) : null;

          const curRainProb = Number(curData?.precipitation?.probability?.percent ?? 0);
          const mappedCur = mapGoogleWeatherType(
            curData?.weatherCondition?.type || '',
            curData?.weatherCondition?.description?.text || '',
            curRainProb
          );

          const days: any[] = Array.isArray(fcData?.forecastDays) ? [...fcData.forecastDays] : [];
          if (days.length < 7 && typeof fcData?.nextPageToken === 'string' && fcData.nextPageToken) {
            const page2Url = new URL(forecastUrl.toString());
            page2Url.searchParams.set('pageToken', fcData.nextPageToken);
            const page2Res = await fetch(page2Url.toString(), {
              headers: { 'X-Goog-Maps-Solution-ID': 'gmp_mcp_codeassist_v1_aistudio' },
            }).catch(() => null);
            if (page2Res?.ok) {
              const page2Data: any = await page2Res.json().catch(() => null);
              if (Array.isArray(page2Data?.forecastDays)) {
                days.push(...page2Data.forecastDays);
              }
            }
          }
          const forecast = days.slice(0, 7).map((d) => {
            const disp = d?.displayDate;
            const dateObj = disp
              ? new Date(Date.UTC(disp.year, (disp.month || 1) - 1, disp.day || 1))
              : new Date();
            const dayName = dateObj.toLocaleDateString('en-US', {
              weekday: 'short',
              timeZone: 'UTC',
            });
            const dateLabel = dateObj.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              timeZone: 'UTC',
            });
            const dayFc = d?.daytimeForecast || {};
            const dayRain = Number(dayFc?.precipitation?.probability?.percent ?? 0);
            const mappedDay = mapGoogleWeatherType(
              dayFc?.weatherCondition?.type || '',
              dayFc?.weatherCondition?.description?.text || '',
              dayRain
            );
            return {
              day: dayName,
              dateLabel,
              tempHigh: Math.round(Number(d?.maxTemperature?.degrees ?? 26)),
              tempLow: Math.round(Number(d?.minTemperature?.degrees ?? 16)),
              rainProb: dayRain,
              humidity: Math.round(Number(dayFc?.relativeHumidity ?? 60)),
              condition: mappedDay.dayCondition,
            };
          });

          const advisory = buildAdvisoryFromForecast(forecast, curRainProb);
          const timeZoneId =
            (tzData?.status === 'OK' && tzData?.timeZoneId) ||
            curData?.timeZone?.id ||
            fcData?.timeZone?.id ||
            undefined;

          res.json({
            weather: {
              locationLabel,
              latitude: lat,
              longitude: lng,
              timeZoneId,
              timeZoneName: tzData?.status === 'OK' ? tzData?.timeZoneName : undefined,
              weatherTheme: classifyWeatherTheme(
                mappedCur.label,
                curRainProb,
                Number(curData?.cloudCover ?? 0)
              ),
              isDaytime: typeof curData?.isDaytime === 'boolean' ? curData.isDaytime : true,
              isLiveData: true,
              currentTemp: Math.round(Number(curData?.temperature?.degrees ?? 25)),
              condition: mappedCur.label,
              humidity: Math.round(Number(curData?.relativeHumidity ?? 65)),
              rainProb: curRainProb,
              windKmh: Math.round(Number(curData?.wind?.speed?.value ?? 10)),
              ...advisory,
              forecast,
            },
          });
          return;
        }
      } catch {
        // Fall through cleanly to Open-Meteo real-time weather endpoint
      }

      // 2. Open-Meteo real-time meteorological & auto-timezone endpoint
      const omUrl = new URL('https://api.open-meteo.com/v1/forecast');
      omUrl.searchParams.append('latitude', String(lat));
      omUrl.searchParams.append('longitude', String(lng));
      omUrl.searchParams.append(
        'current',
        'temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m,is_day,cloud_cover'
      );
      omUrl.searchParams.append(
        'daily',
        'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,relative_humidity_2m_mean'
      );
      omUrl.searchParams.append('timezone', 'auto');
      omUrl.searchParams.append('forecast_days', '7');

      const omRes = await fetch(omUrl.toString());
      if (!omRes.ok) {
        throw new Error(`Weather upstream returned ${omRes.status}`);
      }
      const omData: any = await omRes.json();
      const cur = omData?.current || {};
      const daily = omData?.daily || {};

      const curRainProb = Math.round(Number(cur.precipitation_probability ?? 0));
      const curCloudCover = Math.round(Number(cur.cloud_cover ?? 0));
      const curWmo = Number(cur.weather_code ?? 0);
      const mappedCur = mapWmoCodeToWeather(curWmo, curRainProb);

      const times: string[] = Array.isArray(daily.time) ? daily.time : [];
      const forecast = times.slice(0, 7).map((isoDate, idx) => {
        const d = new Date(`${isoDate}T12:00:00Z`);
        const dayRain = Math.round(Number(daily.precipitation_probability_max?.[idx] ?? 0));
        const dayCode = Number(daily.weather_code?.[idx] ?? 0);
        const mappedDay = mapWmoCodeToWeather(dayCode, dayRain);
        return {
          day: d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
          dateLabel: d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            timeZone: 'UTC',
          }),
          tempHigh: Math.round(Number(daily.temperature_2m_max?.[idx] ?? cur.temperature_2m ?? 26)),
          tempLow: Math.round(Number(daily.temperature_2m_min?.[idx] ?? 16)),
          rainProb: dayRain,
          humidity: Math.round(
            Number(daily.relative_humidity_2m_mean?.[idx] ?? cur.relative_humidity_2m ?? 65)
          ),
          condition: mappedDay.dayCondition,
        };
      });

      const advisory = buildAdvisoryFromForecast(forecast, curRainProb);
      const weatherTheme = classifyWeatherTheme(mappedCur.label, curRainProb, curCloudCover);

      res.json({
        weather: {
          locationLabel,
          latitude: lat,
          longitude: lng,
          timeZoneId: typeof omData?.timezone === 'string' ? omData.timezone : undefined,
          weatherTheme,
          isDaytime: cur.is_day === 1 || cur.is_day === undefined,
          isLiveData: true,
          currentTemp: Math.round(Number(cur.temperature_2m ?? 26)),
          condition: mappedCur.label,
          humidity: Math.round(Number(cur.relative_humidity_2m ?? 65)),
          rainProb: curRainProb,
          windKmh: Math.round(Number(cur.wind_speed_10m ?? 10)),
          ...advisory,
          forecast,
        },
      });
    } catch (error: unknown) {
      res.status(502).json({
        error:
          error instanceof Error ? error.message : 'Unable to fetch live weather for this location.',
      });
    }
  });

  // ---------------------------------------------------------------------------
  // Multi-Turn Gemini Chatbot with Model & Thinking-Level Routing
  // ---------------------------------------------------------------------------
  app.post('/api/assistant/chat', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const {
        message,
        history,
        farmProfile,
        language = 'en',
        mode = 'general',
      } = req.body ?? {};
      if (!message || typeof message !== 'string' || !message.trim()) {
        res.status(400).json({ error: 'Please enter a farming question.' });
        return;
      }

      const trimmedMessage = message.trim();
      const route = resolveAssistantRoute(mode);
      const ai = getGeminiClient();
      const targetLanguage = LANGUAGE_NAMES[language] ?? 'English';

      const farmContext = farmProfile
        ? `Farmer's current profile: Location=${farmProfile.location}, Land=${farmProfile.landSize} ${farmProfile.landUnit}, Soil=${farmProfile.soilType} (pH ${farmProfile.soilPh}), Irrigation=${farmProfile.irrigation}, Primary Goal=${farmProfile.goal}.`
        : 'Location: India smallholder farm.';

      // Build clean alternating multi-turn history for ai.chats.create
      const rawHistory = Array.isArray(history) ? history.slice(-12) : [];
      const chatHistory: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
      for (const item of rawHistory) {
        if (!item || typeof item.content !== 'string' || !item.content.trim()) continue;
        const role = item.role === 'user' ? 'user' : 'model';
        if (chatHistory.length === 0 && role === 'model') continue;
        if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === role) {
          chatHistory[chatHistory.length - 1].parts[0].text += `\n${item.content.trim()}`;
        } else {
          chatHistory.push({ role, parts: [{ text: item.content.trim() }] });
        }
      }
      if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'user') {
        chatHistory.pop();
      }

      const systemInstruction =
        `You are AgroPulse's friendly, practical agricultural extension advisor helping Indian farmers. ` +
        `${farmContext} ` +
        `Current consultation mode: ${route.label}. ${route.systemRolePrompt} ` +
        `Respond in ${targetLanguage}. Give actionable advice with practical dosages (per acre or per litre of water), timing, and organic + standard options when relevant.`;

      let activeModel = route.model;
      let response;
      try {
        response = await runWithTransientRetry(async () => {
          const chat = ai.chats.create({
            model: activeModel,
            history: chatHistory,
            config: {
              systemInstruction,
              thinkingConfig: {
                thinkingLevel: THINKING_ENUM_MAP[route.thinkingLevel] ?? ThinkingLevel.LOW,
              },
            },
          });
          return chat.sendMessage({ message: trimmedMessage });
        });
      } catch (primaryErr) {
        if (!isTransientOverload(primaryErr)) {
          throw primaryErr;
        }
        const fallbackModel =
          route.model === 'gemini-4-hydrogen' ? 'gemini-3.1-flash-lite' : 'gemini-4-hydrogen';
        const fallbackThinking =
          fallbackModel === 'gemini-3.1-flash-lite' ? ThinkingLevel.MINIMAL : ThinkingLevel.LOW;
        activeModel = fallbackModel;
        const fallbackChat = ai.chats.create({
          model: fallbackModel,
          history: chatHistory,
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel: fallbackThinking },
          },
        });
        response = await fallbackChat.sendMessage({ message: trimmedMessage });
      }

      const reply = (response.text ?? '').trim();
      if (!reply) {
        res
          .status(502)
          .json({ error: 'No response generated. Please try rephrasing your question.' });
        return;
      }

      if (req.dbUser) {
        await appendChatMessages(req.dbUser.id, [
          {
            role: 'user',
            content: trimmedMessage,
            modelUsed: activeModel,
            modeLabel: route.label,
          },
          {
            role: 'assistant',
            content: reply,
            modelUsed: activeModel,
            modeLabel: route.label,
          },
        ]).catch((err) => {
          console.error('Failed to persist chat message:', err);
        });
      }

      res.json({
        reply,
        modelUsed: activeModel,
        modeLabel: route.label,
        mode: route.mode,
      });
    } catch (err: unknown) {
      const { status, message: cleanMsg } = extractReadableGeminiError(
        err,
        'Unable to reach AI Farming Assistant right now.'
      );
      res.status(status).json({ error: cleanMsg });
    }
  });

  // ---------------------------------------------------------------------------
  // Plant Doctor Image Diagnosis
  // ---------------------------------------------------------------------------
  app.post('/api/assistant/diagnose', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const {
        imageBase64,
        mimeType,
        sampleFilename,
        cropName,
        symptomsNote,
        farmProfile,
        language = 'en',
      } = req.body ?? {};

      let resolvedBase64: string | undefined =
        typeof imageBase64 === 'string' && imageBase64.length > 0 ? imageBase64 : undefined;
      let resolvedMime: string =
        typeof mimeType === 'string' && mimeType.startsWith('image/') ? mimeType : 'image/jpeg';

      if (!resolvedBase64 && typeof sampleFilename === 'string' && sampleFilename.length > 0) {
        const safeName = path.basename(sampleFilename);
        const assetsDir = path.resolve(__dirname, 'src', 'assets', 'images');
        const assetPath = path.resolve(assetsDir, safeName);
        if (assetPath.startsWith(assetsDir + path.sep) && fs.existsSync(assetPath)) {
          resolvedBase64 = fs.readFileSync(assetPath).toString('base64');
          resolvedMime = safeName.endsWith('.png') ? 'image/png' : 'image/jpeg';
        }
      }

      if (!resolvedBase64) {
        res
          .status(400)
          .json({ error: 'Please upload a plant photo or pick a sample leaf photo.' });
        return;
      }

      const ai = getGeminiClient();
      const targetLanguage = LANGUAGE_NAMES[language] ?? 'English';
      const farmContext = farmProfile
        ? `Location: ${farmProfile.location}, Soil: ${farmProfile.soilType}, Irrigation: ${farmProfile.irrigation}.`
        : '';

      const promptText =
        `Analyze this crop/plant photo as an experienced plant pathologist. ` +
        `Crop hint: ${cropName || 'Unknown crop'}. ` +
        `Observed notes: ${symptomsNote || 'None provided'}. ` +
        `${farmContext} ` +
        `Identify the most likely pest, fungal/bacterial/viral disease, or nutrient deficiency. ` +
        `Respond in ${targetLanguage} inside the JSON fields with practical dosages (per litre of water or per acre).`;

      const diagnoseConfig = {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedIssue: {
              type: Type.STRING,
              description: 'Clear name of the disease, pest, or deficiency.',
            },
            confidence: {
              type: Type.INTEGER,
              description: 'Confidence percentage from 1 to 99.',
            },
            status: {
              type: Type.STRING,
              description: 'Severity level: Good, Caution, or Risk.',
            },
            summary: {
              type: Type.STRING,
              description: '1-2 sentence plain-language explanation of visible symptoms.',
            },
            organicTreatment: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2-3 practical organic / biological treatment steps with quantities.',
            },
            chemicalTreatment: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description:
                '2-3 recommended chemical control steps with safe dosage and safety interval.',
            },
            preventionSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2-3 prevention practices for current and next season.',
            },
          },
          required: [
            'detectedIssue',
            'confidence',
            'status',
            'summary',
            'organicTreatment',
            'chemicalTreatment',
            'preventionSteps',
          ],
        },
      };

      const imageContents = {
        parts: [
          {
            inlineData: {
              mimeType: resolvedMime,
              data: resolvedBase64,
            },
          },
          { text: promptText },
        ],
      };

      let response;
      try {
        response = await runWithTransientRetry(() =>
          ai.models.generateContent({
            model: DEFAULT_MODEL,
            contents: imageContents,
            config: diagnoseConfig,
          })
        );
      } catch (primaryErr) {
        if (!isTransientOverload(primaryErr)) {
          throw primaryErr;
        }
        response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: imageContents,
          config: diagnoseConfig,
        });
      }

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText);
      const validStatus =
        parsed.status === 'Good' || parsed.status === 'Caution' || parsed.status === 'Risk'
          ? parsed.status
          : 'Caution';

      const diagnosisPayload = {
        detectedIssue: parsed.detectedIssue || 'Leaf Stress / Spot',
        confidence: Math.max(40, Math.min(99, Number(parsed.confidence) || 84)),
        status: validStatus,
        summary: parsed.summary || 'Visual symptoms analyzed from uploaded leaf photo.',
        organicTreatment: Array.isArray(parsed.organicTreatment) ? parsed.organicTreatment : [],
        chemicalTreatment: Array.isArray(parsed.chemicalTreatment) ? parsed.chemicalTreatment : [],
        preventionSteps: Array.isArray(parsed.preventionSteps) ? parsed.preventionSteps : [],
      };

      res.json({ diagnosis: diagnosisPayload });
    } catch (err: unknown) {
      const { status, message: cleanMsg } = extractReadableGeminiError(
        err,
        'Unable to analyze plant photo right now.'
      );
      res.status(status).json({ error: cleanMsg });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const httpServer = http.createServer(app);

  // ---------------------------------------------------------------------------
  // Real-Time Gemini Live Voice WebSocket Bridge (/live, gemini-3.8-live)
  // ---------------------------------------------------------------------------
  const wss = new WebSocketServer({ server: httpServer, path: '/live' });

  wss.on('connection', async (clientWs, req) => {
    let session: Awaited<ReturnType<GoogleGenAI['live']['connect']>> | null = null;
    try {
      const ai = getGeminiClient();
      const parsedUrl = new URL(req.url || '/live', 'http://localhost');
      const location = parsedUrl.searchParams.get('location') || 'India';
      const soil = parsedUrl.searchParams.get('soil') || 'Alluvial';
      const irrigation = parsedUrl.searchParams.get('irrigation') || 'Canal';
      const goal = parsedUrl.searchParams.get('goal') || 'High Yield';
      const langCode = parsedUrl.searchParams.get('language') || 'en';
      const targetLanguage = LANGUAGE_NAMES[langCode] ?? 'English';

      session = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction:
            `You are AgroPulse's friendly live voice farming advisor helping an Indian farmer. ` +
            `Farm profile: Location=${location}, Soil=${soil}, Irrigation=${irrigation}, Goal=${goal}. ` +
            `Speak clearly and naturally in ${targetLanguage}. Keep spoken answers concise, practical, and easy to follow in the field with exact doses and timing.`,
        },
        callbacks: {
          onopen: () => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ ready: true }));
            }
          },
          onmessage: (message: LiveServerMessage) => {
            if (clientWs.readyState !== WebSocket.OPEN) return;
            const content = message.serverContent;
            if (content?.inputTranscription?.text) {
              clientWs.send(
                JSON.stringify({ inputTranscript: content.inputTranscription.text })
              );
            }
            if (content?.outputTranscription?.text) {
              clientWs.send(
                JSON.stringify({ outputTranscript: content.outputTranscription.text })
              );
            }
            for (const part of content?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
              }
            }
            if (content?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
            if (content?.turnComplete) {
              clientWs.send(JSON.stringify({ turnComplete: true }));
            }
          },
          onerror: (err: unknown) => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  error:
                    err instanceof Error
                      ? err.message
                      : 'Voice advisor connection interrupted.',
                })
              );
            }
          },
          onclose: () => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.close();
            }
          },
        },
      });
    } catch (err: unknown) {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            error:
              err instanceof Error
                ? err.message
                : 'Unable to start live voice advisor.',
          })
        );
        clientWs.close();
      }
      return;
    }

    clientWs.on('message', (raw) => {
      if (!session) return;
      try {
        const msg = JSON.parse(raw.toString());
        if (typeof msg.audio === 'string' && msg.audio.length > 0) {
          session.sendRealtimeInput({
            audio: { data: msg.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        } else if (typeof msg.text === 'string' && msg.text.trim()) {
          session.sendRealtimeInput({
            text: msg.text.trim(),
          });
        }
      } catch {
        // Ignore malformed websocket frames
      }
    });

    clientWs.on('close', () => {
      try {
        session?.close();
      } catch {
        // Session already closed
      }
      session = null;
    });
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`AgroPulse server running on http://localhost:${PORT}`);
  });
}

startServer();
