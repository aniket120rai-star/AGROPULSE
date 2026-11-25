/// <reference types="google.maps" />
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { ExternalLink, Loader2, MapPin, Navigation, Search, Store } from 'lucide-react';
import type { AgroPlaceResult, LanguageCode } from '../types/agro';

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const ATTRIBUTION_IDS = ['gmp_mcp_codeassist_v1_aistudio'];

function isSafeExternalUrl(url?: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function MapCameraSync({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.panTo({ lat, lng });
    }
  }, [map, lat, lng]);
  return null;
}

interface HubMarkerProps {
  hub: AgroPlaceResult;
  isSelected: boolean;
  onSelect: (hub: AgroPlaceResult, marker: google.maps.marker.AdvancedMarkerElement) => void;
}

function HubMarker({ hub, isSelected, onSelect }: HubMarkerProps) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  return (
    <AdvancedMarker
      ref={markerRef}
      position={{ lat: hub.lat, lng: hub.lng }}
      title={hub.name}
      onClick={() => {
        if (marker) onSelect(hub, marker);
      }}
    >
      <Pin
        background={isSelected ? '#B45309' : '#D97706'}
        borderColor="#78350F"
        glyphColor="#FFFFFF"
      />
    </AdvancedMarker>
  );
}

interface PlacesAutocompleteFieldProps {
  onSelectPlace: (place: {
    location: string;
    district: string;
    state: string;
    lat: number;
    lng: number;
  }) => void;
  placeholder?: string;
}

export function PlacesAutocompleteField({
  onSelectPlace,
  placeholder = 'Search village, town, mandi, or district on Google Maps...',
}: PlacesAutocompleteFieldProps) {
  const placesLib = useMapsLibrary('places');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  useEffect(() => {
    if (!placesLib) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }

    const { AutocompleteSessionToken, AutocompleteSuggestion } = placesLib;
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new AutocompleteSessionToken();
    }

    let cancelled = false;
    setLoading(true);
    const timer = window.setTimeout(() => {
      AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: trimmed,
        sessionToken: sessionTokenRef.current ?? undefined,
        includedRegionCodes: ['in'],
      })
        .then((res) => {
          if (!cancelled) {
            setSuggestions(res.suggestions ?? []);
            setLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setSuggestions([]);
            setLoading(false);
          }
        });
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [placesLib, query]);

  const handlePick = useCallback(
    async (suggestion: google.maps.places.AutocompleteSuggestion) => {
      if (!placesLib || !suggestion.placePrediction) return;
      try {
        const place = suggestion.placePrediction.toPlace();
        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location', 'addressComponents'],
        });
        const loc = place.location;
        if (!loc) return;
        const lat = loc.lat();
        const lng = loc.lng();
        const components = place.addressComponents ?? [];
        const districtComp =
          components.find((c) => c.types.includes('administrative_area_level_3')) ||
          components.find((c) => c.types.includes('administrative_area_level_2')) ||
          components.find((c) => c.types.includes('locality'));
        const stateComp = components.find((c) =>
          c.types.includes('administrative_area_level_1')
        );
        const district =
          districtComp?.longText || place.displayName || place.formattedAddress || 'Farm Location';
        const state = stateComp?.longText || 'India';
        const label =
          district && state && district !== state
            ? `${district}, ${state}`
            : place.formattedAddress || district;

        setQuery(label);
        setSuggestions([]);
        sessionTokenRef.current = null;
        onSelectPlace({ location: label, district, state, lat, lng });
      } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        if (msg.includes('OVER_QUERY_LIMIT') || msg.includes('RESOURCE_EXHAUSTED')) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
      }
    },
    [placesLib, onSelectPlace]
  );

  if (!MAPS_API_KEY) return null;

  return (
    <div className="relative">
      <div className="relative">
        <Search
          className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label="Search location with Google Places"
          className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-9 py-2 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
        />
        {loading && (
          <Loader2
            className="w-4 h-4 text-[#2D6A4F] animate-spin absolute right-3 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
        )}
      </div>

      {suggestions.length > 0 && (
        <ul className="absolute z-30 mt-1 w-full rounded-xl border border-[#DCE3DE] bg-white shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
          {suggestions.map((s, idx) => (
            <li key={s.placePrediction?.placeId || idx}>
              <button
                type="button"
                onClick={() => handlePick(s)}
                className="w-full text-left px-3.5 py-2 text-xs text-[#1E293B] hover:bg-emerald-50 flex items-center gap-2 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-[#2D6A4F] shrink-0" aria-hidden="true" />
                <span className="truncate">{s.placePrediction?.text.text}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface FarmMapCardProps {
  lat: number;
  lng: number;
  locationLabel: string;
  soilType: string;
  language: LanguageCode;
  interactive?: boolean;
  showNearbyHubs?: boolean;
  heightClass?: string;
  onMapPick?: (
    lat: number,
    lng: number,
    resolved?: { location: string; district: string; state: string }
  ) => void;
}

export function FarmMapCard({
  lat,
  lng,
  locationLabel,
  soilType,
  language,
  interactive = false,
  showNearbyHubs = false,
  heightClass = 'h-64',
  onMapPick,
}: FarmMapCardProps) {
  const [hubs, setHubs] = useState<AgroPlaceResult[]>([]);
  const [hubsLoading, setHubsLoading] = useState(false);
  const [hubsError, setHubsError] = useState<string | null>(null);
  const [hubQuery, setHubQuery] = useState<
    'mandi agricultural market' | 'krishi vigyan kendra soil testing' | 'seed fertilizer store'
  >('mandi agricultural market');
  const [selectedHub, setSelectedHub] = useState<AgroPlaceResult | null>(null);
  const [selectedMarker, setSelectedMarker] =
    useState<google.maps.marker.AdvancedMarkerElement | null>(null);
  const [farmMarkerRef, farmMarker] = useAdvancedMarkerRef();
  const [farmInfoOpen, setFarmInfoOpen] = useState(false);

  const fetchNearbyHubs = useCallback(
    async (searchText: string) => {
      setHubsLoading(true);
      setHubsError(null);
      setSelectedHub(null);
      try {
        const res = await fetch('/api/maps/nearby-agro-hubs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng, query: searchText }),
        });
        const data = await res.json();
        if (res.status === 429 || data?.error === 'RESOURCE_EXHAUSTED') {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
          setHubsError('Daily map search quota reached.');
          return;
        }
        if (!res.ok) {
          throw new Error(data.error || 'Unable to load nearby agricultural centers.');
        }
        setHubs(Array.isArray(data.places) ? data.places : []);
      } catch (err: unknown) {
        setHubsError(
          err instanceof Error ? err.message : 'Unable to fetch nearby agricultural centers.'
        );
      } finally {
        setHubsLoading(false);
      }
    },
    [lat, lng]
  );

  const handleMapClick = useCallback(
    async (e: { detail?: { latLng?: { lat: number; lng: number } | null } }) => {
      if (!interactive || !onMapPick || !e.detail?.latLng) return;
      const pickedLat = e.detail.latLng.lat;
      const pickedLng = e.detail.latLng.lng;
      onMapPick(pickedLat, pickedLng);

      try {
        const res = await fetch(
          `/api/maps/reverse-geocode?lat=${encodeURIComponent(pickedLat)}&lng=${encodeURIComponent(
            pickedLng
          )}&language=${encodeURIComponent(language)}`
        );
        const data = await res.json();
        if (res.status === 429 || data?.error === 'RESOURCE_EXHAUSTED') {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
          return;
        }
        if (res.ok && (data.district || data.formattedAddress)) {
          const district = data.district || data.formattedAddress;
          const state = data.state || 'India';
          const label =
            data.district && data.state
              ? `${data.district}, ${data.state}`
              : data.formattedAddress;
          onMapPick(pickedLat, pickedLng, { location: label, district, state });
        }
      } catch {
        // Keep coordinates even if reverse geocode fails
      }
    },
    [interactive, onMapPick, language]
  );

  if (!MAPS_API_KEY) {
    return (
      <div
        className={`rounded-xl border border-[#DCE3DE] bg-white p-4 flex items-center justify-center text-xs text-slate-500 ${heightClass}`}
      >
        Google Maps API key not configured in environment.
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="farm-map-container">
      {showNearbyHubs && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: 'mandi agricultural market', label: 'Mandis & Markets' },
                { id: 'krishi vigyan kendra soil testing', label: 'KVK & Soil Labs' },
                { id: 'seed fertilizer store', label: 'Seed & Fertilizer' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setHubQuery(opt.id);
                  fetchNearbyHubs(opt.id);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  hubQuery === opt.id && hubs.length > 0
                    ? 'bg-[#1B4332] text-white border-[#1B4332]'
                    : 'bg-white text-[#1E293B] border-[#DCE3DE] hover:border-[#2D6A4F]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => fetchNearbyHubs(hubQuery)}
            disabled={hubsLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#D97706] hover:bg-[#B45309] disabled:opacity-60 text-white text-xs font-semibold transition-colors"
          >
            {hubsLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Store className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            <span>{hubsLoading ? 'Searching...' : 'Search Nearby'}</span>
          </button>
        </div>
      )}

      <div className={`w-full ${heightClass} rounded-xl overflow-hidden border border-[#DCE3DE] bg-[#E8EDE9]`}>
        <APIProvider
          apiKey={MAPS_API_KEY}
          libraries={['places', 'marker']}
          language={language}
          region="IN"
        >
          <GoogleMap
            mapId="DEMO_MAP_ID"
            defaultCenter={{ lat, lng }}
            defaultZoom={interactive ? 11 : 12}
            gestureHandling="greedy"
            internalUsageAttributionIds={ATTRIBUTION_IDS}
            style={{ width: '100%', height: '100%' }}
            onClick={handleMapClick}
          >
            <MapCameraSync lat={lat} lng={lng} />

            <AdvancedMarker
              ref={farmMarkerRef}
              position={{ lat, lng }}
              title={locationLabel}
              onClick={() => setFarmInfoOpen(true)}
            >
              <Pin background="#1B4332" borderColor="#0F291E" glyphColor="#FFFFFF" />
            </AdvancedMarker>

            {farmInfoOpen && farmMarker && (
              <InfoWindow anchor={farmMarker} onCloseClick={() => setFarmInfoOpen(false)}>
                <div className="p-1 max-w-[200px] text-xs text-[#1E293B]">
                  <div className="font-bold text-[#1B4332]">{locationLabel}</div>
                  <div className="text-slate-600 mt-0.5">Soil: {soilType}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                    {lat.toFixed(4)}, {lng.toFixed(4)}
                  </div>
                </div>
              </InfoWindow>
            )}

            {hubs.map((hub) => (
              <HubMarker
                key={hub.id}
                hub={hub}
                isSelected={selectedHub?.id === hub.id}
                onSelect={(h, marker) => {
                  setSelectedHub(h);
                  setSelectedMarker(marker);
                }}
              />
            ))}

            {selectedHub && selectedMarker && (
              <InfoWindow
                anchor={selectedMarker}
                onCloseClick={() => {
                  setSelectedHub(null);
                  setSelectedMarker(null);
                }}
              >
                <div className="p-1 max-w-[220px] space-y-1 text-xs text-[#1E293B]">
                  <div className="font-bold text-[#1B4332]">{selectedHub.name}</div>
                  {selectedHub.primaryType && (
                    <div className="text-[11px] text-[#D97706] font-semibold">
                      {selectedHub.primaryType}
                    </div>
                  )}
                  <div className="text-slate-600 leading-snug">{selectedHub.address}</div>
                  {selectedHub.rating && (
                    <div className="text-[11px] text-slate-500">
                      Rating: {selectedHub.rating.toFixed(1)} / 5
                    </div>
                  )}
                  {isSafeExternalUrl(selectedHub.googleMapsUri) && (
                    <a
                      href={selectedHub.googleMapsUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1B4332] hover:underline pt-0.5"
                    >
                      <span>Open in Google Maps</span>
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </APIProvider>
      </div>

      {hubsError && <p className="text-xs text-red-700">{hubsError}</p>}

      {showNearbyHubs && hubs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {hubs.slice(0, 4).map((hub) => (
            <div
              key={hub.id}
              className="rounded-xl bg-white border border-[#E5EAE6] p-3 flex items-start justify-between gap-2.5"
            >
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#1E293B] truncate">{hub.name}</div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">{hub.address}</div>
                {hub.primaryType && (
                  <div className="text-[10px] font-semibold text-[#2D6A4F] mt-1">
                    {hub.primaryType}
                  </div>
                )}
              </div>
              {isSafeExternalUrl(hub.googleMapsUri) && (
                <a
                  href={hub.googleMapsUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Directions to ${hub.name}`}
                  className="p-1.5 rounded-lg bg-[#EEF2EF] text-[#1B4332] hover:bg-[#DCE5DE] shrink-0"
                >
                  <Navigation className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
