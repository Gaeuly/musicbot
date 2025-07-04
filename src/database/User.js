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
 * User Database for tracking user statistics
 */
export class User extends Database {
  /**
   * Create a new UserDatabase instance
   */
  constructor() {
    super(config.database.user);
    this.initTable();
  }

  /**
   * Initialize the users table
   */
  initTable() {
    this.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        no_prefix BOOLEAN DEFAULT FALSE,
        no_prefix_expiry INTEGER DEFAULT NULL,
        blacklisted BOOLEAN DEFAULT FALSE,
        blacklist_reason TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create liked songs table
    this.exec(`
      CREATE TABLE IF NOT EXISTS liked_songs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        track_data TEXT NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create user history table
    this.exec(`
      CREATE TABLE IF NOT EXISTS user_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        track_data TEXT NOT NULL,
        played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    logger.info('UserDatabase', 'User, liked_songs, and user_history tables initialized');
  }

  /**
   * Get a user from the database
   * @param {string} userId - The user ID
   * @returns {object|null} - User data or null if not found
   */
  getUser(userId) {
    return this.get('SELECT * FROM users WHERE id = ?', [userId]);
  }

  /**
   * Create a new user in the database or get existing
   * @param {string} userId - The user ID
   * @returns {object} - User data
   */
  ensureUser(userId) {
    const user = this.getUser(userId);

    if (!user) {
      this.exec('INSERT INTO users (id) VALUES (?)', [userId]);
      return this.getUser(userId);
    }

    return user;
  }

  /**
   * Set no prefix mode for a user
   * @param {string} userId - The user ID
   * @param {boolean} enabled - Whether to enable or disable
   * @param {number|null} expiryTimestamp - Optional expiry timestamp in ms
   * @returns {object} - Statement result
   */
  setNoPrefix(userId, enabled, expiryTimestamp = null) {
    this.ensureUser(userId);

    return this.exec(
      'UPDATE users SET no_prefix = ?, no_prefix_expiry = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [enabled ? 1 : 0, expiryTimestamp, userId]
    );
  }

  /**
   * Check if a user has no prefix mode enabled
   * @param {string} userId - The user ID
   * @returns {boolean} - Whether no prefix is enabled
   */
  hasNoPrefix(userId) {
    const user = this.getUser(userId);
    if (!user) return false;

    // If user is in config.ownerIds, they always have no prefix
    //if (config.ownerIds.includes(userId)) return true;

    // Check if no_prefix is enabled and not expired
    if (user.no_prefix) {
      if (!user.no_prefix_expiry) return true; // Permanent no prefix

      // Check if the temporary no prefix has expired
      const now = Date.now();
      if (user.no_prefix_expiry > now) {
        return true;
      } else {
        // Expired, reset it
        this.setNoPrefix(userId, false, null);
        return false;
      }
    }

    return false;
  }

  /**
   * Blacklist a user
   * @param {string} userId - The user ID
   * @param {string} reason - Reason for blacklisting
   * @returns {object} - Statement result
   */
  blacklistUser(userId, reason = 'No reason provided') {
    this.ensureUser(userId);

    return this.exec(
      'UPDATE users SET blacklisted = 1, blacklist_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [reason, userId]
    );
  }

  /**
   * Remove user from blacklist
   * @param {string} userId - The user ID
   * @returns {object} - Statement result
   */
  unblacklistUser(userId) {
    this.ensureUser(userId);

    return this.exec(
      'UPDATE users SET blacklisted = 0, blacklist_reason = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [userId]
    );
  }

  /**
   * Check if a user is blacklisted
   * @param {string} userId - The user ID
   * @returns {object|false} - Blacklist data or false if not blacklisted
   */
  isBlacklisted(userId) {
    const user = this.getUser(userId);
    if (!user || !user.blacklisted) return false;

    return {
      blacklisted: true,
      reason: user.blacklist_reason || 'No reason provided'
    };
  }

  /**
   * Add a song to a user's liked songs
   * @param {string} userId - The user ID
   * @param {object} trackData - The track data to store
   * @returns {boolean} - Whether the operation was successful
   */
  addLikedSong(userId, trackData) {
    try {
      // Make sure the user exists
      this.ensureUser(userId);

      // Check if song is already liked
      const existingLike = this.get(
        "SELECT id FROM liked_songs WHERE user_id = ? AND json_extract(track_data, '$.uri') = ?",
        [userId, trackData.uri]
      );

      if (existingLike) {
        
        return false; // Already liked
      }

      // Add to liked songs
      this.exec(
        'INSERT INTO liked_songs (user_id, track_data) VALUES (?, ?)',
        [userId, JSON.stringify(trackData)]
      );

      return true;
    } catch (error) {
      logger.error('UserDatabase', `Failed to add liked song for user ${userId}`, error);
      return false;
    }
  }

  /**
   * Remove a song from a user's liked songs
   * @param {string} userId - The user ID
   * @param {string} trackUri - The track URI to remove
   * @returns {boolean} - Whether the operation was successful
   */
  removeLikedSong(userId, trackUri) {
    try {
      this.exec(
        "DELETE FROM liked_songs WHERE user_id = ? AND json_extract(track_data, '$.uri') = ?",
        [userId, trackUri]
      );

      return true;
    } catch (error) {
      logger.error('UserDatabase', `Failed to remove liked song for user ${userId}`, error);
      return false;
    }
  }

  /**
   * Get a user's liked songs
   * @param {string} userId - The user ID
   * @param {number} limit - Maximum number of songs to return
   * @param {number} offset - Number of songs to skip
   * @returns {Array} - Array of track data objects
   */
  getLikedSongs(userId, limit = 10, offset = 0) {
    try {
      const likes = this.all(
        'SELECT track_data FROM liked_songs WHERE user_id = ? ORDER BY added_at DESC LIMIT ? OFFSET ?',
        [userId, limit, offset]
      );

      return likes.map(item => {
        try {
          return JSON.parse(item.track_data);
        } catch (parseError) {
          logger.error('UserDatabase', 'Failed to parse liked song data', parseError);
          return null;
        }
      }).filter(Boolean); // Remove any null entries
    } catch (error) {
      logger.error('UserDatabase', `Failed to get liked songs for user ${userId}`, error);
      return [];
    }
  }

  /**
   * Count user's total liked songs
   * @param {string} userId - The user ID
   * @returns {number} - Total number of liked songs
   */
  countLikedSongs(userId) {
    try {
      const result = this.get(
        'SELECT COUNT(*) as count FROM liked_songs WHERE user_id = ?',
        [userId]
      );
      return result?.count || 0;
    } catch (error) {
      logger.error('UserDatabase', `Failed to count liked songs for user ${userId}`, error);
      return 0;
    }
  }

  /**
   * Add a track to user's listening history
   * @param {string} userId - The user ID
   * @param {object} trackData - The track data to store
   * @returns {boolean} - Whether the operation was successful
   */
  addToHistory(userId, trackData) {
    try {
      // Make sure the user exists
      this.ensureUser(userId);

      // Check if this track is already the most recent one in history
      const recentTrack = this.get(
        "SELECT id, track_data FROM user_history WHERE user_id = ? ORDER BY played_at DESC LIMIT 1",
        [userId]
      );

      if (recentTrack) {
        try {
          const recentTrackData = JSON.parse(recentTrack.track_data);
          // If this track has the same URI as the most recent track, don't add it again
          if (recentTrackData.uri === trackData.uri) {
           
            return true;
          }
        } catch (parseError) {
          // If we can't parse it, continue with adding the new track
          logger.error('UserDatabase', 'Failed to parse recent track data', parseError);
        }
      }

      // Add to user history
      this.exec(
        'INSERT INTO user_history (user_id, track_data) VALUES (?, ?)',
        [userId, JSON.stringify(trackData)]
      );

      // Limit history to 50 tracks per user (delete oldest tracks)
      this.exec(`
        DELETE FROM user_history
        WHERE id IN (
          SELECT id FROM user_history
          WHERE user_id = ?
          ORDER BY played_at DESC
          LIMIT -1 OFFSET 50
        )
      `, [userId]);

      return true;
    } catch (error) {
      logger.error('UserDatabase', `Failed to add track to history for user ${userId}`, error);
      return false;
    }
  }

  /**
   * Get a user's listening history
   * @param {string} userId - The user ID
   * @param {number} limit - Maximum number of tracks to return
   * @param {number} offset - Number of tracks to skip
   * @returns {Array} - Array of track data objects
   */
  getHistory(userId, limit = 10, offset = 0) {
    try {
      const history = this.all(
        'SELECT track_data FROM user_history WHERE user_id = ? ORDER BY played_at DESC LIMIT ? OFFSET ?',
        [userId, limit, offset]
      );

      return history.map(item => {
        try {
          return JSON.parse(item.track_data);
        } catch (parseError) {
          logger.error('UserDatabase', 'Failed to parse history track data', parseError);
          return null;
        }
      }).filter(Boolean); // Remove any null entries
    } catch (error) {
      logger.error('UserDatabase', `Failed to get history for user ${userId}`, error);
      return [];
    }
  }

  /**
   * Count user's total history entries
   * @param {string} userId - The user ID
   * @returns {number} - Total number of history entries
   */
  countHistory(userId) {
    try {
      const result = this.get(
        'SELECT COUNT(*) as count FROM user_history WHERE user_id = ?',
        [userId]
      );
      return result?.count || 0;
    } catch (error) {
      logger.error('UserDatabase', `Failed to count history for user ${userId}`, error);
      return 0;
    }
  }

  /**
   * Check if a track is liked by a user
   * @param {string} userId - The user ID
   * @param {string} trackUri - The track URI to check
   * @returns {boolean} - Whether the track is liked
   */
  isTrackLiked(userId, trackUri) {
    try {
      const result = this.get(
        "SELECT id FROM liked_songs WHERE user_id = ? AND json_extract(track_data, '$.uri') = ?",
        [userId, trackUri]
      );
      return !!result;
    } catch (error) {
      logger.error('UserDatabase', `Failed to check if track is liked by user ${userId}`, error);
      return false;
    }
  }

// Wait for "coded by bre4d" isn't this an easter egg? I'll hide it deeper
}
