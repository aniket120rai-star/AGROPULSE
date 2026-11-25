import type { LanguageCode } from '../types/agro';

export interface TranslationBundle {
  appName: string;
  farmSetup: string;
  nav: {
    dashboard: string;
    advisor: string;
    calendar: string;
    doctor: string;
    knowledge: string;
    profile: string;
  };
  actions: {
    signIn: string;
    signOut: string;
    saveFarmProfile: string;
    cancel: string;
    addToPlan: string;
    addedToPlan: string;
    compare: string;
    comparing: string;
    openComparison: string;
    editFarmDetails: string;
    diagnosePlant: string;
    readGuide: string;
    autoDetectGps: string;
    addTask: string;
    viewAllAdvisor: string;
  };
  status: {
    Good: string;
    Caution: string;
    Risk: string;
  };
  seasons: {
    Kharif: string;
    Rabi: string;
    Zaid: string;
  };
  headings: {
    dashboardTitle: string;
    dashboardSubtitle: string;
    weatherAlertLabel: string;
    topRecommendedCrops: string;
    todaysChecklist: string;
    quickAccess: string;
    advisorTitle: string;
    advisorSubtitle: string;
    calendarTitle: string;
    calendarSubtitle: string;
    doctorTitle: string;
    doctorSubtitle: string;
    knowledgeTitle: string;
    knowledgeSubtitle: string;
    profileTitle: string;
  };
}

export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  en: 'English',
  hi: 'हिन्दी (Hindi)',
  as: 'অসমীয়া (Assamese)',
  bn: 'বাংলা (Bengali)',
};

export const TRANSLATIONS: Record<LanguageCode, TranslationBundle> = {
  en: {
    appName: 'AgroPulse',
    farmSetup: 'Farm Setup',
    nav: {
      dashboard: 'Dashboard',
      advisor: 'Crop Advisor',
      calendar: 'Farm Calendar',
      doctor: 'AI Plant Doctor',
      knowledge: 'Knowledge Hub',
      profile: 'My Profile',
    },
    actions: {
      signIn: 'Sign in',
      signOut: 'Sign out',
      saveFarmProfile: 'Save Farm Profile',
      cancel: 'Cancel',
      addToPlan: 'Select & Add to My Farm Plan',
      addedToPlan: 'In My Farm Plan',
      compare: 'Compare',
      comparing: 'Selected',
      openComparison: 'Compare Selected',
      editFarmDetails: 'Edit farm details',
      diagnosePlant: 'Diagnose Plant Issue',
      readGuide: 'Read guide',
      autoDetectGps: 'Auto-detect GPS',
      addTask: 'Add Task',
      viewAllAdvisor: 'Open Crop Advisor',
    },
    status: {
      Good: 'Good',
      Caution: 'Caution',
      Risk: 'Risk',
    },
    seasons: {
      Kharif: 'Kharif (Monsoon)',
      Rabi: 'Rabi (Winter)',
      Zaid: 'Zaid (Summer)',
    },
    headings: {
      dashboardTitle: 'Farm Dashboard',
      dashboardSubtitle: 'Localized weather, top seasonal crops, and daily field priorities.',
      weatherAlertLabel: 'Field Weather Advisory',
      topRecommendedCrops: 'Top Recommended Crops Right Now',
      todaysChecklist: "Today's Action Checklist",
      quickAccess: 'Quick Access',
      advisorTitle: 'Smart Crop Recommender',
      advisorSubtitle: 'Set your field conditions — we rank the crops that fit.',
      calendarTitle: 'Seasonal Farming Calendar',
      calendarSubtitle: 'Month-by-month guide and the full lifecycle of your crop.',
      doctorTitle: 'AI Farming Assistant',
      doctorSubtitle: 'Ask anything — fertilizers, pests, soil, schemes. Or diagnose a sick plant.',
      knowledgeTitle: 'Knowledge Hub',
      knowledgeSubtitle: 'Short, practical guides — soil, compost, irrigation, schemes and prices.',
      profileTitle: 'My Profile',
    },
  },
  hi: {
    appName: 'AgroPulse',
    farmSetup: 'खेत सेटअप',
    nav: {
      dashboard: 'डैशबोर्ड',
      advisor: 'फसल सलाहकार',
      calendar: 'कृषि कैलेंडर',
      doctor: 'AI पौधा डॉक्टर',
      knowledge: 'ज्ञान केंद्र',
      profile: 'मेरी प्रोफ़ाइल',
    },
    actions: {
      signIn: 'साइन इन करें',
      signOut: 'साइन आउट',
      saveFarmProfile: 'खेत प्रोफ़ाइल सहेजें',
      cancel: 'रद्द करें',
      addToPlan: 'मेरी फसल योजना में जोड़ें',
      addedToPlan: 'योजना में शामिल',
      compare: 'तुलना करें',
      comparing: 'चयनित',
      openComparison: 'चयनित की तुलना करें',
      editFarmDetails: 'खेत विवरण बदलें',
      diagnosePlant: 'पौधे की जांच करें',
      readGuide: 'गाइड पढ़ें',
      autoDetectGps: 'GPS से लोकेशन खोजें',
      addTask: 'कार्य जोड़ें',
      viewAllAdvisor: 'फसल सलाहकार खोलें',
    },
    status: {
      Good: 'उत्तम',
      Caution: 'सावधानी',
      Risk: 'जोखिम',
    },
    seasons: {
      Kharif: 'खरीफ (मानसून)',
      Rabi: 'रबी (सर्दी)',
      Zaid: 'जायद (गर्मी)',
    },
    headings: {
      dashboardTitle: 'कृषि डैशबोर्ड',
      dashboardSubtitle: 'स्थानीय मौसम, उपयुक्त मौसमी फसलें और आज के कृषि कार्य।',
      weatherAlertLabel: 'खेत मौसम सलाह',
      topRecommendedCrops: 'अभी के लिए शीर्ष अनुशंसित फसलें',
      todaysChecklist: 'आज की कार्य सूची',
      quickAccess: 'त्वरित पहुँच',
      advisorTitle: 'स्मार्ट फसल सलाहकार',
      advisorSubtitle: 'अपने खेत की स्थिति चुनें — हम सबसे उपयुक्त फसलें रैंक करते हैं।',
      calendarTitle: 'मौसमी कृषि कैलेंडर',
      calendarSubtitle: 'महीने-दर-महीने मार्गदर्शन और आपकी फसल का पूरा जीवनचक्र।',
      doctorTitle: 'AI कृषि सहायक',
      doctorSubtitle: 'खाद, कीट, मिट्टी, योजनाओं के बारे में पूछें या रोगग्रस्त पौधे की जांच करें।',
      knowledgeTitle: 'कृषि ज्ञान केंद्र',
      knowledgeSubtitle: 'मिट्टी, जैविक खाद, सिंचाई, सरकारी योजनाएं और मंडी भाव की गाइड।',
      profileTitle: 'मेरी प्रोफ़ाइल',
    },
  },
  as: {
    appName: 'AgroPulse',
    farmSetup: 'খেতিৰ তথ্য',
    nav: {
      dashboard: 'ডেছব’ৰ্ড',
      advisor: 'শস্য পৰামৰ্শ',
      calendar: 'কৃষি কেলেণ্ডাৰ',
      doctor: 'AI উদ্ভিদ চিকিৎসক',
      knowledge: 'জ্ঞান ভঁৰাল',
      profile: 'মোৰ প্ৰ’ফাইল',
    },
    actions: {
      signIn: 'চাইন ইন কৰক',
      signOut: 'চাইন আউট',
      saveFarmProfile: 'খেতিৰ তথ্য সংৰক্ষণ কৰক',
      cancel: 'বাতিল কৰক',
      addToPlan: 'মোৰ পৰিকল্পনাত যোগ কৰক',
      addedToPlan: 'পৰিকল্পনাত আছে',
      compare: 'তুলনা কৰক',
      comparing: 'নিৰ্বাচিত',
      openComparison: 'নিৰ্বাচিত শস্য তুলনা কৰক',
      editFarmDetails: 'তথ্য সলনি কৰক',
      diagnosePlant: 'গছৰ ৰোগ পৰীক্ষা কৰক',
      readGuide: 'পঢ়ক',
      autoDetectGps: 'GPS ব্যৱহাৰ কৰক',
      addTask: 'কাম যোগ কৰক',
      viewAllAdvisor: 'শস্য পৰামৰ্শ চাওক',
    },
    status: {
      Good: 'ভাল',
      Caution: 'সাৱধান',
      Risk: 'বিপদ',
    },
    seasons: {
      Kharif: 'খাৰিফ (বাৰিষা)',
      Rabi: 'ৰবি (শীতকাল)',
      Zaid: 'জায়দ (গ্ৰীষ্ম)',
    },
    headings: {
      dashboardTitle: 'কৃষি ডেছব’ৰ্ড',
      dashboardSubtitle: 'স্থানীয় বতৰ, উপযুক্ত শস্য আৰু দৈনিক খেতিৰ কাম।',
      weatherAlertLabel: 'বতৰৰ সতৰ্কবাণী',
      topRecommendedCrops: 'বৰ্তমানৰ শ্ৰেষ্ঠ শস্য',
      todaysChecklist: 'আজিৰ কামৰ তালিকা',
      quickAccess: 'দ্ৰুত সেৱা',
      advisorTitle: 'স্মাৰ্ট শস্য পৰামৰ্শদাতা',
      advisorSubtitle: 'আপোনাৰ পথাৰৰ অৱস্থা দিয়ক — উপযুক্ত শস্য চাওক।',
      calendarTitle: 'ঋতুকালীন কৃষি কেলেণ্ডাৰ',
      calendarSubtitle: 'মাহেকীয়া নিৰ্দেশনা আৰু শস্যৰ সম্পূৰ্ণ জীৱনচক্ৰ।',
      doctorTitle: 'AI কৃষি সহায়ক',
      doctorSubtitle: 'সাৰ, পোক-পৰুৱা, মাটি বা ৰোগৰ ফটো দি পৰীক্ষা কৰক।',
      knowledgeTitle: 'জ্ঞান ভঁৰাল',
      knowledgeSubtitle: 'মাটি, পচন সাৰ, জলসিঞ্চন, চৰকাৰী আঁচনি আৰু বজাৰ দৰ।',
      profileTitle: 'মোৰ প্ৰ’ফাইল',
    },
  },
  bn: {
    appName: 'AgroPulse',
    farmSetup: 'খামার সেটআপ',
    nav: {
      dashboard: 'ড্যাশবোর্ড',
      advisor: 'ফসল পরামর্শ',
      calendar: 'কৃষি ক্যালেন্ডার',
      doctor: 'AI উদ্ভিদ ডাক্তার',
      knowledge: 'জ্ঞান ভান্ডার',
      profile: 'আমার প্রোফাইল',
    },
    actions: {
      signIn: 'সাইন ইন করুন',
      signOut: 'সাইন আউট',
      saveFarmProfile: 'খামারের তথ্য সংরক্ষণ করুন',
      cancel: 'বাতিল করুন',
      addToPlan: 'আমার পরিকল্পনায় যোগ করুন',
      addedToPlan: 'পরিকল্পনায় যুক্ত',
      compare: 'তুলনা করুন',
      comparing: 'নির্বাচিত',
      openComparison: 'নির্বাচিত তুলনা করুন',
      editFarmDetails: 'তথ্য পরিবর্তন করুন',
      diagnosePlant: 'গাছের রোগ নির্ণয় করুন',
      readGuide: 'গাইড পড়ুন',
      autoDetectGps: 'GPS দিয়ে খুঁজুন',
      addTask: 'কাজ যোগ করুন',
      viewAllAdvisor: 'ফসল পরামর্শ দেখুন',
    },
    status: {
      Good: 'ভালো',
      Caution: 'সতর্কতা',
      Risk: 'ঝুঁকি',
    },
    seasons: {
      Kharif: 'খরিফ (বর্ষা)',
      Rabi: 'রবি (শীত)',
      Zaid: 'জায়েদ (গ্রীষ্ম)',
    },
    headings: {
      dashboardTitle: 'কৃষি ড্যাশবোর্ড',
      dashboardSubtitle: 'স্থানীয় আবহাওয়া, সেরা মৌসুমি ফসল এবং আজকের কাজের তালিকা।',
      weatherAlertLabel: 'মাঠের আবহাওয়া পরামর্শ',
      topRecommendedCrops: 'এখনকার সেরা প্রস্তাবিত ফসল',
      todaysChecklist: 'আজকের কাজের তালিকা',
      quickAccess: 'দ্রুত অ্যাক্সেস',
      advisorTitle: 'স্মার্ট ফসল পরামর্শদাতা',
      advisorSubtitle: 'আপনার জমির অবস্থা দিন — উপযুক্ত ফসল র‍্যাঙ্ক করে দেখানো হবে।',
      calendarTitle: 'মৌসুমি কৃষি ক্যালেন্ডার',
      calendarSubtitle: 'মাসভিত্তিক নির্দেশিকা এবং ফসলের সম্পূর্ণ জীবনচক্র।',
      doctorTitle: 'AI কৃষি সহায়ক',
      doctorSubtitle: 'সার, পোকামাকড়, মাটি, প্রকল্প বা রোগাক্রান্ত গাছের ছবি দিন।',
      knowledgeTitle: 'কৃষি জ্ঞান ভান্ডার',
      knowledgeSubtitle: 'মাটির স্বাস্থ্য, জৈব সার, সেচ, সরকারি প্রকল্প এবং বাজার দর।',
      profileTitle: 'আমার প্রোফাইল',
    },
  },
};
