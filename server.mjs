import { createServer } from 'node:http';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer } from 'ws';

const port = Number(process.env.PORT || 5173);
const vite = await createViteServer({ server: { middlewareMode: true, hmr: false } });
const httpServer = createServer((request, response) => vite.middlewares(request, response));
const webSockets = new WebSocketServer({ noServer: true });
const clients = new Map();

function send(client, message) {
  if (client.readyState === 1) client.send(JSON.stringify(message));
}

function updateControllerStatus() {
  const gameConnected = [...clients.values()].some((role) => role === 'game');
  for (const [client, role] of clients) {
    if (role === 'controller') send(client, { type: 'game-status', connected: gameConnected });
  }
}

httpServer.on('upgrade', (request, socket, head) => {
  if (request.url !== '/ws') { socket.destroy(); return; }
  webSockets.handleUpgrade(request, socket, head, (client) => webSockets.emit('connection', client, request));
});

webSockets.on('connection', (client) => {
  clients.set(client, 'unknown');
  client.on('message', (raw) => {
    try {
      const message = JSON.parse(raw.toString());
      if (message.type === 'register' && (message.role === 'game' || message.role === 'controller')) {
        clients.set(client, message.role);
        updateControllerStatus();
        return;
      }
      if (message.type !== 'input' || !['ArrowLeft', 'ArrowRight', 'Space', 'KeyX', 'KeyE'].includes(message.key)) return;
      for (const [other, role] of clients) {
        if (other !== client && role === 'game') send(other, { type: 'input', key: message.key, isDown: Boolean(message.isDown) });
      }
    } catch { /* Ignore malformed local messages. */ }
  });
  client.on('close', () => {
    clients.delete(client);
    updateControllerStatus();
  });
});

httpServer.listen(port, '0.0.0.0', () => {
  console.log(`Jeu:        http://localhost:${port}`);
  console.log(`Manette:    http://<IP-DE-L-ORDINATEUR>:${port}/controller.html`);
});