import {
  Bell,
  BookOpen,
  Bot,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Globe,
  LayoutGrid,
  LogOut,
  MapPin,
  Sprout,
  User,
} from 'lucide-react';
import { LANGUAGE_LABELS, type TranslationBundle } from '../data/translations';
import type { FarmProfile, LanguageCode, NavTab, UserAccount } from '../types/agro';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  farmProfile: FarmProfile;
  onOpenFarmSetup: () => void;
  language: LanguageCode;
  onChangeLanguage: (lang: LanguageCode) => void;
  user: UserAccount | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  alertCount?: number;
  onOpenAlerts?: () => void;
  t: TranslationBundle;
}

export function Sidebar({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  farmProfile,
  onOpenFarmSetup,
  language,
  onChangeLanguage,
  user,
  onOpenAuth,
  onSignOut,
  alertCount = 0,
  onOpenAlerts,
  t,
}: SidebarProps) {
  const navItems: Array<{ id: NavTab; label: string; icon: typeof LayoutGrid }> = [
    { id: 'dashboard', label: t.nav.dashboard, icon: LayoutGrid },
    { id: 'advisor', label: t.nav.advisor, icon: Sprout },
    { id: 'calendar', label: t.nav.calendar, icon: CalendarDays },
    { id: 'doctor', label: t.nav.doctor, icon: Bot },
    { id: 'knowledge', label: t.nav.knowledge, icon: BookOpen },
    { id: 'profile', label: t.nav.profile, icon: User },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col justify-between bg-[#141816] text-slate-200 border-r border-[#232A26] shrink-0 transition-[width] duration-200 min-h-screen sticky top-0 h-screen ${
          collapsed ? 'w-[76px]' : 'w-[244px]'
        }`}
        aria-label="Primary Navigation"
      >
        <div className="p-3.5 space-y-5">
          {/* Brand Header */}
          <div className="flex items-center justify-between gap-2 px-1">
            <button
              type="button"
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] rounded-lg"
            >
              <div className="w-9 h-9 rounded-xl bg-[#C86A1F] flex items-center justify-center shrink-0 shadow-sm">
                <Sprout className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <div className="text-[16px] font-bold tracking-tight text-white leading-tight whitespace-nowrap">
                    {t.appName}
                  </div>
                  <div className="text-[11px] text-slate-400 leading-tight whitespace-nowrap">
                    {t.farmSetup}
                  </div>
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1E2420] transition-colors shrink-0"
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-[#245E3E] text-white'
                      : 'text-slate-300 hover:bg-[#1E2420] hover:text-white'
                  } ${collapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon
                    className={`w-[18px] h-[18px] shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`}
                    aria-hidden="true"
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Farm Summary, Setup, Language & Sign-in */}
        <div className="p-3.5 border-t border-[#232A26] space-y-2.5">
          {!collapsed && (
            <div className="px-2 py-1.5">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
                <span className="truncate">{farmProfile.district || farmProfile.location}</span>
              </div>
              <div className="text-[12.5px] font-medium text-slate-200 mt-0.5 truncate">
                {farmProfile.soilType} · {farmProfile.irrigation}
              </div>
            </div>
          )}

          {onOpenAlerts && (
            <button
              type="button"
              onClick={onOpenAlerts}
              title={collapsed ? 'Crop Weather Alerts' : undefined}
              aria-label={`Crop weather alerts (${alertCount} active)`}
              className={`w-full flex items-center justify-between gap-2 py-2 px-3 rounded-xl bg-[#1E2420] hover:bg-[#27302A] text-slate-100 text-[13px] font-medium border border-[#2C352F] transition-colors whitespace-nowrap ${
                collapsed ? 'justify-center px-0' : ''
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <Bell
                  className={`w-4 h-4 shrink-0 ${
                    alertCount > 0 ? 'text-amber-400' : 'text-slate-300'
                  }`}
                  aria-hidden="true"
                />
                {!collapsed && <span className="truncate">Crop Alerts</span>}
              </span>
              {!collapsed && alertCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[11px] font-bold tabular-nums">
                  {alertCount}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onOpenFarmSetup}
            title={collapsed ? t.farmSetup : undefined}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#1E2420] hover:bg-[#27302A] text-slate-100 text-[13px] font-medium border border-[#2C352F] transition-colors whitespace-nowrap ${
              collapsed ? 'px-0' : ''
            }`}
          >
            <Sprout className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
            {!collapsed && <span>{t.farmSetup}</span>}
          </button>

          {!collapsed && (
            <div className="relative">
              <label htmlFor="sidebar-lang-select" className="sr-only">
                Select language
              </label>
              <Globe
                className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <select
                id="sidebar-lang-select"
                value={language}
                onChange={(e) => onChangeLanguage(e.target.value as LanguageCode)}
                className="w-full appearance-none bg-[#181D1A] border border-[#2C352F] text-slate-200 text-[12.5px] rounded-xl pl-8 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] cursor-pointer"
              >
                {(Object.keys(LANGUAGE_LABELS) as LanguageCode[]).map((code) => (
                  <option key={code} value={code} className="bg-[#141816] text-white">
                    {LANGUAGE_LABELS[code]}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
            </div>
          )}

          {user ? (
            <div className="flex items-center justify-between gap-2 bg-[#1E2420] rounded-xl p-2 border border-[#2C352F]">
              {!collapsed && (
                <div className="min-w-0 pl-1">
                  <div className="text-xs font-medium text-white truncate">{user.name}</div>
                  <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                </div>
              )}
              <button
                type="button"
                onClick={onSignOut}
                aria-label={t.actions.signOut}
                title={t.actions.signOut}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#2A332D] transition-colors shrink-0 mx-auto"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#C86A1F] hover:bg-[#B45D18] text-white text-[13px] font-semibold transition-colors whitespace-nowrap ${
                collapsed ? 'px-0' : ''
              }`}
            >
              <User className="w-4 h-4 shrink-0" aria-hidden="true" />
              {!collapsed && <span>{t.actions.signIn}</span>}
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Top Bar (Compact 1-row, well within mobile sticky cap) */}
      <header className="lg:hidden sticky top-0 z-30 bg-[#141816] text-white border-b border-[#232A26] px-3 py-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onSelectTab('dashboard')}
          className="flex items-center gap-2 shrink-0"
        >
          <span className="w-7 h-7 rounded-lg bg-[#C86A1F] flex items-center justify-center">
            <Sprout className="w-4 h-4 text-white" aria-hidden="true" />
          </span>
          <span className="font-display font-bold text-sm tracking-tight whitespace-nowrap">
            {t.appName}
          </span>
        </button>

        <div className="flex items-center gap-1.5">
          {onOpenAlerts && (
            <button
              type="button"
              onClick={onOpenAlerts}
              aria-label={`Crop weather alerts (${alertCount} active)`}
              className="relative p-1.5 rounded-lg bg-[#1E2420] border border-[#2C352F] text-slate-100 shrink-0"
            >
              <Bell
                className={`w-4 h-4 ${alertCount > 0 ? 'text-amber-400' : 'text-slate-300'}`}
                aria-hidden="true"
              />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-[#141816] text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {alertCount}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onOpenFarmSetup}
            className="px-2.5 py-1.5 rounded-lg bg-[#1E2420] border border-[#2C352F] text-xs font-medium text-slate-100 whitespace-nowrap shrink-0 flex items-center gap-1"
          >
            <MapPin className="w-3 h-3 text-emerald-400" aria-hidden="true" />
            <span className="max-w-[78px] truncate">{farmProfile.district || farmProfile.location}</span>
          </button>

          <select
            aria-label="Language"
            value={language}
            onChange={(e) => onChangeLanguage(e.target.value as LanguageCode)}
            className="bg-[#1E2420] border border-[#2C352F] text-slate-100 text-xs rounded-lg px-2 py-1.5 focus:outline-none"
          >
            <option value="en">EN</option>
            <option value="hi">HI</option>
            <option value="as">AS</option>
            <option value="bn">BN</option>
          </select>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[#141816] border-t border-[#232A26] px-1 py-1 grid grid-cols-6"
        aria-label="Mobile Navigation"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg min-h-[44px] transition-colors ${
                isActive ? 'text-emerald-400 bg-[#1E2B23]' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="text-[10px] font-medium mt-0.5 truncate max-w-full">
                {item.id === 'dashboard'
                  ? 'Home'
                  : item.id === 'advisor'
                  ? 'Advisor'
                  : item.id === 'calendar'
                  ? 'Calendar'
                  : item.id === 'doctor'
                  ? 'Doctor'
                  : item.id === 'knowledge'
                  ? 'Guides'
                  : 'Profile'}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
