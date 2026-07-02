// SPDX-License-Identifier: WTFPL
export type Bird = { x: number; y: number; vy: number };
export type Pipe = { x: number; gap: number; scored?: boolean };
export type GameState = { bird: Bird; pipes: Pipe[]; frame: number; score: number; dead: boolean };
export const GAME = { width: 760, height: 460, gravity: 0.48, lift: -8.5, gap: 150, speed: 3.2, pipeWidth: 72, spawnEvery: 115 } as const;
export function createGameState(): GameState { return { bird: { x: 150, y: GAME.height / 2, vy: 0 }, pipes: [{ x: GAME.width, gap: 180 }], frame: 0, score: 0, dead: false }; }
export function shouldFlap(previousGaze: number, currentGaze: number, threshold = 0.012) { return currentGaze < previousGaze - threshold; }
export function nextPipeGap(random = Math.random) { return 80 + random() * (GAME.height - GAME.gap - 160); }
export function stepGame(state: GameState, flap: boolean, random = Math.random): GameState { const bird = { ...state.bird, vy: flap ? GAME.lift : state.bird.vy }; bird.vy += GAME.gravity; bird.y += bird.vy; const frame = state.frame + 1; let pipes = state.pipes.map(p => ({ ...p, x: p.x - GAME.speed })).filter(p => p.x > -GAME.pipeWidth); if (frame % GAME.spawnEvery === 0) pipes = [...pipes, { x: GAME.width + 20, gap: nextPipeGap(random) }]; let score = state.score; for (const pipe of pipes) { if (!pipe.scored && pipe.x + GAME.pipeWidth < bird.x) { pipe.scored = true; score += 1; } } const hitPipe = pipes.some(p => bird.x > p.x && bird.x < p.x + GAME.pipeWidth && (bird.y < p.gap || bird.y > p.gap + GAME.gap)); const dead = bird.y < 0 || bird.y > GAME.height || hitPipe; return { bird, pipes, frame, score, dead }; }
