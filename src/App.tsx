// SPDX-License-Identifier: WTFPL
import { Camera, Eye, RotateCcw, Server } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createGameState, GAME, shouldFlap, stepGame, type GameState } from '@/game/flappy';
import { bootstrapSafeTensors, type BootstrapResult } from '@/model/safetensors';
import './index.css';

function useEyeController(active: boolean) {
  const [ready, setReady] = useState('Idle');
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    if (!active) {
      return;
    }

    let stop = false;
    let timer = 0;
    let stream: MediaStream | undefined;
    let socket: WebSocket | undefined;
    let video: HTMLVideoElement | undefined;
    const canvas = document.createElement('canvas');
    canvas.width = 224;
    canvas.height = 168;
    const ctx = canvas.getContext('2d', { alpha: false });

    const schedule = (delay: number) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(sendFrame, delay);
    };

    const sendFrame = () => {
      if (stop || !socket || socket.readyState !== WebSocket.OPEN || !video || !ctx) {
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob || stop || socket?.readyState !== WebSocket.OPEN) {
            return;
          }
          blob.arrayBuffer().then((buffer) => socket?.send(buffer));
        },
        'image/jpeg',
        0.52,
      );
    };

    (async () => {
      setReady('Starting…');
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 320, height: 240, frameRate: { ideal: 15, max: 20 } },
        audio: false,
      });

      video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;
      await video.play();

      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      socket = new WebSocket(`${protocol}://${window.location.host}/ws/gaze`);
      socket.binaryType = 'arraybuffer';

      socket.addEventListener('open', () => {
        setReady('Tracking');
        schedule(0);
      });

      socket.addEventListener('message', (event: MessageEvent<string>) => {
        const message = JSON.parse(event.data) as {
          type: string;
          blink?: boolean;
          nextFrameMs?: number;
        };
        if (message.type === 'gaze' && typeof message.blink === 'boolean') {
          setBlink(message.blink);
          schedule(message.nextFrameMs ?? 90);
        }
      });

      socket.addEventListener('close', () => {
        if (!stop) setReady('Disconnected');
      });
    })().catch(() => setReady('Unavailable'));

    return () => {
      stop = true;
      window.clearTimeout(timer);
      socket?.close();
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [active]);

  return { ready, blink };
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
    ctx.fillText('Blink to flap. Reset to retry.', 135, GAME.height / 2);
  }
}

export function Game({ blink }: { blink: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const blinkRef = useRef(blink);
  const [run, setRun] = useState(0);

  blinkRef.current = blink;

  const reset = useCallback(() => setRun((value) => value + 1), []);

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) {
      return;
    }

    let state = createGameState();
    let lastBlink = blinkRef.current;
    let raf = 0;

    const loop = () => {
      const currentBlink = blinkRef.current;
      state = stepGame(state, shouldFlap(lastBlink, currentBlink));
      lastBlink = currentBlink;
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
  const { ready, blink } = useEyeController(active);

  useEffect(() => {
    bootstrapSafeTensors()
      .then(setBoot)
      .catch((error: Error) =>
        setBoot({
          ok: false,
          status: `Safe model bootstrap unavailable: ${error.message}. Backend blink detection still starts from camera input.`,
        }),
      );
  }, []);

  return (
    <main className="app">
      <section>
        <p className="eyebrow">React 19 + Vite + shadcn-style UI + Magic UI glow</p>
        <h1 className="title">Blink controlled Flappy Bird</h1>
        <Card className="game-card">
          <Game blink={blink} />
        </Card>
      </section>
      <aside className="side">
        <Card className="panel">
          <h2>
            <Eye />
            Blink control
          </h2>
          <p className="status">{ready}</p>
          <Button onClick={() => setActive(true)} disabled={active} className="full">
            <Camera className="icon" />
            Start camera
          </Button>
        </Card>
        <Card className="panel">
          <h2>
            <Server />
            Backend blink
          </h2>
          <p className="muted">{boot.status}</p>
          <p className="tiny">
            Camera frames are sent as compact binary WebSocket messages to detect blinks; the feed is not shown.
          </p>
        </Card>
      </aside>
    </main>
  );
}
