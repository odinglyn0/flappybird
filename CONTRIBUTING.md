<!-- SPDX-License-Identifier: WTFPL -->

# Contributing

Thanks for helping make this browser toy better.

## Development

1. Install dependencies with `npm install`.
2. Run `npm run dev` for local development.
3. Add tests for gameplay, model bootstrap, and UI changes.
4. Run `npm run typecheck`, `npm run test`, and `npm run build` before opening a pull request.

## Principles

- Keep camera and model inference fully client-side.
- Do not execute untrusted model code from downloaded checkpoints.
- Prefer deterministic pure functions for game logic and test coverage.
