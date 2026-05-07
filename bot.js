require('dotenv').config();

console.log('ENV CHECK', {
  hasToken: !!process.env.DISCORD_TOKEN,
  hasClientId: !!process.env.CLIENT_ID,
  hasGuildIds: !!process.env.GUILD_IDS,
  hasGasUrl: !!process.env.GAS_URL
});

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

const {
  DISCORD_TOKEN,
  CLIENT_ID,
  GUILD_IDS,
  GAS_URL,
  PORT
} = process.env;

if (!DISCORD_TOKEN) throw new Error('DISCORD_TOKEN が未設定です');
if (!CLIENT_ID) throw new Error('CLIENT_ID が未設定です');
if (!GUILD_IDS) throw new Error('GUILD_IDS が未設定です');
if (!GAS_URL) throw new Error('GAS_URL が未設定です');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const commands = [
  new SlashCommandBuilder()
    .setName('落選確認')
    .setDescription('このチャンネルに紐づくキャストの落選者を確認します。')
    .toJSON()
];

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

async function registerCommands() {
  const guildIds = GUILD_IDS
    .split(',')
    .map(id => id.trim())
    .filter(Boolean);

  console.log('登録対象ギルド:', guildIds);

  for (const guildId of guildIds) {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, guildId),
      { body: commands }
    );

    console.log(`スラッシュコマンド登録完了: ${guildId}`);
  }
}

client.once(Events.ClientReady, async () => {
  console.log(`✅ ログイン完了: ${client.user.tag}`);

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
    const url = `${GAS_URL}?mode=lostCheck&channelId=${encodeURIComponent(channelId)}`;

    console.log('GAS呼び出し:', url);

    const res = await fetch(url);
    const data = await res.json();

    await interaction.editReply(data.message || '取得できませんでした。');
  } catch (e) {
    console.error('落選確認エラー:', e);

    await interaction.editReply(
      `落選確認でエラーが発生しました。\n${e.message}`
    );
  }
});

client.on('error', err => {
  console.error('Client Error:', err);
});

process.on('unhandledRejection', err => {
  console.error('Unhandled Rejection:', err);
});

process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
});

// Render用ヘルスチェックサーバー
const app = express();
const port = PORT || 10000;

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Discord Bot is running',
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`ヘルスチェックサーバー起動: port ${port}`);
});

// Discordログイン
console.log('Discordログイン開始直前');

client.login(DISCORD_TOKEN)
  .then(() => {
    console.log('Discordログイン処理開始OK');
  })
  .catch(err => {
    console.error('❌ Discordログイン失敗');
    console.error(err);
  });