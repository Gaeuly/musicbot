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
 * Command to move tracks within a playlist
 */
class MoveTracksCommand extends Command {
  constructor() {
    super({
      name: 'move-tracks',
      description: 'Move tracks within your playlist',
      usage: 'move-tracks <playlist-id> <from-position | range> <to-position>',
      aliases: ['playlist-move', 'move-track', 'move-in-playlist'],
      category: 'playlists',
      cooldown: 5,
      examples: [
        'move-tracks 1 3 1',           // Move track from position 3 to 1
        'move-tracks 2 1-3 5',         // Move tracks 1-3 to position 5
        'move-tracks 4 last 1'         // Move last track to position 1
      ]
    });
  }

  /**
   * Execute the move-tracks command
   * @param {object} options - Command options
   * @returns {Promise<void>}
   */
  async execute({ message, args }) {
    const { author } = message;

    if (args.length < 3) {
      const reply = embedManager.error(
        'Missing Arguments',
        `Please provide playlist ID, source position(s), and target position.\n\nUsage: \`${this.usage}\``
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
        'You can only modify your own playlists.'
      );
      return message.reply({ embeds: [reply] });
    }

    // Get the number of tracks in the playlist
    const trackCount = db.playlist.countPlaylistTracks(playlistId);
    if (trackCount === 0) {
      const reply = embedManager.error(
        'Empty Playlist',
        'This playlist is empty.'
      );
      return message.reply({ embeds: [reply] });
    }

    try {
      const fromArg = args[1].toLowerCase();
      const toArg = args[2].toLowerCase();
      
      // Process the 'to' position
      let toPosition;
      
      if (toArg === 'last') {
        toPosition = trackCount;
      } else {
        toPosition = parseInt(toArg);
        if (isNaN(toPosition) || toPosition < 1 || toPosition > trackCount) {
          const reply = embedManager.error(
            'Invalid Target Position',
            `Please provide a valid target position between 1 and ${trackCount}.`
          );
          return message.reply({ embeds: [reply] });
        }
      }
      
      // Process the 'from' position or range
      if (fromArg === 'last') {
        // Move last track
        const success = db.playlist.moveTrack(playlistId, trackCount, toPosition);
        
        if (success) {
          const reply = embedManager.success(
            'Track Moved',
            `Moved the last track to position ${toPosition} in playlist: **${playlist.name}**`
          );
          return message.reply({ embeds: [reply] });
        } else {
          throw new Error('Failed to move track');
        }
      } else if (fromArg.includes('-')) {
        // Move a range of tracks
        const [rangeStart, rangeEnd] = fromArg.split('-').map(p => parseInt(p));
        
        if (isNaN(rangeStart) || isNaN(rangeEnd) || 
            rangeStart < 1 || rangeEnd > trackCount || 
            rangeStart > rangeEnd) {
          const reply = embedManager.error(
            'Invalid Range',
            `Please provide a valid range between 1 and ${trackCount}.`
          );
          return message.reply({ embeds: [reply] });
        }
        
        // Check if target position is within the range
        if (toPosition >= rangeStart && toPosition <= rangeEnd) {
          const reply = embedManager.error(
            'Invalid Target',
            'The target position cannot be within the range of tracks being moved.'
          );
          return message.reply({ embeds: [reply] });
        }
        
        // Begin a transaction using the database instance from the playlist manager
        db.playlist.db.exec('BEGIN TRANSACTION;');
        
        try {
          // Extract tracks to move
          const tracks = db.playlist.getPlaylistTracks(playlistId)
            .filter(track => track.position >= rangeStart && track.position <= rangeEnd)
            .sort((a, b) => a.position - b.position);
          
          // Remove tracks from their current positions (in reverse to prevent position shifting)
          for (let i = rangeEnd; i >= rangeStart; i--) {
            db.playlist.deleteTrack(playlistId, i);
          }
          
          // Calculate insertion point
          let insertAt = toPosition;
          if (toPosition > rangeEnd) {
            // If inserting after the original positions, adjust for removed tracks
            insertAt -= (rangeEnd - rangeStart + 1);
          }
          
          // Add all tracks at the insertion point (in reverse order to maintain sequence)
          for (let i = tracks.length - 1; i >= 0; i--) {
            const track = tracks[i];
            
            // Add track and then move it to the correct position
            const trackObj = {
              title: track.title,
              author: track.author,
              uri: track.uri,
              thumbnail: track.thumbnail,
              length: track.length,
              source: track.source
            };
            
            // Add to end of playlist
            db.playlist.addTrack(playlistId, trackObj);
            
            // Get current max position
            const newPos = db.playlist.getMaxPosition(playlistId);
            
            // Move from end to target position
            db.playlist.moveTrack(playlistId, newPos, insertAt);
          }
          
          db.playlist.db.exec('COMMIT;');
          
          const reply = embedManager.success(
            'Tracks Moved',
            `Moved ${tracks.length} tracks (${rangeStart}-${rangeEnd}) to position ${toPosition} in playlist: **${playlist.name}**`
          );
          return message.reply({ embeds: [reply] });
        } catch (err) {
          db.playlist.db.exec('ROLLBACK;');
          throw err;
        }
      } else {
        // Move a single track
        const fromPosition = parseInt(fromArg);
        if (isNaN(fromPosition) || fromPosition < 1 || fromPosition > trackCount) {
          const reply = embedManager.error(
            'Invalid Source Position',
            `Please provide a valid source position between 1 and ${trackCount}.`
          );
          return message.reply({ embeds: [reply] });
        }
        
        if (fromPosition === toPosition) {
          const reply = embedManager.info(
            'No Change',
            'The track is already at the specified position.'
          );
          return message.reply({ embeds: [reply] });
        }
        
        const success = db.playlist.moveTrack(playlistId, fromPosition, toPosition);
        
        if (success) {
          const reply = embedManager.success(
            'Track Moved',
            `Moved track from position ${fromPosition} to position ${toPosition} in playlist: **${playlist.name}**`
          );
          return message.reply({ embeds: [reply] });
        } else {
          throw new Error('Failed to move track');
        }
      }
    } catch (error) {
      console.error('Error moving tracks in playlist:', error);
      const reply = embedManager.error(
        'Error',
        'An error occurred while moving tracks in your playlist. Please try again.'
      );
      return message.reply({ embeds: [reply] });
    }
  }
}

export default new MoveTracksCommand();
