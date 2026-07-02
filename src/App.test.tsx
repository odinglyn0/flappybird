// SPDX-License-Identifier: WTFPL
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App, Game } from './App';

vi.mock('@tensorflow/tfjs', () => ({ setBackend: vi.fn(), ready: vi.fn() }));
vi.mock('@tensorflow/tfjs-backend-webgl', () => ({}));
vi.mock('@tensorflow-models/face-landmarks-detection', () => ({ SupportedModels: { MediaPipeFaceMesh: 'MediaPipeFaceMesh' }, createDetector: vi.fn() }));
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({ clearRect: vi.fn(), fillRect: vi.fn(), beginPath: vi.fn(), arc: vi.fn(), fill: vi.fn(), fillText: vi.fn(), set fillStyle(_: string) {}, set font(_: string) {} })) as never;

describe('App UI', () => {
  it('renders professional title and panels', () => { render(<App />); expect(screen.getByText(/Eye controlled Flappy Bird/i)).toBeInTheDocument(); expect(screen.getByText(/Browser eye input/i)).toBeInTheDocument(); expect(screen.getByText(/Safe model bootstrap/i)).toBeInTheDocument(); });
  it('renders accessible game canvas and reset button', () => { render(<Game gaze={0.5} />); expect(screen.getByLabelText(/Flappy Bird game board/i)).toBeInTheDocument(); expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument(); });
});
