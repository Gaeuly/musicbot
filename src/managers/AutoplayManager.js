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
import { config } from '../config/config.js';
import { SearchManager } from './SearchManager.js';
import { createRequire } from 'module';
import axios from 'axios';

const require = createRequire(import.meta.url);
const SpotifyWebApi = require('spotify-web-api-node');

/**
 * SpotifyRecommender - A service class to interact with Spotify API for recommendations
 */
class SpotifyRecommender {
    constructor(clientId, clientSecret, options = {}) {
        this.spotifyApi = new SpotifyWebApi({ clientId, clientSecret });
        this.tokenCache = null;
        this.tokenCacheExpiration = null;
        this.cacheEnabled = options?.cacheEnabled ?? true;
        
        logger.info('SpotifyRecommender', 'Initialized with Spotify credentials');
    }

    /**
     * Get track recommendations based on a Spotify track URL
     * @param {string} previousTrackUrl - The Spotify track URL to base recommendations on
     * @returns {Promise<Array<string>>} - Returns an array of recommended track URLs
     */
    async getRecommendations(previousTrackUrl) {
        try {
            // Validate the input URL
            if (!previousTrackUrl || typeof previousTrackUrl !== "string") {
                throw new Error("Error | Please provide a valid Spotify Track URL");
            }

            if (!previousTrackUrl.includes("open.spotify.com/track/")) {
                throw new Error("Error | Invalid Spotify Track URL. Please provide a valid Spotify Track URL");
            }

            logger.debug('SpotifyRecommender', `Getting recommendations for track URL: ${previousTrackUrl}`);
            
            // Get Spotify access token
            await this.getSpotifyToken();
            
            // Extract track ID from URL
            const match = previousTrackUrl.match(/track\/([a-zA-Z0-9]+)(\?|$)/);
            const trackId = match?.[1];
            // Get track info to use artist and genre for better seed data
            const [trackInfo, audioFeatures, availableGenres] = await Promise.all([
        this.spotifyApi.getTrack(trackId),
        this.spotifyApi.getAudioFeaturesForTrack(trackId),
        this.spotifyApi.getAvailableGenreSeeds()
      ]);

      const artist = trackInfo.body.artists[0];
      const artistGenres = (await this.spotifyApi.getArtist(artist.id)).body.genres;
      const validGenres = artistGenres.filter(g => availableGenres.body.genres.includes(g));

      const { valence, energy, danceability, tempo } = audioFeatures.body;
            
            if (!trackId) {
                throw new Error("Error | Invalid Spotify track URL format");
            }
            
            logger.debug('SpotifyRecommender', `Extracted track ID: ${trackId}`);
            
            // Get recommendations
            const recommendations = await this.spotifyApi.getRecommendations({
           seed_tracks: [trackId],
        seed_artists: [artist.id],
        seed_genres: validGenres.slice(0, 2),
              limit: 5,
           });
            
            logger.debug('SpotifyRecommender', `Received ${recommendations.body.tracks.length} recommendations`);
            
            // Map to track URLs
            return recommendations.body.tracks.map(track => track.external_urls.spotify);
        } catch (error) {
            logger.error('SpotifyRecommender', 'Error getting recommendations', error);
            
            // Handle specific error responses
            if (error.response) {
                const errorMessage = error.response.data?.error?.message || "Unknown API error";
                throw new Error(`Error | Getting Recommendations from Spotify: ${errorMessage}`);
            } else if (error.statusCode) {
                throw new Error(`Error | Spotify API error (${error.statusCode}): ${error.message}`);
            } else if (error.message) {
                throw new Error(error.message);
            } else {
                throw new Error("Error | Something went wrong while getting recommendations from Spotify");
            }
        }
    }

    /**
     * Get a Spotify API access token
     * @returns {Promise<string>} - Returns the access token
     */
    async getSpotifyToken() {
        // Return cached token if it's still valid and caching is enabled
        if (this.cacheEnabled && this.tokenCache && this.tokenCacheExpiration > Date.now()) {
            logger.debug('SpotifyRecommender', 'Using cached Spotify token');
            return this.tokenCache;
        }

        try {
            logger.debug('SpotifyRecommender', 'Requesting new Spotify access token');
            
            const data = await this.spotifyApi.clientCredentialsGrant();
            const token = data.body['access_token'];
            const expiresIn = data.body['expires_in'];
            
            // Set the token on the API object
            this.spotifyApi.setAccessToken(token);
            
            logger.debug('SpotifyRecommender', `Received new Spotify token, expires in ${expiresIn}s`);
            
            // Cache the token if caching is enabled
            if (this.cacheEnabled) {
                this.tokenCache = token;
                // Convert expiration to milliseconds and subtract 60 seconds as buffer
                this.tokenCacheExpiration = Date.now() + ((expiresIn - 60) * 1000);
            }
            
            return token;
        } catch (error) {
            logger.error('SpotifyRecommender', 'Error getting Spotify token', error);
            const errorMessage = error.body?.error_description || error.message || "Unknown error";
            throw new Error(`Error | While getting Spotify Access Token: ${errorMessage}`);
        }
    }
    
    /**
     * Search for track information by URL
     * @param {string} trackUrl - Spotify track URL
     * @returns {Promise<object>} - Track information
     */
    async searchTrack(trackUrl) {
        try {
            if (!trackUrl || typeof trackUrl !== "string") {
                throw new Error("Error | Please provide a valid track URL");
            }
            
            // Get Spotify access token
            await this.getSpotifyToken();
            
            // Extract track ID from URL
            const match = trackUrl.match(/track\/([a-zA-Z0-9]+)(\?|$)/);
            const trackId = match?.[1];
            
            if (!trackId) {
                throw new Error("Error | Invalid Spotify track URL format");
            }
            
            logger.debug('SpotifyRecommender', `Searching for track with ID: ${trackId}`);
            
            // Get track information
            const trackResponse = await this.spotifyApi.getTrack(trackId);
            const trackData = trackResponse.body;
            
            if (!trackData) {
                throw new Error("Error | No track found or unexpected API response");
            }
            
            logger.debug('SpotifyRecommender', `Found track: ${trackData.name}`);
            
            // Format the track information
            return {
                title: trackData.name,
                artist: trackData.artists.map(artist => artist.name).join(', '),
                album: trackData.album?.name,
                durationInMs: trackData.duration_ms,
                duration: trackData.duration_ms,
                link: trackData.external_urls.spotify,
                thumbnail: trackData.album?.images[0]?.url
            };
        } catch (error) {
            logger.error('SpotifyRecommender', 'Error searching track', error);
            
            // Handle specific error responses
            if (error.statusCode) {
                throw new Error(`Error | Spotify API error (${error.statusCode}): ${error.message}`);
            } else if (error.message) {
                throw new Error(error.message);
            } else {
                throw new Error("Error | Something went wrong while getting track info from Spotify");
            }
        }
    }
}

/**
 * AutoplayManager - Handles automatic track recommendations when queue is empty
 */
export class AutoplayManager {
  /**
   * Create a new AutoplayManager instance
   * @param {object} musicManager - MusicManager instance
   */
  constructor(musicManager) {
    this.musicManager = musicManager;
    this.searchManager = new SearchManager(musicManager);
    
    // Store last played track for recommendations
    this.lastTrackMap = new Map(); // guildId -> last track info
    
    // Initialize SpotifyRecommender instead of BreadSpoti
    this.spotifyRecommender = new SpotifyRecommender(
      config.spotify.clientId, 
      config.spotify.clientSecret,
      { cacheEnabled: true }
    );
    
    logger.info('AutoplayManager', 'Initialized with SpotifyRecommender');
  }

  /**
   * Get track recommendations based on the last played track
   * @param {string} guildId - Guild ID
   * @param {object} currentTrack - Current playing track
   * @returns {Promise<object|null>} - Track recommendations
   */
  async getRecommendations(guildId, currentTrack) {
    try {
      // Safety check for track
      if (!currentTrack) {
        logger.warn('AutoplayManager', 'No currentTrack provided for recommendations');
        return null;
      }

      // Extract track info
      const trackId = this.extractTrackId(currentTrack.uri);
      const trackTitle = currentTrack.title || '';
      const trackArtist = currentTrack.author || currentTrack.artist || '';

      // Store the last track info
      this.lastTrackMap.set(guildId, {
        id: trackId,
        title: trackTitle,
        artist: trackArtist,
        uri: currentTrack.uri
      });

      logger.info('AutoplayManager', `Getting recommendations for: ${trackTitle} by ${trackArtist}`);
      
      // First try with SpotifyRecommender API if we have a Spotify track ID or URL
      if (trackId && trackId.startsWith('spotify:track:')) {
        try {
          // Convert Spotify URI to URL for SpotifyRecommender
          const trackUrl = this.convertUriToUrl(trackId);
          
          logger.info('AutoplayManager', `Getting SpotifyRecommender recommendations for track URL: ${trackUrl}`);
          
          const trackRecommendations = await this.spotifyRecommender.getRecommendations(trackUrl);
          
          if (trackRecommendations && trackRecommendations.length > 0) {
            // Convert SpotifyRecommender recommendations to tracks format
            const tracks = await this.convertRecommendationsToTracks(trackRecommendations, currentTrack.requester);
            
            logger.info('AutoplayManager', `Found ${tracks.length} SpotifyRecommender recommendations`);
            
            return {
              type: 'PLAYLIST',
              playlistName: 'Recommended Songs',
              tracks: tracks
            };
          }
        } catch (spotifyError) {
          logger.error('AutoplayManager', 'Error getting SpotifyRecommender recommendations', spotifyError);
          // Fall through to next method
        }
      }
      
      // If SpotifyRecommender recommendations failed or weren't possible, try search by artist and title
      if (trackArtist && trackTitle) {
        const searchQuery = `songs like ${trackArtist} ${trackTitle}`;
        logger.info('AutoplayManager', `Searching for recommendations using query: ${searchQuery}`);
        
        return await this.searchManager.search(searchQuery, {
          platform: 'spotify',
          requester: currentTrack.requester,
          limit: 10
        });
      }
      
      // If we have just artist, search by artist
      if (trackArtist) {
        logger.info('AutoplayManager', `Falling back to artist search for: ${trackArtist}`);
        return await this.searchManager.searchArtistTracks(trackArtist, null, currentTrack.requester);
      }
      
      // Last resort: search by track title only
      if (trackTitle) {
        logger.info('AutoplayManager', `Falling back to title search for: ${trackTitle}`);
        return await this.searchManager.search(trackTitle, {
          platform: 'spotify',
          requester: currentTrack.requester,
          limit: 10
        });
      }
      
      return null;
    } catch (error) {
      logger.error('AutoplayManager', 'Error getting recommendations', error);
      return null;
    }
  }

  /**
   * Convert SpotifyRecommender recommendations to track format compatible with Kazagumo
   * @param {Array} recommendations - SpotifyRecommender recommendations
   * @param {object} requester - User who requested the track
   * @returns {Promise<Array>} - Array of formatted tracks
   */
  async convertRecommendationsToTracks(recommendations, requester) {
    try {
      const tracks = [];
      
      // Ensure recommendations is an array
      const recArray = Array.isArray(recommendations) ? recommendations : [recommendations];
      
      // Log the recommendations being processed
      logger.debug('AutoplayManager', `Converting ${recArray.length} recommendations to tracks`);
      
      for (const recommendation of recArray) {
        // Check if recommendation is a URL or an object
        let trackData;
        
        if (typeof recommendation === 'string') {
          // It's a URL, so we need to search for it
          try {
            logger.debug('AutoplayManager', `Searching for track data for URL: ${recommendation}`);
            trackData = await this.spotifyRecommender.searchTrack(recommendation);
          } catch (err) {
            logger.error('AutoplayManager', `Error searching for track: ${recommendation}`, err);
            continue;
          }
        } else {
          // It's already a track object
          trackData = recommendation;
        }
        
        // Make sure we have valid track data
        if (!trackData || !trackData.title) {
          logger.warn('AutoplayManager', 'Skipping invalid track data');
          continue;
        }
        
        logger.debug('AutoplayManager', `Found track data: ${trackData.title} by ${trackData.artist}`);
        
        // Format track for Kazagumo
        const formattedTrack = {
          title: trackData.title,
          author: trackData.artist,
          uri: trackData.link,
          url: trackData.link,
          length: trackData.durationInMs || 0,
          duration: trackData.duration || 0,
          thumbnail: trackData.thumbnail,
          album: trackData.album,
          isStream: false,
          spotifyTrack: true,
          requester: requester
        };
        
        tracks.push(formattedTrack);
      }
      
      logger.info('AutoplayManager', `Successfully converted ${tracks.length} recommendations to tracks`);
      return tracks;
    } catch (error) {
      logger.error('AutoplayManager', 'Error converting recommendations to tracks', error);
      return [];
    }
  }

  /**
   * Convert a Spotify URI to a URL
   * @param {string} uri - Spotify URI (spotify:track:xyz)
   * @returns {string} - Spotify URL
   */
  convertUriToUrl(uri) {
    if (!uri) return '';
    
    // Check if it's already a URL
    if (uri.startsWith('http')) {
      return uri;
    }
    
    // Convert from spotify:track:xyz to https://open.spotify.com/track/xyz
    if (uri.startsWith('spotify:')) {
      const parts = uri.split(':');
      if (parts.length >= 3) {
        const type = parts[1];
        const id = parts[2];
        return `https://open.spotify.com/${type}/${id}`;
      }
    }
    
    return uri;
  }

  /**
   * Extract track ID from a track URI
   * @param {string} uri - Track URI or URL
   * @returns {string|null} - Track ID
   */
  extractTrackId(uri) {
    if (!uri) return null;
    
    try {
      // For Spotify URLs
      if (uri.includes('spotify.com/track/')) {
        const match = uri.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
        if (match && match[1]) {
          return `spotify:track:${match[1]}`;
        }
      }
      
      // For Spotify URIs
      if (uri.startsWith('spotify:track:')) {
        return uri;
      }
      
      // For YouTube
      if (uri.includes('youtube.com/watch?v=') || uri.includes('youtu.be/')) {
        const match = uri.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
          return `youtube:${match[1]}`;
        }
      }
      
      return null;
    } catch (error) {
      logger.error('AutoplayManager', 'Error extracting track ID', error);
      return null;
    }
  }

  /**
   * Handle autoplay for a player when its queue ends
   * @param {object} player - Kazagumo player
   * @returns {Promise<boolean>} - Whether autoplay was successful
   */
  async handleAutoplay(player) {
    try {
      if (!player || player.autoplay !== true) {
        logger.info('AutoplayManager', `Autoplay not enabled for guild ${player.guildId}`);
        return false;
      }
      
      const guildId = player.guildId;
      
      // Get the last played track
      const lastTrack = player.queue.previous && player.queue.previous.length > 0 
        ? player.queue.previous[player.queue.previous.length - 1] 
        : player.queue.current;
      
      if (!lastTrack) {
        logger.warn('AutoplayManager', `No track history available for autoplay in guild ${guildId}`);
        return false;
      }
      
      logger.info('AutoplayManager', `Getting recommendations based on last track: ${lastTrack.title} by ${lastTrack.author}`);
      
      // Get recommendations based on the last track
      const recommendations = await this.getRecommendations(guildId, lastTrack);
      
      if (!recommendations || !recommendations.tracks || !recommendations.tracks.length) {
        logger.warn('AutoplayManager', `No recommendations found for guild ${guildId}`);
        return false;
      }
      
      // Take a random subset of tracks (max 3) for variety
      const tracksToAdd = [];
      const maxTracksToAdd = Math.min(3, recommendations.tracks.length);
      
      // Create a copy of the array to avoid modifying the original
      const trackPool = [...recommendations.tracks];
      
      for (let i = 0; i < maxTracksToAdd; i++) {
        const randomIndex = Math.floor(Math.random() * trackPool.length);
        const trackToAdd = trackPool.splice(randomIndex, 1)[0];
        
        // Make sure track has a requester property (copied from last track)
        if (lastTrack.requester && !trackToAdd.requester) {
          trackToAdd.requester = lastTrack.requester;
        }
        
        // Convert to Kazagumo track format if needed
        const kazagumoTrack = await this.convertToKazagumoTrack(trackToAdd, player);
        
        if (kazagumoTrack) {
          tracksToAdd.push(kazagumoTrack);
        }
        
        // If we've emptied the pool, break
        if (trackPool.length === 0) break;
      }
      
      if (tracksToAdd.length === 0) {
        logger.warn('AutoplayManager', `No valid tracks to add after conversion for guild ${guildId}`);
        return false;
      }
      
      logger.info('AutoplayManager', `Adding ${tracksToAdd.length} recommended tracks to queue for guild ${guildId}`);
      
      // Add tracks to queue
      player.queue.add(tracksToAdd);
      
      // Start playing if not already playing
      if (!player.playing && !player.paused && player.queue.totalSize > 0) {
        await player.play();
        logger.info('AutoplayManager', `Started playing recommended tracks for guild ${guildId}`);
      }
      
      return true;
    } catch (error) {
      logger.error('AutoplayManager', 'Error handling autoplay', error);
      return false;
    }
  }
  
  /**
   * Convert a track to a Kazagumo track
   * @param {object} track - The track to convert
   * @param {object} player - Kazagumo player
   * @returns {Promise<object|null>} - The converted track or null if conversion failed
   */
  async convertToKazagumoTrack(track, player) {
    try {
      // If track is already a Kazagumo track, return it
      if (track.kazagumo) {
        return track;
      }
      
      // If musicManager is not available, return track as is
      if (!this.musicManager || !this.musicManager.kazagumo) {
        return track;
      }
      
      // Prepare track data
      const trackData = {
        title: track.title,
        author: track.author || track.artist,
        uri: track.uri || track.link || track.url,
        length: track.length || track.durationInMs || 0,
        thumbnail: track.thumbnail,
        requester: track.requester
      };
      
      logger.debug('AutoplayManager', `Converting track to Kazagumo format: ${trackData.title}`);
      
      // Use musicManager to resolve the track
      const resolvedTrack = await this.musicManager.kazagumo.resolve({
        query: trackData.uri,
        source: this.getSourceTypeFromUri(trackData.uri),
        requester: trackData.requester
      });
      
      if (resolvedTrack && resolvedTrack.tracks && resolvedTrack.tracks.length > 0) {
        // Return the first resolved track
        logger.debug('AutoplayManager', `Successfully resolved track with Kazagumo`);
        return resolvedTrack.tracks[0];
      }
      
      // If resolution failed, return original track
      logger.warn('AutoplayManager', `Failed to resolve track with Kazagumo, using original track`);
      return track;
    } catch (error) {
      logger.error('AutoplayManager', 'Error converting to Kazagumo track', error);
      return track; // Return original track as fallback
    }
  }
  
  /**
   * Get the source type from a URI
   * @param {string} uri - The URI to check
   * @returns {string} - The source type
   */
  getSourceTypeFromUri(uri) {
    if (!uri) return 'youtube';
    
    if (uri.includes('spotify.com') || uri.startsWith('spotify:')) {
      return 'spotify';
    } else if (uri.includes('youtube.com') || uri.includes('youtu.be')) {
      return 'youtube';
    } else if (uri.includes('soundcloud.com')) {
      return 'soundcloud';
    }
    
    return 'youtube'; // Default to YouTube
  }
}

// Export singleton instance
export const autoplayManager = new AutoplayManager();
