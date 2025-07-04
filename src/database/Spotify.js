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
import { logger } from '../utils/logger.js';

/**
 * Spotify database class for managing Spotify user connections
 */
export class Spotify extends Database {
  /**
   * Create a new Spotify database instance
   */
  constructor() {
    super('database/spotify.db');
    this.init();
  }

  /**
   * Initialize the Spotify database tables
   */
  init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS spotify_users (
        user_id TEXT PRIMARY KEY,
        spotify_id TEXT,
        profile_url TEXT,
        display_name TEXT,
        avatar_url TEXT,
        linked_at INTEGER,
        last_updated INTEGER,
        refreshed_at INTEGER
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS spotify_playlists (
        playlist_id TEXT PRIMARY KEY,
        user_id TEXT,
        spotify_id TEXT,
        name TEXT,
        description TEXT,
        cover_url TEXT,
        track_count INTEGER DEFAULT 0,
        is_public BOOLEAN DEFAULT 1,
        external_url TEXT,
        last_updated INTEGER,
        FOREIGN KEY (user_id) REFERENCES spotify_users(user_id)
      )
    `);

    logger.success('SpotifyDB', 'Spotify database initialized successfully');
  }

  /**
   * Link a Discord user to a Spotify profile
   * @param {string} userId - Discord user ID
   * @param {string} profileUrl - Spotify profile URL
   * @param {object} profileData - Additional profile data
   * @returns {object} - User data
   */
  linkUser(userId, profileUrl, profileData = {}) {
    try {
      // Extract spotify ID from profile URL
      const spotifyId = this.extractSpotifyId(profileUrl);

      if (!spotifyId) {
        throw new Error('Invalid Spotify profile URL');
      }

      const timestamp = Date.now();

      // Prepare user data
      const userData = {
        user_id: userId,
        spotify_id: spotifyId,
        profile_url: profileUrl,
        display_name: profileData.display_name || 'Unknown',
        avatar_url: profileData.avatar_url || '',
        linked_at: timestamp,
        last_updated: timestamp,
        refreshed_at: timestamp
      };

      // Check if user already exists
      const existing = this.getUserById(userId);

      if (existing) {
        // Update existing user
        this.db.prepare(`
          UPDATE spotify_users
          SET spotify_id = ?, profile_url = ?, display_name = ?,
              avatar_url = ?, last_updated = ?
          WHERE user_id = ?
        `).run(
          userData.spotify_id,
          userData.profile_url,
          userData.display_name,
          userData.avatar_url,
          timestamp,
          userId
        );

        logger.info('SpotifyDB', `Updated Spotify link for user ${userId}`);
        return { ...existing, ...userData };
      } else {
        // Insert new user
        this.db.prepare(`
          INSERT INTO spotify_users
          (user_id, spotify_id, profile_url, display_name, avatar_url,
           linked_at, last_updated, refreshed_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          userData.user_id,
          userData.spotify_id,
          userData.profile_url,
          userData.display_name,
          userData.avatar_url,
          userData.linked_at,
          userData.last_updated,
          userData.refreshed_at
        );

        logger.info('SpotifyDB', `Linked user ${userId} to Spotify profile ${spotifyId}`);
        return userData;
      }
    } catch (error) {
      logger.error('SpotifyDB', `Failed to link user ${userId} to Spotify profile`, error);
      throw error;
    }
  }

  /**
   * Unlink a Discord user from Spotify
   * @param {string} userId - Discord user ID
   * @returns {boolean} - Whether the user was unlinked
   */
  unlinkUser(userId) {
    try {
      // Delete user playlists first (foreign key constraint)
      this.db.prepare('DELETE FROM spotify_playlists WHERE user_id = ?').run(userId);

      // Then delete the user
      const result = this.db.prepare('DELETE FROM spotify_users WHERE user_id = ?').run(userId);

      logger.info('SpotifyDB', `Unlinked user ${userId} from Spotify`);
      return result.changes > 0;
    } catch (error) {
      logger.error('SpotifyDB', `Failed to unlink user ${userId} from Spotify`, error);
      throw error;
    }
  }

  /**
   * Get a Spotify user by Discord ID
   * @param {string} userId - Discord user ID
   * @returns {object|null} - User data
   */
  getUserById(userId) {
    try {
      return this.db.prepare('SELECT * FROM spotify_users WHERE user_id = ?').get(userId);
    } catch (error) {
      logger.error('SpotifyDB', `Failed to get Spotify user ${userId}`, error);
      return null;
    }
  }

  /**
   * Check if a Discord user is linked to Spotify
   * @param {string} userId - Discord user ID
   * @returns {boolean} - Whether the user is linked
   */
  isUserLinked(userId) {
    return !!this.getUserById(userId);
  }

  /**
   * Add a Spotify playlist to the database
   * @param {string} userId - Discord user ID
   * @param {object} playlistData - Playlist data
   * @returns {object} - Playlist data
   */
  savePlaylist(userId, playlistData) {
    try {
      const timestamp = Date.now();

      // Prepare playlist data
      const playlist = {
        playlist_id: `${userId}:${playlistData.spotify_id}`,
        user_id: userId,
        spotify_id: playlistData.spotify_id,
        name: playlistData.name || 'Unnamed Playlist',
        description: playlistData.description || '',
        cover_url: playlistData.cover_url || '',
        track_count: playlistData.track_count || 0,
        is_public: playlistData.is_public !== false,
        external_url: playlistData.external_url || '',
        last_updated: timestamp
      };

      // Check if playlist already exists
      const existing = this.getPlaylistById(playlist.playlist_id);

      if (existing) {
        // Update existing playlist
        this.db.prepare(`
          UPDATE spotify_playlists
          SET name = ?, description = ?, cover_url = ?,
              track_count = ?, is_public = ?, external_url = ?, last_updated = ?
          WHERE playlist_id = ?
        `).run(
          playlist.name,
          playlist.description,
          playlist.cover_url,
          playlist.track_count,
          playlist.is_public ? 1 : 0,
          playlist.external_url,
          timestamp,
          playlist.playlist_id
        );

        logger.info('SpotifyDB', `Updated playlist ${playlist.name} for user ${userId}`);
      } else {
        // Insert new playlist
        this.db.prepare(`
          INSERT INTO spotify_playlists
          (playlist_id, user_id, spotify_id, name, description, cover_url,
           track_count, is_public, external_url, last_updated)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          playlist.playlist_id,
          playlist.user_id,
          playlist.spotify_id,
          playlist.name,
          playlist.description,
          playlist.cover_url,
          playlist.track_count,
          playlist.is_public ? 1 : 0,
          playlist.external_url,
          playlist.last_updated
        );

        logger.info('SpotifyDB', `Added playlist ${playlist.name} for user ${userId}`);
      }

      return playlist;
    } catch (error) {
      logger.error('SpotifyDB', `Failed to save playlist for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Get a Spotify playlist by ID
   * @param {string} playlistId - Playlist ID (format: userId:spotifyId)
   * @returns {object|null} - Playlist data
   */
  getPlaylistById(playlistId) {
    try {
      return this.db.prepare('SELECT * FROM spotify_playlists WHERE playlist_id = ?').get(playlistId);
    } catch (error) {
      logger.error('SpotifyDB', `Failed to get playlist ${playlistId}`, error);
      return null;
    }
  }

  /**
   * Get all playlists for a user
   * @param {string} userId - Discord user ID
   * @returns {object[]} - Array of playlist data
   */
  getUserPlaylists(userId) {
    try {
      return this.db.prepare('SELECT * FROM spotify_playlists WHERE user_id = ? ORDER BY last_updated DESC').all(userId);
    } catch (error) {
      logger.error('SpotifyDB', `Failed to get playlists for user ${userId}`, error);
      return [];
    }
  }

  /**
   * Delete a playlist
   * @param {string} playlistId - Playlist ID
   * @returns {boolean} - Whether the playlist was deleted
   */
  deletePlaylist(playlistId) {
    try {
      const result = this.db.prepare('DELETE FROM spotify_playlists WHERE playlist_id = ?').run(playlistId);
      return result.changes > 0;
    } catch (error) {
      logger.error('SpotifyDB', `Failed to delete playlist ${playlistId}`, error);
      return false;
    }
  }

  /**
   * Extract Spotify ID from profile URL
   * @param {string} url - Spotify profile URL
   * @returns {string|null} - Spotify ID or null if invalid
   */
  extractSpotifyId(url) {
    try {
      if (!url) return null;

      // Handle different Spotify URL formats
      let spotifyId = null;

      // Format: https://open.spotify.com/user/spotifyid
      if (url.includes('open.spotify.com/user/')) {
        spotifyId = url.split('open.spotify.com/user/')[1].split('?')[0];
      }
      // Format: spotify:user:spotifyid
      else if (url.includes('spotify:user:')) {
        spotifyId = url.split('spotify:user:')[1];
      }
      // Just the ID
      else if (url.match(/^[a-zA-Z0-9]{22}$/)) {
        spotifyId = url;
      }

      return spotifyId ? spotifyId.trim() : null;
    } catch (error) {
      logger.error('SpotifyDB', `Failed to extract Spotify ID from URL: ${url}`, error);
      return null;
    }
  }

  /**
   * Extract Spotify playlist ID from URL
   * @param {string} url - Spotify playlist URL
   * @returns {string|null} - Spotify playlist ID or null if invalid
   */
  extractPlaylistId(url) {
    try {
      if (!url) return null;

      let playlistId = null;

      // Format: https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
      if (url.includes('open.spotify.com/playlist/')) {
        playlistId = url.split('open.spotify.com/playlist/')[1].split('?')[0];
      }
      // Format: spotify:playlist:37i9dQZF1DXcBWIGoYBM5M
      else if (url.includes('spotify:playlist:')) {
        playlistId = url.split('spotify:playlist:')[1];
      }
      // Just the ID
      else if (url.match(/^[a-zA-Z0-9]{22}$/)) {
        playlistId = url;
      }

      return playlistId ? playlistId.trim() : null;
    } catch (error) {
      logger.error('SpotifyDB', `Failed to extract playlist ID from URL: ${url}`, error);
      return null;
    }
  }
}
