<!-- SPDX-License-Identifier: WTFPL -->

# Eye-Controlled Flappy Bird

A fully client-side React 19 + Vite Flappy Bird app controlled by webcam eye movement. The app loads TensorFlow.js in the browser, uses TF.js MediaPipe FaceMesh eye/iris landmarks for live control, and safely validates a local Hugging Face UniGaze `safetensors` checkpoint header from `public/models` without executing model code.

## Verified model/runtime choices

- **UniGaze**: Hugging Face and the official project describe UniGaze as a universal gaze-estimation model with released models for inference.
- **TensorFlow.js Face Landmarks Detection**: TensorFlow.js documents browser face landmark models, and the package provides real-time face landmark tracking suitable for webcam eye/iris control.
- **Safety boundary**: the safetensors bootstrap reads only the checkpoint header and never evaluates remote Python/model code in the browser.

## Quick start

```bash
npm install
npm run dev
```

Open the Vite URL, click **Start camera**, then look upward/blink upward to flap.

## Optional safetensors bootstrap

Download `unigaze_b16_joint.safetensors` from <https://huggingface.co/UniGaze/UniGaze-models> and place it at:

```text
public/models/unigaze_b16_joint.safetensors
```

The app will validate the local safetensors header and then continue to use TF.js eye landmarks for the CSR game input.

## Deploy on Railway

Yes: this is a Vite client-side app, so the deployable artifact is static files in `dist/` after `npm run build`. Railway can deploy that either with its static-site/Railpack support or with the included Dockerfile. This repo uses the explicit Dockerfile path so deployment is predictable: Node 24 builds the Vite app, then Caddy serves `dist/` with an SPA fallback to `index.html`.

### GitHub deployment

1. Create a Railway project and choose **Deploy from GitHub repo**.
2. Select this repository. Railway will detect `railway.json` and build with the included Dockerfile.
3. In Railway networking settings, generate a public domain.
4. Camera access requires HTTPS, so use the Railway-generated HTTPS domain or your own HTTPS custom domain.

### Railway CLI deployment

```bash
railway init
railway up
railway domain
```

No server-rendering process is required for the app itself; Caddy only serves the compiled static Vite assets.

## Quality gates

```bash
npm run typecheck
npm run test
npm run build
```

## License

WTFPL – Do What the Fuck You Want to Public License. See [LICENSE](./LICENSE).

### GitHub Actions Railway CI/CD

This repository includes GitHub Actions workflows for CI and Railway deployments:

- `.github/workflows/ci.yml` runs typechecking, tests, and a production build on pushes to `main` and on pull requests.
- `.github/workflows/railway-production.yml` deploys every push to `main` to the Railway production environment with `railway up --ci`.
- `.github/workflows/railway-pr-environments.yml` creates or reuses a Railway environment named `pr-<number>` for each same-repository pull request, deploys the PR there, comments with the preview environment/domain when available, and deletes the Railway environment when the PR closes.

Configure these GitHub secrets before enabling deployments:

| Secret                     | Purpose                                                                                                   |
| -------------------------- | --------------------------------------------------------------------------------------------------------- |
| `RAILWAY_PRODUCTION_TOKEN` | Railway project token scoped to the production environment; used only by the main-branch deploy workflow. |
| `RAILWAY_API_TOKEN`        | Railway account/workspace token that can create, duplicate, deploy, and delete PR environments.           |
| `RAILWAY_PROJECT_ID`       | Railway project ID for the app; used by the PR environment workflow to link the CLI non-interactively.    |

Optional GitHub Actions variables:

| Variable                         | Default      | Purpose                                                       |
| -------------------------------- | ------------ | ------------------------------------------------------------- |
| `RAILWAY_SERVICE`                | `flappybird` | Railway service name or ID to deploy.                         |
| `RAILWAY_PRODUCTION_ENVIRONMENT` | `production` | Environment used by the main-branch deployment.               |
| `RAILWAY_PR_BASE_ENVIRONMENT`    | `production` | Environment duplicated when creating PR preview environments. |

For security, the PR preview workflow only runs for pull requests from branches in the same repository, so Railway secrets are not exposed to untrusted forks.
