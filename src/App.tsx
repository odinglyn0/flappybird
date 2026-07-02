// SPDX-License-Identifier: WTFPL
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs';
import { Camera, Eye, RotateCcw, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { normalizedEyeY } from '@/eye/landmarks';
import { createGameState, GAME, shouldFlap, stepGame, type GameState } from '@/game/flappy';
import { bootstrapSafeTensors, type BootstrapResult } from '@/model/safetensors';
import './index.css';

function useEyeController(active: boolean) {
  const video = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState('Idle');
  const [eyeY, setEyeY] = useState(0.5);

  useEffect(() => {
    if (!active) {
      return;
    }

    let stop = false;
    let raf = 0;
    let stream: MediaStream | undefined;
    let faceDetector: faceLandmarksDetection.FaceLandmarksDetector | null = null;

    (async () => {
      setReady('Loading TensorFlow.js WebGL…');
      await tf.setBackend('webgl');
      await tf.ready();

      setReady('Requesting camera…');
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false,
      });

      if (video.current) {
        video.current.srcObject = stream;
        await video.current.play();
      }

      setReady('Loading TF.js MediaPipe FaceMesh eye landmarks…');
      faceDetector = await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        { runtime: 'tfjs', refineLandmarks: true, maxFaces: 1 },
      );
      setReady('Tracking eyes');

      const tick = async () => {
        if (stop || !video.current || !faceDetector) {
          return;
        }

        const faces = await faceDetector.estimateFaces(video.current, { flipHorizontal: true });
        const y = normalizedEyeY(faces[0]?.keypoints || [], video.current.videoHeight);
        if (y !== null) {
          setEyeY(y);
        }
        raf = requestAnimationFrame(tick);
      };

      tick();
    })().catch((error: Error) => setReady(`Camera/model error: ${error.message}`));

    return () => {
      stop = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((track) => track.stop());
      faceDetector?.dispose();
    };
  }, [active]);

  return { video, ready, eyeY };
}

function draw(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.clearRect(0, 0, GAME.width, GAME.height);
  ctx.fillStyle = '#7dd3fc';
  ctx.fillRect(0, 0, GAME.width, GAME.height);

  ctx.fillStyle = '#0f766e';
  state.pipes.forEach((pipe) => {
    ctx.fillRect(pipe.x, 0, GAME.pipeWidth, pipe.gap);
    ctx.fillRect(pipe.x, pipe.gap + GAME.gap, GAME.pipeWidth, GAME.height);
  });

  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.arc(state.bird.x, state.bird.y, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.arc(state.bird.x + 8, state.bird.y - 7, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#134e4a';
  ctx.fillRect(0, GAME.height - 28, GAME.width, 28);
  ctx.fillStyle = 'white';
  ctx.font = '700 24px system-ui';
  ctx.fillText(`Score ${state.score}`, 24, 38);

  if (state.dead) {
    ctx.fillStyle = 'rgba(7,17,31,.72)';
    ctx.fillRect(0, 0, GAME.width, GAME.height);
    ctx.fillStyle = 'white';
    ctx.font = '800 34px system-ui';
    ctx.fillText('Look up to flap. Reset to retry.', 115, GAME.height / 2);
  }
}

export function Game({ gaze }: { gaze: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const gazeRef = useRef(gaze);
  const [run, setRun] = useState(0);

  gazeRef.current = gaze;

  const reset = useCallback(() => setRun((value) => value + 1), []);

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) {
      return;
    }

    let state = createGameState();
    let lastGaze = gazeRef.current;
    let raf = 0;

    const loop = () => {
      const currentGaze = gazeRef.current;
      state = stepGame(state, shouldFlap(lastGaze, currentGaze));
      lastGaze = currentGaze;
      draw(ctx, state);
      if (!state.dead) {
        raf = requestAnimationFrame(loop);
      }
    };

    loop();
    return () => cancelAnimationFrame(raf);
  }, [run]);

  return (
    <>
      <canvas
        aria-label="Flappy Bird game board"
        ref={canvas}
        width={GAME.width}
        height={GAME.height}
        className="game-canvas"
      />
      <Button onClick={reset} variant="secondary">
        <RotateCcw className="icon" />
        Reset
      </Button>
    </>
  );
}

export function App() {
  const [active, setActive] = useState(false);
  const [boot, setBoot] = useState<BootstrapResult>({
    ok: false,
    status: 'Checking public safetensors…',
  });
  const { video, ready, eyeY } = useEyeController(active);

  useEffect(() => {
    bootstrapSafeTensors()
      .then(setBoot)
      .catch((error: Error) =>
        setBoot({
          ok: false,
          status: `Safe model bootstrap unavailable: ${error.message}. Using TF.js eye-landmark fallback.`,
        }),
      );
  }, []);

  return (
    <main className="app">
      <section>
        <p className="eyebrow">React 19 + Vite + shadcn-style UI + Magic UI glow</p>
        <h1 className="title">Eye controlled Flappy Bird</h1>
        <Card className="game-card">
          <Game gaze={eyeY} />
        </Card>
      </section>
      <aside className="side">
        <Card className="panel">
          <h2>
            <Eye />
            Browser eye input
          </h2>
          <video
            ref={video}
            muted
            playsInline
            className="camera"
            aria-label="Camera preview for eye tracking"
          />
          <p className="status">{ready}</p>
          <Button onClick={() => setActive(true)} disabled={active} className="full">
            <Camera className="icon" />
            Start camera
          </Button>
        </Card>
        <Card className="panel">
          <h2>
            <ShieldCheck />
            Safe model bootstrap
          </h2>
          <p className="muted">{boot.status}</p>
          <p className="tiny">
            Verified target: UniGaze Hugging Face safetensors checkpoint. Runtime gameplay input
            remains client-only through TensorFlow.js eye landmarks.
          </p>
        </Card>
      </aside>
    </main>
  );
}
