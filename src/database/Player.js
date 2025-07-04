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
import { Database } from './Database.js';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

/**
 * Player Database for storing player states for recovery
 */
export class Player extends Database {
  /**
   * Create a new PlayerDatabase instance
   */
  constructor() {
    super(config.database.player);
    this.initTable();
  }

  /**
   * Initialize the players table and track history table
   */
  initTable() {
    this.exec(`
      CREATE TABLE IF NOT EXISTS players (
        guild_id TEXT PRIMARY KEY,
        voice_channel_id TEXT NOT NULL,
        text_channel_id TEXT NOT NULL,
        volume INTEGER DEFAULT 100,
        loop_mode TEXT DEFAULT 'none',
        paused BOOLEAN DEFAULT FALSE,
        current_track TEXT DEFAULT NULL,
        queue TEXT DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create a new table for track history
    this.exec(`
      CREATE TABLE IF NOT EXISTS track_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        track_data TEXT NOT NULL,
        played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (guild_id) REFERENCES players(guild_id) ON DELETE CASCADE
      )
    `);

    logger.info('PlayerDatabase', 'Player and track history tables initialized');
  }

  /**
   * Get a player from the database
   * @param {string} guildId - The guild ID
   * @returns {object|null} - Player data or null if not found
   */
  getPlayer(guildId) {
    return this.get('SELECT * FROM players WHERE guild_id = ?', [guildId]);
  }

  /**
   * Create a new player in the database
   * @param {object} data - Player data
   * @returns {object} - Statement result
   */
  createPlayer(data) {
    const {
      guildId,
      voiceChannelId,
      textChannelId,
      volume = 100,
      loopMode = 'none',
      paused = false,
      currentTrack = null,
      queue = []
    } = data;

    return this.exec(`
      INSERT INTO players (
        guild_id, voice_channel_id, text_channel_id,
        volume, loop_mode, paused,
        current_track, queue
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(guild_id) DO UPDATE SET
        voice_channel_id = excluded.voice_channel_id,
        text_channel_id = excluded.text_channel_id,
        volume = excluded.volume,
        loop_mode = excluded.loop_mode,
        paused = excluded.paused,
        current_track = excluded.current_track,
        queue = excluded.queue,
        updated_at = CURRENT_TIMESTAMP
    `, [
      guildId,
      voiceChannelId,
      textChannelId,
      volume,
      loopMode,
      paused ? 1 : 0,
      currentTrack ? JSON.stringify(currentTrack) : null,
      JSON.stringify(queue)
    ]);
  }

  /**
   * Update a player in the database
   * @param {string} guildId - The guild ID
   * @param {object} data - The data to update
   * @returns {object} - Statement result
   */
  updatePlayer(guildId, data) {
    const player = this.getPlayer(guildId);

    if (!player) {
      return null;
    }

    // Build the update query dynamically
    const keys = Object.keys(data).filter(key =>
      ['voice_channel_id', 'text_channel_id', 'volume', 'loop_mode', 'paused', 'current_track', 'queue'].includes(key)
    );

    if (keys.length === 0) return null;

    const setClause = keys.map(key => {
      if (key === 'current_track' || key === 'queue') {
        return `${key} = ?`;
      }
      return `${key} = ?`;
    }).join(', ');

    const values = keys.map(key => {
      if (key === 'current_track') {
        return data[key] ? JSON.stringify(data[key]) : null;
      }
      if (key === 'queue') {
        return JSON.stringify(data[key] || []);
      }
      if (key === 'paused') {
        return data[key] ? 1 : 0;
      }
      return data[key];
    });

    values.push(guildId); // For the WHERE clause

    return this.exec(
      `UPDATE players SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE guild_id = ?`,
      values
    );
  }

  /**
   * Update a player's queue
   * @param {string} guildId - The guild ID
   * @param {Array} queue - The new queue
   * @returns {object} - Statement result
   */
  updateQueue(guildId, queue) {
    const player = this.getPlayer(guildId);

    if (!player) {
      return null;
    }

    return this.exec(
      'UPDATE players SET queue = ?, updated_at = CURRENT_TIMESTAMP WHERE guild_id = ?',
      [JSON.stringify(queue), guildId]
    );
  }

  /**
   * Update a player's current track
   * @param {string} guildId - The guild ID
   * @param {object|null} track - The current track or null if none
   * @returns {object} - Statement result
   */
  updateCurrentTrack(guildId, track) {
    const player = this.getPlayer(guildId);

    if (!player) {
      return null;
    }

    return this.exec(
      'UPDATE players SET current_track = ?, updated_at = CURRENT_TIMESTAMP WHERE guild_id = ?',
      [track ? JSON.stringify(track) : null, guildId]
    );
  }

  /**
   * Delete a player from the database
   * @param {string} guildId - The guild ID
   * @returns {object} - Statement result
   */
  deletePlayer(guildId) {
    return this.exec('DELETE FROM players WHERE guild_id = ?', [guildId]);
  }

  /**
   * Get all players in the database
   * @returns {object[]} - All players
   */
  getAllPlayers() {
    return this.all('SELECT * FROM players');
  }

  /**
   * Add a track to history
   * @param {string} guildId - The guild ID
   * @param {object} trackData - The track data to store
   * @returns {boolean} - Whether the operation was successful
   */
  addTrackToHistory(guildId, trackData) {
    try {
      // Make sure the guild exists in players table (needed for foreign key constraint)
      const player = this.getPlayer(guildId);
      if (!player) {
        // Create a minimal player entry if none exists
        this.createPlayer({
          guildId: guildId,
          voiceChannelId: trackData.voiceChannelId || 'unknown',
          textChannelId: trackData.textChannelId || 'unknown'
        });
      }

      // Check if this track is already the most recent one in history
      const recentTrack = this.get(
        "SELECT id, track_data FROM track_history WHERE guild_id = ? ORDER BY played_at DESC LIMIT 1",
        [guildId]
      );

      if (recentTrack) {
        try {
          const recentTrackData = JSON.parse(recentTrack.track_data);
          // If this track has the same URI as the most recent track, don't add it again
          if (recentTrackData.uri === trackData.uri) {
            logger.debug('PlayerDatabase', `Skipping duplicate recent track "${trackData.title}" for guild ${guildId}`);
            return true;
          }
        } catch (parseError) {
          // If we can't parse it, continue with adding the new track
          logger.error('PlayerDatabase', 'Failed to parse recent track data', parseError);
        }
      }

      // Add to track history
      this.exec(
        'INSERT INTO track_history (guild_id, track_data) VALUES (?, ?)',
        [guildId, JSON.stringify(trackData)]
      );

      // Limit history to 20 tracks per guild (delete oldest tracks)
      this.exec(`
        DELETE FROM track_history
        WHERE id IN (
          SELECT id FROM track_history
          WHERE guild_id = ?
          ORDER BY played_at DESC
          LIMIT -1 OFFSET 20
        )
      `, [guildId]);

      return true;
    } catch (error) {
      logger.error('PlayerDatabase', `Failed to add track to history for guild ${guildId}`, error);
      return false;
    }
  }

  /**
   * Get track history for a guild
   * @param {string} guildId - The guild ID
   * @param {number} limit - Max number of tracks to retrieve (default 20)
   * @returns {Array} - Array of track data objects
   */
  getTrackHistory(guildId, limit = 20) {
    try {
      const history = this.all(
        'SELECT track_data FROM track_history WHERE guild_id = ? ORDER BY played_at DESC LIMIT ?',
        [guildId, limit]
      );

      return history.map(item => {
        try {
          return JSON.parse(item.track_data);
        } catch (parseError) {
          logger.error('PlayerDatabase', 'Failed to parse track history data', parseError);
          return null;
        }
      }).filter(Boolean); // Remove any null entries
    } catch (error) {
      logger.error('PlayerDatabase', `Failed to get track history for guild ${guildId}`, error);
      return [];
    }
  }

  /**
   * Remove the most recent track from history and return it
   * @param {string} guildId - The guild ID
   * @returns {object|null} - The most recent track or null if not found
   */
  getAndRemoveMostRecentTrack(guildId) {
    try {
      // Get the transaction lock
      this.db.prepare('BEGIN TRANSACTION').run();

      // Get the most recent track
      const mostRecent = this.get(
        'SELECT id, track_data FROM track_history WHERE guild_id = ? ORDER BY played_at DESC LIMIT 1',
        [guildId]
      );

      if (!mostRecent) {
        // Release the transaction lock
        this.db.prepare('ROLLBACK').run();
        return null;
      }

      // Delete the track from history
      this.exec('DELETE FROM track_history WHERE id = ?', [mostRecent.id]);

      // Commit the transaction
      this.db.prepare('COMMIT').run();

      // Parse and return the track data
      return JSON.parse(mostRecent.track_data);
    } catch (error) {
      // Release the transaction lock on error
      try {
        this.db.prepare('ROLLBACK').run();
      } catch (rollbackError) {
        // Ignore rollback errors
      }

      logger.error('PlayerDatabase', `Failed to get and remove recent track for guild ${guildId}`, error);
      return null;
    }
  }

  /**
   * Clear the track history for a guild
   * @param {string} guildId - The guild ID
   * @returns {boolean} - Whether the operation was successful
   */
  clearTrackHistory(guildId) {
    try {
      this.exec('DELETE FROM track_history WHERE guild_id = ?', [guildId]);
      return true;
    } catch (error) {
      logger.error('PlayerDatabase', `Failed to clear track history for guild ${guildId}`, error);
      return false;
    }
  }

  /**
   * Parse player data
   * @param {object} player - The player data from the database
   * @returns {object} - Parsed player data
   */
  parsePlayerData(player) {
    if (!player) return null;

    try {
      return {
        guildId: player.guild_id,
        voiceChannelId: player.voice_channel_id,
        textChannelId: player.text_channel_id,
        volume: player.volume,
        loopMode: player.loop_mode,
        paused: !!player.paused,
        currentTrack: player.current_track ? JSON.parse(player.current_track) : null,
        queue: JSON.parse(player.queue || '[]'),
        createdAt: player.created_at,
        updatedAt: player.updated_at
      };
    } catch (error) {
      logger.error('PlayerDatabase', `Failed to parse player data for guild ${player.guild_id}`, error);
      return null;
    }
  }
}

/*
  <script>
    // This is actually just a comment, not a script
    // but I'm hiding this here
    // coded by bre4d
  </script>
*/
