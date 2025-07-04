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
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Class for managing playlist database interactions
 */
class PlaylistDB {
  constructor() {
    this.db = new Database(path.join(__dirname, '../../database/playlist.db'));
    this.init();
  }

  /**
   * Initialize database
   */
  init() {
    // Create playlists table if not exists
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS playlists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        userId TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );
    `);

    // Create tracks table if not exists
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS playlist_tracks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        playlistId INTEGER NOT NULL,
        title TEXT NOT NULL,
        author TEXT,
        uri TEXT NOT NULL,
        thumbnail TEXT,
        length INTEGER,
        source TEXT,
        position INTEGER NOT NULL,
        FOREIGN KEY (playlistId) REFERENCES playlists (id) ON DELETE CASCADE
      );
    `);

    // Enable foreign keys
    this.db.exec('PRAGMA foreign_keys = ON;');

    // Prepare statements
    this.createPlaylistStmt = this.db.prepare(`
      INSERT INTO playlists (name, userId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?)
    `);

    this.addTrackStmt = this.db.prepare(`
      INSERT INTO playlist_tracks (playlistId, title, author, uri, thumbnail, length, source, position)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    this.getPlaylistsStmt = this.db.prepare(`
      SELECT * FROM playlists WHERE userId = ? ORDER BY updatedAt DESC
    `);

    this.getPlaylistByIdStmt = this.db.prepare(`
      SELECT * FROM playlists WHERE id = ?
    `);

    this.getPlaylistByNameStmt = this.db.prepare(`
      SELECT * FROM playlists WHERE userId = ? AND name = ? LIMIT 1
    `);

   
    this.updatePlaylistStmt = this.db.prepare(`
      UPDATE playlists SET name = ?, updatedAt = ? WHERE id = ?
    `);

    this.deletePlaylistStmt = this.db.prepare(`
      DELETE FROM playlists WHERE id = ?
    `);

    this.getPlaylistTracksStmt = this.db.prepare(`
      SELECT * FROM playlist_tracks WHERE playlistId = ? ORDER BY position ASC
    `);

    this.clearPlaylistTracksStmt = this.db.prepare(`
      DELETE FROM playlist_tracks WHERE playlistId = ?
    `);

    this.deleteTrackStmt = this.db.prepare(`
      DELETE FROM playlist_tracks WHERE playlistId = ? AND position = ?
    `);

    this.getMaxPositionStmt = this.db.prepare(`
      SELECT MAX(position) as maxPos FROM playlist_tracks WHERE playlistId = ?
    `);

    this.updateTracksPositionStmt = this.db.prepare(`
      UPDATE playlist_tracks SET position = position - 1
      WHERE playlistId = ? AND position > ?
    `);

    this.moveTrackStmt = this.db.prepare(`
      UPDATE playlist_tracks SET position = ? WHERE playlistId = ? AND position = ?
    `);

    this.countPlaylistTracksStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM playlist_tracks WHERE playlistId = ?
    `);
    
    this.updatePlaylistTimestampStmt = this.db.prepare(`
      UPDATE playlists SET updatedAt = ? WHERE id = ?
    `);
  }

  /**
   * Create a new playlist
   * @param {string} name - Playlist name
   * @param {string} userId - User ID
   * @param {boolean} isPublic - Whether the playlist is public
   * @returns {number} - Playlist ID
   */
  createPlaylist(name, userId, isPublic = false) {
    const now = Date.now();
    const result = this.createPlaylistStmt.run(name, userId, now, now);
    return result.lastInsertRowid;
  }

  /**
   * Add a track to a playlist
   * @param {number} playlistId - Playlist ID
   * @param {object} track - Track object
   * @returns {boolean} - Success status
   */
  addTrack(playlistId, track) {
    try {
      // Check if playlist exists
      const playlist = this.getPlaylistById(playlistId);
      if (!playlist) return false;

      // Get the highest position to add at the end
      const maxPos = this.getMaxPosition(playlistId);
      const position = maxPos + 1;

      // Add the track
      this.addTrackStmt.run(
        playlistId,
        track.title || 'Unknown Title',
        track.author || 'Unknown Artist',
        track.uri || '',
        track.thumbnail || '',
        track.length || 0,
        track.source || this.detectSourceFromUri(track.uri),
        position
      );

      // Update playlist updatedAt time
      this.updatePlaylistTimestamp(playlistId);

      return true;
    } catch (error) {
      console.error('Error adding track to playlist:', error);
      return false;
    }
  }

  /**
   * Add multiple tracks to a playlist
   * @param {number} playlistId - Playlist ID
   * @param {array} tracks - Array of track objects
   * @returns {boolean} - Success status
   */
  addTracks(playlistId, tracks) {
    if (!Array.isArray(tracks) || !tracks.length) return false;

    try {
      // Check if playlist exists
      const playlist = this.getPlaylistById(playlistId);
      if (!playlist) return false;

      // Begin manual transaction
      this.db.exec('BEGIN TRANSACTION;');
      
      try {
        let maxPos = this.getMaxPosition(playlistId);

        for (const track of tracks) {
          maxPos++;
          this.addTrackStmt.run(
            playlistId,
            track.title || 'Unknown Title',
            track.author || 'Unknown Artist',
            track.uri || '',
            track.thumbnail || '',
            track.length || 0,
            track.source || this.detectSourceFromUri(track.uri),
            maxPos
          );
        }

        // Update playlist updatedAt time
        this.updatePlaylistTimestamp(playlistId);
        
        // Commit transaction if successful
        this.db.exec('COMMIT;');
        return true;
      } catch (err) {
        // Rollback transaction if there was an error
        this.db.exec('ROLLBACK;');
        console.error('Error in transaction, rolling back:', err);
        return false;
      }
    } catch (error) {
      console.error('Error adding tracks to playlist:', error);
      return false;
    }
  }

  /**
   * Get the highest position number in a playlist
   * @param {number} playlistId - Playlist ID
   * @returns {number} - Highest position
   */
  getMaxPosition(playlistId) {
    const result = this.getMaxPositionStmt.get(playlistId);
    return result && result.maxPos !== null ? result.maxPos : 0;
  }

  /**
   * Update playlist timestamp
   * @param {number} playlistId - Playlist ID
   */
  updatePlaylistTimestamp(playlistId) {
    this.updatePlaylistTimestampStmt.run(Date.now(), playlistId);
  }

  /**
   * Get all playlists for a user
   * @param {string} userId - User ID
   * @returns {array} - Array of playlists
   */
  getPlaylists(userId) {
    return this.getPlaylistsStmt.all(userId);
  }

  
  /**
   * Get a playlist by ID
   * @param {number} id - Playlist ID
   * @returns {object|null} - Playlist object or null
   */
  getPlaylistById(id) {
    return this.getPlaylistByIdStmt.get(id);
  }

  /**
   * Get a playlist by name for a user
   * @param {string} userId - User ID
   * @param {string} name - Playlist name
   * @returns {object|null} - Playlist object or null
   */
  getPlaylistByName(userId, name) {
    return this.getPlaylistByNameStmt.get(userId, name);
  }

  /**
   * Update a playlist
   * @param {number} id - Playlist ID
   * @param {string} name - New playlist name
   * @param {boolean} isPublic - Whether the playlist is public
   * @returns {boolean} - Success status
   */
  updatePlaylist(id, name, isPublic = false) {
    try {
      this.updatePlaylistStmt.run(name, Date.now(), id);
      return true;
    } catch (error) {
      console.error('Error updating playlist:', error);
      return false;
    }
  }

  /**
   * Delete a playlist
   * @param {number} id - Playlist ID
   * @returns {boolean} - Success status
   */
  deletePlaylist(id) {
    try {
      this.deletePlaylistStmt.run(id);
      return true;
    } catch (error) {
      console.error('Error deleting playlist:', error);
      return false;
    }
  }

  /**
   * Get tracks in a playlist
   * @param {number} playlistId - Playlist ID
   * @returns {array} - Array of tracks
   */
  getPlaylistTracks(playlistId) {
    return this.getPlaylistTracksStmt.all(playlistId);
  }

  /**
   * Count tracks in a playlist
   * @param {number} playlistId - Playlist ID
   * @returns {number} - Number of tracks
   */
  countPlaylistTracks(playlistId) {
    const result = this.countPlaylistTracksStmt.get(playlistId);
    return result ? result.count : 0;
  }

  /**
   * Clear all tracks from a playlist
   * @param {number} playlistId - Playlist ID
   * @returns {boolean} - Success status
   */
  clearPlaylistTracks(playlistId) {
    try {
      this.clearPlaylistTracksStmt.run(playlistId);
      this.updatePlaylistTimestamp(playlistId);
      return true;
    } catch (error) {
      console.error('Error clearing playlist tracks:', error);
      return false;
    }
  }

  /**
   * Delete a track from a playlist
   * @param {number} playlistId - Playlist ID
   * @param {number} position - Track position
   * @returns {boolean} - Success status
   */
  deleteTrack(playlistId, position) {
    try {
      // Begin manual transaction
      this.db.exec('BEGIN TRANSACTION;');
      
      try {
        // Delete the track
        this.deleteTrackStmt.run(playlistId, position);

        // Update positions of remaining tracks
        this.updateTracksPositionStmt.run(playlistId, position);

        // Update playlist updatedAt time
        this.updatePlaylistTimestamp(playlistId);
        
        // Commit transaction if successful
        this.db.exec('COMMIT;');
        return true;
      } catch (err) {
        // Rollback transaction if there was an error
        this.db.exec('ROLLBACK;');
        console.error('Error in transaction, rolling back:', err);
        return false;
      }
    } catch (error) {
      console.error('Error deleting track from playlist:', error);
      return false;
    }
  }

  /**
   * Move a track to a new position in the playlist
   * @param {number} playlistId - Playlist ID
   * @param {number} fromPosition - Current position
   * @param {number} toPosition - New position
   * @returns {boolean} - Success status
   */
  moveTrack(playlistId, fromPosition, toPosition) {
    try {
      const trackCount = this.countPlaylistTracks(playlistId);
      if (fromPosition < 1 || fromPosition > trackCount ||
          toPosition < 1 || toPosition > trackCount) {
        return false;
      }

      if (fromPosition === toPosition) return true;

      // Begin manual transaction
      this.db.exec('BEGIN TRANSACTION;');
      
      try {
        // Temporarily mark the track
        const tempPosition = -1;
        this.moveTrackStmt.run(tempPosition, playlistId, fromPosition);

        // Move other tracks to make space
        if (fromPosition < toPosition) {
          // Moving down - shift tracks up
          this.db.prepare(`
            UPDATE playlist_tracks
            SET position = position - 1
            WHERE playlistId = ? AND position > ? AND position <= ?
          `).run(playlistId, fromPosition, toPosition);
        } else {
          // Moving up - shift tracks down
          this.db.prepare(`
            UPDATE playlist_tracks
            SET position = position + 1
            WHERE playlistId = ? AND position >= ? AND position < ?
          `).run(playlistId, toPosition, fromPosition);
        }

        // Move the track to its final position
        this.moveTrackStmt.run(toPosition, playlistId, tempPosition);

        // Update playlist updatedAt time
        this.updatePlaylistTimestamp(playlistId);
        
        // Commit transaction if successful
        this.db.exec('COMMIT;');
        return true;
      } catch (err) {
        // Rollback transaction if there was an error
        this.db.exec('ROLLBACK;');
        console.error('Error in transaction, rolling back:', err);
        return false;
      }
    } catch (error) {
      console.error('Error moving track in playlist:', error);
      return false;
    }
  }

  /**
   * Detect source from URI
   * @param {string} uri - Track URI
   * @returns {string} - Source type
   */
  detectSourceFromUri(uri) {
    if (!uri) return 'unknown';
    if (uri.includes('youtube') || uri.includes('youtu.be')) return 'youtube';
    if (uri.includes('spotify')) return 'spotify';
    if (uri.includes('soundcloud')) return 'soundcloud';
    return 'unknown';
  }
}

export default new PlaylistDB();
