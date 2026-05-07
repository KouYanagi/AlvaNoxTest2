require('dotenv').config();

const express = require('express');
const {
  Client,
  GatewayIntentBits,
  Events,
  REST,
  Routes,
  SlashCommandBuilder,
  MessageFlags
} = require('discord.js');

console.log('Node version:', process.version);

const token = process.env.DISCORD_TOKEN?.trim();
const clientId = process.env.CLIENT_ID?.trim();
const guildIdsText = process.env.GUILD_IDS?.trim();
const gasUrl = process.env.GAS_URL?.trim();
const port = process.env.PORT || 10000;

if (!token) throw new Error('DISCORD_TOKEN が未設定です');
if (!clientId) throw new Error('CLIENT_ID が未設定です');
if (!guildIdsText) throw new Error('GUILD_IDS が未設定です');
if (!gasUrl) throw new Error('GAS_URL が未設定です');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const commands = [
  new SlashCommandBuilder()
    .setName('落選確認')
    .setDescription('このチャンネルに紐づくキャストの落選者を確認します。')
    .toJSON()
];

const rest = new REST({ version: '10' }).setToken(token);

async function registerCommands() {
  const guildIds = guildIdsText
    .split(',')
    .map(id => id.trim())
    .filter(Boolean);

  console.log('登録対象ギルド:', guildIds);

  for (const guildId of guildIds) {
    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );

    console.log(`スラッシュコマンド登録完了: ${guildId}`);
  }
}

client.once(Events.ClientReady, async () => {
  console.log(`✅ Botログイン成功: ${client.user.tag}`);

  try {
    await registerCommands();
  } catch (err) {
    console.error('❌ スラッシュコマンド登録失敗');
    console.error(err);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== '落選確認') return;

  await interaction.deferReply({
    flags: MessageFlags.Ephemeral
  });

  try {
    const channelId = interaction.channelId;
    const url = `${gasUrl}?mode=lostCheck&channelId=${encodeURIComponent(channelId)}`;

    const res = await fetch(url);
    const data = await res.json();

    await interaction.editReply(data.message || '取得できませんでした。');
  } catch (err) {
    console.error('落選確認エラー:', err);

    await interaction.editReply(
      `落選確認でエラーが発生しました。\n${err.message}`
    );
  }
});

client.on('warn', msg => {
  console.warn('Discord Warn:', msg);
});

client.on('error', err => {
  console.error('Client Error:', err);
});

client.on('shardError', err => {
  console.error('Shard Error:', err);
});

process.on('unhandledRejection', err => {
  console.error('Unhandled Rejection:', err);
});

process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
});

console.log('Discordログイン開始');

client.login(token)
  .then(() => {
    console.log('login() resolved');
  })
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