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
import { logger } from '../utils/logger.js';
import axios from 'axios';
import { config } from '../config/config.js';
import { db } from '../database/DatabaseManager.js';

/**
 * SpotifyManager for interacting with Spotify API and public data
 */
export class SpotifyManager {
  /**
   * Create a new SpotifyManager instance
   */
  constructor() {
    this.baseUrl = 'https://api.spotify.com/v1';
    this.clientId = config.spotify.clientId;
    this.clientSecret = config.spotify.clientSecret;
    this.accessToken = null;
    this.tokenExpiry = 0;
  }

  /**
   * Get Spotify access token using client credentials flow
   * @returns {string|null} - Access token or null if failed
   */
  async getAccessToken() {
    try {
      // Check if we already have a valid token
      if (this.accessToken && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      // Request new token
      const tokenEndpoint = 'https://accounts.spotify.com/api/token';
      const authString = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await axios({
        method: 'post',
        url: tokenEndpoint,
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: 'grant_type=client_credentials'
      });

      if (response.data && response.data.access_token) {
        this.accessToken = response.data.access_token;
        // Set expiry (subtract 60 seconds as buffer)
        this.tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;
        return this.accessToken;
      }

      logger.error('SpotifyManager', 'Failed to get access token - no token in response');
      return null;
    } catch (error) {
      logger.error('SpotifyManager', 'Failed to get Spotify access token', error);
      return null;
    }
  }

  /**
   * Make authenticated request to Spotify API
   * @param {string} endpoint - API endpoint (without base URL)
   * @param {string} method - HTTP method (GET, POST, etc.)
   * @param {object} data - Request data for POST requests
   * @returns {object|null} - Response data or null if failed
   */
  async apiRequest(endpoint, method = 'GET', data = null) {
    try {
      const token = await this.getAccessToken();

      if (!token) {
        logger.error('SpotifyManager', 'No access token available for API request');
        return null;
      }

      const response = await axios({
        method: method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        data: data
      });

      return response.data;
    } catch (error) {
      logger.error('SpotifyManager', `Spotify API request failed: ${endpoint}`, error);
      return null;
    }
  }

  /**
   * Get Spotify ID from a URL
   * @param {string} url - The Spotify URL
   * @returns {object|null} - The extracted ID and type, or null if invalid
   */
  parseSpotifyUrl(url) {
    try {
      // Match different Spotify URL patterns
      const playlistMatch = url.match(/spotify\.com\/playlist\/([a-zA-Z0-9]+)/);
      const userMatch = url.match(/spotify\.com\/user\/([a-zA-Z0-9]+)/);
      const profileMatch = url.match(/spotify\.com\/(?:user\/)?([a-zA-Z0-9]+)(?:\?|$)/);
      const trackMatch = url.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
      const albumMatch = url.match(/spotify\.com\/album\/([a-zA-Z0-9]+)/);

      if (playlistMatch) {
        return { id: playlistMatch[1], type: 'playlist' };
      }
      if (trackMatch) {
        return { id: trackMatch[1], type: 'track' };
      }
      if (albumMatch) {
        return { id: albumMatch[1], type: 'album' };
      }
      if (userMatch) {
        return { id: userMatch[1], type: 'user' };
      }
      if (profileMatch) {
        return { id: profileMatch[1], type: 'user' };
      }

      return null;
    } catch (error) {
      logger.error('SpotifyManager', 'Failed to parse Spotify URL', error);
      return null;
    }
  }

  /**
   * Fetch playlist data from Spotify
   * @param {string} playlistUrl - The Spotify playlist URL
   * @returns {object|null} - Playlist data
   */
  async fetchPlaylistData(playlistUrl) {
    try {
      const parsed = this.parseSpotifyUrl(playlistUrl);

      if (!parsed || parsed.type !== 'playlist') {
        logger.error('SpotifyManager', 'Invalid Spotify playlist URL');
        return null;
      }

      // Fetch from Spotify API
      const data = await this.apiRequest(`/playlists/${parsed.id}`);

      if (!data) {
        logger.error('SpotifyManager', `Failed to fetch playlist data for ID: ${parsed.id}`);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        url: data.external_urls?.spotify || playlistUrl,
        coverUrl: data.images?.[0]?.url,
        owner: {
          id: data.owner?.id,
          displayName: data.owner?.display_name
        },
        tracks: {
          total: data.tracks?.total || 0,
          items: data.tracks?.items || []
        },
        public: data.public
      };
    } catch (error) {
      logger.error('SpotifyManager', 'Failed to fetch playlist data', error);
      return null;
    }
  }

  /**
   * Fetch user playlists from Spotify
   * @param {string} profileUrl - The Spotify profile URL
   * @returns {Array|null} - Array of playlists or null if failed
   */
  async fetchUserPlaylists(profileUrl) {
    try {
      const parsed = this.parseSpotifyUrl(profileUrl);

      if (!parsed || parsed.type !== 'user') {
        logger.error('SpotifyManager', 'Invalid Spotify user profile URL');
        return null;
      }

      // Get user data first to verify user exists
      const userData = await this.fetchUserData(profileUrl);

      if (!userData) {
        logger.error('SpotifyManager', `Failed to fetch user data for ID: ${parsed.id}`);
        return null;
      }

      // Fetch public playlists for the user
      const data = await this.apiRequest(`/users/${parsed.id}/playlists?limit=50`);

      if (!data || !data.items) {
        logger.error('SpotifyManager', `Failed to fetch playlists for user: ${parsed.id}`);
        return null;
      }

      // Process and return the playlists
      return data.items.map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        url: playlist.external_urls?.spotify,
        coverUrl: playlist.images?.[0]?.url,
        trackCount: playlist.tracks?.total || 0
      }));
    } catch (error) {
      logger.error('SpotifyManager', 'Failed to fetch user playlists', error);
      return null;
    }
  }

  /**
   * Fetch user data from Spotify
   * @param {string} profileUrl - The Spotify profile URL
   * @returns {object|null} - User data or null if failed
   */
  async fetchUserData(profileUrl) {
    try {
      const parsed = this.parseSpotifyUrl(profileUrl);

      if (!parsed || parsed.type !== 'user') {
        logger.error('SpotifyManager', 'Invalid Spotify user profile URL');
        return null;
      }

      // Fetch from Spotify API
      const data = await this.apiRequest(`/users/${parsed.id}`);

      if (!data) {
        logger.error('SpotifyManager', `Failed to fetch user data for ID: ${parsed.id}`);
        return null;
      }

      return {
        id: data.id,
        displayName: data.display_name,
        url: data.external_urls?.spotify || profileUrl,
        images: data.images || []
      };
    } catch (error) {
      logger.error('SpotifyManager', 'Failed to fetch user data', error);
      return null;
    }
  }

  /**
   * Fetch tracks from a playlist
   * @param {string} playlistId - The Spotify playlist ID
   * @param {number} limit - Max number of tracks to fetch (default 100)
   * @returns {Array|null} - Array of tracks or null if failed
   */
  async fetchPlaylistTracks(playlistId, limit = 500) {
    try {
      // Fetch from Spotify API
      const tracks = [];
      let offset = 0;
      const maxPerRequest = 1000;

      // Calculate how many requests we need to make
      const numRequests = Math.min(Math.ceil(limit / maxPerRequest), 5); // Max 5 requests

      for (let i = 0; i < numRequests; i++) {
        const data = await this.apiRequest(`/playlists/${playlistId}/tracks`);

        if (!data || !data.items) break;

        // Process tracks
        const processedTracks = data.items
          .filter(item => item.track) // Ensure track exists
          .map(item => ({
            name: item.track.name,
            artist: item.track.artists.map(artist => artist.name).join(', '),
            album: item.track.album?.name,
            duration: item.track.duration_ms,
            url: item.track.external_urls?.spotify,
            albumCoverUrl: item.track.album?.images?.[0]?.url
          }));

        tracks.push(...processedTracks);

        // Update offset
        offset += maxPerRequest;

        // If we have enough tracks or there are no more tracks, break
        if (tracks.length >= limit || data.items.length < maxPerRequest) break;
      }

      return tracks;
    } catch (error) {
      logger.error('SpotifyManager', 'Failed to fetch playlist tracks', error);
      return null;
    }
  }

  /**
   * Convert Spotify track data to format usable by the player
   * @param {object} track - Spotify track data
   * @param {object} requester - Discord user who requested the track
   * @returns {object} - Track in player format
   */
  convertTrackToPlayerFormat(track, requester) {
    return {
      title: track.name,
      author: track.artist,
      url: track.url,
      thumbnail: track.albumCoverUrl || 'https://i.scdn.co/image/ab67616d00001e02ff9ca10b55ce82ae553c8228',
      duration: track.duration,
      requester: requester,
      source: 'spotify'
    };
  }

  /**
   * Import a playlist's tracks to the player queue
   * @param {string} playlistId - The playlist ID
   * @param {object} player - The music player
   * @param {object} requester - The user who requested the import
   * @returns {number} - Number of tracks imported
   */
  async importPlaylistToQueue(playlistId, player, requester) {
    try {
      const tracks = await this.fetchPlaylistTracks(playlistId);

      if (!tracks || tracks.length === 0) {
        return 0;
      }

      const convertedTracks = tracks.map(track => this.convertTrackToPlayerFormat(track, requester));

      // Check if player has a queue manager
      if (player.queue && typeof player.queue.add === 'function') {
        player.queue.add(convertedTracks);
      } else {
        // Fallback for direct array queue
        convertedTracks.forEach(track => player.queue.push(track));
      }

      return tracks.length;
    } catch (error) {
      logger.error('SpotifyManager', 'Failed to import playlist to queue', error);
      return 0;
    }
  }
}

// Export a singleton instance
export const spotifyManager = new SpotifyManager();
