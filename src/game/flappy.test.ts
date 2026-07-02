// SPDX-License-Identifier: WTFPL
import { describe, expect, it } from 'vitest';
import { createGameState, GAME, nextPipeGap, shouldFlap, stepGame } from './flappy';

describe('flappy game physics', () => {
  it('creates a centered living bird with initial pipe', () => {
    const state = createGameState();
    expect(state.bird).toEqual({ x: 150, y: GAME.height / 2, vy: 0 });
    expect(state.pipes).toHaveLength(1);
    expect(state.dead).toBe(false);
  });

  it('applies gravity when no flap is requested', () => {
    const state = stepGame(createGameState(), false);
    expect(state.bird.vy).toBeCloseTo(GAME.gravity);
    expect(state.bird.y).toBeCloseTo(GAME.height / 2 + GAME.gravity);
  });

  it('applies lift before gravity when flap is requested', () => {
    const state = stepGame(createGameState(), true);
    expect(state.bird.vy).toBeCloseTo(GAME.lift + GAME.gravity);
    expect(state.bird.y).toBeLessThan(GAME.height / 2);
  });

  it('moves pipes left and removes offscreen pipes', () => {
    const state = createGameState();
    state.pipes = [
      { x: -GAME.pipeWidth - 1, gap: 120 },
      { x: 100, gap: 120 },
    ];
    const next = stepGame(state, false);
    expect(next.pipes).toHaveLength(1);
    expect(next.pipes[0].x).toBeCloseTo(100 - GAME.speed);
  });

  it('spawns deterministic pipe gaps on schedule', () => {
    let state = createGameState();
    state.frame = GAME.spawnEvery - 1;
    state = stepGame(state, false, () => 0);
    expect(state.pipes.at(-1)?.gap).toBe(80);
  });

  it('scores once when a pipe passes the bird', () => {
    const state = createGameState();
    state.pipes = [{ x: 70, gap: 120 }];
    const next = stepGame(state, false);
    expect(next.score).toBe(1);
    const again = stepGame(next, false);
    expect(again.score).toBe(1);
  });

  it('dies on ceiling and floor bounds', () => {
    const top = createGameState();
    top.bird.y = -1;
    expect(stepGame(top, true).dead).toBe(true);

    const bottom = createGameState();
    bottom.bird.y = GAME.height + 1;
    expect(stepGame(bottom, false).dead).toBe(true);
  });

  it('dies on pipe collision outside the gap', () => {
    const state = createGameState();
    state.pipes = [{ x: 140, gap: 300 }];
    expect(stepGame(state, false).dead).toBe(true);
  });

  it('survives when passing through the pipe gap', () => {
    const state = createGameState();
    state.pipes = [{ x: 140, gap: 190 }];
    expect(stepGame(state, false).dead).toBe(false);
  });

  it('detects upward gaze deltas as flaps only past threshold', () => {
    expect(shouldFlap(0.5, 0.47)).toBe(true);
    expect(shouldFlap(0.5, 0.49)).toBe(false);
    expect(shouldFlap(0.4, 0.5)).toBe(false);
  });

  it('keeps generated pipe gaps inside playfield constraints', () => {
    expect(nextPipeGap(() => 0)).toBe(80);
    expect(nextPipeGap(() => 1)).toBe(GAME.height - GAME.gap - 80);
  });
});
