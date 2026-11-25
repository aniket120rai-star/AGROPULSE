import { useState } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { LocateFixed, MapPin, Sprout, X } from 'lucide-react';
import { LOCATION_PRESETS } from '../data/agroData';
import type { TranslationBundle } from '../data/translations';
import type {
  FarmGoal,
  FarmProfile,
  IrrigationType,
  LandUnit,
  SoilType,
} from '../types/agro';
import { FarmMapCard, PlacesAutocompleteField } from './FarmMapCard';

interface FarmSetupModalProps {
  isOpen: boolean;
  initialProfile: FarmProfile;
  onClose: () => void;
  onSave: (profile: FarmProfile) => void;
  t: TranslationBundle;
}

const SOIL_TYPES: SoilType[] = ['Alluvial', 'Clay', 'Loam', 'Sandy', 'Red', 'Black'];
const IRRIGATION_TYPES: IrrigationType[] = ['Rainfed', 'Canal', 'Borewell', 'Drip'];
const FARM_GOALS: FarmGoal[] = ['High Yield', 'Low Water', 'Cash Crop', 'Organic'];
const LAND_UNITS: LandUnit[] = ['Acre', 'Hectare', 'Bigha'];
const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export function FarmSetupModal({
  isOpen,
  initialProfile,
  onClose,
  onSave,
  t,
}: FarmSetupModalProps) {
  const [locationInput, setLocationInput] = useState(initialProfile.location);
  const [latitude, setLatitude] = useState<number>(initialProfile.latitude ?? 26.1445);
  const [longitude, setLongitude] = useState<number>(initialProfile.longitude ?? 91.7362);
  const [landSize, setLandSize] = useState(String(initialProfile.landSize));
  const [landUnit, setLandUnit] = useState<LandUnit>(initialProfile.landUnit);
  const [soilType, setSoilType] = useState<SoilType>(initialProfile.soilType);
  const [irrigation, setIrrigation] = useState<IrrigationType>(initialProfile.irrigation);
  const [goal, setGoal] = useState<FarmGoal>(initialProfile.goal);
  const [soilPh, setSoilPh] = useState(initialProfile.soilPh);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (presetLocation: string) => {
    const preset = LOCATION_PRESETS.find((p) => p.location === presetLocation);
    if (preset) {
      setLocationInput(preset.location);
      setLatitude(preset.lat);
      setLongitude(preset.lng);
      setSoilType(preset.defaultSoil);
      setSoilPh(preset.defaultPh);
      setGpsStatus(`Loaded regional defaults for ${preset.location}`);
    }
  };

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus('GPS not supported on this browser. Pick a district preset or tap the map.');
      return;
    }
    setGpsStatus('Detecting coordinates...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLatitude(lat);
        setLongitude(lng);

        try {
          const res = await fetch(
            `/api/maps/reverse-geocode?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(
              lng
            )}`
          );
          const data = await res.json();
          if (res.ok && (data.district || data.formattedAddress)) {
            const label =
              data.district && data.state
                ? `${data.district}, ${data.state}`
                : data.formattedAddress;
            setLocationInput(label);
            setGpsStatus(`GPS (${lat.toFixed(3)}, ${lng.toFixed(3)}) matched to ${label}`);
            return;
          }
        } catch {
          // Fall back to preset matching
        }

        let nearest = LOCATION_PRESETS[0];
        if (lat > 28) nearest = LOCATION_PRESETS[1];
        else if (lng > 89) nearest = LOCATION_PRESETS[0];
        else if (lng > 85) nearest = LOCATION_PRESETS[2];
        else if (lat < 15) nearest = LOCATION_PRESETS[5];
        else if (lat < 21 && lng < 78) nearest = LOCATION_PRESETS[3];
        setLocationInput(nearest.location);
        setSoilType(nearest.defaultSoil);
        setSoilPh(nearest.defaultPh);
        setGpsStatus(`GPS (${lat.toFixed(2)}, ${lng.toFixed(2)}) matched to ${nearest.location}`);
      },
      () => {
        setLocationInput('Kamrup, Assam');
        setLatitude(26.1445);
        setLongitude(91.7362);
        setGpsStatus('Location permission unavailable — defaulted to Kamrup, Assam.');
      },
      { timeout: 5000 }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedLoc = locationInput.trim();
    const parsedSize = Number(landSize);

    if (!trimmedLoc) {
      setValidationError('Please enter your Village, District, or State.');
      return;
    }
    if (!Number.isFinite(parsedSize) || parsedSize <= 0) {
      setValidationError('Please enter a valid land size greater than 0.');
      return;
    }

    const parts = trimmedLoc.split(',').map((p) => p.trim());
    const district = parts[0] || trimmedLoc;
    const state = parts[1] || 'India';

    setValidationError(null);
    onSave({
      location: trimmedLoc,
      district,
      state,
      latitude,
      longitude,
      landSize: parsedSize,
      landUnit,
      soilType,
      irrigation,
      goal,
      soilPh,
      customized: true,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="farm-setup-title"
    >
      <div className="w-full max-w-2xl bg-[#FAFBF9] rounded-2xl border border-[#DCE3DE] shadow-xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8E4] bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1B4332] flex items-center justify-center text-white">
              <Sprout className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h2 id="farm-setup-title" className="text-lg font-bold text-[#1E293B]">
                {t.farmSetup} & Local Conditions
              </h2>
              <p className="text-xs text-slate-500">
                Updates weather, crop match scores, field map, and seasonal guidance across AgroPulse.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close farm setup"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {validationError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
              {validationError}
            </div>
          )}

          {/* Location + Places Search + Interactive Map */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="farm-location-input" className="text-sm font-semibold text-[#1E293B]">
                Village / District / State
              </label>
              <button
                type="button"
                onClick={handleDetectGps}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2D6A4F] hover:text-[#1B4332] px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 transition-colors"
              >
                <LocateFixed className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t.actions.autoDetectGps}</span>
              </button>
            </div>

            {MAPS_API_KEY && (
              <APIProvider
                apiKey={MAPS_API_KEY}
                libraries={['places', 'marker']}
                region="IN"
              >
                <PlacesAutocompleteField
                  onSelectPlace={(place) => {
                    setLocationInput(place.location);
                    setLatitude(place.lat);
                    setLongitude(place.lng);
                    setGpsStatus(`Pinned ${place.location} (${place.lat.toFixed(3)}, ${place.lng.toFixed(3)})`);
                  }}
                />
              </APIProvider>
            )}

            <div className="relative">
              <MapPin
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="farm-location-input"
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder="e.g., Kamrup, Assam or Ludhiana, Punjab"
                className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {LOCATION_PRESETS.slice(0, 6).map((preset) => (
                <button
                  key={preset.location}
                  type="button"
                  onClick={() => handleSelectPreset(preset.location)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    locationInput.toLowerCase() === preset.location.toLowerCase()
                      ? 'bg-[#1B4332] text-white border-[#1B4332]'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-[#2D6A4F]'
                  }`}
                >
                  {preset.location}
                </button>
              ))}
            </div>

            <div className="pt-1">
              <div className="text-[11px] font-medium text-slate-500 mb-1.5">
                Tap anywhere on the map to adjust your farm pin ({latitude.toFixed(3)}, {longitude.toFixed(3)})
              </div>
              <FarmMapCard
                lat={latitude}
                lng={longitude}
                locationLabel={locationInput || 'Selected Farm'}
                soilType={soilType}
                language="en"
                interactive
                heightClass="h-44"
                onMapPick={(pickedLat, pickedLng, resolved) => {
                  setLatitude(pickedLat);
                  setLongitude(pickedLng);
                  if (resolved?.location) {
                    setLocationInput(resolved.location);
                    setGpsStatus(`Map pin updated to ${resolved.location}`);
                  } else {
                    setGpsStatus(`Map pin set to ${pickedLat.toFixed(3)}, ${pickedLng.toFixed(3)}`);
                  }
                }}
              />
            </div>

            {gpsStatus && <p className="text-xs text-[#2D6A4F]">{gpsStatus}</p>}
          </div>

          {/* Land size & Soil pH */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="farm-land-size" className="block text-sm font-semibold text-[#1E293B] mb-1.5">
                Land Size
              </label>
              <div className="flex gap-2">
                <input
                  id="farm-land-size"
                  type="number"
                  min="0.1"
                  step="any"
                  value={landSize}
                  onChange={(e) => setLandSize(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-[#1E293B] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                />
                <select
                  aria-label="Land unit"
                  value={landUnit}
                  onChange={(e) => setLandUnit(e.target.value as LandUnit)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                >
                  {LAND_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="farm-soil-ph" className="text-sm font-semibold text-[#1E293B]">
                  Soil pH
                </label>
                <span className="text-sm font-bold text-[#D97706] tabular-nums">
                  {soilPh.toFixed(1)}
                </span>
              </div>
              <input
                id="farm-soil-ph"
                type="range"
                min="4.5"
                max="8.5"
                step="0.1"
                value={soilPh}
                onChange={(e) => setSoilPh(Number(e.target.value))}
                style={{
                  background: `linear-gradient(to right, #2D6A4F ${
                    ((soilPh - 4.5) / 4.0) * 100
                  }%, #D8E0DB ${((soilPh - 4.5) / 4.0) * 100}%)`,
                }}
                className="w-full agro-slider mt-2"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1 tabular-nums">
                <span>4.5 Acidic</span>
                <span>7.0 Neutral</span>
                <span>8.5 Alkaline</span>
              </div>
            </div>
          </div>

          {/* Soil Type */}
          <div>
            <span className="block text-sm font-semibold text-[#1E293B] mb-2">Soil Type</span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {SOIL_TYPES.map((soil) => (
                <button
                  key={soil}
                  type="button"
                  onClick={() => setSoilType(soil)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-colors ${
                    soilType === soil
                      ? 'bg-[#1B4332] text-white border-[#1B4332]'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-[#2D6A4F]'
                  }`}
                >
                  {soil}
                </button>
              ))}
            </div>
          </div>

          {/* Irrigation Access */}
          <div>
            <span className="block text-sm font-semibold text-[#1E293B] mb-2">
              Irrigation Access
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {IRRIGATION_TYPES.map((irr) => (
                <button
                  key={irr}
                  type="button"
                  onClick={() => setIrrigation(irr)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors ${
                    irrigation === irr
                      ? 'bg-[#1B4332] text-white border-[#1B4332]'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-[#2D6A4F]'
                  }`}
                >
                  {irr}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Goal */}
          <div>
            <span className="block text-sm font-semibold text-[#1E293B] mb-2">Primary Goal</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FARM_GOALS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGoal(g)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors ${
                    goal === g
                      ? 'bg-[#D97706] text-white border-[#D97706]'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-[#D97706]'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8E4]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {t.actions.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#1B4332] hover:bg-[#2D6A4F] text-white transition-colors"
            >
              {t.actions.saveFarmProfile}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
