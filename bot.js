require('dotenv').config();

const express = require('express');
const WebSocket = require('ws');

const port = process.env.PORT || 10000;

console.log('Node version:', process.version);

console.log('WebSocket接続開始');

const ws = new WebSocket('wss://gateway.discord.gg/?v=10&encoding=json');

ws.on('open', () => {
  console.log('✅ WebSocket接続成功');
});

ws.on('message', data => {
  console.log('📩 Gateway message:', data.toString().slice(0, 200));
});

ws.on('error', err => {
  console.error('❌ WebSocket error');
  console.error(err);
});

ws.on('close', (code, reason) => {
  console.log('WebSocket closed:', code, reason.toString());
});

const app = express();

app.get('/', (req, res) => {
  res.send('ok');
});

app.listen(port, () => {
  console.log(`ヘルスチェックサーバー起動: port ${port}`);
});