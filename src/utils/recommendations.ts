import type {
  Crop,
  CropRecommendation,
  FarmProfile,
  RecommenderFilters,
  SeasonType,
  StatusLevel,
} from '../types/agro';

export function getCurrentSeasonFromMonth(monthIndex: number): SeasonType {
  // monthIndex: 0 = Jan ... 11 = Dec
  if (monthIndex >= 5 && monthIndex <= 9) {
    return 'Kharif'; // Jun - Oct
  }
  if (monthIndex >= 10 || monthIndex <= 2) {
    return 'Rabi'; // Nov - Mar
  }
  return 'Zaid'; // Apr - May
}

export function scoreCropForFilters(
  crop: Crop,
  filters: RecommenderFilters
): CropRecommendation {
  let score = 36;
  const reasons: string[] = [];
  let cautionNote: string | undefined;

  // 1. Season alignment (+22 or -22)
  if (crop.seasons.includes(filters.season)) {
    score += 22;
    reasons.push(`Ideal sowing fit for ${filters.season} season (${crop.sowingWindow})`);
  } else {
    score -= 22;
    cautionNote = `Typically grown in ${crop.seasons.join(' / ')} rather than ${filters.season}.`;
  }

  // 2. Soil type fit (+14 or -10)
  const soilIdx = crop.soilTypes.indexOf(filters.soilType);
  if (soilIdx !== -1) {
    // Primary listed soils score slightly higher than secondary tolerated soils
    score += soilIdx === 0 ? 15 : soilIdx === 1 ? 13 : 11;
    reasons.push(`Thrives in ${filters.soilType} soil texture and drainage`);
  } else {
    score -= 10;
    if (!cautionNote) {
      cautionNote = `Prefers ${crop.soilTypes.slice(0, 2).join(' or ')} soil; amend ${filters.soilType} with organic matter.`;
    }
  }

  // 3. Soil pH fit (+12 centered / +8 edge / -14 out of range)
  if (filters.soilPh >= crop.phMin && filters.soilPh <= crop.phMax) {
    const phMid = (crop.phMin + crop.phMax) / 2;
    const proximity = Math.abs(filters.soilPh - phMid);
    score += proximity <= 0.35 ? 12 : 9;
    reasons.push(`Soil pH ${filters.soilPh.toFixed(1)} sits inside optimal ${crop.phMin}–${crop.phMax} range`);
  } else {
    const distance = Math.min(
      Math.abs(filters.soilPh - crop.phMin),
      Math.abs(filters.soilPh - crop.phMax)
    );
    if (distance <= 0.6) {
      score += 2;
      if (!cautionNote) {
        cautionNote = `pH ${filters.soilPh.toFixed(1)} is slightly outside ${crop.phMin}–${crop.phMax}; apply lime or gypsum as needed.`;
      }
    } else {
      score -= 14;
      cautionNote = `pH ${filters.soilPh.toFixed(1)} needs correction before sowing (optimal ${crop.phMin}–${crop.phMax}).`;
    }
  }

  // 4. Irrigation & water availability (+10 or -12)
  if (crop.irrigationFit.includes(filters.waterAvailability)) {
    score += crop.irrigationFit[0] === filters.waterAvailability ? 10 : 8;
    reasons.push(`Well suited to ${filters.waterAvailability} irrigation (${crop.waterRequirement} water need)`);
  } else if (filters.waterAvailability === 'Rainfed' && crop.waterRequirement === 'High') {
    score -= 15;
    cautionNote = `High water demand may face moisture stress under rainfed conditions.`;
  } else {
    score -= 5;
  }

  // 5. Primary goal match (+7)
  if (crop.goals.includes(filters.goal)) {
    score += crop.goals[0] === filters.goal ? 7 : 4;
    reasons.push(`Aligns with your "${filters.goal}" target`);
  }

  // 6. Budget compatibility (+4 or -5)
  const budgetRank = { Low: 1, Medium: 2, High: 3 };
  if (budgetRank[filters.budgetLevel] >= budgetRank[crop.budgetLevel]) {
    score += budgetRank[filters.budgetLevel] === budgetRank[crop.budgetLevel] ? 4 : 3;
  } else {
    score -= 5;
    if (!cautionNote) {
      cautionNote = `Requires ${crop.budgetLevel.toLowerCase()} input investment (~₹${crop.inputCostPerAcre.toLocaleString('en-IN')}/acre).`;
    }
  }

  // 7. Crop rotation synergy (+5 or -8)
  if (filters.previousCrop && filters.previousCrop !== 'None') {
    if (crop.goodPreviousCrops.includes(filters.previousCrop)) {
      score += 5;
      reasons.push(`Strong rotation after ${filters.previousCrop} — breaks pest cycles & balances nutrients`);
    } else if (crop.avoidPreviousCrops.includes(filters.previousCrop)) {
      score -= 8;
      cautionNote = `Avoid planting immediately after ${filters.previousCrop} to prevent soil nutrient depletion & disease carryover.`;
    }
  }

  // 8. Inherent crop management risk adjustment
  if (crop.riskLevel === 'Caution') {
    score -= 4;
  }

  // Clamp score between 25 and 98
  const clampedScore = Math.max(25, Math.min(98, Math.round(score)));

  let status: StatusLevel = 'Good';
  if (clampedScore < 65) {
    status = 'Risk';
  } else if (clampedScore < 80 || Boolean(cautionNote) || crop.riskLevel === 'Caution') {
    status = clampedScore >= 82 && !cautionNote && crop.riskLevel === 'Good' ? 'Good' : 'Caution';
  }

  // Guarantee at least 2 clear reasons for UI readability
  if (reasons.length === 0) {
    reasons.push(`Expected duration ${crop.durationDays} with ${crop.expectedYield} yield potential`);
  }

  return {
    crop,
    matchScore: clampedScore,
    status,
    reasons: reasons.slice(0, 3),
    cautionNote,
  };
}

export function getRecommendedCrops(
  crops: Crop[],
  filters: RecommenderFilters
): CropRecommendation[] {
  return crops
    .map((crop) => scoreCropForFilters(crop, filters))
    .sort((a, b) => b.matchScore - a.matchScore);
}

export function buildFiltersFromProfile(
  profile: FarmProfile,
  season: SeasonType
): RecommenderFilters {
  return {
    soilPh: profile.soilPh,
    soilType: profile.soilType,
    season,
    waterAvailability: profile.irrigation,
    budgetLevel: 'Medium',
    previousCrop: 'None',
    goal: profile.goal,
  };
}

export function toggleCompareCropSelection(
  currentIds: string[],
  cropId: string,
  maxItems = 3
): string[] {
  if (currentIds.includes(cropId)) {
    return currentIds.filter((id) => id !== cropId);
  }
  if (currentIds.length >= maxItems) {
    return [...currentIds.slice(1), cropId];
  }
  return [...currentIds, cropId];
}

export function calculateNetProfitPerAcre(crop: Crop): number {
  return crop.expectedReturnPerAcre - crop.inputCostPerAcre;
}

export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}
