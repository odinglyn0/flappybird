// SPDX-License-Identifier: WTFPL
import { describe, expect, it } from 'vitest';
import { normalizedEyeY, selectEyeLandmarks } from './landmarks';

describe('eye landmark utilities', () => {
  it('selects named eye and iris landmarks', () => {
    const points = [
      { x: 0, y: 10, name: 'leftEye' },
      { x: 0, y: 20, name: 'rightIris' },
      { x: 0, y: 30, name: 'nose' },
    ];
    expect(selectEyeLandmarks(points)).toHaveLength(2);
  });

  it('normalizes average eye y to video height', () => {
    expect(
      normalizedEyeY(
        [
          { x: 0, y: 25, name: 'leftEye' },
          { x: 0, y: 75, name: 'rightEye' },
        ],
        100,
      ),
    ).toBe(0.5);
  });

  it('clamps out-of-range landmarks', () => {
    expect(normalizedEyeY([{ x: 0, y: 999, name: 'iris' }], 100)).toBe(1);
    expect(normalizedEyeY([{ x: 0, y: -1, name: 'iris' }], 100)).toBe(0);
  });

  it('returns null without eye points or valid height', () => {
    expect(normalizedEyeY([{ x: 0, y: 1, name: 'nose' }], 100)).toBeNull();
    expect(normalizedEyeY([{ x: 0, y: 1, name: 'eye' }], 0)).toBeNull();
  });
});
