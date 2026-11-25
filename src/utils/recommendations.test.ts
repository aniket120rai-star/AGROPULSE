import test from 'node:test';
import assert from 'node:assert/strict';
import { CROPS_CATALOG } from '../data/agroData';
import {
  buildFiltersFromProfile,
  calculateNetProfitPerAcre,
  getCurrentSeasonFromMonth,
  getRecommendedCrops,
  scoreCropForFilters,
  toggleCompareCropSelection,
} from './recommendations';
import type { FarmProfile, RecommenderFilters } from '../types/agro';

test('getCurrentSeasonFromMonth maps months to Indian cropping seasons', () => {
  assert.equal(getCurrentSeasonFromMonth(10), 'Rabi'); // Nov
  assert.equal(getCurrentSeasonFromMonth(0), 'Rabi'); // Jan
  assert.equal(getCurrentSeasonFromMonth(6), 'Kharif'); // Jul
  assert.equal(getCurrentSeasonFromMonth(3), 'Zaid'); // Apr
});

test('scoreCropForFilters ranks Wheat and Mustard high for Kamrup Alluvial Rabi profile', () => {
  const filters: RecommenderFilters = {
    soilPh: 6.8,
    soilType: 'Alluvial',
    season: 'Rabi',
    waterAvailability: 'Canal',
    budgetLevel: 'Medium',
    previousCrop: 'Paddy (Rice)',
    goal: 'High Yield',
  };

  const ranked = getRecommendedCrops(CROPS_CATALOG, filters);
  assert.ok(ranked.length >= 6);
  const wheat = ranked.find((r) => r.crop.id === 'wheat');
  const mustard = ranked.find((r) => r.crop.id === 'mustard');
  const paddy = ranked.find((r) => r.crop.id === 'paddy-kharif');

  assert.ok(wheat && wheat.matchScore >= 90, `Expected Wheat >= 90, got ${wheat?.matchScore}`);
  assert.ok(mustard && mustard.matchScore >= 85, `Expected Mustard >= 85, got ${mustard?.matchScore}`);
  assert.ok(paddy && paddy.matchScore < wheat!.matchScore, 'Kharif paddy should score lower than Rabi wheat in Rabi');
});

test('pH out of range triggers caution or lowers score', () => {
  const wheatCrop = CROPS_CATALOG.find((c) => c.id === 'wheat')!;
  const optimal = scoreCropForFilters(wheatCrop, {
    soilPh: 6.8,
    soilType: 'Alluvial',
    season: 'Rabi',
    waterAvailability: 'Canal',
    budgetLevel: 'Medium',
    previousCrop: 'None',
    goal: 'High Yield',
  });
  const extremeAcid = scoreCropForFilters(wheatCrop, {
    soilPh: 4.5,
    soilType: 'Alluvial',
    season: 'Rabi',
    waterAvailability: 'Canal',
    budgetLevel: 'Medium',
    previousCrop: 'None',
    goal: 'High Yield',
  });

  assert.ok(extremeAcid.matchScore < optimal.matchScore);
  assert.ok(extremeAcid.cautionNote && extremeAcid.cautionNote.includes('pH'));
});

test('toggleCompareCropSelection caps comparison list at 3 crops and toggles cleanly', () => {
  let selected: string[] = [];
  selected = toggleCompareCropSelection(selected, 'wheat');
  selected = toggleCompareCropSelection(selected, 'mustard');
  selected = toggleCompareCropSelection(selected, 'potato');
  assert.deepEqual(selected, ['wheat', 'mustard', 'potato']);

  // Adding 4th rotates oldest out, keeping max 3
  selected = toggleCompareCropSelection(selected, 'chickpea');
  assert.equal(selected.length, 3);
  assert.deepEqual(selected, ['mustard', 'potato', 'chickpea']);

  // Removing existing crop
  selected = toggleCompareCropSelection(selected, 'potato');
  assert.deepEqual(selected, ['mustard', 'chickpea']);
});

test('buildFiltersFromProfile and calculateNetProfitPerAcre work accurately', () => {
  const profile: FarmProfile = {
    location: 'Ludhiana, Punjab',
    district: 'Ludhiana',
    state: 'Punjab',
    landSize: 5,
    landUnit: 'Acre',
    soilType: 'Loam',
    irrigation: 'Borewell',
    goal: 'Cash Crop',
    soilPh: 7.2,
    customized: true,
  };
  const filters = buildFiltersFromProfile(profile, 'Rabi');
  assert.equal(filters.soilType, 'Loam');
  assert.equal(filters.waterAvailability, 'Borewell');
  assert.equal(filters.goal, 'Cash Crop');

  const wheat = CROPS_CATALOG.find((c) => c.id === 'wheat')!;
  assert.equal(calculateNetProfitPerAcre(wheat), wheat.expectedReturnPerAcre - wheat.inputCostPerAcre);
});
