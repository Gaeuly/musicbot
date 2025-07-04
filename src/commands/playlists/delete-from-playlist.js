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
 * Command to delete tracks from a playlist
 */
class DeleteFromPlaylistCommand extends Command {
  constructor() {
    super({
      name: 'delete-from-playlist',
      description: 'Delete one or more tracks from your playlist',
      usage: 'delete-from-playlist <playlist-id> <position | range>',
      aliases: ['remove-from-playlist', 'playlist-remove', 'playlist-delete'],
      category: 'playlists',
      cooldown: 5,
      examples: [
        'delete-from-playlist 1 3',
        'delete-from-playlist 2 1-5',
        'delete-from-playlist 3 last'
      ]
    });
  }

  /**
   * Execute the delete-from-playlist command
   * @param {object} options - Command options
   * @returns {Promise<void>}
   */
  async execute({ message, args }) {
    const { author } = message;

    if (args.length < 2) {
      const reply = embedManager.error(
        'Missing Arguments',
        `Please provide both playlist ID and track position(s).\n\nUsage: \`${this.usage}\``
      );
      return message.reply({ embeds: [reply] });
    }

    // Get the playlist ID
    const playlistId = parseInt(args[0]);
    if (isNaN(playlistId)) {
      const reply = embedManager.error(
        'Invalid Playlist ID',
        'Please provide a valid playlist ID.'
      );
      return message.reply({ embeds: [reply] });
    }

    // Check if playlist exists and belongs to the user
    const playlist = db.playlist.getPlaylistById(playlistId);
    if (!playlist) {
      const reply = embedManager.error(
        'Playlist Not Found',
        `Could not find a playlist with ID ${playlistId}.`
      );
      return message.reply({ embeds: [reply] });
    }

    if (playlist.userId !== author.id) {
      const reply = embedManager.error(
        'Not Your Playlist',
        'You can only delete tracks from your own playlists.'
      );
      return message.reply({ embeds: [reply] });
    }

    // Get the number of tracks in the playlist
    const trackCount = db.playlist.countPlaylistTracks(playlistId);
    if (trackCount === 0) {
      const reply = embedManager.error(
        'Empty Playlist',
        'This playlist is already empty.'
      );
      return message.reply({ embeds: [reply] });
    }

    try {
      const positionArg = args[1].toLowerCase();
      
      // Check if user wants to delete all tracks
      if (positionArg === 'all') {
        db.playlist.clearPlaylistTracks(playlistId);
        const reply = embedManager.success(
          'Tracks Removed',
          `Removed all tracks from playlist: **${playlist.name}**`
        );
        return message.reply({ embeds: [reply] });
      }
      
      // Check if user wants to delete the last track
      if (positionArg === 'last') {
        const success = db.playlist.deleteTrack(playlistId, trackCount);
        if (success) {
          const reply = embedManager.success(
            'Track Removed',
            `Removed the last track from playlist: **${playlist.name}**`
          );
          return message.reply({ embeds: [reply] });
        } else {
          throw new Error('Failed to remove track');
        }
      }
      
      // Check if this is a range (e.g., "1-5")
      if (positionArg.includes('-')) {
        const [start, end] = positionArg.split('-').map(p => parseInt(p));
        
        if (isNaN(start) || isNaN(end) || start < 1 || end > trackCount || start > end) {
          const reply = embedManager.error(
            'Invalid Range',
            `Please provide a valid range between 1 and ${trackCount}.`
          );
          return message.reply({ embeds: [reply] });
        }
        
        // Delete tracks in reverse order (from highest to lowest position)
        // to avoid position shifting issues
        let deletedCount = 0;
        db.playlist.db.exec('BEGIN TRANSACTION;');
        
        try {
          for (let pos = end; pos >= start; pos--) {
            const success = db.playlist.deleteTrack(playlistId, pos);
            if (success) {
              deletedCount++;
            }
          }
          
          db.playlist.db.exec('COMMIT;');
          
          const reply = embedManager.success(
            'Tracks Removed',
            `Removed ${deletedCount} tracks (positions ${start}-${end}) from playlist: **${playlist.name}**`
          );
          return message.reply({ embeds: [reply] });
        } catch (err) {
          db.playlist.db.exec('ROLLBACK;');
          throw err;
        }
      }
      
      // Otherwise, it's a single position
      const position = parseInt(positionArg);
      if (isNaN(position) || position < 1 || position > trackCount) {
        const reply = embedManager.error(
          'Invalid Position',
          `Please provide a valid position between 1 and ${trackCount}.`
        );
        return message.reply({ embeds: [reply] });
      }
      
      const success = db.playlist.deleteTrack(playlistId, position);
      if (success) {
        const reply = embedManager.success(
          'Track Removed',
          `Removed track at position ${position} from playlist: **${playlist.name}**`
        );
        return message.reply({ embeds: [reply] });
      } else {
        throw new Error('Failed to remove track');
      }
    } catch (error) {
      console.error('Error deleting tracks from playlist:', error);
      const reply = embedManager.error(
        'Error',
        'An error occurred while removing tracks from your playlist. Please try again.'
      );
      return message.reply({ embeds: [reply] });
    }
  }
}

export default new DeleteFromPlaylistCommand();
