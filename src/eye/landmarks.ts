// SPDX-License-Identifier: WTFPL
export type Landmark = { x: number; y: number; name?: string };

export function selectEyeLandmarks(points: Landmark[]) {
  return points.filter((point) => /eye|iris/i.test(point.name || ''));
}

export function normalizedEyeY(points: Landmark[], videoHeight: number) {
  const eyes = selectEyeLandmarks(points);
  if (!eyes.length || videoHeight <= 0) {
    return null;
  }

  const y = eyes.reduce((sum, point) => sum + point.y, 0) / eyes.length / videoHeight;
  return Math.min(1, Math.max(0, y));
}
