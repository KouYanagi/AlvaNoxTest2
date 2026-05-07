require('dotenv').config();

const express = require('express');
const { Client, GatewayIntentBits, Events } = require('discord.js');

console.log('Node version:', process.version);

const token = process.env.DISCORD_TOKEN?.trim();
const port = process.env.PORT || 10000;

if (!token) throw new Error('DISCORD_TOKEN が未設定です');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once(Events.ClientReady, () => {
  console.log(`✅ Botログイン成功: ${client.user.tag}`);
});

client.on('debug', msg => console.log('Discord Debug:', msg));
client.on('warn', msg => console.warn('Discord Warn:', msg));
client.on('error', err => console.error('Client Error:', err));
client.on('shardError', err => console.error('Shard Error:', err));

console.log('Discordログイン開始');

client.login(token)
  .then(() => console.log('login() resolved'))
  .catch(err => {
    console.error('❌ login() failed');
    console.error(err);
  });

const app = express();

app.get('/', (req, res) => {
  res.send('ok');
});

app.listen(port, () => {
  console.log(`ヘルスチェックサーバー起動: port ${port}`);
});