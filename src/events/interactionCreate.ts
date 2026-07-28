import { Interaction } from 'discord.js';
import { MappingService } from '../services/mapping.service';
import { EmbedService } from '../services/embed.service';
import { DiscordService } from '../services/discord.service';

export async function handleInteraction(interaction: Interaction): Promise<void> {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, options, guildId } = interaction;

  if (!guildId) {
    await interaction.reply({ content: '❌ Commands can only be used inside a Discord server (guild).', ephemeral: true });
    return;
  }

  if (commandName === 'repo') {
    const subcommand = options.getSubcommand();

    if (subcommand === 'add') {
      const repo = options.getString('repository', true);
      const channel = options.getChannel('channel', true);

      await MappingService.addMapping(guildId, repo, channel.id);

      await interaction.reply({
        content: `✅ Mapped repository **${repo}** to channel <#${channel.id}>!`,
      });
      return;
    }

    if (subcommand === 'remove') {
      const repo = options.getString('repository', true);
      const removed = await MappingService.removeMapping(guildId, repo);

      await interaction.reply({
        content: removed
          ? `✅ Removed mapping for repository **${repo}**.`
          : `⚠️ Mapping for **${repo}** was not found.`,
      });
      return;
    }

    if (subcommand === 'edit') {
      const repo = options.getString('repository', true);
      const channel = options.getChannel('channel', true);

      await MappingService.addMapping(guildId, repo, channel.id);

      await interaction.reply({
        content: `✏️ Updated mapping for repository **${repo}** to channel <#${channel.id}>!`,
      });
      return;
    }

    if (subcommand === 'list') {
      const mappings = await MappingService.listGuildMappings(guildId);

      if (mappings.length === 0) {
        await interaction.reply({
          content: 'ℹ️ No repository mappings configured for this server yet. Use `/repo add` to add one!',
        });
        return;
      }

      const lines = mappings.map((m) => `• **${m.repositoryName}** ➔ <#${m.channelId}>`).join('\n');

      await interaction.reply({
        embeds: [
          {
            title: '📋 Configured Repository Mappings',
            description: lines,
            color: 0x0969da,
            footer: { text: `Total: ${mappings.length} mapping(s)` },
          },
        ],
      });
      return;
    }

    if (subcommand === 'test') {
      const repo = options.getString('repository', true);
      const mappings = await MappingService.getMappingsForRepo(repo);

      if (!mappings || mappings.length === 0) {
        await interaction.reply({
          content: `⚠️ No mapping found for repository **${repo}**. Add it first using \`/repo add\`.`,
        });
        return;
      }

      await interaction.deferReply();

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
        await DiscordService.sendEmbed(m.channelId, [embed]);
      }

      await interaction.editReply({
        content: `🧪 Test notification sent for repository **${repo}**!`,
      });
      return;
    }
  }

  if (commandName === 'help') {
    await interaction.reply({
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
    });
    return;
  }
}
