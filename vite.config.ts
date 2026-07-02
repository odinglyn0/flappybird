// SPDX-License-Identifier: WTFPL
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { WebSocketServer } from 'ws';
import { defineConfig, type Plugin } from 'vite';

function backendGazePlugin(): Plugin {
  return {
    name: 'backend-gaze-websocket',
    configureServer(server) {
      const wss = new WebSocketServer({ noServer: true });

      server.httpServer?.on('upgrade', (request, socket, head) => {
        if (!request.url?.startsWith('/ws/gaze')) return;
        wss.handleUpgrade(request, socket, head, (client) => wss.emit('connection', client));
      });

      wss.on('connection', (socket) => {
        let eyeY = 0.5;
        let fps = 12;

        socket.on('message', (data, isBinary) => {
          if (!isBinary) return;
          const started = performance.now();
          const frame = Buffer.from(data as Buffer);
          const signal = frame.length ? frame.readUInt8(Math.floor(frame.length / 2)) / 255 : eyeY;
          eyeY = Math.min(0.95, Math.max(0.05, eyeY * 0.82 + signal * 0.18));
          const latencyMs = performance.now() - started;
          if (latencyMs > 65) fps = Math.max(6, fps - 1);
          if (latencyMs < 28) fps = Math.min(18, fps + 0.5);
          socket.send(
            JSON.stringify({
              type: 'gaze',
              eyeY,
              fps: Math.round(fps),
              nextFrameMs: Math.round(1000 / fps),
            }),
          );
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), backendGazePlugin()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
});
