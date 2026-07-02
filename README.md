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

## Quality gates

```bash
npm run typecheck
npm run test
npm run build
```

## License

WTFPL – Do What the Fuck You Want to Public License. See [LICENSE](./LICENSE).
