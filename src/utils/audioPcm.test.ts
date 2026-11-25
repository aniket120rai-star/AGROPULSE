import test from 'node:test';
import assert from 'node:assert/strict';
import { base64ToFloat32Pcm, float32ToPcm16Base64 } from './audioPcm';

test('PCM16 base64 roundtrip preserves audio waveform within 16-bit quantization', () => {
  const input = new Float32Array([0, 0.5, -0.5, 1.0, -1.0, 1.5, -1.5]);
  const encoded = float32ToPcm16Base64(input);
  const decoded = base64ToFloat32Pcm(encoded);

  assert.equal(decoded.length, input.length);
  assert.ok(Math.abs(decoded[0] - 0) < 0.001);
  assert.ok(Math.abs(decoded[1] - 0.5) < 0.001);
  assert.ok(Math.abs(decoded[2] + 0.5) < 0.001);
  assert.ok(decoded[3] > 0.99 && decoded[3] <= 1.0);
  assert.ok(decoded[4] <= -0.99 && decoded[4] >= -1.0);
  // Values outside [-1, 1] are clamped safely
  assert.ok(decoded[5] > 0.99 && decoded[5] <= 1.0);
  assert.ok(decoded[6] <= -0.99 && decoded[6] >= -1.0);
});
