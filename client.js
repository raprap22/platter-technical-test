const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
  console.log('Connected to WebSocket server');
});

ws.on('message', (data) => {
  console.log('Notification received:', data);
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});
