// SPDX-License-Identifier: WTFPL
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App, Game } from './App';

afterEach(() => {
  cleanup();
});

HTMLCanvasElement.prototype.getContext = vi.fn(
  () =>
    ({
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      fillText: vi.fn(),
      set fillStyle(_: string) {},
      set font(_: string) {},
    }) as never,
);

describe('App UI', () => {
  it('renders focused title and panels without a camera feed', () => {
    render(<App />);
    expect(screen.getByText(/Eye controlled Flappy Bird/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^Eye control$/i })).toBeInTheDocument();
    expect(screen.queryByText(/Backend gaze/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Camera preview/i)).not.toBeInTheDocument();
  });

  it('renders accessible game canvas and reset button', () => {
    render(<Game gaze={0.5} />);
    expect(screen.getByLabelText(/Flappy Bird game board/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
  });
});
