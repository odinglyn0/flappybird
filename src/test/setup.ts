// SPDX-License-Identifier: WTFPL
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

globalThis.fetch = vi.fn(async () =>
  Response.json({ safetensors: '/models/unigaze_b16_joint.safetensors' }),
) as typeof fetch;
