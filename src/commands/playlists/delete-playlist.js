/**
 * Muffin STUDIO - Bre4d777 & prayag 
 * https://discord.gg/TRPqseUq32
 * give credits or ill touch you in your dreams
 */

/**
 * Muffin STUDIO - Bre4d777& prayag 
 * https://discord.gg/TRPqseUq32
 * give credits or ill touch you in your dreams
 */
import { Command } from '../../structures/Command.js';
import { embedManager } from '../../managers/EmbedManager.js';
import { db } from '../../database/DatabaseManager.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

/**
 * Command to delete a playlist
 */
class DeletePlaylistCommand extends Command {
  constructor() {
    super({
      name: 'delete-playlist',
      description: 'Delete one of your playlists',
      usage: 'delete-playlist <playlist-id>',
      aliases: ['playlist-delete', 'removeplaylist', 'remove-playlist'],
      category: 'playlists',
      cooldown: 10,
      examples: [
        'delete-playlist 1',
        'delete-playlist 5'
      ]
    });
  }

  /**
   * Execute the delete-playlist command
   * @param {object} options - Command options
   * @returns {Promise<void>}
   */
  async execute({ message, args }) {
    const { author } = message;

    if (!args.length) {
      const reply = embedManager.error(
        'Missing Playlist ID',
        `Please provide the ID of the playlist you want to delete.\n\nUsage: \`${this.usage}\``
      );
      return message.reply({ embeds: [reply] });
    }

    const playlistId = parseInt(args[0]);
    if (isNaN(playlistId)) {
      const reply = embedManager.error(
        'Invalid Playlist ID',
        'Please provide a valid playlist ID.'
      );
      return message.reply({ embeds: [reply] });
    }

    // Check if playlist exists
    const playlist = db.playlist.getPlaylistById(playlistId);
    if (!playlist) {
      const reply = embedManager.error(
        'Playlist Not Found',
        `Could not find a playlist with ID ${playlistId}.`
      );
      return message.reply({ embeds: [reply] });
    }

    // Check if the playlist belongs to the user
    if (playlist.userId !== author.id) {
      const reply = embedManager.error(
        'Not Your Playlist',
        'You can only delete your own playlists.'
      );
      return message.reply({ embeds: [reply] });
    }

    try {
      // Create buttons for confirmation
      const confirmButton = new ButtonBuilder()
        .setCustomId('confirm_delete')
        .setLabel('Delete Playlist')
        .setStyle(ButtonStyle.Danger);

      const cancelButton = new ButtonBuilder()
        .setCustomId('cancel_delete')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary);

      const actionRow = new ActionRowBuilder()
        .addComponents(confirmButton, cancelButton);

      // Ask for confirmation with buttons
      const confirmMessage = await message.reply({ 
        embeds: [embedManager.warning(
          'Confirm Deletion',
          `Are you sure you want to delete the playlist **${playlist.name}**? ` +
          'This action cannot be undone.'
        )],
        components: [actionRow]
      });
      
      // Create button interaction collector
      const collector = confirmMessage.createMessageComponentCollector({ 
        filter: i => i.user.id === author.id,
        time: 30000, // 30 seconds timeout
        max: 1
      });
      
      collector.on('collect', async interaction => {
        if (interaction.customId === 'confirm_delete') {
          // User confirmed, delete the playlist
          const success = db.playlist.deletePlaylist(playlistId);
          
          if (success) {
            await interaction.update({ 
              embeds: [embedManager.success(
                'Playlist Deleted',
                `Successfully deleted playlist: **${playlist.name}**`
              )],
              components: [] // Remove buttons
            });
          } else {
            await interaction.update({ 
              embeds: [embedManager.error(
                'Error',
                'An error occurred while deleting the playlist. Please try again.'
              )],
              components: [] // Remove buttons
            });
          }
        } else {
          // User cancelled
          await interaction.update({ 
            embeds: [embedManager.info(
              'Deletion Cancelled',
              'Playlist deletion has been cancelled.'
            )],
            components: [] // Remove buttons
          });
        }
      });
      
      collector.on('end', async collected => {
        if (collected.size === 0) {
          // No response - timeout
          await confirmMessage.edit({ 
            embeds: [embedManager.info(
              'Deletion Cancelled',
              'Playlist deletion has been cancelled due to timeout.'
            )],
            components: [] // Remove buttons
          });
        }
      });
    } catch (error) {
      console.error('Error deleting playlist:', error);
      const reply = embedManager.error(
        'Error',
        'An error occurred while deleting your playlist. Please try again.'
      );
      return message.reply({ embeds: [reply] });
    }
  }
}

export default new DeletePlaylistCommand();
