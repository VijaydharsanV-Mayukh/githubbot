import { EmbedService } from './embed.service';
import { MappingService } from './mapping.service';
import { DiscordService } from './discord.service';
import { EmbedBuilder } from 'discord.js';
import { Colors } from '../utils/colors';

export class GitHubService {
  /**
   * Processes incoming GitHub Webhook event and dispatches embeds to mapped Discord channels
   */
  public static async processWebhook(eventType: string, payload: any): Promise<{ success: boolean; channelsNotified: number }> {
    const repoName = payload.repository?.full_name || payload.repository?.name;

    // Special handling for GitHub PING test event
    if (eventType === 'ping') {
      console.log(`🏓 Received GitHub ping event for repository: ${repoName || 'N/A'}`);
      if (repoName) {
        const mappings = await MappingService.getMappingsForRepo(repoName);
        if (mappings && mappings.length > 0) {
          const pingEmbed = new EmbedBuilder()
            .setColor(Colors.Push)
            .setTitle(`🏓 GitHub Webhook Connected Successfully!`)
            .setURL(payload.repository?.html_url || 'https://github.com')
            .setDescription(`**Zen Quote:** *"${payload.zen || 'Design for failure.'}"*\n\nWebhook integration for **[${repoName}](${payload.repository?.html_url})** is active and listening for events.`)
            .setTimestamp();

          let count = 0;
          for (const m of mappings) {
            const sent = await DiscordService.sendEmbed(m.channelId, [pingEmbed]);
            if (sent) count++;
          }
          return { success: true, channelsNotified: count };
        }
      }
      return { success: true, channelsNotified: 0 };
    }

    if (!repoName) {
      console.log(`⚠️ Received GitHub webhook ${eventType} without repository info`);
      return { success: false, channelsNotified: 0 };
    }

    // Look up channel mappings for this repo
    const mappings = await MappingService.getMappingsForRepo(repoName);
    if (!mappings || mappings.length === 0) {
      console.log(`ℹ️ No Discord channel mapped for repository: ${repoName}`);
      return { success: true, channelsNotified: 0 };
    }

    // Build event embed
    const embed = this.buildEmbedForEvent(eventType, payload);
    if (!embed) {
      console.log(`ℹ️ Event type ${eventType} ignored or unsupported`);
      return { success: true, channelsNotified: 0 };
    }

    let notifiedCount = 0;
    for (const mapping of mappings) {
      const sent = await DiscordService.sendEmbed(mapping.channelId, [embed]);
      if (sent) notifiedCount++;
    }

    return { success: true, channelsNotified: notifiedCount };
  }

  /**
   * Routes GitHub event type to specific EmbedService builders
   */
  private static buildEmbedForEvent(eventType: string, payload: any) {
    switch (eventType) {
      case 'push':
        return EmbedService.createPushEmbed(payload);
      case 'pull_request':
        return EmbedService.createPullRequestEmbed(payload);
      case 'pull_request_review':
        return EmbedService.createPullRequestReviewEmbed(payload);
      case 'issues':
        return EmbedService.createIssueEmbed(payload);
      case 'issue_comment':
        return EmbedService.createIssueCommentEmbed(payload);
      case 'release':
        return EmbedService.createReleaseEmbed(payload);
      case 'workflow_run':
        return EmbedService.createWorkflowRunEmbed(payload);
      case 'create':
      case 'delete':
      case 'fork':
      case 'watch':
        return EmbedService.createGenericEmbed(eventType, payload);
      default:
        return EmbedService.createGenericEmbed(eventType, payload);
    }
  }
}
