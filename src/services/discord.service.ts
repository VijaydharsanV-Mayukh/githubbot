import { REST, Routes, APIEmbed } from 'discord.js';
import { env } from '../config/env';

export class DiscordService {
  private static restClient = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);

  /**
   * Posts an array of Discord embeds to the target channel ID using Discord REST API
   */
  public static async sendEmbed(channelId: string, embeds: any[]): Promise<boolean> {
    try {
      const formattedEmbeds = embeds.map((embed) => (embed.toJSON ? embed.toJSON() : embed));

      await this.restClient.post(Routes.channelMessages(channelId), {
        body: {
          embeds: formattedEmbeds,
        },
      });

      console.log(`✅ Sent notification embed to Discord channel: ${channelId}`);
      return true;
    } catch (error: any) {
      console.error(`❌ Failed to send Discord embed to channel ${channelId}:`, error.message || error);
      return false;
    }
  }

  /**
   * Posts a raw text message to the target channel ID
   */
  public static async sendMessage(channelId: string, content: string): Promise<boolean> {
    try {
      await this.restClient.post(Routes.channelMessages(channelId), {
        body: { content },
      });
      return true;
    } catch (error: any) {
      console.error(`❌ Failed to send Discord message to channel ${channelId}:`, error.message || error);
      return false;
    }
  }
}
