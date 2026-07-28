import { Client, GatewayIntentBits } from 'discord.js';
import { env } from './config/env';
import { handleInteraction } from './events/interactionCreate';

export const discordClient = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

discordClient.once('ready', (c) => {
  console.log(`🤖 Logged into Discord as ${c.user.tag}!`);
});

discordClient.on('interactionCreate', (interaction) => {
  handleInteraction(interaction).catch((err) => {
    console.error('❌ Error handling Discord interaction:', err);
  });
});

export async function initDiscordClient(): Promise<void> {
  if (!env.DISCORD_TOKEN) return;
  try {
    await discordClient.login(env.DISCORD_TOKEN);
  } catch (error) {
    console.error('⚠️ Could not log into Discord Gateway client:', error);
  }
}
