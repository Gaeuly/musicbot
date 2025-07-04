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
import { spotifyManager } from './SpotifyManager.js';
/**
 * SearchManager - Enhanced search functionality
 */
import client  from '../index.js'
export class SearchManager {
  /**
   * Create a new SearchManager instance
   * @param {object} musicManager - MusicManager instance
   */
  constructor(musicManager) {
    this.musicManager = musicManager;
  }

  /**
   * Search for tracks across platforms
   * @param {string} query - The search query
   * @param {object} options - Search options
   * @returns {Promise<object>} - Search results
   */
  async search(query, options = {}) {
    const {
      platform = 'spotify',
      requester = null,
      limit = 600
    } = options;

    try {
      const normalizedPlatform = this.normalizePlatform(platform);

      // Detect source from query for auto-platform selection
      const detectedPlatform = this.detectSourceFromUrl(query);

      let searchPlatform = detectedPlatform || normalizedPlatform;

      // For direct links detected through URL analysis, always use http
      if (this.isUrl(query) && !detectedPlatform && !this.isFromMajorPlatform(query)) {
        searchPlatform = 'http';
      }

      // Format the query based on the platform
      let formattedQuery = query;

      // Apply special formatting for different search engines
      if (!this.isUrl(query)) {
        switch (searchPlatform) {
          case 'youtube':
            formattedQuery = this.youtubeSearchQuery(query);
            break;
          case 'spotify':
            formattedQuery = this.spotifySearchQuery(query);
            break;
          case 'soundcloud':
            formattedQuery = this.soundcloudSearchQuery(query);
            break;
          case 'apple':
            formattedQuery = this.appleSearchQuery(query);
            break;
          case 'deezer':
            formattedQuery = this.deezerSearchQuery(query);
            break;
          case 'jiosaavn':
            formattedQuery = this.jioSaavnSearchQuery(query);
            break;
        }
      } else if (searchPlatform === 'spotify') {
        // Handle Spotify URLs differently to extract proper data
        const spotifyType = this.getSpotifyResourceType(query);
      }

      // Try to perform the search with error handling
      let results = null;
      try {
        results = await client.music.search(query, {
          engine: searchPlatform,
          requester
        });
      } catch (searchError) {
        // If the error is related to nodes, log but don't break
        if (searchError.message && searchError.message.includes('No available nodes')) {
          logger.warn('SearchManager', 'No connected Lavalink nodes available. Continuing to process.');

          // For direct links, we can create a synthetic result
          if (searchPlatform === 'http' && this.isDirectAudioLink(query)) {
            results = {
              type: 'TRACK',
              tracks: [{
                title: this.extractFilenameFromUrl(query),
                author: 'Unknown Artist',
                uri: query,
                length: 0,
                isStream: true,
                thumbnail: this.getDefaultThumbnail('http'),
                requester
              }]
            };
          } else {
            throw new Error(`Cannot search due to node connection issues. Please try again later.`);
          }
        } else {
          // For other errors, rethrow
          throw searchError;
        }
      }

      if (!results) {
        logger.warn('SearchManager', `No results found for query: ${query}`);
        return null;
      }

      // Limit the number of results
      if (results.tracks.length > limit) {
        results.tracks = results.tracks.slice(0, limit);
      }

      // Enhance track information
      results.tracks = results.tracks.map(track => {
        // Ensure track has a thumbnail
        if (!track.thumbnail) {
          track.thumbnail = this.getDefaultThumbnail(track.uri);
        }
        return track;
      });

      return results;
    } catch (error) {
      logger.error('SearchManager', `Failed to search for tracks: ${query}`, error);
      return null;
    }
  }

  /**
   * Extract a readable filename from a URL
   * @param {string} url - The URL to extract from
   * @returns {string} - The extracted filename
   */
  extractFilenameFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop();

      // Remove extension if present
      const nameWithoutExt = filename.split('.').slice(0, -1).join('.');

      // Replace dashes and underscores with spaces and capitalize words
      return nameWithoutExt
        ? nameWithoutExt.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        : 'Direct Audio File';
    } catch (error) {
      return 'Direct Audio File';
    }
  }

  /**
   * Get Spotify resource type from URL
   * @param {string} url - The Spotify URL
   * @returns {string} - The resource type (track, album, playlist)
   */
  getSpotifyResourceType(url) {
    if (!url.includes('spotify.com')) return null;

    if (url.includes('/track/')) return 'track';
    if (url.includes('/album/')) return 'album';
    if (url.includes('/playlist/')) return 'playlist';
    if (url.includes('/artist/')) return 'artist';

    return 'unknown';
  }

  /**
   * Get JioSaavn resource type from URL
   * @param {string} url - The JioSaavn URL
   * @returns {string} - The resource type (song, album, playlist, artist)
   */
  getJioSaavnResourceType(url) {
    if (!url.includes('jiosaavn.com')) return null;

    if (url.includes('/song/')) return 'song';
    if (url.includes('/album/')) return 'album';
    if (url.includes('/playlist/')) return 'playlist';
    if (url.includes('/artist/')) return 'artist';

    return 'unknown';
  }

  /**
   * Detect the platform from a URL
   * @param {string} url - The URL to check
   * @returns {string|null} - The detected platform or null if not a URL
   */
  detectSourceFromUrl(url) {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) return null;

    // First check if it's a direct audio link which takes priority
    if (this.isDirectAudioLink(url)) {
      return 'http';
    }

    // Check for YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'youtube';
    }

    // check for Apple music
    if (url.includes('music.apple.com')) {
      return 'apple';
    }

    // Check for deezer
    if (url.includes('deezer.com')) {
      return 'deezer';
    }

    // Check for Spotify
    if (url.includes('spotify.com')) {
      return 'spotify';
    }

    // Check for SoundCloud
    if (url.includes('soundcloud.com')) {
      return 'soundcloud';
    }

    // Check for Twitch
    if (url.includes('twitch.tv')) {
      return 'twitch';
    }

    // Check for Bandcamp
    if (url.includes('bandcamp.com')) {
      return 'bandcamp';
    }

    // Check for Jio Saavan
    if (url.includes('jiosaavn.com')) {
      return 'jiosaavn';
    }

    // Double check for direct links again
    if (this.isUrl(url)) {
      return 'http';
    }

    return null;
  }

  /**
   * Check if a URL is a direct audio link
   * @param {string} url - The URL to check
   * @returns {boolean} - Whether the URL is a direct audio link
   */
  isDirectAudioLink(url) {
    if (!url || typeof url !== 'string') return false;

    const audioExtensions = ['.mp3', '.flac', '.wav', '.ogg', '.m4a', '.aac', '.wma'];

    // Check if the URL ends with an audio extension
    for (const ext of audioExtensions) {
      if (url.toLowerCase().endsWith(ext)) {
        return true;
      }
    }

    // Check if URL contains audio-related query parameters
    const hasAudioParams = url.includes('?') &&
                         (url.includes('audio=') ||
                          url.includes('format=audio') ||
                          url.includes('type=audio'));

    // If the URL is not from any major music platforms, treat as direct
    const majorPlatforms = ['youtube.com', 'youtu.be', 'spotify.com', 'soundcloud.com',
                            'twitch.tv', 'bandcamp.com', 'apple.com', 'music.apple.com',
                            'deezer.com', 'tidal.com', 'jiosaavn.com'];

    const isFromMajorPlatform = majorPlatforms.some(platform => url.includes(platform));

    // If it's a valid URL and not from major platforms, consider it a direct link
    return hasAudioParams || (this.isUrl(url) && !isFromMajorPlatform);
  }

  /**
   * Normalize the platform name
   * @param {string} platform - The platform name
   * @returns {string} - The normalized platform name
   */
  normalizePlatform(platform) {
    const platformMap = {
      'yt': 'youtube',
      'youtube': 'youtube',
      'sp': 'spotify',
      'spotify': 'spotify',
      'sc': 'soundcloud',
      'soundcloud': 'soundcloud',
      'am' : 'apple',
      'apple' : 'apple',
      'dz' : 'deezer',
      'deezer' : 'deezer',
      'tw': 'twitch',
      'twitch': 'twitch',
      'bc': 'bandcamp',
      'bandcamp': 'bandcamp',
      'jiosaavn': 'jiosaavn',
      'js': 'jiosaavn',
      'saavn': 'jiosaavn',
      'http': 'http',
      'direct': 'http'
    };

    return platformMap[platform.toLowerCase()] || 'youtube';
  }

  /**
   * Check if a query is a direct URL
   * @param {string} query - The query to check
   * @returns {boolean} - Whether the query is a URL
   */
  isUrl(query) {
    try {
      new URL(query);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Convert search terms to a YouTube search query
   * @param {string} query - The search query
   * @returns {string} - The YouTube search query
   */
  youtubeSearchQuery(query) {
    if (this.isUrl(query)) return query;

    return `ytsearch:${query}`;
  }

  /**
   * Convert search terms to a Deezer search query
   * @param {string} query - The search query
   * @returns {string} - The Deezer search query
   */
  deezerSearchQuery(query) {
    if (this.isUrl(query)) return query;

    return `dzsearch:${query}`;
  }

  /**
   * Convert search terms to a Apple search query
   * @param {string} query - The search query
   * @returns {string} - The Apple search query
   */
  appleSearchQuery(query) {
    if (this.isUrl(query)) return query;

    return `amsearch:${query}`;
  }

  /**
   * Convert search terms to a Spotify search query
   * @param {string} query - The search query
   * @returns {string} - The Spotify search query
   */
  spotifySearchQuery(query) {
    if (this.isUrl(query)) return query;

    return `spsearch:${query}`;
  }

  /**
   * Convert search terms to a SoundCloud search query
   * @param {string} query - The search query
   * @returns {string} - The SoundCloud search query
   */
  soundcloudSearchQuery(query) {
    if (this.isUrl(query)) return query;

    return `scsearch:${query}`;
  }

  /**
   * Convert search terms to a JioSaavn search query
   * @param {string} query - The search query
   * @returns {string} - The JioSaavn search query
   */
  jioSaavnSearchQuery(query) {
    if (this.isUrl(query)) return query;

    return `jiosaavn:${query}`;
  }

  /**
   * Process search results for display
   * @param {object} results - The search results
   * @returns {object} - Processed search results
   */
  processResults(results) {
    if (!results || !results.tracks || !results.tracks.length) {
      return null;
    }

    return {
      playlist: results.playlist,
      tracks: results.tracks.map(track => ({
        title: track.title,
        author: track.author,
        duration: track.length,
        url: track.uri,
        thumbnail: track.thumbnail || this.getDefaultThumbnail(track.uri),
        platform: this.getPlatformFromUrl(track.uri)
      }))
    };
  }

  /**
   * Get the platform from a URL
   * @param {string} url - The URL
   * @returns {string} - The platform name
   */
  getPlatformFromUrl(url) {
    return this.detectSourceFromUrl(url) || 'unknown';
  }

  /**
   * Get a default thumbnail for a track
   * @param {string} url - The track URL
   * @returns {string} - The default thumbnail URL
   */
  getDefaultThumbnail(url) {
    const platform = this.getPlatformFromUrl(url);

    const defaultThumbnails = {
      'youtube': 'https://i.imgur.com/vbj8qAG.png',
      'spotify': 'https://i.imgur.com/NgKnVZP.png',
      'soundcloud': 'https://i.imgur.com/fxPJUEu.png',
      'twitch': 'https://i.imgur.com/ZG39gVB.png',
      'bandcamp': 'https://i.imgur.com/VDk28Wr.png',
      'jiosaavn': 'https://i.imgur.com/6LfVhpQ.png', // JioSaavn logo
      'http': 'https://pbs.twimg.com/media/Fdp2MLhagAAPD_O?format=jpg&name=large'
    };

    return defaultThumbnails[platform] || 'https://i.imgur.com/Yh6QjhJ.png';
  }

  /**
   * Check if URL is from a major music platform
   * @param {string} url - The URL to check
   * @returns {boolean} - Whether the URL is from a major platform
   */
  isFromMajorPlatform(url) {
    if (!url || typeof url !== 'string') return false;

    const majorPlatforms = ['youtube.com', 'youtu.be', 'spotify.com', 'soundcloud.com',
                            'twitch.tv', 'bandcamp.com', 'apple.com', 'music.apple.com',
                            'deezer.com', 'tidal.com', 'jiosaavn.com'];

    return majorPlatforms.some(platform => url.includes(platform));
  }
}
