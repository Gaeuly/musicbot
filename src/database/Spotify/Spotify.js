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
import { Database } from '../Database.js';
import { config } from '../../config/config.js';
import { logger } from '../../utils/logger.js';

/**
 * Spotify Database for storing user Spotify profiles
 */
export class Spotify extends Database {
  /**
   * Create a new SpotifyDatabase instance
   */
  constructor() {
    super(config.database.spotify || 'database/spotify.db');
    this.initTable();
  }

  /**
   * Initialize the spotify_profiles table
   */
  initTable() {
    this.exec(`
      CREATE TABLE IF NOT EXISTS spotify_profiles (
        user_id TEXT PRIMARY KEY,
        profile_url TEXT NOT NULL,
        username TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.exec(`
      CREATE TABLE IF NOT EXISTS spotify_playlists (
        playlist_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        playlist_name TEXT NOT NULL,
        playlist_url TEXT NOT NULL,
        cover_url TEXT,
        track_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES spotify_profiles(user_id) ON DELETE CASCADE
      )
    `);

    this.exec(`
      CREATE TABLE IF NOT EXISTS spotify_playlist_tracks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        playlist_id TEXT NOT NULL,
        track_name TEXT NOT NULL,
        artist_name TEXT NOT NULL,
        album_name TEXT,
        track_url TEXT,
        duration INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (playlist_id) REFERENCES spotify_playlists(playlist_id) ON DELETE CASCADE
      )
    `);

    logger.info('SpotifyDatabase', 'Spotify tables initialized');
  }

  /**
   * Link a user's Spotify profile
   * @param {string} userId - The user ID
   * @param {string} profileUrl - The Spotify profile URL
   * @param {string} username - Optional Spotify username
   * @returns {object} - Statement result
   */
  linkProfile(userId, profileUrl, username = null) {
    return this.exec(`
      INSERT INTO spotify_profiles (
        user_id, profile_url, username
      ) VALUES (?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        profile_url = excluded.profile_url,
        username = excluded.username,
        updated_at = CURRENT_TIMESTAMP
    `, [userId, profileUrl, username]);
  }

  /**
   * Unlink a user's Spotify profile
   * @param {string} userId - The user ID
   * @returns {object} - Statement result
   */
  unlinkProfile(userId) {
    return this.exec('DELETE FROM spotify_profiles WHERE user_id = ?', [userId]);
  }

  /**
   * Get a user's Spotify profile
   * @param {string} userId - The user ID
   * @returns {object|null} - User profile or null if not found
   */
  getProfile(userId) {
    return this.get('SELECT * FROM spotify_profiles WHERE user_id = ?', [userId]);
  }

  /**
   * Check if a user has linked their Spotify profile
   * @param {string} userId - The user ID
   * @returns {boolean} - Whether the user has linked their profile
   */
  hasLinkedProfile(userId) {
    const profile = this.getProfile(userId);
    return !!profile;
  }

  /**
   * Add a playlist for a user
   * @param {string} playlistId - The Spotify playlist ID
   * @param {string} userId - The user ID
   * @param {string} playlistName - The playlist name
   * @param {string} playlistUrl - The playlist URL
   * @param {string} coverUrl - Optional playlist cover image URL
   * @param {number} trackCount - Optional number of tracks
   * @returns {object} - Statement result
   */
  addPlaylist(playlistId, userId, playlistName, playlistUrl, coverUrl = null, trackCount = 0) {
    return this.exec(`
      INSERT INTO spotify_playlists (
        playlist_id, user_id, playlist_name, playlist_url, cover_url, track_count
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(playlist_id) DO UPDATE SET
        playlist_name = excluded.playlist_name,
        playlist_url = excluded.playlist_url,
        cover_url = excluded.cover_url,
        track_count = excluded.track_count,
        updated_at = CURRENT_TIMESTAMP
    `, [playlistId, userId, playlistName, playlistUrl, coverUrl, trackCount]);
  }

  /**
   * Get all playlists for a user
   * @param {string} userId - The user ID
   * @returns {object[]} - Array of playlists
   */
  getUserPlaylists(userId) {
    return this.all('SELECT * FROM spotify_playlists WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  }

  /**
   * Get a playlist by ID
   * @param {string} playlistId - The playlist ID
   * @returns {object|null} - Playlist or null if not found
   */
  getPlaylist(playlistId) {
    return this.get('SELECT * FROM spotify_playlists WHERE playlist_id = ?', [playlistId]);
  }

  /**
   * Add a track to a playlist
   * @param {string} playlistId - The playlist ID
   * @param {string} trackName - The track name
   * @param {string} artistName - The artist name
   * @param {string} albumName - Optional album name
   * @param {string} trackUrl - Optional track URL
   * @param {number} duration - Optional track duration in ms
   * @returns {object} - Statement result
   */
  addTrackToPlaylist(playlistId, trackName, artistName, albumName = null, trackUrl = null, duration = 0) {
    return this.exec(`
      INSERT INTO spotify_playlist_tracks (
        playlist_id, track_name, artist_name, album_name, track_url, duration
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [playlistId, trackName, artistName, albumName, trackUrl, duration]);
  }

  /**
   * Get all tracks for a playlist
   * @param {string} playlistId - The playlist ID
   * @param {number} limit - Optional limit for number of tracks to return
   * @param {number} offset - Optional offset for pagination
   * @returns {object[]} - Array of tracks
   */
  getPlaylistTracks(playlistId, limit = 100, offset = 0) {
    return this.all(`
      SELECT * FROM spotify_playlist_tracks
      WHERE playlist_id = ?
      ORDER BY id ASC
      LIMIT ? OFFSET ?
    `, [playlistId, limit, offset]);
  }

  /**
   * Clear all tracks for a playlist
   * @param {string} playlistId - The playlist ID
   * @returns {object} - Statement result
   */
  clearPlaylistTracks(playlistId) {
    return this.exec('DELETE FROM spotify_playlist_tracks WHERE playlist_id = ?', [playlistId]);
  }

  /**
   * Count tracks in a playlist
   * @param {string} playlistId - The playlist ID
   * @returns {number} - Number of tracks
   */
  countPlaylistTracks(playlistId) {
    const result = this.get('SELECT COUNT(*) as count FROM spotify_playlist_tracks WHERE playlist_id = ?', [playlistId]);
    return result ? result.count : 0;
  }

  /**
   * Delete a playlist
   * @param {string} playlistId - The playlist ID
   * @returns {object} - Statement result
   */
  deletePlaylist(playlistId) {
    return this.exec('DELETE FROM spotify_playlists WHERE playlist_id = ?', [playlistId]);
  }
}
