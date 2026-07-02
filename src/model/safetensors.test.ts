// SPDX-License-Identifier: WTFPL
import { describe, expect, it, vi } from 'vitest';
import { bootstrapSafeTensors, parseSafeTensorsHeader } from './safetensors';

function fileFor(header: object) {
  const bytes = new TextEncoder().encode(JSON.stringify(header));
  const output = new ArrayBuffer(8 + bytes.length);
  new DataView(output).setBigUint64(0, BigInt(bytes.length), true);
  new Uint8Array(output, 8).set(bytes);
  return output;
}

const manifest = {
  name: 'm',
  source: 'https://huggingface.co/UniGaze/UniGaze-models',
  recommendedFile: 'unigaze_b16_joint.safetensors',
  localPath: '/models/unigaze_b16_joint.safetensors',
  note: 'n',
};

describe('safetensors bootstrap', () => {
  it('parses valid safetensors headers', () => {
    expect(
      parseSafeTensorsHeader(fileFor({ weight: { dtype: 'F32', shape: [1], data_offsets: [0, 4] } })),
    ).toHaveProperty('weight');
  });

  it('rejects tiny files', () => {
    expect(() => parseSafeTensorsHeader(new ArrayBuffer(1))).toThrow(/too small/);
  });

  it('rejects impossible header lengths', () => {
    const buffer = new ArrayBuffer(16);
    new DataView(buffer).setBigUint64(0, 999n, true);
    expect(() => parseSafeTensorsHeader(buffer)).toThrow(/header length/);
  });

  it('rejects array headers', () => {
    expect(() => parseSafeTensorsHeader(fileFor([]))).toThrow(/invalid/);
  });

  it('reports validated tensor names', async () => {
    const fetcher = vi.fn(async (url: string) =>
      url.endsWith('.json')
        ? Response.json(manifest)
        : new Response(fileFor({ a: {}, __metadata__: {} }), { status: 206 }),
    );
    const result = await bootstrapSafeTensors(fetcher as unknown as typeof fetch);
    expect(result.ok).toBe(true);
    expect(result.tensors).toEqual(['a']);
  });

  it('falls back cleanly when checkpoint is absent', async () => {
    const fetcher = vi.fn(async (url: string) =>
      url.endsWith('.json') ? Response.json(manifest) : new Response('missing', { status: 404 }),
    );
    const result = await bootstrapSafeTensors(fetcher as unknown as typeof fetch);
    expect(result.ok).toBe(false);
    expect(result.status).toContain('Using TF.js eye-landmark fallback');
  });
});
