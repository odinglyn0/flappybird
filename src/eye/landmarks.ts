// SPDX-License-Identifier: WTFPL
export type Landmark = { x: number; y: number; name?: string };
export function selectEyeLandmarks(points: Landmark[]) { return points.filter(p => /eye|iris/i.test(p.name || '')); }
export function normalizedEyeY(points: Landmark[], videoHeight: number) { const eyes = selectEyeLandmarks(points); if (!eyes.length || videoHeight <= 0) return null; const y = eyes.reduce((sum, p) => sum + p.y, 0) / eyes.length / videoHeight; return Math.min(1, Math.max(0, y)); }
