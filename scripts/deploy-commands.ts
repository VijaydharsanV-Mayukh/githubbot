import { REST, Routes, SlashCommandBuilder, ChannelType } from 'discord.js';
import { env } from '../src/config/env';

const commands = [
  new SlashCommandBuilder()
    .setName('repo')
    .setDescription('Manage GitHub repository to Discord channel mappings')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('Add a new repository mapping')
        .addStringOption((option) =>
          option.setName('repository').setDescription('GitHub repository name (e.g. owner/repo)').setRequired(true)
        )
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription('Target Discord channel')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildNews, ChannelType.GuildForum)
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Remove an existing repository mapping')
        .addStringOption((option) =>
          option.setName('repository').setDescription('GitHub repository name (e.g. owner/repo)').setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('edit')
        .setDescription('Update channel for a repository mapping')
        .addStringOption((option) =>
          option.setName('repository').setDescription('GitHub repository name (e.g. owner/repo)').setRequired(true)
        )
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription('New target Discord channel')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildNews, ChannelType.GuildForum)
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('list').setDescription('List all configured repository mappings for this server')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('test')
        .setDescription('Send a test notification to verify setup')
        .addStringOption((option) =>
          option.setName('repository').setDescription('GitHub repository name (e.g. owner/repo)').setRequired(true)
        )
    ),
  new SlashCommandBuilder().setName('help').setDescription('Show GitHub Discord Bot help instructions'),
].map((command) => command.toJSON());

const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);

async function deployCommands() {
  try {
    console.log('🚀 Registering Discord slash commands globally...');

    await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), {
      body: commands,
    });

    console.log('✅ Successfully registered global slash commands!');
  } catch (error) {
    console.error('❌ Error registering slash commands:', error);
    process.exit(1);
  }
}

deployCommands();
