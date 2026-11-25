import type { AssistantMode } from '../types/agro';

export interface ModelRouteConfig {
  mode: AssistantMode;
  model: 'gemini-3.1-flash-lite' | 'gemini-4-hydrogen';
  thinkingLevel: 'MINIMAL' | 'LOW' | 'HIGH' | 'XHIGH';
  label: string;
  shortDesc: string;
  systemRolePrompt: string;
}

export const ASSISTANT_ROUTES: Record<AssistantMode, ModelRouteConfig> = {
  fast: {
    mode: 'fast',
    model: 'gemini-3.1-flash-lite',
    thinkingLevel: 'MINIMAL',
    label: 'Quick Answer',
    shortDesc: 'Instant short tips · Flash Lite',
    systemRolePrompt:
      'Give a crisp, fast answer in 3-5 bullet points with direct dosages or immediate action steps.',
  },
  general: {
    mode: 'general',
    model: 'gemini-4-hydrogen',
    thinkingLevel: 'LOW',
    label: 'Field Advisor',
    shortDesc: 'Balanced daily guidance · Hydrogen',
    systemRolePrompt:
      'Provide clear, balanced step-by-step agricultural guidance covering timing, per-acre or per-litre rates, and practical precautions.',
  },
  complex: {
    mode: 'complex',
    model: 'gemini-4-hydrogen',
    thinkingLevel: 'HIGH',
    label: 'Crop & Soil Planner',
    shortDesc: 'Multi-factor field planning · Hydrogen High',
    systemRolePrompt:
      'Analyze interactions across soil pH, moisture, season, crop rotation, and input costs. Present structured options comparing organic and conventional practices.',
  },
  deep: {
    mode: 'deep',
    model: 'gemini-4-hydrogen',
    thinkingLevel: 'XHIGH',
    label: 'Deep Agronomy',
    shortDesc: 'Root-cause diagnostics & rotation · Hydrogen XHigh',
    systemRolePrompt:
      'Perform deep multi-step agronomic reasoning: examine root-cause soil/nutrient/pathogen interactions, long-term rotation trade-offs, contingency steps for weather risk, and safety intervals.',
  },
};

export function resolveAssistantRoute(mode?: string): ModelRouteConfig {
  if (mode === 'fast' || mode === 'general' || mode === 'complex' || mode === 'deep') {
    return ASSISTANT_ROUTES[mode];
  }
  return ASSISTANT_ROUTES.general;
}

export function inferRecommendedMode(prompt: string): AssistantMode {
  const lower = prompt.toLowerCase();
  if (
    lower.includes('compare') ||
    lower.includes('rotation') ||
    lower.includes('budget') ||
    lower.includes('soil health') ||
    lower.includes('root cause') ||
    lower.includes('plan')
  ) {
    return lower.length > 90 ? 'deep' : 'complex';
  }
  if (lower.length < 40) {
    return 'fast';
  }
  return 'general';
}
