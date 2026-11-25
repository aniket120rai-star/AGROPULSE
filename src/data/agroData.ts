import type {
  ChecklistTask,
  Crop,
  FarmProfile,
  KnowledgeGuide,
  WeatherProfile,
} from '../types/agro';

export const DEFAULT_FARM_PROFILE: FarmProfile = {
  location: 'Kamrup, Assam',
  district: 'Kamrup',
  state: 'Assam',
  latitude: 26.1445,
  longitude: 91.7362,
  landSize: 2,
  landUnit: 'Acre',
  soilType: 'Alluvial',
  irrigation: 'Canal',
  goal: 'High Yield',
  soilPh: 6.8,
  customized: false,
};

export interface LocationPreset {
  location: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  defaultSoil: FarmProfile['soilType'];
  defaultPh: number;
  baseTemp: number;
  humidity: number;
  rainProb: number;
}

export const LOCATION_PRESETS: LocationPreset[] = [
  {
    location: 'Kamrup, Assam',
    district: 'Kamrup',
    state: 'Assam',
    lat: 26.1445,
    lng: 91.7362,
    defaultSoil: 'Alluvial',
    defaultPh: 6.8,
    baseTemp: 27,
    humidity: 74,
    rainProb: 35,
  },
  {
    location: 'Ludhiana, Punjab',
    district: 'Ludhiana',
    state: 'Punjab',
    lat: 30.901,
    lng: 75.8573,
    defaultSoil: 'Loam',
    defaultPh: 7.4,
    baseTemp: 22,
    humidity: 54,
    rainProb: 12,
  },
  {
    location: 'Bardhaman, West Bengal',
    district: 'Bardhaman',
    state: 'West Bengal',
    lat: 23.2324,
    lng: 87.8615,
    defaultSoil: 'Alluvial',
    defaultPh: 6.4,
    baseTemp: 28,
    humidity: 78,
    rainProb: 42,
  },
  {
    location: 'Nashik, Maharashtra',
    district: 'Nashik',
    state: 'Maharashtra',
    lat: 19.9975,
    lng: 73.7898,
    defaultSoil: 'Black',
    defaultPh: 7.2,
    baseTemp: 29,
    humidity: 48,
    rainProb: 18,
  },
  {
    location: 'Varanasi, Uttar Pradesh',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    lat: 25.3176,
    lng: 82.9739,
    defaultSoil: 'Alluvial',
    defaultPh: 7.1,
    baseTemp: 24,
    humidity: 60,
    rainProb: 20,
  },
  {
    location: 'Thanjavur, Tamil Nadu',
    district: 'Thanjavur',
    state: 'Tamil Nadu',
    lat: 10.787,
    lng: 79.1378,
    defaultSoil: 'Clay',
    defaultPh: 6.9,
    baseTemp: 31,
    humidity: 76,
    rainProb: 65,
  },
  {
    location: 'Indore, Madhya Pradesh',
    district: 'Indore',
    state: 'Madhya Pradesh',
    lat: 22.7196,
    lng: 75.8577,
    defaultSoil: 'Black',
    defaultPh: 7.5,
    baseTemp: 26,
    humidity: 45,
    rainProb: 15,
  },
  {
    location: 'Guntur, Andhra Pradesh',
    district: 'Guntur',
    state: 'Andhra Pradesh',
    lat: 16.3067,
    lng: 80.4365,
    defaultSoil: 'Red',
    defaultPh: 6.6,
    baseTemp: 30,
    humidity: 68,
    rainProb: 48,
  },
];

export function getWeatherForLocation(location: string): WeatherProfile {
  const matched = LOCATION_PRESETS.find(
    (p) =>
      p.location.toLowerCase() === location.toLowerCase() ||
      location.toLowerCase().includes(p.district.toLowerCase())
  );

  const seed = location
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  const baseTemp = matched ? matched.baseTemp : 24 + (seed % 8);
  const humidity = matched ? matched.humidity : 52 + (seed % 26);
  const rainProb = matched ? matched.rainProb : 15 + (seed % 55);

  const forecastDays = ['Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed'];
  const dateLabels = ['Nov 21', 'Nov 22', 'Nov 23', 'Nov 24', 'Nov 25', 'Nov 26', 'Nov 27'];

  const forecast = forecastDays.map((day, idx) => {
    const dayOffset = ((seed + idx * 7) % 5) - 2;
    const isRainSpike = (idx === 0 && rainProb > 50) || (idx === 2 && rainProb >= 30);
    const dayRain = isRainSpike
      ? Math.min(88, rainProb + 36)
      : Math.max(5, Math.min(70, rainProb + ((idx * 11 + seed) % 25) - 12));

    let condition: WeatherProfile['forecast'][number]['condition'] = 'Sunny';
    if (dayRain >= 65) condition = 'Heavy Rain';
    else if (dayRain >= 40) condition = 'Light Rain';
    else if (dayRain >= 20) condition = 'Partly Cloudy';

    return {
      day,
      dateLabel: dateLabels[idx],
      tempHigh: baseTemp + dayOffset,
      tempLow: baseTemp - 9 + dayOffset,
      rainProb: dayRain,
      humidity: Math.min(92, Math.max(35, humidity + (dayRain > 50 ? 12 : -4))),
      condition,
    };
  });

  const heavyRainDay = forecast.find((d) => d.rainProb >= 65);
  const moderateRainDay = forecast.find((d) => d.rainProb >= 40);

  if (heavyRainDay) {
    return {
      locationLabel: location,
      currentTemp: baseTemp,
      condition: rainProb > 45 ? 'Light Showers' : 'Partly Sunny',
      humidity,
      rainProb,
      windKmh: 11 + (seed % 8),
      alertStatus: 'Risk',
      alertTitle: `Heavy rain expected ${heavyRainDay.day} (${heavyRainDay.rainProb}% probability)`,
      alertAdvice:
        'Delay top-dressing urea and foliar pesticide sprays. Clear field drainage channels before rainfall.',
      forecast,
    };
  }

  if (moderateRainDay) {
    return {
      locationLabel: location,
      currentTemp: baseTemp,
      condition: 'Partly Sunny',
      humidity,
      rainProb,
      windKmh: 9 + (seed % 7),
      alertStatus: 'Caution',
      alertTitle: `Light showers likely on ${moderateRainDay.day} (${moderateRainDay.rainProb}% chance)`,
      alertAdvice:
        'Schedule herbicide or micronutrient spraying for early morning before wind picks up; postpone heavy irrigation.',
      forecast,
    };
  }

  return {
    locationLabel: location,
    currentTemp: baseTemp,
    condition: 'Clear & Sunny',
    humidity,
    rainProb,
    windKmh: 8 + (seed % 6),
    alertStatus: 'Good',
    alertTitle: 'Clear dry window across the next 5 days',
    alertAdvice:
      'Ideal weather for basal fertilizer application, sowing, and preventive neem oil sprays.',
    forecast,
  };
}

export const CROPS_CATALOG: Crop[] = [
  {
    id: 'wheat',
    name: 'Wheat',
    localName: 'गेहूँ / গম',
    category: 'Cereal',
    seasons: ['Rabi'],
    soilTypes: ['Alluvial', 'Loam', 'Clay', 'Black'],
    phMin: 6.0,
    phMax: 7.8,
    irrigationFit: ['Canal', 'Borewell', 'Drip'],
    waterRequirement: 'Medium',
    budgetLevel: 'Medium',
    goals: ['High Yield', 'Cash Crop'],
    expectedYield: '18–22 qtl/acre',
    durationDays: '120–135 days',
    inputCostPerAcre: 16500,
    expectedReturnPerAcre: 44500,
    riskLevel: 'Good',
    sowingWindow: 'November – December',
    harvestWindow: 'March – April',
    activeMonths: [0, 1, 2, 10, 11],
    sowingMonths: [10, 11],
    harvestMonths: [2, 3],
    description:
      'The reliable Rabi staple with assured MSP procurement. Timely-sown HD-series varieties under canal irrigation are the safest ₹/acre bet.',
    goodPreviousCrops: ['Paddy (Rice)', 'Soybean', 'Maize', 'Pulses'],
    avoidPreviousCrops: ['Wheat'],
    iconEmoji: '🌾',
    stages: [
      {
        stageNumber: 1,
        title: 'Land Preparation',
        timeframe: '1–2 WEEKS',
        summary: 'Fine tilth seedbed with basal organic manure incorporation.',
        instructions: [
          'Plough twice with disc harrow followed by planking to level field for uniform canal irrigation.',
          'Incorporate 4–5 tonnes well-decomposed FYM or vermicompost per acre during final harrowing.',
          'Check soil moisture — pre-sowing palewa irrigation helps uniform germination.',
        ],
        dosageTip: 'Basal: 50 kg DAP + 25 kg MOP per acre at final ploughing.',
        iconName: 'tractor',
      },
      {
        stageNumber: 2,
        title: 'Seed Selection & Sowing',
        timeframe: 'WEEK 3',
        summary: 'Line sowing at optimal 5 cm depth with certified treated seed.',
        instructions: [
          'Choose rust-resistant varieties (HD-2967, HD-3086, DBW-187) at 40 kg/acre seed rate.',
          'Treat seeds with Carbendazim 50 WP (2 g/kg) or Trichoderma viride (4 g/kg) against loose smut.',
          'Sow in rows 20–22 cm apart using zero-till or seed-cum-fertilizer drill.',
        ],
        dosageTip: 'Seed rate: 40 kg/acre timely sown; 48 kg/acre if sown after Dec 10.',
        iconName: 'sprout',
      },
      {
        stageNumber: 3,
        title: 'Nutrient & Water Management',
        timeframe: 'WEEKS 4–10',
        summary: 'Critical CRI stage irrigation and split nitrogen top-dressing.',
        instructions: [
          'First irrigation at Crown Root Initiation (21 days after sowing) is mandatory — never delay.',
          'Follow up with irrigations at tillering (45 DAS), jointing (65 DAS), flowering (85 DAS), and milking (105 DAS).',
          'Apply remaining Urea in two equal splits after first and second irrigation.',
        ],
        dosageTip: 'Top dress 45 kg Urea/acre at 21 DAS and 45 kg/acre at 45 DAS.',
        iconName: 'droplets',
      },
      {
        stageNumber: 4,
        title: 'Weed & Pest Control',
        timeframe: 'WEEKS 5–12',
        summary: 'Control Phalaris minor and watch for yellow rust or aphids.',
        instructions: [
          'Keep field weed-free in first 35 days; apply Sulfosulfuron or Clodinafop at 30–35 DAS if grassy weeds emerge.',
          'Monitor lower leaves for yellow rust streaks during humid January mornings.',
          'If earhead aphids exceed 10 per tiller, spray Neem oil (3 ml/L) or Imidacloprid 17.8 SL.',
        ],
        dosageTip: 'Spray only on calm mornings; use flat-fan nozzle for weedicide.',
        iconName: 'shield',
      },
      {
        stageNumber: 5,
        title: 'Harvesting & Storage',
        timeframe: 'WEEKS 17–19',
        summary: 'Harvest at golden maturity and dry grain below 12% moisture.',
        instructions: [
          'Harvest when stalks turn golden yellow and grains crack crisply under teeth (~20% moisture).',
          'Sun-dry threshed wheat on tarpaulin sheets for 2–3 days until moisture reaches 10–12%.',
          'Store in clean airtight metal bins or neem-leaf lined gunny bags off the floor.',
        ],
        dosageTip: 'Target storage moisture < 12% to prevent weevil damage.',
        iconName: 'wheat',
      },
    ],
  },
  {
    id: 'mustard',
    name: 'Mustard',
    localName: 'सरसों / সৰিয়হ',
    category: 'Oilseed',
    seasons: ['Rabi'],
    soilTypes: ['Alluvial', 'Loam', 'Sandy', 'Red'],
    phMin: 5.8,
    phMax: 7.6,
    irrigationFit: ['Rainfed', 'Canal', 'Borewell', 'Drip'],
    waterRequirement: 'Low',
    budgetLevel: 'Low',
    goals: ['Low Water', 'Cash Crop', 'High Yield', 'Organic'],
    expectedYield: '7–9 qtl/acre',
    durationDays: '105–120 days',
    inputCostPerAcre: 9200,
    expectedReturnPerAcre: 39500,
    riskLevel: 'Good',
    sowingWindow: 'October – November',
    harvestWindow: 'February – March',
    activeMonths: [0, 1, 9, 10, 11],
    sowingMonths: [9, 10],
    harvestMonths: [1, 2],
    description:
      'Low-water Rabi oilseed ideal for Assam, UP, and Bengal alluvial tracts. High oil content varieties deliver fast returns with minimal irrigation.',
    goodPreviousCrops: ['Paddy (Rice)', 'Maize', 'Pulses', 'Soybean'],
    avoidPreviousCrops: ['Mustard'],
    iconEmoji: '🌼',
    stages: [
      {
        stageNumber: 1,
        title: 'Land Preparation',
        timeframe: '1 WEEK',
        summary: 'Light ploughing and clod crushing for fine seed contact.',
        instructions: [
          'Prepare a fine, weed-free seedbed with 2 ploughings and planking immediately after Kharif harvest.',
          'Ensure good field drainage — mustard does not tolerate standing water.',
        ],
        dosageTip: 'Mix 10 kg Sulphur (Bentonite) + 35 kg DAP per acre before sowing.',
        iconName: 'tractor',
      },
      {
        stageNumber: 2,
        title: 'Seed Selection & Sowing',
        timeframe: 'WEEK 2',
        summary: 'Shallow line sowing at 30 cm row spacing.',
        instructions: [
          'Use high-yielding varieties like Pusa Bold, RH-749, or TS-38 (Assam/NE) at 2 kg/acre.',
          'Sow shallow (2.5–3 cm depth) and thin extra seedlings at 15–20 DAS keeping 10–12 cm plant spacing.',
        ],
        dosageTip: 'Seed rate: 2 kg/acre; treat with Metalaxyl (6 g/kg) against white rust.',
        iconName: 'sprout',
      },
      {
        stageNumber: 3,
        title: 'Nutrient & Water Management',
        timeframe: 'WEEKS 4–9',
        summary: 'Two well-timed irrigations at branching and siliqua filling.',
        instructions: [
          'Apply first light irrigation at 30–35 DAS (pre-flowering branching stage).',
          'Apply second irrigation at 60–65 DAS (pod/siliqua development stage) if winter rains are absent.',
        ],
        dosageTip: 'Top dress 25 kg Urea/acre after first irrigation; avoid excess nitrogen.',
        iconName: 'droplets',
      },
      {
        stageNumber: 4,
        title: 'Weed & Pest Control',
        timeframe: 'WEEKS 5–11',
        summary: 'Watch closely for mustard aphids (chepa/mahu) on flower buds.',
        instructions: [
          'Install yellow sticky traps (6–8/acre) to detect early aphid arrival.',
          'Spray Azadirachtin / Neem oil 1500 ppm (3 ml/L) at initial infestation; protect honeybees by spraying after 4 PM.',
        ],
        dosageTip: 'Always spray in late afternoon when bee foraging stops.',
        iconName: 'shield',
      },
      {
        stageNumber: 5,
        title: 'Harvesting & Storage',
        timeframe: 'WEEKS 15–17',
        summary: 'Harvest when 75% pods turn yellow to prevent shattering.',
        instructions: [
          'Cut crop in early morning hours when dew reduces pod shattering.',
          'Stack bundles for 4–5 days to dry evenly before threshing and winnowing.',
        ],
        dosageTip: 'Store seed at 8% moisture for maximum oil extraction yield.',
        iconName: 'wheat',
      },
    ],
  },
  {
    id: 'potato',
    name: 'Potato',
    localName: 'आलू / আলু',
    category: 'Vegetable',
    seasons: ['Rabi'],
    soilTypes: ['Alluvial', 'Loam', 'Sandy'],
    phMin: 5.5,
    phMax: 7.0,
    irrigationFit: ['Canal', 'Borewell', 'Drip'],
    waterRequirement: 'Medium',
    budgetLevel: 'High',
    goals: ['Cash Crop', 'High Yield'],
    expectedYield: '95–115 qtl/acre',
    durationDays: '85–105 days',
    inputCostPerAcre: 34000,
    expectedReturnPerAcre: 82000,
    riskLevel: 'Caution',
    sowingWindow: 'October – November',
    harvestWindow: 'January – February',
    activeMonths: [0, 1, 9, 10, 11],
    sowingMonths: [9, 10],
    harvestMonths: [0, 1],
    description:
      'High-margin winter cash crop thriving in loose alluvial and sandy-loam soils. Demands disciplined earthing-up and late blight vigilance.',
    goodPreviousCrops: ['Paddy (Rice)', 'Maize', 'Pulses'],
    avoidPreviousCrops: ['Potato', 'Tomato'],
    iconEmoji: '🥔',
    stages: [
      {
        stageNumber: 1,
        title: 'Land Preparation',
        timeframe: '1 WEEK',
        summary: 'Deep ploughing and well-drained ridge formation.',
        instructions: [
          'Plough 20–25 cm deep and incorporate 8 tonnes compost/acre for loose tuber expansion.',
          'Form ridges 60 cm apart for easy furrow irrigation and drainage.',
        ],
        dosageTip: 'Basal: 65 kg DAP + 50 kg MOP + 25 kg Urea per acre.',
        iconName: 'tractor',
      },
      {
        stageNumber: 2,
        title: 'Seed Selection & Sowing',
        timeframe: 'WEEK 2',
        summary: 'Plant sprouted 30–40 g certified seed tubers.',
        instructions: [
          'Use disease-free Kufri Jyoti, Kufri Pukhraj, or Kufri Chipsona tubers (600–750 kg/acre).',
          'Dip cut/whole tubers in Mancozeb solution (2.5 g/L) for 10 mins and shade-dry before planting.',
        ],
        dosageTip: 'Plant at 20 cm spacing along 60 cm ridges, 5 cm soil cover.',
        iconName: 'sprout',
      },
      {
        stageNumber: 3,
        title: 'Nutrient & Water Management',
        timeframe: 'WEEKS 3–8',
        summary: 'Light frequent irrigations and earthing-up at 25–30 DAS.',
        instructions: [
          'Keep ridges moist at 60% field capacity without flooding furrows.',
          'Perform earthing-up at 25–30 days after planting alongside second nitrogen dose.',
        ],
        dosageTip: 'Top dress 35 kg Urea/acre during earthing-up at 25–30 DAS.',
        iconName: 'droplets',
      },
      {
        stageNumber: 4,
        title: 'Weed & Pest Control',
        timeframe: 'WEEKS 4–10',
        summary: 'Preventive sprays for Late Blight during foggy weather.',
        instructions: [
          'Watch lower leaves closely when night temp drops below 14°C with high humidity.',
          'Apply preventive Mancozeb (2 g/L) or Copper Oxychloride; switch to Cymoxanil+Mancozeb if blight spots appear.',
        ],
        dosageTip: 'Stop irrigation 10 days before haulm cutting.',
        iconName: 'shield',
      },
      {
        stageNumber: 5,
        title: 'Harvesting & Storage',
        timeframe: 'WEEKS 12–14',
        summary: 'Cut haulms 10 days early to toughen tuber skin.',
        instructions: [
          'De-haulm vines 10 days before digging so skin sets firmly and resists bruising.',
          'Sort bruised tubers separately and cure in shaded cool heaps for 7 days.',
        ],
        dosageTip: 'Move graded tubers to cold storage at 2–4°C if holding > 3 weeks.',
        iconName: 'wheat',
      },
    ],
  },
  {
    id: 'chickpea',
    name: 'Chickpea (Gram)',
    localName: 'चना / বুটমাহ',
    category: 'Pulse',
    seasons: ['Rabi'],
    soilTypes: ['Loam', 'Black', 'Alluvial', 'Clay'],
    phMin: 6.0,
    phMax: 8.0,
    irrigationFit: ['Rainfed', 'Canal', 'Drip'],
    waterRequirement: 'Low',
    budgetLevel: 'Low',
    goals: ['Low Water', 'Organic', 'High Yield'],
    expectedYield: '7–9 qtl/acre',
    durationDays: '110–125 days',
    inputCostPerAcre: 10500,
    expectedReturnPerAcre: 42000,
    riskLevel: 'Good',
    sowingWindow: 'October – November',
    harvestWindow: 'February – March',
    activeMonths: [0, 1, 2, 9, 10, 11],
    sowingMonths: [9, 10],
    harvestMonths: [1, 2],
    description:
      'Drought-hardy Rabi pulse that fixes atmospheric nitrogen, cutting fertilizer bills for the following Kharif crop while fetching strong market prices.',
    goodPreviousCrops: ['Paddy (Rice)', 'Maize', 'Soybean'],
    avoidPreviousCrops: ['Pulses'],
    iconEmoji: '🫘',
    stages: [
      {
        stageNumber: 1,
        title: 'Land Preparation',
        timeframe: '1 WEEK',
        summary: 'Rough cloddy seedbed preserves residual moisture.',
        instructions: [
          'One deep ploughing followed by light harrowing; avoid over-pulverizing heavy clay.',
          'Ensure zero waterlogging risk with perimeter drainage furrows.',
        ],
        dosageTip: 'Basal: 40 kg DAP + 8 kg Sulphur/acre.',
        iconName: 'tractor',
      },
      {
        stageNumber: 2,
        title: 'Seed Selection & Sowing',
        timeframe: 'WEEK 2',
        summary: 'Rhizobium-inoculated seed sown at 7–8 cm depth.',
        instructions: [
          'Select wilt-resistant JG-11, Pusa-372, or JAKI-9218 at 30 kg/acre.',
          'Treat with Trichoderma first, then coat with Rhizobium + PSB culture before sowing.',
        ],
        dosageTip: 'Row spacing 30 cm × 10 cm plant spacing.',
        iconName: 'sprout',
      },
      {
        stageNumber: 3,
        title: 'Nutrient & Water Management',
        timeframe: 'WEEKS 4–9',
        summary: 'Pinching/nipping at 35 DAS boosts branching; 1 light irrigation.',
        instructions: [
          'Nip top terminal shoots at 35–40 DAS to encourage vigorous side branches.',
          'Give only 1 light irrigation at pre-flowering (45 DAS) if winter is dry; never over-irrigate.',
        ],
        dosageTip: 'Foliar spray 2% DAP at flowering improves pod set.',
        iconName: 'droplets',
      },
      {
        stageNumber: 4,
        title: 'Weed & Pest Control',
        timeframe: 'WEEKS 5–11',
        summary: 'Install bird perches and pheromone traps for pod borer.',
        instructions: [
          'Place 15–20 T-shaped bird perches/acre so insectivorous birds eat Helicoverpa larvae.',
          'Spray NPV (HaNPV) or Emamectin Benzoate if pod borer exceeds 1 larva per meter row.',
        ],
        dosageTip: 'Neem Seed Kernel Extract (5%) spray at 50% flowering.',
        iconName: 'shield',
      },
      {
        stageNumber: 5,
        title: 'Harvesting & Storage',
        timeframe: 'WEEKS 15–17',
        summary: 'Harvest when leaves turn reddish-brown and pods dry.',
        instructions: [
          'Cut plants close to ground when 80% pods dry brown.',
          'Dry 3–4 days, thresh, and store in airtight drums with dry neem leaves.',
        ],
        dosageTip: 'Keep grain moisture < 9% for bruchid protection.',
        iconName: 'wheat',
      },
    ],
  },
  {
    id: 'paddy-kharif',
    name: 'Paddy (Sali Rice)',
    localName: 'धान / শালি ধান',
    category: 'Cereal',
    seasons: ['Kharif'],
    soilTypes: ['Alluvial', 'Clay', 'Loam'],
    phMin: 5.2,
    phMax: 7.2,
    irrigationFit: ['Rainfed', 'Canal', 'Borewell'],
    waterRequirement: 'High',
    budgetLevel: 'Medium',
    goals: ['High Yield', 'Organic'],
    expectedYield: '20–25 qtl/acre',
    durationDays: '130–145 days',
    inputCostPerAcre: 18000,
    expectedReturnPerAcre: 46000,
    riskLevel: 'Good',
    sowingWindow: 'June – July',
    harvestWindow: 'October – November',
    activeMonths: [5, 6, 7, 8, 9, 10],
    sowingMonths: [5, 6],
    harvestMonths: [9, 10],
    description:
      'Primary Kharif staple suited to monsoon rainfall and alluvial/clay basins. Ranjit, Swarna, and Mahsuri deliver dependable grain recovery.',
    goodPreviousCrops: ['Pulses', 'Mustard', 'Potato', 'Moong Dal'],
    avoidPreviousCrops: ['Paddy (Rice)'],
    iconEmoji: '🌾',
    stages: [
      {
        stageNumber: 1,
        title: 'Land Preparation',
        timeframe: '1–2 WEEKS',
        summary: 'Nursery bed prep and main field puddling with bund repair.',
        instructions: [
          'Raise raised nursery beds (10% of main area) with compost and fine tilth.',
          'Puddle main field twice in standing water and level bunds to hold 5 cm water evenly.',
        ],
        dosageTip: 'Basal: 35 kg DAP + 20 kg MOP + 10 kg Zinc Sulphate/acre.',
        iconName: 'tractor',
      },
      {
        stageNumber: 2,
        title: 'Seed Selection & Sowing',
        timeframe: 'WEEKS 2–4',
        summary: 'Transplant 21–25 day vigorous seedlings at 20×15 cm.',
        instructions: [
          'Soak 18–20 kg certified seed in salt water to remove unfilled grains, then treat with Carbendazim.',
          'Transplant 2–3 seedlings per hill at 2–3 cm depth in lines.',
        ],
        dosageTip: 'Line transplanting boosts aeration and lowers sheath blight.',
        iconName: 'sprout',
      },
      {
        stageNumber: 3,
        title: 'Nutrient & Water Management',
        timeframe: 'WEEKS 5–11',
        summary: 'Alternate wetting & drying (AWD) saves water and strengthens roots.',
        instructions: [
          'Maintain 3–5 cm standing water during active tillering and panicle initiation.',
          'Drain field 10 days before harvest for uniform ripening.',
        ],
        dosageTip: 'Split Urea: 25 kg/acre at 25 DAT and 25 kg/acre at panicle initiation.',
        iconName: 'droplets',
      },
      {
        stageNumber: 4,
        title: 'Weed & Pest Control',
        timeframe: 'WEEKS 4–13',
        summary: 'Cono-weeder passes and pheromone traps for stem borer.',
        instructions: [
          'Run cono-weeder at 15 and 30 DAT in line-transplanted fields.',
          'Monitor for leaf blast (spindle spots) and yellow stem borer; use Tricyclazole or Neem spray.',
        ],
        dosageTip: 'Install 4 yellow stem borer pheromone traps/acre.',
        iconName: 'shield',
      },
      {
        stageNumber: 5,
        title: 'Harvesting & Storage',
        timeframe: 'WEEKS 18–20',
        summary: 'Harvest when 85% of panicle grains turn straw-golden.',
        instructions: [
          'Avoid over-ripening in the field to prevent grain shattering and bird loss.',
          'Dry threshed paddy to 13% moisture before bagging.',
        ],
        dosageTip: 'Test bite hardness or moisture meter before milling.',
        iconName: 'wheat',
      },
    ],
  },
  {
    id: 'maize',
    name: 'Maize (Corn)',
    localName: 'मक्का / মাকৈ',
    category: 'Cereal',
    seasons: ['Kharif', 'Rabi', 'Zaid'],
    soilTypes: ['Loam', 'Alluvial', 'Red', 'Sandy'],
    phMin: 5.8,
    phMax: 7.5,
    irrigationFit: ['Rainfed', 'Canal', 'Borewell', 'Drip'],
    waterRequirement: 'Medium',
    budgetLevel: 'Medium',
    goals: ['High Yield', 'Cash Crop'],
    expectedYield: '22–28 qtl/acre',
    durationDays: '95–110 days',
    inputCostPerAcre: 14500,
    expectedReturnPerAcre: 43000,
    riskLevel: 'Good',
    sowingWindow: 'June – July / Oct – Nov',
    harvestWindow: 'Sept – Oct / Feb – Mar',
    activeMonths: [1, 2, 5, 6, 7, 8, 9, 10],
    sowingMonths: [5, 6, 9, 10],
    harvestMonths: [8, 9, 1, 2],
    description:
      'Versatile multi-season cereal with booming poultry feed and starch demand. Performs best on well-drained ridges.',
    goodPreviousCrops: ['Pulses', 'Potato', 'Soybean'],
    avoidPreviousCrops: ['Maize'],
    iconEmoji: '🌽',
    stages: [
      {
        stageNumber: 1,
        title: 'Land Preparation',
        timeframe: '1 WEEK',
        summary: 'Deep tilth and ridge-furrow drainage layout.',
        instructions: [
          'Maize is highly sensitive to waterlogging — form ridges 60 cm apart.',
          'Incorporate 4 tonnes compost/acre prior to ridge forming.',
        ],
        dosageTip: 'Basal: 50 kg DAP + 20 kg MOP + 10 kg Zinc Sulphate/acre.',
        iconName: 'tractor',
      },
      {
        stageNumber: 2,
        title: 'Seed Selection & Sowing',
        timeframe: 'WEEK 2',
        summary: 'Single-cross hybrid seed dibbled on ridge sides.',
        instructions: [
          'Use 8 kg/acre hybrid seed spaced 60 × 20 cm at 4 cm depth.',
          'Treat seed with Imidacloprid 600 FS against early shoot fly.',
        ],
        dosageTip: 'Plant 1 seed per hill for uniform cob size.',
        iconName: 'sprout',
      },
      {
        stageNumber: 3,
        title: 'Nutrient & Water Management',
        timeframe: 'WEEKS 3–8',
        summary: 'Critical watering at knee-high, tasseling, and silking.',
        instructions: [
          'Never allow moisture stress during tasseling and cob silking.',
          'Apply urea side-dressing at knee-high (30 DAS) and pre-tasseling (50 DAS).',
        ],
        dosageTip: 'Side-dress 35 kg Urea/acre twice before tasseling.',
        iconName: 'droplets',
      },
      {
        stageNumber: 4,
        title: 'Weed & Pest Control',
        timeframe: 'WEEKS 3–9',
        summary: 'Early Fall Armyworm (FAW) whorl scouting.',
        instructions: [
          'Inspect central leaf whorl weekly for ragged window-pane feeding by Fall Armyworm.',
          'Apply Neem oil + sand/ash in whorls early, or Spinetoram if infestation crosses 10% plants.',
        ],
        dosageTip: 'Early whorl treatment prevents cob damage completely.',
        iconName: 'shield',
      },
      {
        stageNumber: 5,
        title: 'Harvesting & Storage',
        timeframe: 'WEEKS 14–15',
        summary: 'Harvest when cob husks dry straw-colored and black layer forms.',
        instructions: [
          'De-husk cobs and sun-dry to 12% kernel moisture before shelling.',
          'Store shelled grain in PICS or moisture-proof bags to prevent aflatoxin.',
        ],
        dosageTip: 'Never heap damp freshly harvested cobs indoors.',
        iconName: 'wheat',
      },
    ],
  },
  {
    id: 'soybean',
    name: 'Soybean',
    localName: 'सोयाबीन / ছয়াবিন',
    category: 'Oilseed',
    seasons: ['Kharif'],
    soilTypes: ['Black', 'Loam', 'Red'],
    phMin: 6.0,
    phMax: 7.5,
    irrigationFit: ['Rainfed', 'Canal', 'Drip'],
    waterRequirement: 'Low',
    budgetLevel: 'Low',
    goals: ['Low Water', 'Cash Crop', 'Organic'],
    expectedYield: '8–11 qtl/acre',
    durationDays: '95–105 days',
    inputCostPerAcre: 11000,
    expectedReturnPerAcre: 39000,
    riskLevel: 'Good',
    sowingWindow: 'June – July',
    harvestWindow: 'September – October',
    activeMonths: [5, 6, 7, 8, 9],
    sowingMonths: [5, 6],
    harvestMonths: [8, 9],
    description:
      'Rainfed Kharif protein-oilseed powerhouse for central and peninsular soils. Enriches soil nitrogen before Rabi wheat or chickpea.',
    goodPreviousCrops: ['Wheat', 'Maize', 'Cotton'],
    avoidPreviousCrops: ['Soybean'],
    iconEmoji: '🫛',
    stages: [
      {
        stageNumber: 1,
        title: 'Land Preparation',
        timeframe: '1 WEEK',
        summary: 'Broad-bed furrow (BBF) protects from monsoon waterlogging.',
        instructions: [
          'Prepare Broad-Bed Furrows (BBF) so excess monsoon rain drains smoothly while conserving dry-spell moisture.',
        ],
        dosageTip: 'Basal: 35 kg DAP + 15 kg MOP + 10 kg Sulphur/acre.',
        iconName: 'tractor',
      },
      {
        stageNumber: 2,
        title: 'Seed Selection & Sowing',
        timeframe: 'WEEK 2',
        summary: 'Shallow sowing after ≥ 75 mm cumulative monsoon rain.',
        instructions: [
          'Sow JS-9560 or NRC-138 at 28–30 kg/acre at shallow 3 cm depth.',
          'Inoculate seed with Bradyrhizobium japonicum before sowing.',
        ],
        dosageTip: 'Do not sow deeper than 3–4 cm or germination drops.',
        iconName: 'sprout',
      },
      {
        stageNumber: 3,
        title: 'Nutrient & Water Management',
        timeframe: 'WEEKS 4–8',
        summary: 'Mostly rainfed; protective irrigation only during pod-fill dry spell.',
        instructions: [
          'Provide 1 protective irrigation if dry spell > 15 days hits during R3–R5 pod filling.',
        ],
        dosageTip: '19:19:19 foliar spray (5 g/L) at pod initiation.',
        iconName: 'droplets',
      },
      {
        stageNumber: 4,
        title: 'Weed & Pest Control',
        timeframe: 'WEEKS 3–9',
        summary: 'Watch for girdle beetle and yellow mosaic whiteflies.',
        instructions: [
          'Keep field weed-free up to 35 DAS; run blade hoe twice.',
          'Rogue out yellow mosaic plants early and install yellow sticky traps.',
        ],
        dosageTip: 'Use Neem oil 3 ml/L for early whitefly and semilooper.',
        iconName: 'shield',
      },
      {
        stageNumber: 5,
        title: 'Harvesting & Storage',
        timeframe: 'WEEKS 14–15',
        summary: 'Harvest immediately when 90% pods turn golden-brown.',
        instructions: [
          'Avoid delay once pods dry or shattering losses rise steeply.',
          'Thresh gently at low cylinder RPM to avoid splitting seed coat.',
        ],
        dosageTip: 'Store below 10% moisture.',
        iconName: 'wheat',
      },
    ],
  },
  {
    id: 'moong',
    name: 'Moong Dal (Green Gram)',
    localName: 'मूंग / মগুমাহ',
    category: 'Pulse',
    seasons: ['Zaid', 'Kharif'],
    soilTypes: ['Loam', 'Alluvial', 'Sandy', 'Red'],
    phMin: 6.2,
    phMax: 7.8,
    irrigationFit: ['Rainfed', 'Canal', 'Borewell', 'Drip'],
    waterRequirement: 'Low',
    budgetLevel: 'Low',
    goals: ['Low Water', 'Organic', 'Cash Crop'],
    expectedYield: '4.5–6 qtl/acre',
    durationDays: '60–65 days',
    inputCostPerAcre: 7500,
    expectedReturnPerAcre: 34000,
    riskLevel: 'Good',
    sowingWindow: 'March – April / July',
    harvestWindow: 'May – June / Sept',
    activeMonths: [2, 3, 4, 5, 6, 7, 8],
    sowingMonths: [2, 3, 6],
    harvestMonths: [4, 5, 8],
    description:
      'Ultra-fast 60-day summer/Zaid catch crop between Wheat harvest and Kharif Paddy. Generates bonus cash and adds 25 kg nitrogen/acre.',
    goodPreviousCrops: ['Wheat', 'Potato', 'Mustard'],
    avoidPreviousCrops: ['Pulses'],
    iconEmoji: '🌱',
    stages: [
      {
        stageNumber: 1,
        title: 'Land Preparation',
        timeframe: '3–5 DAYS',
        summary: 'Minimal zero-till or 1 light harrowing after Rabi harvest.',
        instructions: [
          'Irrigate lightly and sow directly into wheat/potato stubble to save moisture and turnaround time.',
        ],
        dosageTip: 'Basal: 25 kg DAP + 8 kg Sulphur/acre.',
        iconName: 'tractor',
      },
      {
        stageNumber: 2,
        title: 'Seed Selection & Sowing',
        timeframe: 'WEEK 1',
        summary: 'Short-duration YMV-resistant varieties like Virat or Samrat.',
        instructions: [
          'Sow 8–10 kg/acre treated with Rhizobium culture in 25–30 cm rows.',
        ],
        dosageTip: 'Complete Zaid sowing before April 10 to beat early monsoon.',
        iconName: 'sprout',
      },
      {
        stageNumber: 3,
        title: 'Nutrient & Water Management',
        timeframe: 'WEEKS 3–6',
        summary: '2–3 light summer irrigations at flowering and podding.',
        instructions: [
          'Irrigate at 25 DAS (pre-flowering) and 40 DAS (pod development).',
        ],
        dosageTip: 'Spray 2% Urea or NPK 0:52:34 at flowering.',
        iconName: 'droplets',
      },
      {
        stageNumber: 4,
        title: 'Weed & Pest Control',
        timeframe: 'WEEKS 3–7',
        summary: 'Monitor thrips and whiteflies in hot dry weather.',
        instructions: [
          'Keep 1st 25 days weed-free; spray Neem oil (3 ml/L) at bud stage to protect flower drop.',
        ],
        dosageTip: 'Blue sticky traps curb blossom thrips effectively.',
        iconName: 'shield',
      },
      {
        stageNumber: 5,
        title: 'Harvesting & Storage',
        timeframe: 'WEEKS 9–10',
        summary: 'Pick mature black pods in 1–2 pickings or harvest at 80% maturity.',
        instructions: [
          'Sun-dry harvested pods, thresh, and incorporate remaining green biomass into soil before Paddy!',
        ],
        dosageTip: 'Ploughing green stover adds ~25 kg organic N/acre for Kharif.',
        iconName: 'wheat',
      },
    ],
  },
  {
    id: 'watermelon',
    name: 'Watermelon',
    localName: 'तरबूज / তৰমুজ',
    category: 'Fruit',
    seasons: ['Zaid'],
    soilTypes: ['Sandy', 'Loam', 'Alluvial'],
    phMin: 6.0,
    phMax: 7.2,
    irrigationFit: ['Drip', 'Borewell'],
    waterRequirement: 'Medium',
    budgetLevel: 'High',
    goals: ['Cash Crop', 'High Yield'],
    expectedYield: '110–140 qtl/acre',
    durationDays: '80–90 days',
    inputCostPerAcre: 24000,
    expectedReturnPerAcre: 78000,
    riskLevel: 'Caution',
    sowingWindow: 'February – March',
    harvestWindow: 'April – May',
    activeMonths: [1, 2, 3, 4],
    sowingMonths: [1, 2],
    harvestMonths: [3, 4],
    description:
      'High-demand Zaid summer cash crop that excels on sandy-loam riverbeds and drip-mulched raised beds.',
    goodPreviousCrops: ['Paddy (Rice)', 'Mustard', 'Wheat'],
    avoidPreviousCrops: ['Watermelon'],
    iconEmoji: '🍉',
    stages: [
      {
        stageNumber: 1,
        title: 'Land Preparation',
        timeframe: '1 WEEK',
        summary: 'Raised beds with silver-black plastic mulch and drip line.',
        instructions: [
          'Form 1.2 m wide raised beds spaced 2.5 m center-to-center; lay 16 mm inline drip + mulch film.',
        ],
        dosageTip: 'Basal: 6 tonnes FYM + 50 kg DAP + 35 kg MOP/acre in beds.',
        iconName: 'tractor',
      },
      {
        stageNumber: 2,
        title: 'Seed Selection & Sowing',
        timeframe: 'WEEK 2',
        summary: 'Sow Sugar Baby or icebox hybrids in mulch holes.',
        instructions: [
          'Sow 2 seeds per pit at 45 cm spacing along bed edge (350–450 g hybrid seed/acre).',
        ],
        dosageTip: 'Thin to 1 healthy vine per hill after true leaf emergence.',
        iconName: 'sprout',
      },
      {
        stageNumber: 3,
        title: 'Nutrient & Water Management',
        timeframe: 'WEEKS 3–9',
        summary: 'Drip fertigation boosts sweetness (Brix) and fruit weight.',
        instructions: [
          'Run drip daily 45 mins during flowering/fruiting; cut water 7 days before harvest for high sweetness.',
        ],
        dosageTip: 'Fertigate NPK 19:19:19 early, switch to 0:0:50 at fruit sizing.',
        iconName: 'droplets',
      },
      {
        stageNumber: 4,
        title: 'Weed & Pest Control',
        timeframe: 'WEEKS 4–10',
        summary: 'Fruit fly traps and powdery mildew prevention.',
        instructions: [
          'Hang Cue-lure fruit fly traps (6/acre) at female flower initiation.',
        ],
        dosageTip: 'Spray wettable sulphur (2 g/L) only in cool evening hours.',
        iconName: 'shield',
      },
      {
        stageNumber: 5,
        title: 'Harvesting & Storage',
        timeframe: 'WEEKS 11–13',
        summary: 'Harvest when tendril near fruit dries and ground spot turns creamy yellow.',
        instructions: [
          'Cut stem leaving 2 cm stalk; avoid stacking > 4 layers high in transport.',
        ],
        dosageTip: 'Dull hollow thump + dry tendril confirms ripeness.',
        iconName: 'wheat',
      },
    ],
  },
  {
    id: 'tomato',
    name: 'Tomato',
    localName: 'टमाटर / বিলাহী',
    category: 'Vegetable',
    seasons: ['Rabi', 'Zaid', 'Kharif'],
    soilTypes: ['Loam', 'Alluvial', 'Red', 'Black'],
    phMin: 6.0,
    phMax: 7.2,
    irrigationFit: ['Drip', 'Borewell', 'Canal'],
    waterRequirement: 'Medium',
    budgetLevel: 'High',
    goals: ['Cash Crop', 'High Yield'],
    expectedYield: '130–160 qtl/acre',
    durationDays: '110–130 days',
    inputCostPerAcre: 32000,
    expectedReturnPerAcre: 92000,
    riskLevel: 'Caution',
    sowingWindow: 'Sept – Nov / Jan – Feb',
    harvestWindow: 'Dec – Mar / Apr – Jun',
    activeMonths: [0, 1, 2, 3, 8, 9, 10, 11],
    sowingMonths: [8, 9, 10, 0, 1],
    harvestMonths: [0, 1, 2, 3, 11],
    description:
      'High-value horticultural crop with strong urban market demand. Drip irrigation with bamboo staking multiplies marketable Grade-A yield.',
    goodPreviousCrops: ['Maize', 'Paddy (Rice)', 'Pulses'],
    avoidPreviousCrops: ['Potato', 'Tomato'],
    iconEmoji: '🍅',
    stages: [
      {
        stageNumber: 1,
        title: 'Land Preparation',
        timeframe: '1–2 WEEKS',
        summary: 'Raised beds with Trichoderma-enriched compost.',
        instructions: [
          'Enrich 6 tonnes FYM with 2 kg Trichoderma viride 10 days before bed preparation to suppress bacterial wilt.',
        ],
        dosageTip: 'Basal: 50 kg DAP + 40 kg MOP + 10 kg Boron/acre.',
        iconName: 'tractor',
      },
      {
        stageNumber: 2,
        title: 'Seed Selection & Sowing',
        timeframe: 'WEEKS 2–4',
        summary: 'Transplant 25-day nursery seedlings at 60×45 cm.',
        instructions: [
          'Raise seedlings in cocopeat pro-trays under 40-mesh insect net to prevent leaf curl virus.',
        ],
        dosageTip: 'Dip seedling roots in Pseudomonas fluorescens before transplanting.',
        iconName: 'sprout',
      },
      {
        stageNumber: 3,
        title: 'Nutrient & Water Management',
        timeframe: 'WEEKS 5–11',
        summary: 'Staking at 30 DAT and balanced Calcium/Potash fertigation.',
        instructions: [
          'Install bamboo stakes & twine at 30 DAT so fruits never touch wet soil.',
          'Spray Calcium Nitrate (3 g/L) at fruit set to stop blossom-end rot.',
        ],
        dosageTip: 'Steady moisture prevents fruit cracking.',
        iconName: 'droplets',
      },
      {
        stageNumber: 4,
        title: 'Weed & Pest Control',
        timeframe: 'WEEKS 4–13',
        summary: 'Early blight and fruit borer IPM monitoring.',
        instructions: [
          'Remove lower yellowing leaves touching soil; install pheromone traps for fruit borer.',
          'Apply Mancozeb or Azoxystrobin preventively after rains to block early blight.',
        ],
        dosageTip: 'Rotate fungicide groups to avoid resistance.',
        iconName: 'shield',
      },
      {
        stageNumber: 5,
        title: 'Harvesting & Storage',
        timeframe: 'WEEKS 10–18',
        summary: 'Pick at breaker/pink stage for distant markets.',
        instructions: [
          'Harvest in morning into ventilated plastic crates lined with newspaper.',
        ],
        dosageTip: 'Grade into A/B sizes right in shade to fetch 20% higher mandi rates.',
        iconName: 'wheat',
      },
    ],
  },
];

export const INITIAL_CHECKLIST_TASKS: ChecklistTask[] = [
  {
    id: 'task-1',
    title: 'Collect soil samples from 5 field corners (15 cm depth) for pH & NPK check',
    category: 'Soil Health',
    season: 'All',
    completed: false,
    dueLabel: 'Today',
  },
  {
    id: 'task-2',
    title: 'Treat Rabi seeds with Trichoderma viride (4 g/kg) before sowing',
    category: 'Seed Prep',
    season: 'Rabi',
    completed: true,
    dueLabel: 'Done',
  },
  {
    id: 'task-3',
    title: 'Clear field bunds & silt traps ahead of canal water release',
    category: 'Irrigation',
    season: 'All',
    completed: false,
    dueLabel: 'This week',
  },
  {
    id: 'task-4',
    title: 'Inspect lower leaves of mustard/vegetables for early aphid colonies',
    category: 'Pest Watch',
    season: 'Rabi',
    completed: false,
    dueLabel: 'Today',
  },
  {
    id: 'task-5',
    title: 'Turn vermicompost heap and sprinkle water to keep 50% moisture',
    category: 'Compost',
    season: 'All',
    completed: false,
    dueLabel: 'Tomorrow',
  },
];

export const KNOWLEDGE_GUIDES: KnowledgeGuide[] = [
  {
    id: 'soil-health-card',
    title: 'How to Get a Free Soil Health Card',
    category: 'Soil Health',
    readTimeMinutes: 4,
    summary:
      'Walk through the SHC portal, collect a proper grid sample, and read your N-P-K and micronutrient report like an agronomist.',
    keyTakeaways: [
      'Sample 15 cm deep in a V-shape cut across 6–8 spots per acre after removing surface trash.',
      'Never sample immediately after fertilizer application or in waterlogged patches.',
      'Use the printed fertilizer dosage table tailored to your exact crop yield target.',
    ],
    steps: [
      'Contact your block Krishi Vigyan Kendra (KVK) or register on soilhealth.dac.gov.in.',
      'Scrape away top 2 cm litter, dig a 15 cm V-cut, and slice a 2 cm uniform soil ribbon.',
      'Mix 6–8 sub-samples in a clean bucket, quarter it down to 500 g, and shade-dry.',
      'Label with survey number, previous crop, and irrigation source before submitting.',
    ],
    schemeOrTip: 'Free testing every 2 years under the Soil Health & Fertility Scheme.',
    iconKey: 'flask',
  },
  {
    id: 'organic-carbon',
    title: 'Raising Organic Carbon on Tired Soil',
    category: 'Soil Health',
    readTimeMinutes: 5,
    summary:
      'Four practical levers — compost, green manure, residue retention, and reduced tillage — to boost water holding and fertilizer efficiency.',
    keyTakeaways: [
      'Soils below 0.5% organic carbon lose up to 40% of applied urea to leaching.',
      'One season of Dhaincha or Moong green manuring adds ~25 kg N/acre naturally.',
      'Retaining crop stubble as mulch cuts surface evaporation by 30%.',
    ],
    steps: [
      'Apply 3–4 tonnes/acre well-rotted FYM or vermicompost before land preparation.',
      'Sow Dhaincha (Sesbania) in May and plough it in at 40–45 days before Kharif paddy.',
      'Avoid burning paddy or wheat straw; use Happy Seeder or rotavator with waste decomposer.',
      'Include at least one pulse crop (Chickpea, Moong, Lentil) every 12 months.',
    ],
    schemeOrTip: 'Target soil organic carbon > 0.75% within 3 seasons.',
    iconKey: 'sprout',
  },
  {
    id: 'vermicomposting-3wk',
    title: '3-Week Vermicomposting at Home',
    category: 'Organic Composting',
    readTimeMinutes: 5,
    summary:
      'Build a low-cost 10×3 ft shaded worm bed for ~₹2,000 that converts cow dung and crop waste into dark, odorless black gold.',
    keyTakeaways: [
      'Use Eisenia fetida (red wigglers) — 1 kg worms multiply rapidly in cool shade.',
      'Pre-cool fresh cow dung for 10 days so heat does not kill earthworms.',
      'Harvested vermicompost contains 1.5–2% N plus beneficial humic acids.',
    ],
    steps: [
      'Select a shaded, elevated site and lay a 10×3 ft polythene/brick bed with drainage slope.',
      'Layer 10 cm dry chopped paddy straw, then 30 cm pre-cooled cow dung + kitchen/farm greens.',
      'Release 2 kg Eisenia fetida worms gently on top and cover with wet gunny sacks.',
      'Sprinkle water every 2–3 days (keep moist like a squeezed sponge); harvest granular castings from week 4–6.',
    ],
    schemeOrTip: 'Sieve finished compost (4 mm mesh) and dry worms back into fresh bed.',
    iconKey: 'recycle',
  },
  {
    id: 'pmksy-drip-subsidy',
    title: 'PMKSY Micro-Irrigation & Drip Subsidy Guide',
    category: 'Micro-Irrigation',
    readTimeMinutes: 4,
    summary:
      'Save 45–60% water and claim 45% to 55% government subsidy on inline drip and sprinkler systems.',
    keyTakeaways: [
      'Small & marginal farmers receive up to 55% subsidy; other farmers 45% (+ state top-up in many states).',
      'Drip fertigation increases vegetable and fruit yields by 25–40%.',
      'Flush laterals weekly and clean sand/screen filters after every 10 hours of run.',
    ],
    steps: [
      'Keep Aadhaar, land record (Jamabandi/RoR), bank passbook, and passport photo ready.',
      'Apply online on your State Horticulture/Agriculture DBT portal under PDMC (Per Drop More Crop).',
      'Choose an empanelled BIS-certified drip vendor; verify design spacing matches your crop.',
      'After field geo-tagged verification, subsidy transfers directly to your bank or vendor.',
    ],
    schemeOrTip: 'Pair drip with water-soluble NPK (19:19:19) to save 30% fertilizer.',
    iconKey: 'droplet',
  },
  {
    id: 'pm-kisan-kcc',
    title: 'PM-KISAN, KCC & Fasal Bima Checklist',
    category: 'Government Schemes',
    readTimeMinutes: 4,
    summary:
      'Stay eligible for ₹6,000/year PM-KISAN installments, 4% interest Kisan Credit Card loans, and low-premium PMFBY crop insurance.',
    keyTakeaways: [
      'Complete e-KYC and Aadhaar-bank seeding on pmkisan.gov.in to avoid stalled installments.',
      'KCC provides working capital up to ₹3 lakh at an effective 4% annual interest with timely repayment.',
      'PMFBY caps farmer premium at 2% for Kharif and 1.5% for Rabi crops.',
    ],
    steps: [
      'Verify land seeding status ("Yes") and e-KYC status on PM-KISAN beneficiary portal.',
      'Submit simple 1-page KCC application with land record at nearest cooperative/PSU bank.',
      'Enroll standing Kharif/Rabi crops in PMFBY before state cutoff date (usually Jul 31 / Dec 31).',
      'Report localized hailstorm/flood damage within 72 hours via Krishi Rakshak helpline 14447.',
    ],
    schemeOrTip: 'Helpline 14447 connects directly to PMFBY claim intake.',
    iconKey: 'landmark',
  },
  {
    id: 'msp-enam-prices',
    title: 'Selling Smart on e-NAM & MSP Windows',
    category: 'Market & Prices',
    readTimeMinutes: 3,
    summary:
      'Compare mandi arrivals, clean and grade produce on-farm, and lock assured MSP procurement rates without distress selling.',
    keyTakeaways: [
      'Cleaning & grading grain moisture to 12% eliminates 8–12% mandi quality deductions.',
      'Register free on eNAM portal to view transparent electronic bids across nearby mandis.',
      'Use e-NWR warehouse receipts to hold stock 2–3 months post-harvest when prices rebound.',
    ],
    steps: [
      'Check live mandi modal rates and arrival volumes before loading transport.',
      'Dry grain on tarpaulin to FAQ (Fair Average Quality) moisture norms.',
      'Bring Aadhaar, bank passbook, and sowing certificate for MSP procurement registration.',
    ],
    schemeOrTip: 'Clean dry produce typically earns ₹120–₹250/qtl higher at auction.',
    iconKey: 'trending',
  },
  {
    id: 'neem-ipm-spray',
    title: 'Making & Using Neem Seed Kernel Extract (NSKE 5%)',
    category: 'Plant Protection',
    readTimeMinutes: 4,
    summary:
      'Low-cost farm-made botanical spray that controls aphids, whiteflies, leaf folders, and early caterpillars without harming bees.',
    keyTakeaways: [
      'Costs under ₹80 per tank compared to ₹450+ for synthetic insecticides.',
      'Acts as an antifeedant and growth disruptor — insects stop feeding within hours.',
      'Safe for ladybird beetles, spiders, and honeybees when sprayed in late afternoon.',
    ],
    steps: [
      'Crush 5 kg dried neem seed kernels into coarse powder and tie in a muslin cloth.',
      'Soak overnight (12 hours) in 10 litres of water; squeeze cloth thoroughly to get milky extract.',
      'Mix with 90 litres water (total 100 L for 1 acre) and add 100 g mild soap flakes as sticker.',
      'Spray in late afternoon covering leaf undersides thoroughly.',
    ],
    schemeOrTip: 'Use fresh extract within 24 hours; never store mixed solution.',
    iconKey: 'shield',
  },
  {
    id: 'raised-bed-mulching',
    title: 'Raised Beds & Mulching for Monsoon Vegetables',
    category: 'Micro-Irrigation',
    readTimeMinutes: 3,
    summary:
      'Protect tomatoes, chillies, and cucurbits from root rot during heavy rain while cutting weeding labour in half.',
    keyTakeaways: [
      '20 cm raised beds keep active feeder roots oxygenated even after 80 mm downpours.',
      'Straw or 25-micron mulch cuts soil-borne early blight splash onto lower leaves.',
    ],
    steps: [
      'Shape 90 cm wide, 20 cm high beds with 40 cm drainage furrows between beds.',
      'Apply basal compost and DAP inside bed top before laying paddy straw or mulch sheet.',
      'Keep perimeter field drains open to farm pond or outlet.',
    ],
    schemeOrTip: 'Mulched beds retain moisture 4–5 days longer during dry spells.',
    iconKey: 'droplet',
  },
  {
    id: 'nadep-compost-pit',
    title: 'NADEP Aerobic Composting from Farm Waste',
    category: 'Organic Composting',
    readTimeMinutes: 4,
    summary:
      'Turn dry paddy straw, weeds, and 100 kg cow dung into 3 tonnes of nutrient-rich compost inside a ventilated brick tank.',
    keyTakeaways: [
      'Requires 10× less dung than traditional pits — ideal for farms with 1–2 cattle.',
      'Air holes along brick walls prevent foul smell and speed decomposition to 90 days.',
    ],
    steps: [
      'Build an above-ground 10×6×3 ft brick tank leaving 7-inch honeycomb air vents every third row.',
      'Fill in alternating layers: 15 cm chopped dry crop waste, cow-dung slurry sprinkle, and 5 cm clean topsoil.',
      'Seal the top dome with mud-dung plaster and moisten weekly through top vents.',
    ],
    schemeOrTip: 'Eligible for MGNREGA / State Organic Mission tank construction support.',
    iconKey: 'recycle',
  },
  {
    id: 'pheromone-sticky-traps',
    title: 'Using Sticky & Pheromone Traps for Early Pest Alerts',
    category: 'Plant Protection',
    readTimeMinutes: 3,
    summary:
      'Cut pesticide sprays by half using simple ₹40 yellow/blue sticky cards and funnel pheromone lures installed at canopy height.',
    keyTakeaways: [
      'Yellow sticky traps capture whiteflies, aphids, and jassids early; blue traps target thrips.',
      'Place 5 pheromone traps/acre to time sprays accurately instead of blind calendar spraying.',
    ],
    steps: [
      'Mount traps on bamboo stakes 15 cm above crop canopy starting 20 days after sowing.',
      'Count trapped moths every 3 days; act when catch crosses 4–5 moths/trap/night.',
      'Replace pheromone lure septa every 25–30 days for consistent attraction.',
    ],
    schemeOrTip: 'Keep traps away from field borders facing bright streetlamps.',
    iconKey: 'shield',
  },
];

export interface SamplePlantPhoto {
  id: string;
  label: string;
  cropName: string;
  imageUrl: string;
  hint: string;
}

export const SAMPLE_PLANT_PHOTOS: SamplePlantPhoto[] = [
  {
    id: 'tomato-blight',
    label: 'Tomato Leaf Spots',
    cropName: 'Tomato',
    imageUrl: '/src/assets/images/sample_tomato_blight_1795239879246.jpg',
    hint: 'Dark concentric brown rings with yellow halo on lower tomato leaves',
  },
  {
    id: 'paddy-blast',
    label: 'Paddy Leaf Lesions',
    cropName: 'Paddy (Rice)',
    imageUrl: '/src/assets/images/sample_paddy_spot_1795239880519.jpg',
    hint: 'Spindle-shaped grey-center lesions and yellow tips on paddy foliage',
  },
  {
    id: 'mustard-aphids',
    label: 'Mustard Stem Aphids',
    cropName: 'Mustard',
    imageUrl: '/src/assets/images/sample_mustard_aphids_1795239879862.jpg',
    hint: 'Clustered green-yellow insects on stem and curled mustard leaves',
  },
];

export const QUICK_ASSISTANT_PROMPTS = [
  'Best fertilizer for paddy?',
  'Yellow leaves on tomato',
  'How to improve clay soil?',
  'Organic remedy for aphids in mustard',
];

export const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
