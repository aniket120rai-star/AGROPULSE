import { CalendarDays, Camera, MapPin, Sprout, Trash2, User } from 'lucide-react';
import { CROPS_CATALOG } from '../data/agroData';
import type { TranslationBundle } from '../data/translations';
import type {
  DiagnosisResult,
  FarmProfile,
  NavTab,
  SeasonType,
  UserAccount,
} from '../types/agro';
import { StatusBadge } from './StatusBadge';

interface ProfileViewProps {
  farmProfile: FarmProfile;
  user: UserAccount | null;
  farmPlanIds: string[];
  diagnoses: DiagnosisResult[];
  onEditFarmDetails: () => void;
  onRemoveFromFarmPlan: (cropId: string) => void;
  onOpenCalendarForCrop: (cropId: string, season: SeasonType) => void;
  onNavigate: (tab: NavTab) => void;
  onOpenAuth: () => void;
  t: TranslationBundle;
}

export function ProfileView({
  farmProfile,
  user,
  farmPlanIds,
  diagnoses,
  onEditFarmDetails,
  onRemoveFromFarmPlan,
  onOpenCalendarForCrop,
  onNavigate,
  onOpenAuth,
  t,
}: ProfileViewProps) {
  const plannedCrops = CROPS_CATALOG.filter((c) => farmPlanIds.includes(c.id));

  return (
    <div className="space-y-6">
      {/* Header matching Screenshot 1 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <User className="w-6 h-6 text-slate-600" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-[#1E293B] tracking-tight">
            {t.headings.profileTitle}
          </h1>
        </div>

        {user ? (
          <div className="text-xs text-slate-600 bg-white border border-[#DCE3DE] px-3.5 py-2 rounded-xl">
            Signed in as <span className="font-semibold text-[#1E293B]">{user.name}</span> ({user.email})
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-[#C86A1F] hover:bg-[#B45D18] text-white text-xs font-semibold transition-colors"
          >
            {t.actions.signIn} to Sync Profile
          </button>
        )}
      </div>

      {/* Card 1: Farm profile matching Screenshot 1 */}
      <section
        aria-label="Farm profile"
        className="rounded-2xl bg-[#FAFBF9] border border-[#DCE3DE] p-5 sm:p-6 space-y-5"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sprout className="w-4 h-4 text-[#2D6A4F]" aria-hidden="true" />
            <h2 className="text-base font-bold text-[#1E293B]">Farm profile</h2>
          </div>

          <button
            type="button"
            onClick={onEditFarmDetails}
            className="px-3.5 py-2 rounded-xl bg-[#EEF2EF] hover:bg-[#E1E7E2] text-xs font-semibold text-[#1E293B] transition-colors whitespace-nowrap shrink-0"
          >
            {t.actions.editFarmDetails}
          </button>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-8 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
            <dt className="sr-only">Location</dt>
            <dd className="font-medium text-[#1E293B]">{farmProfile.location}</dd>
          </div>
          <div>
            <dt className="inline text-slate-500">Land size: </dt>
            <dd className="inline font-semibold text-[#1E293B] tabular-nums">
              {farmProfile.landSize} {farmProfile.landUnit}
            </dd>
          </div>
          <div>
            <dt className="inline text-slate-500">Soil type: </dt>
            <dd className="inline font-semibold text-[#1E293B]">
              {farmProfile.soilType} (pH {farmProfile.soilPh.toFixed(1)})
            </dd>
          </div>
          <div>
            <dt className="inline text-slate-500">Irrigation: </dt>
            <dd className="inline font-semibold text-[#1E293B]">{farmProfile.irrigation}</dd>
          </div>
          <div>
            <dt className="inline text-slate-500">Goal: </dt>
            <dd className="inline font-semibold text-[#1E293B]">{farmProfile.goal}</dd>
          </div>
        </dl>

        {/* My farm plan inside/below matching Screenshot 1 */}
        <div className="pt-4 border-t border-[#E5EAE6] space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-[#1E293B]">
              My farm plan ({plannedCrops.length})
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('advisor')}
              className="text-xs font-semibold text-[#1B4332] hover:underline"
            >
              + Add from Crop Advisor
            </button>
          </div>

          {plannedCrops.length === 0 ? (
            <p className="text-sm text-slate-500">
              No crops in your farm plan yet — add some from the Crop Advisor.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {plannedCrops.map((crop) => (
                <div
                  key={crop.id}
                  className="rounded-xl bg-white border border-[#E5EAE6] p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0" aria-hidden="true">
                      {crop.iconEmoji}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[#1E293B] truncate">
                        {crop.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {crop.seasons.join('/')} · Sowing: {crop.sowingWindow}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenCalendarForCrop(crop.id, crop.seasons[0])}
                      title="View in Farm Calendar"
                      aria-label={`View ${crop.name} in Farm Calendar`}
                      className="p-2 rounded-lg text-[#2D6A4F] hover:bg-emerald-50 transition-colors"
                    >
                      <CalendarDays className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveFromFarmPlan(crop.id)}
                      title={`Remove ${crop.name}`}
                      aria-label={`Remove ${crop.name} from farm plan`}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Card 2: Recent diagnoses matching Screenshot 1 */}
      <section
        aria-label="Recent diagnoses"
        className="rounded-2xl bg-[#FAFBF9] border border-[#DCE3DE] p-5 sm:p-6 space-y-4"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#D97706]" aria-hidden="true" />
            <h2 className="text-base font-bold text-[#1E293B]">Recent diagnoses</h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('doctor')}
            className="text-xs font-semibold text-[#1B4332] hover:underline"
          >
            Open Plant Doctor
          </button>
        </div>

        {diagnoses.length === 0 ? (
          <p className="text-sm text-slate-500">No diagnoses yet.</p>
        ) : (
          <div className="space-y-3">
            {diagnoses.map((diag) => (
              <div
                key={diag.id}
                className="rounded-xl bg-white border border-[#E5EAE6] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  {diag.imagePreview && (
                    <img
                      src={diag.imagePreview}
                      alt={diag.cropName}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-lg object-cover border border-[#E5EAE6] shrink-0"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#1E293B]">
                        {diag.detectedIssue}
                      </span>
                      <StatusBadge status={diag.status} label={t.status[diag.status]} />
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{diag.summary}</p>
                    <div className="text-[11px] text-slate-400 mt-1 tabular-nums">
                      {diag.cropName} · {diag.confidence}% confidence · {diag.timestamp}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
