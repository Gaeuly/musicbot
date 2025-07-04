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

/**
 * Command to edit a playlist's name
 */
class EditPlaylistCommand extends Command {
  constructor() {
    super({
      name: 'edit-playlist',
      description: 'Edit a playlist\'s name',
      usage: 'edit-playlist <playlist-id> <new-name>',
      aliases: ['playlist-edit', 'rename-playlist', 'playlist-rename'],
      category: 'playlists',
      cooldown: 5,
      examples: [
        'edit-playlist 1 My New Awesome Playlist',
        'edit-playlist 3 Road Trip Songs'
      ]
    });
  }

  /**
   * Execute the edit-playlist command
   * @param {object} options - Command options
   * @returns {Promise<void>}
   */
  async execute({ message, args }) {
    const { author } = message;

    if (args.length < 2) {
      const reply = embedManager.error(
        'Missing Arguments',
        `Please provide both playlist ID and new name.\n\nUsage: \`${this.usage}\``
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
        'You can only edit your own playlists.'
      );
      return message.reply({ embeds: [reply] });
    }

    // Get new name from remaining arguments
    const newName = args.slice(1).join(' ');

    // Validate new playlist name
    if (newName.length < 3 || newName.length > 50) {
      const reply = embedManager.error(
        'Invalid Playlist Name',
        'Playlist name must be between 3 and 50 characters long.'
      );
      return message.reply({ embeds: [reply] });
    }

    // Check if the new name is different
    if (playlist.name === newName) {
      const reply = embedManager.info(
        'No Change',
        `The playlist is already named "${newName}".`
      );
      return message.reply({ embeds: [reply] });
    }

    // Check if user already has a playlist with the new name
    const existingPlaylist = db.playlist.getPlaylistByName(author.id, newName);
    if (existingPlaylist) {
      const reply = embedManager.error(
        'Playlist Name Taken',
        `You already have a playlist named "${newName}". Please choose a different name.`
      );
      return message.reply({ embeds: [reply] });
    }

    try {
      // Update the playlist name
      const success = db.playlist.updatePlaylist(playlistId, newName);
      
      if (success) {
        const reply = embedManager.success(
          'Playlist Renamed',
          `Successfully renamed playlist from **${playlist.name}** to **${newName}**`
        );
        return message.reply({ embeds: [reply] });
      } else {
        throw new Error('Failed to update playlist');
      }
    } catch (error) {
      console.error('Error editing playlist:', error);
      const reply = embedManager.error(
        'Error',
        'An error occurred while editing your playlist. Please try again.'
      );
      return message.reply({ embeds: [reply] });
    }
  }
}

export default new EditPlaylistCommand();
