import { useMemo, useState } from 'react';
import {
  Bookmark,
  BookOpen,
  ChevronDown,
  Clock,
  Droplet,
  FlaskConical,
  Landmark,
  Recycle,
  Search,
  Shield,
  Sprout,
  TrendingUp,
  X,
} from 'lucide-react';
import { KNOWLEDGE_GUIDES } from '../data/agroData';
import type { TranslationBundle } from '../data/translations';
import type { KnowledgeGuide } from '../types/agro';

interface KnowledgeHubViewProps {
  bookmarkedIds: string[];
  onToggleBookmark: (guideId: string) => void;
  t: TranslationBundle;
}

const CATEGORIES: Array<'All' | KnowledgeGuide['category']> = [
  'All',
  'Soil Health',
  'Organic Composting',
  'Micro-Irrigation',
  'Government Schemes',
  'Market & Prices',
  'Plant Protection',
];

function GuideIcon({ iconKey }: { iconKey: KnowledgeGuide['iconKey'] }) {
  if (iconKey === 'flask') return <FlaskConical className="w-5 h-5 text-[#2D6A4F]" aria-hidden="true" />;
  if (iconKey === 'sprout') return <Sprout className="w-5 h-5 text-[#2D6A4F]" aria-hidden="true" />;
  if (iconKey === 'recycle') return <Recycle className="w-5 h-5 text-[#D97706]" aria-hidden="true" />;
  if (iconKey === 'droplet') return <Droplet className="w-5 h-5 text-sky-600" aria-hidden="true" />;
  if (iconKey === 'landmark') return <Landmark className="w-5 h-5 text-[#1B4332]" aria-hidden="true" />;
  if (iconKey === 'trending') return <TrendingUp className="w-5 h-5 text-[#D97706]" aria-hidden="true" />;
  return <Shield className="w-5 h-5 text-[#2D6A4F]" aria-hidden="true" />;
}

export function KnowledgeHubView({
  bookmarkedIds,
  onToggleBookmark,
  t,
}: KnowledgeHubViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | KnowledgeGuide['category']>('All');
  const [savedOnly, setSavedOnly] = useState(false);
  const [activeGuide, setActiveGuide] = useState<KnowledgeGuide | null>(null);

  const filteredGuides = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return KNOWLEDGE_GUIDES.filter((guide) => {
      if (selectedCategory !== 'All' && guide.category !== selectedCategory) {
        return false;
      }
      if (savedOnly && !bookmarkedIds.includes(guide.id)) {
        return false;
      }
      if (q) {
        const haystack = `${guide.title} ${guide.category} ${guide.summary}`.toLowerCase();
        return haystack.includes(q);
      }
      return true;
    });
  }, [searchQuery, selectedCategory, savedOnly, bookmarkedIds]);

  return (
    <div className="space-y-6">
      {/* Header matching Screenshot 5 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-[#D97706]" aria-hidden="true" />
            <h1 className="text-2xl font-bold text-[#1E293B] tracking-tight">
              {t.headings.knowledgeTitle}
            </h1>
          </div>
          <p className="text-sm text-slate-600 mt-1">{t.headings.knowledgeSubtitle}</p>
        </div>

        <button
          type="button"
          onClick={() => setSavedOnly((prev) => !prev)}
          className={`inline-flex items-center gap-2 self-start sm:self-auto px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
            savedOnly
              ? 'bg-[#1B4332] text-white border-[#1B4332]'
              : 'bg-white text-[#1E293B] border-[#DCE3DE] hover:border-[#2D6A4F]'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Saved ({bookmarkedIds.length})</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search
          className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search guides..."
          aria-label="Search guides"
          className="w-full rounded-xl border border-[#DCE3DE] bg-[#FAFBF9] pl-10 pr-4 py-2.5 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
        />
      </div>

      {/* Category Filter Tabs matching Screenshot 5 */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Guide Categories">
        {CATEGORIES.map((category) => {
          const isActive = selectedCategory === category;
          return (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setSelectedCategory(category)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-[#1B4332] text-white'
                  : 'bg-[#FAFBF9] border border-[#DCE3DE] text-[#1E293B] hover:border-[#2D6A4F]'
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* Guides 3-Column Grid matching Screenshot 5 */}
      {filteredGuides.length === 0 ? (
        <div className="rounded-2xl bg-[#FAFBF9] border border-[#DCE3DE] p-8 text-center space-y-2">
          <p className="text-sm font-semibold text-[#1E293B]">No matching guides found</p>
          <p className="text-xs text-slate-500">
            Try clearing your search filter or viewing all categories.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setSavedOnly(false);
            }}
            className="mt-2 px-4 py-2 rounded-xl bg-[#1B4332] text-white text-xs font-semibold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredGuides.map((guide) => {
            const isBookmarked = bookmarkedIds.includes(guide.id);
            return (
              <article
                key={guide.id}
                className="rounded-2xl bg-[#FAFBF9] border border-[#DCE3DE] p-5 flex flex-col justify-between gap-4 hover:border-[#2D6A4F]/60 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-9 h-9 rounded-xl bg-white border border-[#E5EAE6] flex items-center justify-center shrink-0">
                      <GuideIcon iconKey={guide.iconKey} />
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleBookmark(guide.id)}
                      aria-label={isBookmarked ? `Remove bookmark for ${guide.title}` : `Bookmark ${guide.title}`}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isBookmarked
                          ? 'text-[#D97706] bg-amber-50'
                          : 'text-slate-400 hover:text-slate-700 hover:bg-white'
                      }`}
                    >
                      <Bookmark
                        className="w-4 h-4"
                        fill={isBookmarked ? 'currentColor' : 'none'}
                      />
                    </button>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-slate-500">{guide.category}</div>
                    <h2 className="text-base font-bold text-[#1E293B] mt-1 leading-snug">
                      {guide.title}
                    </h2>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-2">
                      {guide.summary}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#E5EAE6] text-xs">
                  <span className="inline-flex items-center gap-1 text-slate-500 tabular-nums">
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    {guide.readTimeMinutes} min read
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveGuide(guide)}
                    className="inline-flex items-center gap-1 font-semibold text-[#1B4332] hover:text-[#2D6A4F]"
                  >
                    <span>{t.actions.readGuide}</span>
                    <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Full Guide Reader Modal */}
      {activeGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-[2px] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="guide-modal-title"
        >
          <div className="w-full max-w-xl bg-[#FAFBF9] rounded-2xl border border-[#DCE3DE] shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between gap-3 px-6 py-4 bg-white border-b border-[#E5EAE6]">
              <div>
                <div className="text-xs font-medium text-slate-500">
                  {activeGuide.category} · {activeGuide.readTimeMinutes} min read
                </div>
                <h2 id="guide-modal-title" className="text-lg font-bold text-[#1E293B] mt-0.5">
                  {activeGuide.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveGuide(null)}
                aria-label="Close guide"
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto text-sm">
              <p className="text-slate-700 leading-relaxed">{activeGuide.summary}</p>

              <div className="rounded-xl bg-white border border-[#E5EAE6] p-4 space-y-2">
                <h3 className="text-xs font-bold text-[#1B4332] uppercase tracking-wide">
                  Key Takeaways
                </h3>
                <ul className="space-y-1.5 text-slate-700">
                  {activeGuide.keyTakeaways.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#2D6A4F] font-bold" aria-hidden="true">
                        •
                      </span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wide">
                  Step-by-Step Field Action
                </h3>
                <ol className="space-y-2">
                  {activeGuide.steps.map((step, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 rounded-xl bg-white border border-[#E5EAE6] px-3.5 py-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-[#1B4332] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                        {idx + 1}
                      </span>
                      <span className="text-slate-700">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs font-medium text-amber-950">
                <span className="font-bold text-[#D97706]">Pro Tip / Scheme Note: </span>
                {activeGuide.schemeOrTip}
              </div>
            </div>

            <div className="px-6 py-3.5 bg-white border-t border-[#E5EAE6] flex items-center justify-between">
              <button
                type="button"
                onClick={() => onToggleBookmark(activeGuide.id)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B4332] hover:underline"
              >
                <Bookmark
                  className="w-3.5 h-3.5"
                  fill={bookmarkedIds.includes(activeGuide.id) ? 'currentColor' : 'none'}
                />
                <span>
                  {bookmarkedIds.includes(activeGuide.id)
                    ? 'Saved for offline reference'
                    : 'Bookmark guide'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveGuide(null)}
                className="px-4 py-2 rounded-xl bg-[#1B4332] text-white text-xs font-semibold"
              >
                Done Reading
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
