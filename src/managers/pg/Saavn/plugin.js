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
import {
  Kazagumo,
  KazagumoError,
  KazagumoPlugin as Plugin,
  KazagumoTrack,
} from 'kazagumo';
import { request } from 'undici';

// ANSI Color Codes
const COLORS = {
  RESET: "\x1b[0m",
  RED: "\x1b[31m",
  CYAN: "\x1b[36m",
  YELLOW: "\x1b[33m",
  BLUE: "\x1b[34m", // For plugin name prefix
};

// Watermark for logs
const LOG_PREFIX_DEBUG = `${COLORS.BLUE}[KazagumoJioSaavn]${COLORS.RESET}`;
const LOG_PREFIX_ERROR = `${COLORS.RED}[KazagumoJioSaavn]${COLORS.RESET}`;


// Regular expressions for matching JioSaavn URLs
const REGEX = /(?:https?:\/\/(?:www\.)?jiosaavn\.com\/)(song|album|playlist|artist)\/([^/?&]+)/;

/**
 * JioSaavn Plugin for Kazagumo - Allows playback of songs from JioSaavn
 * @extends KazagumoPlugin
 */
export class KazagumoPlugin extends Plugin {
  /**
   * Create a new JioSaavn Plugin
   * @param {Object} options - The plugin options
   * @param {string} [options.baseUrl='https://saavn.dev/api'] - The base URL for JioSaavn API
   * @param {number} [options.searchLimit=10] - The maximum number of tracks to return in search results
   * @param {boolean} [options.debug=false] - Enable debug logging
   */
  constructor(options = {}) {
    super();
    
    this.options = {
      baseUrl: options.baseUrl || 'https://saavn.dev/api',
      searchLimit: options.searchLimit && options.searchLimit > 0 && options.searchLimit < 50
        ? options.searchLimit
        : 10,
      debug: options.debug || false
    };

    this.baseUrl = this.options.baseUrl;
    this.kazagumo = null;
    this._search = null;

    // Define handlers for different JioSaavn content types (currently not used by search, but kept for potential future use/direct calls)
    this.methods = {
      song: this.getSong.bind(this),
      album: this.getAlbum.bind(this),
      playlist: this.getPlaylist.bind(this),
      artist: this.getArtist.bind(this),
      songLink: this.getSongsByLink.bind(this),
      albumLink: this.getAlbumByLink.bind(this),
      playlistLink: this.getPlaylistByLink.bind(this),
      artistLink: this.getArtistByLink.bind(this)
    };
    
    if (this.options.debug) {
      this.debug('Plugin initialized with options:', this.options);
    }
  }

  /**
   * Debug logging with color and watermark if debug mode is enabled.
   * @private
   */
  debug(...args) {
    if (this.options.debug) {
      const messageParts = args.map(arg => 
        typeof arg === 'string' ? `${COLORS.CYAN}${arg}${COLORS.RESET}` : arg
      );
      console.log(`${LOG_PREFIX_DEBUG}`, ...messageParts);
    }
  }

  /**
   * Error logging with color and watermark.
   * @private
   */
  error(...args) {
    const messageParts = args.map(arg => 
      typeof arg === 'string' ? `${COLORS.RED}${arg}${COLORS.RESET}` : arg
    );
    console.error(`${LOG_PREFIX_ERROR} ${WATERMARK}`, ...messageParts);
  }

  /**
   * Load the plugin into Kazagumo
   * @param {Kazagumo} kazagumo - The Kazagumo instance
   */
  load(kazagumo) {
    this.kazagumo = kazagumo;
    this._search = kazagumo.search.bind(kazagumo);
    kazagumo.search = this.search.bind(this);
    this.debug('Plugin loaded successfully');
  }

  /**
   * Search for tracks using JioSaavn
   * @param {string} query - The search query or URL
   * @param {Object} options - Search options
   * @returns {Promise<KazagumoSearchResult>}
   */
  async search(query, options = {}) {
    if (!this.kazagumo || !this._search) {
      throw new KazagumoError(1, 'kazagumo-jiosaavn is not loaded yet.');
    }

    if (!query) {
      throw new KazagumoError(3, 'Query is required');
    }

    this.debug(`Search called with query: "${query}"`);

    const urlMatch = REGEX.exec(query);
    let type, id;

    if (urlMatch) {
        [, type, id] = urlMatch;
        // Clean up the ID - some JioSaavn IDs might have additional path segments
        id = id.split('/')[0];
        this.debug(`Parsed URL. Type: ${type}, ID (from REGEX): ${id}`);
    }

    const isUrl = /^https?:\/\//.test(query);

    // Handle JioSaavn URLs
    if (isUrl && query.includes('jiosaavn.com')) {
      this.debug(`Handling JioSaavn URL directly`);
      try {
        let result;
        // Determine the content type from URL structure and use the appropriate method
        if (query.includes('/song/')) {
          result = await this.getSongsByLink(query, options?.requester);
        } else if (query.includes('/album/')) {
          result = await this.getAlbumByLink(query, options?.requester);
        } else if (query.includes('/playlist/')) {
          result = await this.getPlaylistByLink(query, options?.requester);
        } else if (query.includes('/artist/')) {
          result = await this.getArtistByLink(query, options?.requester);
        } else {
          // Generic fallback for unknown JioSaavn URL patterns - try song endpoint
          this.debug(`Unknown JioSaavn URL pattern, attempting to fetch as song link: ${query}`);
          result = await this.getSongsByLink(query, options?.requester);
        }

        const loadType = (result.tracks.length === 1) ? 'TRACK' : 'PLAYLIST';
        const playlistName = result.name || undefined;

        const tracks = result.tracks.filter(track => track !== null && track !== undefined);
        return this.buildSearch(playlistName, tracks, loadType);
      } catch (e) {
        this.error('Error handling JioSaavn URL:', e.message, e);
        return this.buildSearch(undefined, [], 'SEARCH'); // Or 'ERROR' type
      }
    }
    // Handle JioSaavn text search queries (engine='jiosaavn')
    else if (options?.engine === 'jiosaavn' && !isUrl) {
      this.debug('Handling JioSaavn search query (engine specified)');
      try {
        const result = await this.searchSongs(query, options?.requester);
        return this.buildSearch(undefined, result.tracks, 'SEARCH');
      } catch (e) {
        this.error('Error searching JioSaavn with query:', e.message, e);
        return this.buildSearch(undefined, [], 'SEARCH'); // Or 'ERROR' type
      }
    }

    // Fall back to default Kazagumo search
    this.debug('Falling back to default Kazagumo search');
    return this._search(query, options);
  }

  /**
   * Build a search result object
   * @param {string} playlistName - The name of the playlist
   * @param {KazagumoTrack[]} tracks - The tracks found
   * @param {string} type - The search result type
   * @returns {KazagumoSearchResult}
   */
  buildSearch(playlistName, tracks = [], type) {
    return {
      playlistName,
      tracks,
      type: type ?? 'TRACK',
    };
  }

  /**
   * Search for songs on JioSaavn
   * @param {string} query - The search query
   * @param {*} requester - The user who requested the search
   * @returns {Promise<{tracks: KazagumoTrack[]}>}
   */
  async searchSongs(query, requester) {
    const searchUrl = `${this.baseUrl}/search/songs?query=${encodeURIComponent(query)}&limit=${this.options.searchLimit}`;
    this.debug(`Searching songs with URL: ${searchUrl}`);

    try {
      const response = await request(searchUrl, { method: 'GET' });
      
      if (response.statusCode !== 200) {
        const errorBody = await response.body.text();
        this.error(`API error during song search ${response.statusCode}:`, errorBody);
        throw new Error(`JioSaavn API error: ${response.statusCode}`);
      }

      const apiResponse = await response.body.json();

      if (!apiResponse.success || !apiResponse.data || !Array.isArray(apiResponse.data.results)) {
        this.debug('No results found or unexpected data structure from song search');
        return { tracks: [] };
      }

      const tracks = apiResponse.data.results
        .map(track => this.buildKazagumoTrack(track, requester, 'search'))
        .filter(t => t !== null);
        
      this.debug(`Found ${tracks.length} tracks for query: "${query}"`);
      return { tracks };
    } catch (error) {
      this.error('Error in searchSongs:', error.message, error);
      return { tracks: [] };
    }
  }

  /**
   * Get songs directly from a JioSaavn link
   * @param {string} link - The JioSaavn link
   * @param {*} requester - The user who requested the songs
   * @returns {Promise<{tracks: KazagumoTrack[], name?: string}>}
   */
  async getSongsByLink(link, requester) {
    const apiUrl = `${this.baseUrl}/songs?link=${encodeURIComponent(link)}`;
    this.debug(`Getting songs by link: ${apiUrl}`);

    try {
      const response = await request(apiUrl, { method: 'GET' });
      
      if (response.statusCode !== 200) {
        const errorBody = await response.body.text();
        this.error(`API error fetching songs by link ${response.statusCode}:`, errorBody);
        throw new Error(`JioSaavn API error: ${response.statusCode}`);
      }

      const apiResponse = await response.body.json();

      if (!apiResponse.success || !apiResponse.data || !Array.isArray(apiResponse.data)) {
        this.debug('No valid data found or unexpected data structure from songs by link.');
        return { tracks: [] };
      }

      const tracks = apiResponse.data
        .map(track => this.buildKazagumoTrack(track, requester, 'link_result_song'))
        .filter(t => t !== null);
      
      let resultName = undefined;
      if (tracks.length === 1 && apiResponse.data[0].name) {
        resultName = apiResponse.data[0].name;
      }

      return {
        tracks,
        name: resultName
      };
    } catch (error) {
      this.error('Error in getSongsByLink:', error.message, error);
      return { tracks: [] };
    }
  }

  /**
   * Get a single song from JioSaavn by ID
   * @param {string} id - The song ID
   * @param {*} requester - The user who requested the track
   * @returns {Promise<{tracks: KazagumoTrack[], name?: string}>}
   */
  async getSong(id, requester) {
    id = id.split('/')[0].split('?')[0]; // Clean the ID
    const songUrl = `${this.baseUrl}/songs/${id}`;
    this.debug(`Getting song by ID: ${songUrl}`);
    
    try {
      const response = await request(songUrl, { method: 'GET' });
      
      if (response.statusCode !== 200) {
        const errorBody = await response.body.text();
        this.error(`API error fetching song by ID ${response.statusCode}:`, errorBody);
        throw new Error(`JioSaavn API error: ${response.statusCode}`);
      }

      const apiResponse = await response.body.json();

      if (!apiResponse.success || !apiResponse.data || !Array.isArray(apiResponse.data) || apiResponse.data.length === 0) {
        this.debug('Song not found by ID or unexpected data structure.');
        return { tracks: [] };
      }

      const trackData = apiResponse.data[0]; // API returns an array even for a single song ID
      const track = this.buildKazagumoTrack(trackData, requester, 'song_detail');

      return {
        name: trackData.name,
        tracks: track ? [track] : []
      };
    } catch (error) {
      this.error('Error in getSong:', error.message, error);
      return { tracks: [] };
    }
  }

  /**
   * Get album tracks from JioSaavn by ID
   * @param {string} id - The album ID
   * @param {*} requester - The user who requested the album
   * @returns {Promise<{tracks: KazagumoTrack[], name: string}>}
   */
  async getAlbum(id, requester) {
    const albumUrl = `${this.baseUrl}/albums?id=${id}`;
    this.debug(`Getting album by ID: ${albumUrl}`);
    
    try {
      const response = await request(albumUrl, { method: 'GET' });
      
      if (response.statusCode !== 200) {
        const errorBody = await response.body.text();
        this.error(`API error fetching album by ID ${response.statusCode}:`, errorBody);
        throw new Error(`JioSaavn API error: ${response.statusCode}`);
      }

      const apiResponse = await response.body.json();
      const albumData = apiResponse.data;

      if (!apiResponse.success || !albumData || !albumData.songs || !Array.isArray(albumData.songs)) {
        this.debug('Album not found by ID or missing songs array.');
        return { tracks: [], name: albumData?.name || 'Unknown Album' };
      }

      const tracks = albumData.songs
        .map(track => this.buildKazagumoTrack(track, requester, 'album_song'))
        .filter(t => t !== null);
        
      this.debug(`Found ${tracks.length} tracks for album "${albumData.name}" (ID fetch)`);
      
      return {
        tracks,
        name: albumData.name || 'Unknown Album'
      };
    } catch (error) {
      this.error('Error in getAlbum:', error.message, error);
      return { tracks: [], name: 'Unknown Album' };
    }
  }

  /**
   * Get album tracks from JioSaavn using a direct link
   * @param {string} link - Direct link to the album on JioSaavn
   * @param {*} requester - The user who requested the album
   * @returns {Promise<{tracks: KazagumoTrack[], name: string}>}
   */
  async getAlbumByLink(link, requester) {
    const albumUrl = `${this.baseUrl}/albums?link=${encodeURIComponent(link)}`;
    this.debug(`Getting album by link: ${albumUrl}`);
    
    try {
      const response = await request(albumUrl, { method: 'GET' });
      
      if (response.statusCode !== 200) {
        const errorBody = await response.body.text();
        this.error(`API error fetching album by link ${response.statusCode}:`, errorBody);
        throw new Error(`JioSaavn API error: ${response.statusCode}`);
      }

      const apiResponse = await response.body.json();
      const albumData = apiResponse.data;

      if (!apiResponse.success || !albumData || !albumData.songs || !Array.isArray(albumData.songs)) {
        this.debug('Album not found by link or missing songs array.');
        return { tracks: [], name: albumData?.name || 'Unknown Album' };
      }

      const tracks = albumData.songs
        .map(track => this.buildKazagumoTrack(track, requester, 'album_link_song'))
        .filter(t => t !== null);
        
      this.debug(`Found ${tracks.length} tracks for album "${albumData.name}" (link fetch)`);
      
      return {
        tracks,
        name: albumData.name || 'Unknown Album'
      };
    } catch (error) {
      this.error('Error in getAlbumByLink:', error.message, error);
      return { tracks: [], name: 'Unknown Album' };
    }
  }

  /**
   * Get playlist tracks from JioSaavn by ID
   * @param {string} id - The playlist ID
   * @param {*} requester - The user who requested the playlist
   * @returns {Promise<{tracks: KazagumoTrack[], name: string}>}
   */
  async getPlaylist(id, requester) {
    const playlistUrl = `${this.baseUrl}/playlists?id=${id}`;
    this.debug(`Getting playlist by ID: ${playlistUrl}`);
    
    try {
      const response = await request(playlistUrl, { method: 'GET' });
      
      if (response.statusCode !== 200) {
        const errorBody = await response.body.text();
        this.error(`API error fetching playlist by ID ${response.statusCode}:`, errorBody);
        throw new Error(`JioSaavn API error: ${response.statusCode}`);
      }

      const apiResponse = await response.body.json();
      const playlistData = apiResponse.data;

      if (!apiResponse.success || !playlistData || !playlistData.songs || !Array.isArray(playlistData.songs)) {
        this.debug('Playlist not found by ID or missing songs array.');
        return { tracks: [], name: playlistData?.name || 'Unknown Playlist' };
      }

      const tracks = playlistData.songs
        .map(track => this.buildKazagumoTrack(track, requester, 'playlist_song'))
        .filter(t => t !== null);
        
      this.debug(`Found ${tracks.length} tracks for playlist "${playlistData.name}" (ID fetch)`);
      
      return {
        tracks,
        name: playlistData.name || 'Unknown Playlist'
      };
    } catch (error) {
      this.error('Error in getPlaylist:', error.message, error);
      return { tracks: [], name: 'Unknown Playlist' };
    }
  }

  /**
   * Get playlist tracks from JioSaavn using a direct link
   * @param {string} link - Direct link to the playlist on JioSaavn
   * @param {*} requester - The user who requested the playlist
   * @returns {Promise<{tracks: KazagumoTrack[], name: string}>}
   */
  async getPlaylistByLink(link, requester) {
    const playlistUrl = `${this.baseUrl}/playlists?link=${encodeURIComponent(link)}`;
    this.debug(`Getting playlist by link: ${playlistUrl}`);
    
    try {
      const response = await request(playlistUrl, { method: 'GET' });
      
      if (response.statusCode !== 200) {
        const errorBody = await response.body.text();
        this.error(`API error fetching playlist by link ${response.statusCode}:`, errorBody);
        throw new Error(`JioSaavn API error: ${response.statusCode}`);
      }

      const apiResponse = await response.body.json();
      const playlistData = apiResponse.data;

      if (!apiResponse.success || !playlistData || !playlistData.songs || !Array.isArray(playlistData.songs)) {
        this.debug('Playlist not found by link or missing songs array.');
        return { tracks: [], name: playlistData?.name || 'Unknown Playlist' };
      }

      const tracks = playlistData.songs
        .map(track => this.buildKazagumoTrack(track, requester, 'playlist_link_song'))
        .filter(t => t !== null);
        
      this.debug(`Found ${tracks.length} tracks for playlist "${playlistData.name}" (link fetch)`);
      
      return {
        tracks,
        name: playlistData.name || 'Unknown Playlist'
      };
    } catch (error) {
      this.error('Error in getPlaylistByLink:', error.message, error);
      return { tracks: [], name: 'Unknown Playlist' };
    }
  }

  /**
   * Get artist top songs from JioSaavn by ID
   * @param {string} id - The artist ID
   * @param {*} requester - The user who requested the artist
   * @returns {Promise<{tracks: KazagumoTrack[], name: string}>}
   */
  async getArtist(id, requester) {
    const artistUrl = `${this.baseUrl}/artists?id=${id}`;
    this.debug(`Getting artist by ID: ${artistUrl}`);
    
    try {
      const response = await request(artistUrl, { method: 'GET' });
      
      if (response.statusCode !== 200) {
        const errorBody = await response.body.text();
        this.error(`API error fetching artist by ID ${response.statusCode}:`, errorBody);
        throw new Error(`JioSaavn API error: ${response.statusCode}`);
      }

      const apiResponse = await response.body.json();
      const artistData = apiResponse.data;

      if (!apiResponse.success || !artistData || !artistData.topSongs || !Array.isArray(artistData.topSongs)) {
        this.debug('Artist not found by ID or missing topSongs array. Attempting to fetch all artist songs.');
        // Try to get songs using the artist songs endpoint if topSongs is not available
        return await this.getArtistSongs(id, requester, artistData?.name || 'Unknown Artist');
      }

      const tracks = artistData.topSongs
        .map(track => this.buildKazagumoTrack(track, requester, 'artist_topsong'))
        .filter(t => t !== null);
        
      this.debug(`Found ${tracks.length} top tracks for artist "${artistData.name}" (ID fetch)`);
      
      return {
        tracks,
        name: artistData.name || 'Unknown Artist'
      };
    } catch (error) {
      this.error('Error in getArtist:', error.message, error);
      return { tracks: [], name: 'Unknown Artist' };
    }
  }

  /**
   * Get artist songs using the artists/{id}/songs endpoint (fallback or specific fetch)
   * @param {string} id - The artist ID
   * @param {*} requester - The user who requested the artist
   * @param {string} artistName - The artist name if already known
   * @returns {Promise<{tracks: KazagumoTrack[], name: string}>}
   */
  async getArtistSongs(id, requester, artistName = 'Unknown Artist') {
    const artistSongsUrl = `${this.baseUrl}/artists/${id}/songs?page=0&sortBy=popularity&sortOrder=desc`;
    this.debug(`Getting all artist songs by ID: ${artistSongsUrl}`);
    
    try {
      const response = await request(artistSongsUrl, { method: 'GET' });
      
      if (response.statusCode !== 200) {
        const errorBody = await response.body.text();
        this.error(`API error fetching all artist songs ${response.statusCode}:`, errorBody);
        throw new Error(`JioSaavn API error: ${response.statusCode}`);
      }

      const apiResponse = await response.body.json();

      if (!apiResponse.success || !apiResponse.data || !apiResponse.data.songs || !Array.isArray(apiResponse.data.songs)) {
        this.debug('No songs found for artist from all songs endpoint');
        return { tracks: [], name: artistName };
      }

      const tracks = apiResponse.data.songs
        .map(track => this.buildKazagumoTrack(track, requester, 'artist_songs_all'))
        .filter(t => t !== null);
        
      this.debug(`Found ${tracks.length} songs for artist "${artistName}" (all songs fetch)`);
      
      return {
        tracks,
        name: artistName
      };
    } catch (error) {
      this.error('Error in getArtistSongs:', error.message, error);
      return { tracks: [], name: artistName };
    }
  }

  /**
   * Get artist top songs from JioSaavn using a direct link
   * @param {string} link - Direct link to the artist on JioSaavn
   * @param {*} requester - The user who requested the artist
   * @returns {Promise<{tracks: KazagumoTrack[], name: string}>}
   */
  async getArtistByLink(link, requester) {
    const artistUrl = `${this.baseUrl}/artists?link=${encodeURIComponent(link)}`;
    this.debug(`Getting artist by link: ${artistUrl}`);
    
    try {
      const response = await request(artistUrl, { method: 'GET' });
      
      if (response.statusCode !== 200) {
        const errorBody = await response.body.text();
        this.error(`API error fetching artist by link ${response.statusCode}:`, errorBody);
        throw new Error(`JioSaavn API error: ${response.statusCode}`);
      }

      const apiResponse = await response.body.json();
      const artistData = apiResponse.data;

      if (!apiResponse.success || !artistData) {
        this.debug('Artist not found by link.');
        return { tracks: [], name: 'Unknown Artist' };
      }

      // If we have an ID but no topSongs, get all songs from the artist songs endpoint
      if (artistData.id && (!artistData.topSongs || !Array.isArray(artistData.topSongs) || artistData.topSongs.length === 0)) {
        this.debug(`Artist topSongs missing for "${artistData.name}" (link fetch), attempting to fetch all artist songs.`);
        return await this.getArtistSongs(artistData.id, requester, artistData.name || 'Unknown Artist');
      }

      const tracks = (artistData.topSongs || [])
        .map(track => this.buildKazagumoTrack(track, requester, 'artist_link_topsong'))
        .filter(t => t !== null);
        
      this.debug(`Found ${tracks.length} top tracks for artist "${artistData.name}" (link fetch)`);
      
      return {
        tracks,
        name: artistData.name || 'Unknown Artist'
      };
    } catch (error) {
      this.error('Error in getArtistByLink:', error.message, error);
      return { tracks: [], name: 'Unknown Artist' };
    }
  }

  /**
   * Build a Kazagumo track from JioSaavn track data
   * @param {Object} saavnTrack - The JioSaavn track data
   * @param {*} requester - The user who requested the track
   * @param {string} sourceType - For logging: origin of the track data (e.g., 'search', 'album_song')
   * @returns {KazagumoTrack|null}
   */
  buildKazagumoTrack(saavnTrack, requester, sourceType = 'unknown') {
    if (!saavnTrack || !saavnTrack.id) {
        this.debug(`Invalid or missing track data for sourceType: ${sourceType}. Track data:`, saavnTrack);
        return null;
    }

    // Duration is in seconds in API, convert to milliseconds
    const duration = saavnTrack.duration ? Number(saavnTrack.duration) * 1000 : 0;

    const downloadStreamUrl = this.getBestQualityUrl(saavnTrack.downloadUrl);
    if (!downloadStreamUrl) {
        this.debug(`No suitable download URL found for track ID ${saavnTrack.id} (source: ${sourceType}). Skipping track.`);
        return null;
    }

    let author = 'Unknown Artist';
    // Handle different artist data structures from the API
    if (typeof saavnTrack.primaryArtists === 'string' && saavnTrack.primaryArtists) {
        author = saavnTrack.primaryArtists;
    } else if (saavnTrack.artists && Array.isArray(saavnTrack.artists.primary) && saavnTrack.artists.primary.length > 0) {
        author = saavnTrack.artists.primary.map(artist => artist.name).join(', ');
    } else if (Array.isArray(saavnTrack.artistsAll) && saavnTrack.artistsAll.length > 0) { // Fallback for some API response structures
        author = saavnTrack.artistsAll.map(artist => artist.name).join(', ');
    }

    // Image: API provides an array of image objects { quality: "...", url: "..." }
    // Prefer 500x500, then 150x150, then first available.
    let artworkUrl = null;
    if (Array.isArray(saavnTrack.image) && saavnTrack.image.length > 0) {
        const preferredImage =
            saavnTrack.image.find(img => img.quality === '500x500') ||
            saavnTrack.image.find(img => img.quality === '150x150') ||
            saavnTrack.image[0];
        if (preferredImage && preferredImage.url) { // API uses 'url' for image links
            artworkUrl = preferredImage.url;
        }
    }

    try {
      const track = new KazagumoTrack(
        {
          encoded: '', // Kazagumo will fill this when resolved by Lavalink
          pluginInfo: {
            name: 'kazagumo@jiosaavn-plugin'
          },
          info: {
            sourceName: 'jiosaavn',
            identifier: saavnTrack.id,
            isSeekable: true,
            author: author,
            length: duration,
            isStream: false, // JioSaavn tracks are typically not live streams
            position: 0,
            title: saavnTrack.name || saavnTrack.title || 'Unknown Title', // API uses 'name', fallback to 'title' if structure varies
            uri: downloadStreamUrl, // This is what Lavalink will attempt to play
            artworkUrl: artworkUrl, // URL of the track's artwork
          },
        },
        requester
      ).setKazagumo(this.kazagumo);
      
      return track;
    } catch (error) {
      this.error(`Failed to create KazagumoTrack for JioSaavn track ID ${saavnTrack.id}:`, error.message, error);
      return null;
    }
  }

  /**
   * Get the best quality download URL from the available options
   * @param {Array<{quality: string, url: string}>} downloadUrls - The available download URLs with quality info
   * @returns {string|null}
   */
  getBestQualityUrl(downloadUrls) {
    if (!downloadUrls || !Array.isArray(downloadUrls) || downloadUrls.length === 0) {
      return null;
    }

    // Quality preference order (highest first). API uses "320kbps", "160kbps", "96kbps", etc.
    const qualityOrder = ['320kbps', '160kbps', '96kbps', '48kbps', '12kbps'];

    for (const quality of qualityOrder) {
      const foundUrlObject = downloadUrls.find(obj => obj.quality === quality);
      if (foundUrlObject && foundUrlObject.url) { // API uses 'url' for the link field in downloadUrl array
        return foundUrlObject.url;
      }
    }

    // If no preferred quality match found, return the first available URL that is not empty
    const firstAvailable = downloadUrls.find(obj => obj.url);
    if (firstAvailable) {
        return firstAvailable.url;
    }

    this.debug('No usable URL found in downloadUrls array:', downloadUrls);
    return null;
  }
}
