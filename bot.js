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

async function testDiscordApi() {
  console.log('Discord API疎通確認開始');

  const res = await fetch('https://discord.com/api/v10/gateway/bot', {
    headers: {
      Authorization: `Bot ${token}`
    }
  });

  console.log('Discord API status:', res.status);

  const text = await res.text();
  console.log('Discord API response:', text.slice(0, 300));
}

console.log('Discordログイン開始');

testDiscordApi()
  .then(() => {
    console.log('Discord API疎通確認OK');
    return client.login(token);
  })
  .then(() => {
    console.log('login() resolved');
  })
  .catch(err => {
    console.error('❌ Discord接続失敗');
    console.error(err);
  });

const app = express();

app.get('/', (req, res) => {
  res.send('ok');
});

app.listen(port, () => {
  console.log(`ヘルスチェックサーバー起動: port ${port}`);
});