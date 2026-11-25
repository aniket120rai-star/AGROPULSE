import test from 'node:test';
import assert from 'node:assert/strict';
import { inferRecommendedMode, resolveAssistantRoute } from './assistantRouting';

test('resolveAssistantRoute maps valid modes and falls back to general', () => {
  assert.equal(resolveAssistantRoute('fast').model, 'gemini-3.1-flash-lite');
  assert.equal(resolveAssistantRoute('fast').thinkingLevel, 'MINIMAL');

  assert.equal(resolveAssistantRoute('general').model, 'gemini-4-hydrogen');
  assert.equal(resolveAssistantRoute('general').thinkingLevel, 'LOW');

  assert.equal(resolveAssistantRoute('complex').model, 'gemini-4-hydrogen');
  assert.equal(resolveAssistantRoute('complex').thinkingLevel, 'HIGH');

  assert.equal(resolveAssistantRoute('deep').model, 'gemini-4-hydrogen');
  assert.equal(resolveAssistantRoute('deep').thinkingLevel, 'XHIGH');

  assert.equal(resolveAssistantRoute('unknown').mode, 'general');
});

test('inferRecommendedMode detects quick vs planning prompts', () => {
  assert.equal(inferRecommendedMode('Urea dose for wheat?'), 'fast');
  assert.equal(
    inferRecommendedMode('Compare Mustard and Potato crop rotation plan for alluvial soil'),
    'complex'
  );
  assert.equal(
    inferRecommendedMode(
      'Can you compare a full year Kharif to Rabi crop rotation budget and root cause analysis for yellowing leaves and low soil organic carbon?'
    ),
    'deep'
  );
});
