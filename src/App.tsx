import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { AuthModal } from './components/AuthModal';
import { CropAdvisorView } from './components/CropAdvisorView';
import { CropAlertsDrawer, CropAlertToast } from './components/CropAlertsDrawer';
import { DashboardView } from './components/DashboardView';
import { FarmCalendarView } from './components/FarmCalendarView';
import { FarmSetupModal } from './components/FarmSetupModal';
import { KnowledgeHubView } from './components/KnowledgeHubView';
import { PlantDoctorView } from './components/PlantDoctorView';
import { ProfileView } from './components/ProfileView';
import { Sidebar } from './components/Sidebar';
import {
  CROPS_CATALOG,
  DEFAULT_FARM_PROFILE,
  getWeatherForLocation,
  INITIAL_CHECKLIST_TASKS,
} from './data/agroData';
import { TRANSLATIONS } from './data/translations';
import { auth } from './lib/firebase';
import type {
  BrowserNotificationPermission,
  ChatMessage,
  ChecklistTask,
  CropWeatherAlert,
  DiagnosisResult,
  FarmProfile,
  LanguageCode,
  NavTab,
  NotificationPrefs,
  RecommenderFilters,
  SeasonType,
  UserAccount,
  WeatherProfile,
} from './types/agro';
import {
  DEFAULT_NOTIFICATION_PREFS,
  dispatchBrowserNotification,
  evaluateCropWeatherAlerts,
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
} from './utils/cropWeatherAlerts';
import {
  buildFiltersFromProfile,
  getCurrentSeasonFromMonth,
  getRecommendedCrops,
} from './utils/recommendations';

const STORAGE_KEYS = {
  profile: 'agropulse_farm_profile_v1',
  language: 'agropulse_lang_v1',
  plan: 'agropulse_farm_plan_v1',
  tasks: 'agropulse_tasks_v1',
  stages: 'agropulse_stages_v1',
  bookmarks: 'agropulse_bookmarks_v1',
  diagnoses: 'agropulse_diagnoses_v1',
  chat: 'agropulse_chat_v1',
  notifPrefs: 'agropulse_notif_prefs_v1',
  pushedAlerts: 'agropulse_pushed_alerts_v1',
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const currentSeason = useMemo(
    () => getCurrentSeasonFromMonth(new Date().getMonth()),
    []
  );

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState(false);

  const [language, setLanguage] = useState<LanguageCode>(() =>
    readStorage<LanguageCode>(STORAGE_KEYS.language, 'en')
  );
  const [farmProfile, setFarmProfile] = useState<FarmProfile>(() =>
    readStorage<FarmProfile>(STORAGE_KEYS.profile, DEFAULT_FARM_PROFILE)
  );
  const [farmPlanIds, setFarmPlanIds] = useState<string[]>(() =>
    readStorage<string[]>(STORAGE_KEYS.plan, [])
  );
  const [tasks, setTasks] = useState<ChecklistTask[]>(() =>
    readStorage<ChecklistTask[]>(STORAGE_KEYS.tasks, INITIAL_CHECKLIST_TASKS)
  );
  const [completedStages, setCompletedStages] = useState<Record<string, number[]>>(() =>
    readStorage<Record<string, number[]>>(STORAGE_KEYS.stages, {})
  );
  const [bookmarkedGuides, setBookmarkedGuides] = useState<string[]>(() =>
    readStorage<string[]>(STORAGE_KEYS.bookmarks, ['soil-health-card'])
  );
  const [diagnoses, setDiagnoses] = useState<DiagnosisResult[]>(() =>
    readStorage<DiagnosisResult[]>(STORAGE_KEYS.diagnoses, [])
  );
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() =>
    readStorage<ChatMessage[]>(STORAGE_KEYS.chat, [])
  );

  // Firebase Auth user & in-memory token (never stored in localStorage)
  const [user, setUser] = useState<UserAccount | null>(null);
  const idTokenRef = useRef<string | null>(null);
  const syncedUidRef = useRef<string | null>(null);

  const [advisorFilters, setAdvisorFilters] = useState<RecommenderFilters>(() =>
    buildFiltersFromProfile(
      readStorage<FarmProfile>(STORAGE_KEYS.profile, DEFAULT_FARM_PROFILE),
      currentSeason
    )
  );

  const [calendarSeason, setCalendarSeason] = useState<SeasonType>(currentSeason);
  const [calendarCropId, setCalendarCropId] = useState<string>('wheat');

  const [farmSetupOpen, setFarmSetupOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [alertsDrawerOpen, setAlertsDrawerOpen] = useState(false);

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>(() =>
    readStorage<NotificationPrefs>(STORAGE_KEYS.notifPrefs, DEFAULT_NOTIFICATION_PREFS)
  );
  const [notificationPermission, setNotificationPermission] =
    useState<BrowserNotificationPermission>(() => getBrowserNotificationPermission());
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);
  const [toastAlert, setToastAlert] = useState<CropWeatherAlert | null>(null);

  // Listen for Maps quota exceeded events (Case A)
  useEffect(() => {
    const onQuotaExceeded = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  const getFreshToken = useCallback(async (): Promise<string | null> => {
    const currentUser = auth.currentUser;
    if (!currentUser) return idTokenRef.current;
    try {
      const fresh = await currentUser.getIdToken();
      idTokenRef.current = fresh;
      return fresh;
    } catch {
      return idTokenRef.current;
    }
  }, []);

  const syncWithCloudSql = useCallback(async (token: string, uid: string) => {
    if (syncedUidRef.current === uid) return;
    syncedUidRef.current = uid;
    try {
      const res = await fetch('/api/me/state', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const s = data?.state;
      if (!s) return;

      if (s.farmProfile) {
        setFarmProfile(s.farmProfile);
        setAdvisorFilters((prev) => ({
          ...prev,
          soilPh: s.farmProfile.soilPh,
          soilType: s.farmProfile.soilType,
          waterAvailability: s.farmProfile.irrigation,
          goal: s.farmProfile.goal,
        }));
      }
      if (s.language) {
        setLanguage(s.language as LanguageCode);
      }
      if (Array.isArray(s.farmPlanIds) && s.farmPlanIds.length > 0) {
        setFarmPlanIds(s.farmPlanIds);
      }
      if (Array.isArray(s.tasks) && s.tasks.length > 0) {
        setTasks(s.tasks);
      }
      if (s.completedStages && Object.keys(s.completedStages).length > 0) {
        setCompletedStages(s.completedStages);
      }
      if (Array.isArray(s.bookmarkedGuides) && s.bookmarkedGuides.length > 0) {
        setBookmarkedGuides(s.bookmarkedGuides);
      }
      if (Array.isArray(s.diagnoses) && s.diagnoses.length > 0) {
        setDiagnoses(s.diagnoses);
      }
      if (Array.isArray(s.chatMessages) && s.chatMessages.length > 0) {
        setChatMessages(s.chatMessages);
      }

      // Bootstrap initial DB records for a brand-new user without overwriting existing ones
      if (!s.farmProfile) {
        await fetch('/api/me/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ...farmProfile, language }),
        }).catch(() => {});
      }
      if (!Array.isArray(s.tasks) || s.tasks.length === 0) {
        await fetch('/api/me/tasks', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ tasks }),
        }).catch(() => {});
      }
    } catch {
      // Allow UI to continue operating smoothly
    }
  }, [farmProfile, language, tasks]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        idTokenRef.current = null;
        syncedUidRef.current = null;
        setUser(null);
        return;
      }
      const token = await fbUser.getIdToken();
      idTokenRef.current = token;
      setUser({
        uid: fbUser.uid,
        name:
          fbUser.displayName || fbUser.email?.split('@')[0] || 'AgroPulse Farmer',
        email: fbUser.email || '',
        photoUrl: fbUser.photoURL,
        provider: 'google',
      });
      await syncWithCloudSql(token, fbUser.uid);
    });
    return () => unsubscribe();
  }, [syncWithCloudSql]);

  // Persist guest/local fallback state cleanly
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.language, JSON.stringify(language));
  }, [language]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(farmProfile));
  }, [farmProfile]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.plan, JSON.stringify(farmPlanIds));
  }, [farmPlanIds]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.stages, JSON.stringify(completedStages));
  }, [completedStages]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.bookmarks, JSON.stringify(bookmarkedGuides));
  }, [bookmarkedGuides]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.diagnoses, JSON.stringify(diagnoses));
  }, [diagnoses]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.chat, JSON.stringify(chatMessages.slice(-40)));
  }, [chatMessages]);

  const t = TRANSLATIONS[language];
  const fallbackWeather = useMemo(
    () => getWeatherForLocation(farmProfile.location),
    [farmProfile.location]
  );
  const [liveWeather, setLiveWeather] = useState<WeatherProfile | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const autoLocatedRef = useRef(false);

  const weather = useMemo<WeatherProfile>(() => {
    if (
      liveWeather &&
      liveWeather.locationLabel.toLowerCase() === farmProfile.location.toLowerCase()
    ) {
      return liveWeather;
    }
    return {
      ...fallbackWeather,
      latitude: farmProfile.latitude,
      longitude: farmProfile.longitude,
    };
  }, [liveWeather, fallbackWeather, farmProfile.location, farmProfile.latitude, farmProfile.longitude]);

  const fetchLiveWeather = useCallback(
    async (lat: number, lng: number, locationLabel: string, lang: LanguageCode) => {
      setIsWeatherLoading(true);
      try {
        const res = await fetch(
          `/api/weather/live?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(
            lng
          )}&location=${encodeURIComponent(locationLabel)}&language=${encodeURIComponent(lang)}`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data?.weather) {
          setLiveWeather(data.weather as WeatherProfile);
        }
      } catch {
        // Keep fallback weather quietly on network failure
      } finally {
        setIsWeatherLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const lat = farmProfile.latitude ?? 26.1445;
    const lng = farmProfile.longitude ?? 91.7362;
    void fetchLiveWeather(lat, lng, farmProfile.location, language);
  }, [
    farmProfile.latitude,
    farmProfile.longitude,
    farmProfile.location,
    language,
    fetchLiveWeather,
  ]);

  const dashboardRecommendations = useMemo(
    () =>
      getRecommendedCrops(
        CROPS_CATALOG,
        buildFiltersFromProfile(farmProfile, currentSeason)
      ),
    [farmProfile, currentSeason]
  );

  // Persist notification preferences
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.notifPrefs, JSON.stringify(notificationPrefs));
  }, [notificationPrefs]);

  // Evaluate crop-plan specific weather risks across current & 7-day forecast
  const farmPlanCrops = useMemo(
    () => CROPS_CATALOG.filter((c) => farmPlanIds.includes(c.id)),
    [farmPlanIds]
  );

  const allCropAlerts = useMemo(
    () => evaluateCropWeatherAlerts(farmPlanIds, CROPS_CATALOG, weather, notificationPrefs),
    [farmPlanIds, weather, notificationPrefs]
  );

  const activeCropAlerts = useMemo(
    () => allCropAlerts.filter((a) => !dismissedAlertIds.includes(a.id)),
    [allCropAlerts, dismissedAlertIds]
  );

  const dismissedAlertCount = allCropAlerts.length - activeCropAlerts.length;

  // Automatically push browser alerts + in-app toast when new crop risk alerts arise
  useEffect(() => {
    if (activeCropAlerts.length === 0) return;
    const now = Date.now();
    const cooldownMs = 6 * 60 * 60 * 1000;
    const history = readStorage<Record<string, number>>(STORAGE_KEYS.pushedAlerts, {});
    const freshAlerts = activeCropAlerts.filter((a) => {
      const last = history[a.fingerprint] ?? 0;
      return now - last > cooldownMs;
    });
    if (freshAlerts.length === 0) return;

    const updatedHistory = { ...history };
    for (const alert of freshAlerts) {
      updatedHistory[alert.fingerprint] = now;
      if (notificationPrefs.browserAlertsEnabled && notificationPermission === 'granted') {
        dispatchBrowserNotification(alert);
      }
    }
    window.localStorage.setItem(STORAGE_KEYS.pushedAlerts, JSON.stringify(updatedHistory));
    setToastAlert(freshAlerts[0]);
  }, [activeCropAlerts, notificationPrefs.browserAlertsEnabled, notificationPermission]);

  useEffect(() => {
    if (!toastAlert) return;
    const timer = window.setTimeout(() => setToastAlert(null), 7000);
    return () => window.clearTimeout(timer);
  }, [toastAlert]);

  const handleEnableBrowserAlerts = useCallback(async () => {
    const nextPerm = await requestBrowserNotificationPermission();
    setNotificationPermission(nextPerm);
    if (nextPerm === 'granted') {
      setNotificationPrefs((prev) => ({ ...prev, browserAlertsEnabled: true }));
      if (activeCropAlerts.length > 0) {
        activeCropAlerts.slice(0, 2).forEach((alert) => {
          dispatchBrowserNotification(alert);
        });
        setToastAlert(activeCropAlerts[0]);
      } else if (typeof window !== 'undefined' && 'Notification' in window) {
        try {
          new window.Notification('AgroPulse Weather Alerts Active', {
            body: `Monitoring ${farmPlanCrops.length || 'your'} Farm Plan crops in ${weather.locationLabel} for heat, humidity, and heavy rain.`,
          });
        } catch {
          // Ignore notification constructor restriction if any
        }
      }
    }
  }, [activeCropAlerts, farmPlanCrops.length, weather.locationLabel]);

  const handleSendTestAlert = useCallback(async () => {
    let perm = notificationPermission;
    if (perm === 'default') {
      perm = await requestBrowserNotificationPermission();
      setNotificationPermission(perm);
    }
    const targetCrop = farmPlanCrops[0] ?? CROPS_CATALOG.find((c) => c.id === 'potato') ?? CROPS_CATALOG[0];
    const sampleAlert: CropWeatherAlert = activeCropAlerts[0] ?? {
      id: `sample-${targetCrop.id}-${Date.now()}`,
      fingerprint: `sample:${targetCrop.id}:${Date.now()}`,
      cropId: targetCrop.id,
      cropName: targetCrop.name,
      cropEmoji: targetCrop.iconEmoji,
      hazard: 'humidity',
      severity: 'Risk',
      title: `${targetCrop.name}: High Humidity & Fungal Risk (Sample Alert)`,
      message: `Sample check for ${weather.locationLabel}: Humidity spike above safe threshold threatens ${targetCrop.name} foliage.`,
      actionStep: 'Inspect lower leaves early morning and schedule preventive Neem oil or fungicide spray.',
      triggerMetric: '84% RH sample threshold',
      dayLabel: 'Test Push',
    };
    setToastAlert(sampleAlert);
    if (perm === 'granted') {
      dispatchBrowserNotification(sampleAlert);
    }
  }, [notificationPermission, farmPlanCrops, activeCropAlerts, weather.locationLabel]);

  const persistAuthedPut = useCallback(
    async (endpoint: string, body: unknown) => {
      const token = await getFreshToken();
      if (!token) return;
      await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      }).catch(() => {});
    },
    [getFreshToken]
  );

  const handleChangeLanguage = (nextLang: LanguageCode) => {
    setLanguage(nextLang);
    void persistAuthedPut('/api/me/profile', { ...farmProfile, language: nextLang });
  };

  const handleSaveFarmProfile = useCallback(
    (nextProfile: FarmProfile) => {
      setFarmProfile(nextProfile);
      setAdvisorFilters((prev) => ({
        ...prev,
        soilPh: nextProfile.soilPh,
        soilType: nextProfile.soilType,
        waterAvailability: nextProfile.irrigation,
        goal: nextProfile.goal,
      }));
      void persistAuthedPut('/api/me/profile', { ...nextProfile, language });
    },
    [language, persistAuthedPut]
  );

  const detectLiveLocation = useCallback(
    (silent = false) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) return;
      if (!silent) setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          let resolvedLocation = `Live Location (${lat.toFixed(2)}, ${lng.toFixed(2)})`;
          let district = 'Live Location';
          let state = '';

          try {
            const res = await fetch(
              `/api/maps/reverse-geocode?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(
                lng
              )}&language=${encodeURIComponent(language)}`
            );
            const data = await res.json().catch(() => null);
            if (res.ok && data && (data.district || data.formattedAddress)) {
              district = data.district || data.formattedAddress;
              state = data.state || '';
              resolvedLocation =
                district && state && district !== state
                  ? `${district}, ${state}`
                  : data.formattedAddress || district;
            }
          } catch {
            // Keep coordinates-based label
          }

          setFarmProfile((prev) => {
            const next: FarmProfile = {
              ...prev,
              location: resolvedLocation,
              district,
              state: state || prev.state,
              latitude: lat,
              longitude: lng,
              liveLocated: true,
              customized: !silent ? true : prev.customized,
            };
            void persistAuthedPut('/api/me/profile', { ...next, language });
            return next;
          });
          setIsLocating(false);
        },
        () => {
          setIsLocating(false);
        },
        { enableHighAccuracy: false, timeout: 6000, maximumAge: 300000 }
      );
    },
    [language, persistAuthedPut]
  );

  // Attempt silent one-time live geolocation on first run if farm wasn't manually customized
  useEffect(() => {
    if (autoLocatedRef.current || farmProfile.customized) return;
    autoLocatedRef.current = true;
    detectLiveLocation(true);
  }, [farmProfile.customized, detectLiveLocation]);

  const handleToggleFarmPlan = (cropId: string) => {
    setFarmPlanIds((prev) => {
      const next = prev.includes(cropId)
        ? prev.filter((id) => id !== cropId)
        : [...prev, cropId];
      void persistAuthedPut('/api/me/plan', { cropIds: next });
      return next;
    });
  };

  const handleToggleTask = (taskId: string) => {
    setTasks((prev) => {
      const next = prev.map((item) =>
        item.id === taskId ? { ...item, completed: !item.completed } : item
      );
      void persistAuthedPut('/api/me/tasks', { tasks: next });
      return next;
    });
  };

  const handleAddTask = (title: string) => {
    const newTask: ChecklistTask = {
      id: `task-${Date.now()}`,
      title,
      category: 'Field Note',
      season: currentSeason,
      completed: false,
      dueLabel: 'Today',
    };
    setTasks((prev) => {
      const next = [newTask, ...prev];
      void persistAuthedPut('/api/me/tasks', { tasks: next });
      return next;
    });
  };

  const handleToggleStageComplete = (cropId: string, stageNumber: number) => {
    setCompletedStages((prev) => {
      const existing = prev[cropId] ?? [];
      const updated = existing.includes(stageNumber)
        ? existing.filter((s) => s !== stageNumber)
        : [...existing, stageNumber];
      const next = { ...prev, [cropId]: updated };
      void persistAuthedPut('/api/me/stages', { completedStages: next });
      return next;
    });
  };

  const handleToggleBookmark = (guideId: string) => {
    setBookmarkedGuides((prev) => {
      const next = prev.includes(guideId)
        ? prev.filter((id) => id !== guideId)
        : [...prev, guideId];
      void persistAuthedPut('/api/me/bookmarks', { guideIds: next });
      return next;
    });
  };

  const handleSaveDiagnosis = (diagnosis: DiagnosisResult) => {
    setDiagnoses((prev) => [diagnosis, ...prev].slice(0, 10));
    void (async () => {
      const token = await getFreshToken();
      if (!token) return;
      await fetch('/api/me/diagnoses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ diagnosis }),
      }).catch(() => {});
    })();
  };

  const handleAppendChatMessages = (newMsgs: ChatMessage[]) => {
    setChatMessages((prev) => [...prev, ...newMsgs].slice(-40));
  };

  const handleClearChatMessages = () => {
    setChatMessages([]);
    void (async () => {
      const token = await getFreshToken();
      if (!token) return;
      await fetch('/api/me/chat', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    })();
  };

  const handleSignOut = async () => {
    idTokenRef.current = null;
    syncedUidRef.current = null;
    setUser(null);
    await signOut(auth).catch(() => {});
  };

  const handleOpenCalendarForCrop = (cropId: string, season: SeasonType) => {
    setCalendarSeason(season);
    setCalendarCropId(cropId);
    setActiveTab('calendar');
  };

  return (
    <div className="min-h-screen bg-[#F4F6F4] text-[#1E293B] flex flex-col">
      {gmpQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          farmProfile={farmProfile}
          onOpenFarmSetup={() => setFarmSetupOpen(true)}
          language={language}
          onChangeLanguage={handleChangeLanguage}
          user={user}
          onOpenAuth={() => setAuthModalOpen(true)}
          onSignOut={handleSignOut}
          alertCount={activeCropAlerts.length}
          onOpenAlerts={() => setAlertsDrawerOpen(true)}
          t={t}
        />

        <main className="flex-1 min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-7 pb-24 lg:pb-10">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView
                farmProfile={farmProfile}
                language={language}
                weather={weather}
                isLocating={isLocating}
                isWeatherLoading={isWeatherLoading}
                onDetectLiveLocation={() => detectLiveLocation(false)}
                onRefreshWeather={() =>
                  void fetchLiveWeather(
                    farmProfile.latitude ?? 26.1445,
                    farmProfile.longitude ?? 91.7362,
                    farmProfile.location,
                    language
                  )
                }
                currentSeason={currentSeason}
                recommendations={dashboardRecommendations}
                farmPlanIds={farmPlanIds}
                tasks={tasks}
                onToggleTask={handleToggleTask}
                onAddTask={handleAddTask}
                onToggleFarmPlan={handleToggleFarmPlan}
                onOpenFarmSetup={() => setFarmSetupOpen(true)}
                onNavigate={setActiveTab}
                cropAlerts={activeCropAlerts}
                notificationPermission={notificationPermission}
                onOpenAlerts={() => setAlertsDrawerOpen(true)}
                onEnableBrowserAlerts={() => void handleEnableBrowserAlerts()}
                t={t}
              />
            )}

            {activeTab === 'advisor' && (
              <CropAdvisorView
                filters={advisorFilters}
                onChangeFilters={setAdvisorFilters}
                farmPlanIds={farmPlanIds}
                onToggleFarmPlan={handleToggleFarmPlan}
                onOpenCalendarForCrop={handleOpenCalendarForCrop}
                t={t}
              />
            )}

            {activeTab === 'calendar' && (
              <FarmCalendarView
                selectedSeason={calendarSeason}
                onChangeSeason={setCalendarSeason}
                selectedCropId={calendarCropId}
                onChangeCropId={setCalendarCropId}
                completedStages={completedStages}
                onToggleStageComplete={handleToggleStageComplete}
                t={t}
              />
            )}

            {activeTab === 'doctor' && (
              <PlantDoctorView
                farmProfile={farmProfile}
                language={language}
                messages={chatMessages}
                onAppendMessages={handleAppendChatMessages}
                onClearMessages={handleClearChatMessages}
                getAuthToken={getFreshToken}
                onSaveDiagnosis={handleSaveDiagnosis}
                t={t}
              />
            )}

            {activeTab === 'knowledge' && (
              <KnowledgeHubView
                bookmarkedIds={bookmarkedGuides}
                onToggleBookmark={handleToggleBookmark}
                t={t}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileView
                farmProfile={farmProfile}
                user={user}
                farmPlanIds={farmPlanIds}
                diagnoses={diagnoses}
                onEditFarmDetails={() => setFarmSetupOpen(true)}
                onRemoveFromFarmPlan={handleToggleFarmPlan}
                onOpenCalendarForCrop={handleOpenCalendarForCrop}
                onNavigate={setActiveTab}
                onOpenAuth={() => setAuthModalOpen(true)}
                t={t}
              />
            )}
          </div>
        </main>
      </div>

      <FarmSetupModal
        key={farmSetupOpen ? 'farm-open' : 'farm-closed'}
        isOpen={farmSetupOpen}
        initialProfile={farmProfile}
        onClose={() => setFarmSetupOpen(false)}
        onSave={handleSaveFarmProfile}
        t={t}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={(acc, token) => {
          idTokenRef.current = token;
          setUser(acc);
          if (acc.uid) {
            void syncWithCloudSql(token, acc.uid);
          }
        }}
      />

      <CropAlertsDrawer
        isOpen={alertsDrawerOpen}
        onClose={() => setAlertsDrawerOpen(false)}
        weather={weather}
        farmPlanCrops={farmPlanCrops}
        alerts={activeCropAlerts}
        dismissedCount={dismissedAlertCount}
        prefs={notificationPrefs}
        permission={notificationPermission}
        onRequestPermission={() => void handleEnableBrowserAlerts()}
        onToggleBrowserAlerts={() =>
          setNotificationPrefs((prev) => ({
            ...prev,
            browserAlertsEnabled: !prev.browserAlertsEnabled,
          }))
        }
        onUpdatePrefs={(patch) => setNotificationPrefs((prev) => ({ ...prev, ...patch }))}
        onDismissAlert={(alertId) =>
          setDismissedAlertIds((prev) => (prev.includes(alertId) ? prev : [...prev, alertId]))
        }
        onRestoreDismissed={() => setDismissedAlertIds([])}
        onSendTestAlert={() => void handleSendTestAlert()}
        onOpenAdvisor={() => setActiveTab('advisor')}
        onOpenCalendarForCrop={(cropId) => {
          const crop = CROPS_CATALOG.find((c) => c.id === cropId);
          handleOpenCalendarForCrop(cropId, crop?.seasons[0] ?? currentSeason);
        }}
      />

      <CropAlertToast
        alert={toastAlert}
        onDismiss={() => setToastAlert(null)}
        onOpenAlerts={() => setAlertsDrawerOpen(true)}
      />
    </div>
  );
}
