import { Router, Request, Response } from 'express';
import { verifyKeyMiddleware, InteractionType, InteractionResponseType } from 'discord-interactions';
import { env } from '../config/env';
import { MappingService } from '../services/mapping.service';
import { EmbedService } from '../services/embed.service';
import { DiscordService } from '../services/discord.service';

const router = Router();

// Middleware to verify Discord interaction signatures if DISCORD_PUBLIC_KEY is provided
const verifyDiscordKey = env.DISCORD_PUBLIC_KEY
  ? verifyKeyMiddleware(env.DISCORD_PUBLIC_KEY)
  : (req: Request, res: Response, next: any) => next();

router.post('/interactions', verifyDiscordKey, async (req: Request, res: Response) => {
  const interaction = req.body;

  // Handle Discord PING check
  if (interaction.type === InteractionType.PING) {
    res.json({ type: InteractionResponseType.PONG });
    return;
  }

  // Handle Application Command (Slash Commands)
  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    const { name, options } = interaction.data;
    const guildId = interaction.guild_id;

    if (!guildId) {
      res.json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: '❌ Commands can only be used inside a Discord server (guild).' },
      });
      return;
    }

    if (name === 'repo') {
      const subcommand = options?.[0];
      const subName = subcommand?.name;
      const subOptions = subcommand?.options || [];

      const getOption = (optName: string) => subOptions.find((o: any) => o.name === optName)?.value;

      if (subName === 'add') {
        const repo = getOption('repository');
        const channelId = getOption('channel');

        // Respond instantly to Discord HTTP request
        res.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `✅ Mapped repository **${repo}** to channel <#${channelId}>!`,
          },
        });

        // Persist mapping asynchronously
        MappingService.addMapping(guildId, repo, channelId).catch((err) => {
          console.error(`❌ Failed to save mapping for ${repo}:`, err);
        });
        return;
      }

      if (subName === 'remove') {
        const repo = getOption('repository');

        MappingService.removeMapping(guildId, repo).then((removed) => {
          console.log(`Removed mapping for ${repo}: ${removed}`);
        });

        res.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `✅ Removed mapping for repository **${repo}**.`,
          },
        });
        return;
      }

      if (subName === 'edit') {
        const repo = getOption('repository');
        const channelId = getOption('channel');

        res.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `✏️ Updated mapping for repository **${repo}** to channel <#${channelId}>!`,
          },
        });

        MappingService.addMapping(guildId, repo, channelId).catch((err) => {
          console.error(`❌ Failed to edit mapping for ${repo}:`, err);
        });
        return;
      }

      if (subName === 'list') {
        const mappings = await MappingService.listGuildMappings(guildId);

        if (mappings.length === 0) {
          res.json({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: 'ℹ️ No repository mappings configured for this server yet. Use `/repo add` to add one!' },
          });
          return;
        }

        const lines = mappings.map((m) => `• **${m.repositoryName}** ➔ <#${m.channelId}>`).join('\n');

        res.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            embeds: [
              {
                title: '📋 Configured Repository Mappings',
                description: lines,
                color: 0x0969da,
                footer: { text: `Total: ${mappings.length} mapping(s)` },
              },
            ],
          },
        });
        return;
      }

      if (subName === 'test') {
        const repo = getOption('repository');
        const mappings = await MappingService.getMappingsForRepo(repo);

        if (!mappings || mappings.length === 0) {
          res.json({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: `⚠️ No mapping found for repository **${repo}**. Add it first using \`/repo add\`.` },
          });
          return;
        }

        // Respond instantly to Discord
        res.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: `🧪 Sending test notification for repository **${repo}**...` },
        });

        // Send test notification asynchronously
        const fakePushPayload = {
          ref: 'refs/heads/main',
          commits: [
            {
              id: 'a1b2c3d4e5f67890',
              message: 'Test notification commit from /repo test command',
              url: 'https://github.com',
              author: { username: 'test-user' },
              added: ['index.ts'],
              removed: [],
              modified: [],
            },
          ],
          head_commit: {
            id: 'a1b2c3d4e5f67890',
            message: 'Test notification commit',
            url: 'https://github.com',
            author: { username: 'test-user' },
          },
          repository: {
            full_name: repo,
            html_url: `https://github.com/${repo}`,
          },
          sender: {
            login: 'test-user',
            avatar_url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
            html_url: 'https://github.com',
          },
        };

        const embed = EmbedService.createPushEmbed(fakePushPayload);
        for (const m of mappings) {
          DiscordService.sendEmbed(m.channelId, [embed]).catch(console.error);
        }
        return;
      }
    }

    if (name === 'help') {
      res.json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          embeds: [
            {
              title: '🤖 GitHub Discord Bot Help',
              description: 'Use the following slash commands to manage your GitHub repository notifications:',
              fields: [
                { name: '/repo add', value: 'Add a mapping between a GitHub repo (`owner/repo`) and a Discord channel.' },
                { name: '/repo remove', value: 'Remove a repository mapping.' },
                { name: '/repo edit', value: 'Update the target channel for an existing repository.' },
                { name: '/repo list', value: 'List all repository mappings configured for this server.' },
                { name: '/repo test', value: 'Send a mock test notification to verify setup.' },
              ],
              color: 0x2da44e,
            },
          ],
        },
      });
      return;
    }
  }

  res.status(400).json({ error: 'Unknown interaction type' });
});

export default router;
