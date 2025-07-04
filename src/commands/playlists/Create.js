/**
 * Muffin STUDIO - Bre4d777 & prayag 
 * https://discord.gg/TRPqseUq32
 * give credits or ill touch you in your dreams
 */

import { Command } from '../../structures/Command.js';
import { db } from '../../database/DatabaseManager.js';
import { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags, ButtonBuilder, ButtonStyle,ComponentType } from 'discord.js';

class CreatePlaylistCommand extends Command {
  constructor() {
    super({
      name: 'create-playlist',
      description: 'Create a new playlist',
      usage: 'create-playlist <name> ',
      aliases: ['createplaylist', 'newplaylist', 'playlist-create','create-pl'],
      category: 'playlists',
      cooldown: 5,
      examples: [
        'create-playlist My Favorites',
        'create-playlist Party Mix '
      ]
    });
  }

  createErrorContainer(title, description) {
    return new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`❌ **${title}**`)
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(description)
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(false).setSpacing(SeparatorSpacingSize.Small)
      );
  }

  createSuccessContainer(name, playlistId) {
    return new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`✅ **Playlist Created**`)
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`Created a new playlist: **${name}**`)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`Use \`add-to-playlist ${playlistId} <track>\` to add tracks to this playlist.`)
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(false).setSpacing(SeparatorSpacingSize.Small)
      )
      .addActionRowComponents(row =>
        row.setComponents(
          new ButtonBuilder()
            .setCustomId('view_playlists')
            .setLabel('View My Playlists')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('add_track_shortcut')
            .setLabel('Add Current Track')
            .setStyle(ButtonStyle.Secondary)
        )
      );
  }

  async execute({ message, args }) {
    const { author } = message;

    if (!args.length) {
      return message.reply({
        components: [this.createErrorContainer('Missing Playlist Name', `Please provide a name for your playlist.\n\nUsage: \`${this.usage}\``)],
        flags: MessageFlags.IsComponentsV2
      });
    }

    let name = args.join(' ');

    if (name.length < 3 || name.length > 50) {
      return message.reply({
        components: [this.createErrorContainer('Invalid Playlist Name', 'Playlist name must be between 3 and 50 characters long.')],
        flags: MessageFlags.IsComponentsV2
      });
    }

    const existingPlaylist = db.playlist.getPlaylistByName(author.id, name);
    if (existingPlaylist) {
      return message.reply({
        components: [this.createErrorContainer('Playlist Already Exists', `You already have a playlist named "${name}". Please choose a different name.`)],
        flags: MessageFlags.IsComponentsV2
      });
    }

    try {
      const playlistId = db.playlist.createPlaylist(name, author.id);

      const replyContainer = this.createSuccessContainer(name, playlistId);
      const sentReply = await message.reply({ components: [replyContainer], flags: MessageFlags.IsComponentsV2 });

      const collector = sentReply.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000
      });

      collector.on('collect', async (interaction) => {
        if (interaction.user.id !== author.id) {
          return interaction.reply({
            content: '🔒 Only the command author can interact with this.',
            ephemeral: true
          });
        }

        if (interaction.customId === 'view_playlists') {
          await interaction.deferUpdate();
          // Simulate calling the playlists command
          message.client.commands.get('playlists').execute({ message, args: [], client: message.client, musicManager: message.client.musicManager });
          await interaction.editReply({
            components: [this.createErrorContainer('Redirecting', 'Opening your playlists...')],
            flags: MessageFlags.IsComponentsV2
          });
          sentReply.delete().catch(() => {});
        } else if (interaction.customId === 'add_track_shortcut') {
          await interaction.deferUpdate();
          // Simulate calling the add-to-playlist command with current track
          message.client.commands.get('add-to-playlist').execute({ message, args: [playlistId.toString(), '--current'], client: message.client, musicManager: message.client.musicManager });
          await interaction.editReply({
            components: [this.createErrorContainer('Redirecting', 'Adding current track to your new playlist...')],
            flags: MessageFlags.IsComponentsV2
          });
          sentReply.delete().catch(() => {});
        }
      });

      collector.on('end', () => {
        if (sentReply.editable) {
          sentReply.edit({ components: [this.createErrorContainer('Session Expired', 'This interaction has expired. Please run the command again.')] }).catch(() => {});
        }
      });

    } catch (error) {
      console.error('Error creating playlist:', error);
      return message.reply({
        components: [this.createErrorContainer('Error', 'An error occurred while creating your playlist. Please try again.')],
        flags: MessageFlags.IsComponentsV2
      });
    }
  }
}

export default new CreatePlaylistCommand();
