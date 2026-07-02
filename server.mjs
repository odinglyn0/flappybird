// SPDX-License-Identifier: WTFPL
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT || 8080);
const ROOT = join(process.cwd(), 'dist');
const MIME = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.ico', 'image/x-icon'],
]);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function createAdaptiveProcessor() {
  let lastY = 0.5;
  let targetFps = 12;

  return async function processFrame(frame) {
    const started = performance.now();

    // Backend-only video processing boundary: binary camera frames arrive here.
    // A production gaze model can decode `frame` and update `modelY`; the client
    // never receives or displays the camera feed.
    const signal = frame.length ? frame.readUInt8(Math.floor(frame.length / 2)) / 255 : lastY;
    const modelY = clamp(lastY * 0.82 + signal * 0.18, 0.05, 0.95);
    lastY = modelY;

    const latencyMs = performance.now() - started;
    if (latencyMs > 65) targetFps = Math.max(6, targetFps - 1);
    if (latencyMs < 28) targetFps = Math.min(18, targetFps + 0.5);

    return {
      type: 'gaze',
      eyeY: modelY,
      fps: Math.round(targetFps),
      nextFrameMs: Math.round(1000 / targetFps),
    };
  };
}

async function serveStatic(req, res) {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const requested = normalize(decodeURIComponent(url.pathname)).replace(/^\/+/, '');
  let file = join(ROOT, requested || 'index.html');

  if (!file.startsWith(ROOT) || !existsSync(file)) {
    file = join(ROOT, 'index.html');
  }

  try {
    const stat = await readFile(file).then((body) => body);
    res.writeHead(200, { 'content-type': MIME.get(extname(file)) || 'application/octet-stream' });
    res.end(stat);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}

const server = createServer(serveStatic);
const wss = new WebSocketServer({ server, path: '/ws/gaze' });

wss.on('connection', (socket) => {
  const processFrame = createAdaptiveProcessor();

  socket.on('message', async (data, isBinary) => {
    if (!isBinary) return;
    try {
      const result = await processFrame(Buffer.from(data));
      socket.send(JSON.stringify(result));
    } catch (error) {
      socket.send(JSON.stringify({ type: 'error', message: 'Tracking paused' }));
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`flappybird listening on ${PORT}`);
});
