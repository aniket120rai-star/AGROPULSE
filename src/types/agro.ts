export type LanguageCode = 'en' | 'hi' | 'as' | 'bn';

export type SoilType = 'Alluvial' | 'Clay' | 'Loam' | 'Sandy' | 'Red' | 'Black';

export type IrrigationType = 'Rainfed' | 'Canal' | 'Borewell' | 'Drip';

export type FarmGoal = 'High Yield' | 'Low Water' | 'Cash Crop' | 'Organic';

export type LandUnit = 'Acre' | 'Hectare' | 'Bigha';

export type SeasonType = 'Kharif' | 'Rabi' | 'Zaid';

export type BudgetLevel = 'Low' | 'Medium' | 'High';

export type StatusLevel = 'Good' | 'Caution' | 'Risk';

export type NavTab =
  | 'dashboard'
  | 'advisor'
  | 'calendar'
  | 'doctor'
  | 'knowledge'
  | 'profile';

export interface FarmProfile {
  location: string;
  district: string;
  state: string;
  latitude?: number;
  longitude?: number;
  landSize: number;
  landUnit: LandUnit;
  soilType: SoilType;
  irrigation: IrrigationType;
  goal: FarmGoal;
  soilPh: number;
  customized: boolean;
  liveLocated?: boolean;
}

export interface LifecycleStage {
  stageNumber: number;
  title: string;
  timeframe: string;
  summary: string;
  instructions: string[];
  dosageTip: string;
  iconName: 'tractor' | 'sprout' | 'droplets' | 'shield' | 'wheat';
}

export interface Crop {
  id: string;
  name: string;
  localName: string;
  category: 'Cereal' | 'Oilseed' | 'Pulse' | 'Vegetable' | 'Cash Crop' | 'Fruit';
  seasons: SeasonType[];
  soilTypes: SoilType[];
  phMin: number;
  phMax: number;
  irrigationFit: IrrigationType[];
  waterRequirement: 'Low' | 'Medium' | 'High';
  budgetLevel: BudgetLevel;
  goals: FarmGoal[];
  expectedYield: string;
  durationDays: string;
  inputCostPerAcre: number;
  expectedReturnPerAcre: number;
  riskLevel: StatusLevel;
  sowingWindow: string;
  harvestWindow: string;
  activeMonths: number[]; // 0 = Jan, 11 = Dec
  sowingMonths: number[];
  harvestMonths: number[];
  description: string;
  goodPreviousCrops: string[];
  avoidPreviousCrops: string[];
  iconEmoji: string;
  stages: LifecycleStage[];
}

export interface RecommenderFilters {
  soilPh: number;
  soilType: SoilType;
  season: SeasonType;
  waterAvailability: IrrigationType;
  budgetLevel: BudgetLevel;
  previousCrop: string;
  goal: FarmGoal;
}

export interface CropRecommendation {
  crop: Crop;
  matchScore: number;
  status: StatusLevel;
  reasons: string[];
  cautionNote?: string;
}

export interface WeatherDay {
  day: string;
  dateLabel: string;
  tempHigh: number;
  tempLow: number;
  rainProb: number;
  humidity: number;
  condition: 'Sunny' | 'Partly Cloudy' | 'Light Rain' | 'Heavy Rain' | 'Clear';
}

export type WeatherTheme = 'sunny' | 'cloudy' | 'rainy';

export interface WeatherProfile {
  locationLabel: string;
  latitude?: number;
  longitude?: number;
  timeZoneId?: string;
  timeZoneName?: string;
  weatherTheme?: WeatherTheme;
  isDaytime?: boolean;
  isLiveData?: boolean;
  currentTemp: number;
  condition: string;
  humidity: number;
  rainProb: number;
  windKmh: number;
  alertStatus: StatusLevel;
  alertTitle: string;
  alertAdvice: string;
  forecast: WeatherDay[];
}

export interface ChecklistTask {
  id: string;
  title: string;
  category: string;
  season: SeasonType | 'All';
  completed: boolean;
  dueLabel: string;
}

export interface KnowledgeGuide {
  id: string;
  title: string;
  category:
    | 'Soil Health'
    | 'Organic Composting'
    | 'Micro-Irrigation'
    | 'Government Schemes'
    | 'Market & Prices'
    | 'Plant Protection';
  readTimeMinutes: number;
  summary: string;
  keyTakeaways: string[];
  steps: string[];
  schemeOrTip: string;
  iconKey: 'flask' | 'sprout' | 'recycle' | 'droplet' | 'landmark' | 'trending' | 'shield';
}

export interface DiagnosisResult {
  id: string;
  timestamp: string;
  cropName: string;
  imagePreview?: string;
  detectedIssue: string;
  confidence: number;
  status: StatusLevel;
  summary: string;
  organicTreatment: string[];
  chemicalTreatment: string[];
  preventionSteps: string[];
}

export type AssistantMode = 'fast' | 'general' | 'complex' | 'deep';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
  modeLabel?: string;
}

export interface UserAccount {
  uid?: string;
  name: string;
  email: string;
  photoUrl?: string | null;
  provider: 'google';
}

export interface AgroPlaceResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  primaryType?: string;
  rating?: number;
  googleMapsUri?: string;
}

export type CropWeatherHazard = 'humidity' | 'heat' | 'rain' | 'wind' | 'frost';

export interface CropWeatherAlert {
  id: string;
  fingerprint: string;
  cropId: string;
  cropName: string;
  cropEmoji: string;
  hazard: CropWeatherHazard;
  severity: 'Risk' | 'Caution';
  title: string;
  message: string;
  actionStep: string;
  triggerMetric: string;
  dayLabel: string;
}

export interface NotificationPrefs {
  browserAlertsEnabled: boolean;
  monitorHumidity: boolean;
  monitorHeat: boolean;
  monitorRain: boolean;
}

export type BrowserNotificationPermission =
  | 'default'
  | 'granted'
  | 'denied'
  | 'unsupported';
