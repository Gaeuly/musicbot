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
import { PlayerManager } from '../../managers/PlayerManager.js';
import { SearchManager } from '../../managers/SearchManager.js';
import { embedManager } from '../../managers/EmbedManager.js';
import { logger } from '../../utils/logger.js';
import axios from 'axios';
import { ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType } from 'discord.js';

const ANILIST_API_URL = 'https://graphql.anilist.co';

// --- Configuration Constants ---
const DEFAULT_COUNT = 15;
const MAX_COUNT = 50;
const MIN_COUNT = 1;

const ANILIST_PAGE_SIZE = 50;
const TARGET_ANIME_POOL_SIZE = 300; // Increased from 250 for better diversity

const YOUTUBE_SEARCH_LIMIT_PER_QUERY = 5; // Increased from 3 for better results
const MIN_OP_DURATION_MS = 60000; // 1 minute
const MAX_OP_DURATION_MS = 300000; // 5 minutes

// Format priority - higher priority formats are more likely to have quality openings
const ANIME_FORMATS_PRIORITY = {
  'TV': 10,
  'TV_SHORT': 8,
  'MOVIE': 7,
  'ONA': 6,
  'OVA': 5,
  'SPECIAL': 3
};

const ANIME_FORMATS_WITH_OPS = Object.keys(ANIME_FORMATS_PRIORITY);

const MAX_CONCURRENT_SEARCHES = 8; // Increased from 5 for faster performance
const PROGRESS_UPDATE_INTERVAL_ANIME = 3; // Update search progress every X anime processed
const SEARCH_TIMEOUT_MS = 10000; // Timeout for search operations

// --- End of Configuration Constants ---

const ANILIST_QUERY = `
query (
  $page: Int, 
  $perPage: Int, 
  $sort: [MediaSort], 
  $genre_in: [String], 
  $averageScore_greater: Int, 
  $startDate_greater: FuzzyDateInt,
  $format_in: [MediaFormat],
  $status_in: [MediaStatus]
) {
  Page (page: $page, perPage: $perPage) {
    pageInfo {
      hasNextPage
      total
    }
    media (
      sort: $sort, 
      type: ANIME, 
      isAdult: false, 
      format_in: $format_in,
      status_in: $status_in,
      genre_in: $genre_in,
      averageScore_greater: $averageScore_greater,
      startDate_greater: $startDate_greater
    ) {
      id
      title {
        romaji
        english
        native
      }
      format
      averageScore
      popularity
      startDate { year }
      episodes
      genres
      duration
      studios(isMain: true) { nodes { name } }
    }
  }
}
`;

class AnimeOpeningsCommand extends Command {
  constructor() {
    super({
      name: 'animeopenings',
      description: 'Fetches random anime openings and plays them. Faster and smarter!',
      usage: 'animeopenings [--count <num>] [--year <YYYY>] [--genre <genre1,genre2,...>] [--min-score <0-100>]',
      aliases: ['aop', 'animeop', 'randomop'],
      category: 'misc',
      cooldown: 30,
      voiceRequired: true,
      examples: [
        'animeopenings',
        'animeopenings --count 10',
        'animeopenings --year 2020 --genre Action --count 5',
        'animeopenings --min-score 75',
        'animeopenings --genre "Sci-Fi,Adventure" --count 20',
      ],
    });
    
    // Cache for already found tracks to improve performance in subsequent runs
    this.trackCache = new Map();
  }

  _shuffleArray(array) {
    const newArray = [...array]; // Create a copy to avoid mutating the original
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  _parseArguments(args) {
    const options = { 
      count: DEFAULT_COUNT,
      parseErrors: [] 
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i].toLowerCase();
      const nextArg = args[i + 1];

      const ensureNextArg = (flagName) => {
        if (!nextArg) {
          options.parseErrors.push(`Missing value for ${flagName}.`);
          return false;
        }
        return true;
      };

      switch (arg) {
        case '--count':
        case '-c':
          if (ensureNextArg('--count')) {
            const num = parseInt(nextArg, 10);
            if (!isNaN(num)) {
              options.count = Math.max(MIN_COUNT, Math.min(num, MAX_COUNT));
            } else {
              options.parseErrors.push(`Invalid number for --count: "${nextArg}". Using default: ${options.count}.`);
            }
            i++;
          }
          break;
        case '--year':
          if (ensureNextArg('--year')) {
            const yearNum = parseInt(nextArg, 10);
            if (!isNaN(yearNum) && yearNum > 1940 && yearNum < 2100) {
              options.year = yearNum;
            } else {
              options.parseErrors.push(`Invalid value for --year: "${nextArg}". Must be a valid year (e.g., 2023).`);
            }
            i++;
          }
          break;
        case '--genre':
          if (ensureNextArg('--genre')) {
            options.genres = nextArg.split(',').map(g => g.trim().charAt(0).toUpperCase() + g.trim().slice(1).toLowerCase()).filter(g => g); // Capitalize genres
            if (options.genres.length === 0) {
              options.parseErrors.push(`Invalid or empty value for --genre: "${nextArg}".`);
              delete options.genres;
            }
            i++;
          }
          break;
        case '--min-score':
          if (ensureNextArg('--min-score')) {
            const scoreNum = parseInt(nextArg, 10);
            if (!isNaN(scoreNum) && scoreNum >= 0 && scoreNum <= 100) {
              options.minScore = scoreNum;
            } else {
              options.parseErrors.push(`Invalid value for --min-score: "${nextArg}". Must be 0-100.`);
            }
            i++;
          }
          break;
      }
    }
    return options;
  }

  async _fetchAnimePool(options, progressCallback) {
    const collectedAnime = [];
    let currentPage = 1;
    let hasNextPage = true;
    const fetchedIds = new Set();

    const variables = {
      page: currentPage,
      perPage: ANILIST_PAGE_SIZE,
      sort: ['POPULARITY_DESC', 'SCORE_DESC'], // Add score sorting for better results
      format_in: ANIME_FORMATS_WITH_OPS,
      status_in: ['RELEASING', 'FINISHED'],
    };

    if (options.year) variables.startDate_greater = parseInt(`${options.year}0000`); // YYYYMMDD
    if (options.genres) variables.genre_in = options.genres;
    if (options.minScore) variables.averageScore_greater = options.minScore;

    let totalFetchedFromApi = 0;
    const maxPagesToFetch = Math.ceil(TARGET_ANIME_POOL_SIZE / ANILIST_PAGE_SIZE) + 5; // Fetch more to ensure good pool

    while (hasNextPage && collectedAnime.length < TARGET_ANIME_POOL_SIZE && currentPage <= maxPagesToFetch) {
      variables.page = currentPage;
      try {
        const response = await axios.post(ANILIST_API_URL, { query: ANILIST_QUERY, variables }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000 // Add timeout to prevent hanging
        });
        
        const pageData = response.data?.data?.Page;

        if (!pageData || !pageData.media) {
          
          break; 
        }
        
        totalFetchedFromApi += pageData.media.length;

        for (const anime of pageData.media) {
          if (!fetchedIds.has(anime.id) && (anime.title.romaji || anime.title.english)) {
            // Calculate score for anime based on format and episodes
            const formatScore = ANIME_FORMATS_PRIORITY[anime.format] || 0;
            const hasEnoughEpisodes = anime.format === 'TV' ? (anime.episodes === null || anime.episodes === 0 || anime.episodes >= 4) : true;
            
            // Score bonus if anime is likely to have a good opening
            let bonusScore = 0;
            if (anime.averageScore && anime.averageScore > 70) bonusScore += 5;
            if (anime.popularity && anime.popularity > 10000) bonusScore += 5;
            
            // Only add anime with good format and enough episodes
            if (formatScore > 0 && hasEnoughEpisodes) {
              anime.animeScore = formatScore + bonusScore;
              collectedAnime.push(anime);
              fetchedIds.add(anime.id);
            }
          }
        }
        
        hasNextPage = pageData.pageInfo?.hasNextPage || false;
        currentPage++;
        
        if (progressCallback && currentPage % 2 === 0) {
          await progressCallback(collectedAnime.length, pageData.pageInfo?.total || TARGET_ANIME_POOL_SIZE);
        }
        
        if (collectedAnime.length >= TARGET_ANIME_POOL_SIZE) break;

      } catch (error) {
        logger.error('AnimeOpeningsCommand', 'AniList API error during pagination:', error.message, error.response?.data?.errors);
        // Try one more time before giving up
        if (error.response?.status === 429) {
          logger.warn('AnimeOpeningsCommand', 'Rate limited by AniList API, waiting before retry');
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        break;
      }
    }
    
    
    return collectedAnime;
  }
  
  _extractThemeTitle(themeString) {
    if (!themeString) return null;
    
    // Try to extract theme title with regex patterns
    const patterns = [
      /^"([^"]+)"/,                          // "Theme Name" by Artist
      /^(.*?)(?:\s+by\s+)/i,                 // Theme Name by Artist
      /^(.*?)(?:\s+\(eps|\s+（ｅｐ)/i,        // Theme Name (eps X-Y)
      /^(.*?)(?:\s+[-–]\s+)/                 // Theme Name - Artist
    ];
    
    for (const pattern of patterns) {
      const match = themeString.match(pattern);
      if (match && match[1]?.trim()) {
        return match[1].trim();
      }
    }
    
    // If all patterns fail, just return the first part of the string (up to 40 chars)
    return themeString.split(/\s+(?:by|[-–])/i)[0].trim().substring(0, 40);
  }

  _getSearchQueriesForAnime(anime) {
    const queries = new Set(); // Use a Set to avoid duplicates
    const animeTitle = anime.title.romaji || anime.title.english;
    const animeEnglishTitle = anime.title.english;
    const japaneseTitle = anime.title.native;
    const releaseYear = anime.startDate?.year;
    const mainStudio = anime.studios?.nodes?.[0]?.name;
    
    // Core keyword combinations for searching
    const coreKeywords = [`"${animeTitle}"`, 'opening', 'theme', 'op'];
    
    // First attempt - specific theme title if available
    if (anime.openingThemes && anime.openingThemes.length > 0) {
      const rawTheme = anime.openingThemes[0];
      const themeTitle = this._extractThemeTitle(rawTheme);

      if (themeTitle) {
        // Very specific queries first (most likely to find the exact opening)
        queries.add(`"${animeTitle}" "${themeTitle}" opening official`);
        queries.add(`${themeTitle} ${animeTitle} opening`);
        
        if (animeEnglishTitle && animeEnglishTitle !== animeTitle) {
          queries.add(`"${animeEnglishTitle}" "${themeTitle}" opening official`);
        }
        
        if (releaseYear) {
          queries.add(`${animeTitle} ${themeTitle} ${releaseYear} opening`);
        }
        
        // For very popular anime, theme title alone might work
        if (anime.popularity > 50000 || anime.averageScore > 80) {
          queries.add(`"${themeTitle}" anime opening official`);
        }
      }
    }

    // Generic queries with variations
    const addFormattedQueries = (title) => {
      if (!title) return;
      
      // Format variations
      queries.add(`"${title}" opening 1 official creditless`);
      queries.add(`"${title}" OP1 ${releaseYear || ''} official`);
      queries.add(`"${title}" opening 1 full`);
      queries.add(`"${title}" opening theme`);
      
      // Add studio name for more precision if available
      if (mainStudio) {
        queries.add(`"${title}" opening ${mainStudio}`);
      }
      
      // For TV anime, specify OP number
      if (anime.format === 'TV' || anime.format === 'TV_SHORT') {
        queries.add(`"${title}" OP 1 HD`);
      }
    };

    // Add queries for different title variants
    addFormattedQueries(animeTitle);
    if (animeEnglishTitle && animeEnglishTitle !== animeTitle) {
      addFormattedQueries(animeEnglishTitle);
    }
    
    // For anime with Japanese titles, try those too (might help with certain anime)
    if (japaneseTitle && queries.size < 15) {
      queries.add(`"${japaneseTitle}" opening official`);
    }
    
    return Array.from(queries);
  }

  _scoreTrack(track, anime) {
    // Base scoring system - returns a numerical score for how likely this track is to be the correct opening
    const trackTitleLower = track.title.toLowerCase();
    const animeRomajiLower = anime.title.romaji?.toLowerCase() || '';
    const animeEnglishLower = anime.title.english?.toLowerCase() || '';
    const nativeTitleLower = anime.title.native?.toLowerCase() || '';
    
    // Immediate disqualification for tracks of incorrect length
    if (track.duration < MIN_OP_DURATION_MS || track.duration > MAX_OP_DURATION_MS) {
      return -1000;
    }
    
    // Start with base score
    let score = 10;
    
    // Ideal duration for openings is typically 1:30 to 2:00
    const idealDuration = track.duration >= 85000 && track.duration <= 130000;
    if (idealDuration) score += 20;
    
    // Track title containing anime title (weighted by title type)
    let titleMatchScore = 0;
    if (animeRomajiLower && trackTitleLower.includes(animeRomajiLower)) {
      titleMatchScore = 30;
    } else if (animeEnglishLower && trackTitleLower.includes(animeEnglishLower)) {
      titleMatchScore = 25;
    } else if (nativeTitleLower && trackTitleLower.includes(nativeTitleLower)) {
      titleMatchScore = 20;
    }
    
    // Only apply title match if it's a significant match (to avoid false positives with short titles)
    const significantTitleMatch = 
      (animeRomajiLower.length > 3 && trackTitleLower.includes(animeRomajiLower)) ||
      (animeEnglishLower.length > 3 && trackTitleLower.includes(animeEnglishLower));
    
    if (significantTitleMatch) {
      score += titleMatchScore;
    }
    
    // Check for opening indicators (with position-based weighting)
    const indicators = {
      // Strong indicators
      "opening": 25,
      "op": 25,
      "op1": 35,
      "op 1": 35,
      "opening 1": 35,
      "opening theme": 30,
      "official": 25,
      "creditless": 25,
      "ncop": 30,
      "ノンクレジット": 30,  // Japanese for non-credit
      "pv": 10,              // Promotional Video
      
      // Weaker indicators
      "full": 10,
      "tv size": 20,
      "short ver": 15,
      
      // Bonus for specific video quality terms
      "hd": 5,
      "1080p": 10,
      "60fps": 5
    };
    
    // Add points for various quality indicators found in the title
    for (const [term, value] of Object.entries(indicators)) {
      if (trackTitleLower.includes(term)) {
        // Higher scoring if the term appears earlier in the title
        const position = trackTitleLower.indexOf(term);
        const positionFactor = position < trackTitleLower.length / 2 ? 1 : 0.7;
        score += value * positionFactor;
      }
    }
    
    // Penalties for tracks that are likely not what we want
    const penalties = {
      "amv": 80,
      "cover": 60,
      "remix": 60,
      "nightcore": 70,
      "ost": 40,
      "soundtrack": 30,
      "reaction": 80,
      "mashup": 60,
      "lyrics": 30,
      "instrumental": 40,
      "piano": 40,
      "guitar": 40,
      "8-bit": 50,
      "8bit": 50,
      "full version": 20,
      "extended": 25,
      "preview": 60,
      "trailer": 60,
      "teaser": 60,
      "live": 30,
      "concert": 40,
      "clip": 20,
      "ending": 120,
      "ed": 120,
      "english dub": 30,
      "english version": 30,
      "short version": 10
    };
    
    // Apply penalties
    for (const [term, penalty] of Object.entries(penalties)) {
      if (trackTitleLower.includes(term)) {
        score -= penalty;
      }
    }
    
    // Check for theme song title if available
    if (anime.openingThemes && anime.openingThemes.length > 0) {
      const themeTitle = this._extractThemeTitle(anime.openingThemes[0])?.toLowerCase();
      if (themeTitle && themeTitle.length > 2 && trackTitleLower.includes(themeTitle)) {
        score += 50;  // Very strong indicator this is the right track
      }
    }
    
    // Channel name bonuses
    if (track.author) {
      const channelNameLower = track.author.toLowerCase();
      if (channelNameLower.includes('official')) score += 15;
      if (channelNameLower.includes('aniplex') || 
          channelNameLower.includes('crunchyroll') || 
          channelNameLower.includes('funimation')) {
        score += 20;
      }
      if (channelNameLower.includes('topic') && channelNameLower.includes('music')) {
        score += 10; // YouTube auto-generated music channels are decent sources
      }
    }
    
    // Bonus for tracks from cached tracks that worked well previously
    if (this.trackCache.has(track.identifier)) {
      score += 30; // Significant bonus for tracks we've used successfully before
    }
    
    return score;
  }
  
  async _selectBestYouTubeTrack(youtubeSearchResults, anime) {
    if (!youtubeSearchResults || youtubeSearchResults.length === 0) return null;
    
    let bestTrack = null;
    let highestScore = -Infinity;
    const scoredTracks = [];

    for (const track of youtubeSearchResults) {
      const score = this._scoreTrack(track, anime);
      
      // Store the score for logging
      scoredTracks.push({
        title: track.title,
        duration: Math.round(track.duration / 1000),
        score: score
      });
      
      if (score > highestScore) {
        highestScore = score;
        bestTrack = track;
      }
    }
    
    // Log the top 3 scored tracks for debugging
    const topTracks = [...scoredTracks].sort((a, b) => b.score - a.score).slice(0, 3);
    
    // If highest score is too low but we have valid tracks, choose one with valid duration
    if (highestScore < 20 && youtubeSearchResults.length > 0) {
     
      const fallbackTrack = youtubeSearchResults.find(t => 
        t.duration >= MIN_OP_DURATION_MS && 
        t.duration <= MAX_OP_DURATION_MS &&
        !t.title.toLowerCase().includes("ending") &&
        !t.title.toLowerCase().includes("ed ")
      );
      
      if (fallbackTrack) {
        bestTrack = fallbackTrack;
        highestScore = 15; // Assign minimum viable score
      }
    }

    // If we found a good track, cache it for future use
    if (bestTrack && highestScore > 40) {
      this.trackCache.set(bestTrack.identifier, {
        animeId: anime.id,
        score: highestScore,
        timestamp: Date.now()
      });
      
      // Keep cache size reasonable (max 500 entries)
      if (this.trackCache.size > 500) {
        // Remove oldest entries
        const entries = [...this.trackCache.entries()];
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        for (let i = 0; i < 100; i++) {
          if (entries[i]) this.trackCache.delete(entries[i][0]);
        }
      }
    }

    return highestScore > 15 ? bestTrack : null; // Minimum threshold to accept a track
  }

  async _searchAndSelectOpening(anime, searchManager, requester) {
    // Check if we've already found an opening for this anime in cache
    const cachedTracks = [...this.trackCache.entries()]
      .filter(([_, data]) => data.animeId === anime.id)
      .sort((a, b) => b[1].score - a[1].score);
    
    if (cachedTracks.length > 0) {
      try {
        // Try to fetch the cached track again
        const cachedTrackId = cachedTracks[0][0];
        const trackInfo = await searchManager.getTrack(cachedTrackId, {requester});
        
        if (trackInfo) {
         
          return { animeTitle: anime.title.romaji || anime.title.english, track: trackInfo };
        }
      } catch (err) {
        // Cache miss, continue with normal search
      }
    }
    
    const searchQueries = this._getSearchQueriesForAnime(anime);
    
    
    // Try most promising queries first
    const queriesToTry = searchQueries.slice(0, 8); // Try more queries for better results
    
    // Create array of search promises with timeouts
    const searchPromises = queriesToTry.map(query => {
      // Wrap each search in a promise race with a timeout
      return Promise.race([
        searchManager.search(query, {
          platform: 'youtube',
          requester: requester,
          limit: YOUTUBE_SEARCH_LIMIT_PER_QUERY
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Search timeout')), SEARCH_TIMEOUT_MS)
        )
      ]).catch(err => {
        logger.debug(`[${anime.title.romaji}] Search error/timeout for "${query}": ${err.message}`);
        return { tracks: [] }; // Return empty result on error
      });
    });
    
    // Execute searches in order until we find a valid track
    for (const searchPromise of searchPromises) {
      try {
        const searchResult = await searchPromise;
        
        if (searchResult?.tracks?.length > 0) {
          const bestTrack = await this._selectBestYouTubeTrack(searchResult.tracks, anime);
          
          if (bestTrack) {
            return { animeTitle: anime.title.romaji || anime.title.english, track: bestTrack };
          }
        }
      } catch (error) {
        // Error already logged in searchPromises, continue to next query
        continue;
      }
    }
    
    return { animeTitle: anime.title.romaji || anime.title.english, track: null };
  }

  async execute({ message, args, client, musicManager }) {
    const { channel, member, guild } = message;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      return message.reply({ embeds: [embedManager.error('Voice Channel Required', 'You need to join a voice channel first!')] });
    }
    
    const permissions = voiceChannel.permissionsFor(guild.members.me);
    if (!permissions || !permissions.has('Connect') || !permissions.has('Speak')) {
      return message.reply({ embeds: [embedManager.error('Insufficient Permissions', 'I need permissions to join and speak in your voice channel!')] });
    }

    const commandOptions = this._parseArguments(args);

    if (commandOptions.parseErrors.length > 0) {
      const errorString = commandOptions.parseErrors.join('\n');
      await message.reply({ 
        embeds: [embedManager.warn('Invalid Arguments', `Found issues with your arguments:\n${errorString}\nPlease check the command usage.`)] 
      });
    }
    
    const desiredCount = commandOptions.count;

    let initialMsg;
    try {
      initialMsg = await message.reply({
        embeds: [embedManager.create({
          title: '🎶 Anime Openings Quest!',
          description: `Assembling your anime playlist... Aiming for ${desiredCount} openings.`,
          color: embedManager.colors.info,
          footer: { text: 'Powered by AniList & YouTube' }
        })]
      });
    } catch (e) {
      logger.error("AnimeOpeningsCommand: Failed to send initial message", e);
      return; 
    }

    const updateAniListProgress = async (fetched, totalApiItems) => {
      if (initialMsg.lastEditTimestamp && (Date.now() - initialMsg.lastEditTimestamp < 2000)) return; // Rate limit edits
        try {
            await initialMsg.edit({
                embeds: [embedManager.create({
                    title: '🎶 Anime Openings Quest!',
                    description: `Scanning AniList's archives for anime...`,
                    color: embedManager.colors.info,
                    footer: { text: `Anime Pool: ${fetched} / ~${TARGET_ANIME_POOL_SIZE} (target)` }
                })]
            });
            initialMsg.lastEditTimestamp = Date.now();
        } catch(e) { /* ignore */ }
    };
    
    await updateAniListProgress(0, TARGET_ANIME_POOL_SIZE);
    const animePool = await this._fetchAnimePool(commandOptions, updateAniListProgress);

    if (!animePool) {
      return initialMsg.edit({ embeds: [embedManager.error('AniList API Error', 'Could not fetch anime list from AniList. Please try again later.')] }).catch(()=>{});
    }
    if (animePool.length === 0) {
      let reason = "Could not find any anime from AniList with current settings.";
      if (commandOptions.year || commandOptions.genres || commandOptions.minScore) {
        reason = "No anime found matching your specific criteria (year, genre, score). Try broader filters or different values.";
      }
      return initialMsg.edit({ embeds: [embedManager.error('No Anime Found', reason)] }).catch(()=>{});
    }

    // Get the current player status before we possibly create a new one
    let player = musicManager.getPlayer(guild.id);
    const isCurrentlyPlaying = player && player.playing && !player.paused;
    
    // If currently playing, show warning with continue button
    if (isCurrentlyPlaying) {
      const continueButton = new ButtonBuilder()
        .setCustomId('continue_anime_op')
        .setLabel('Continue & Replace Current Queue')
        .setStyle(ButtonStyle.Danger);
      
      const cancelButton = new ButtonBuilder()
        .setCustomId('cancel_anime_op')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary);
      const actionRow = new ActionRowBuilder().addComponents(continueButton, cancelButton);

      

      const warningMsg = await initialMsg.edit({

        embeds: [embedManager.warning(

          'Currently Playing', 

          `I'm already playing music in this server! Continue to replace the current queue with anime openings?`

        )],

        components: [actionRow]

      });

      

      try {

        const confirmation = await warningMsg.awaitMessageComponent({

          filter: (i) => i.user.id === message.author.id && ['continue_anime_op', 'cancel_anime_op'].includes(i.customId),

          time: 30000,

          componentType: ComponentType.Button

        });

        

        if (confirmation.customId === 'cancel_anime_op') {

          await confirmation.update({

            embeds: [embedManager.info('Operation Cancelled', 'Anime openings search cancelled.')],

            components: []

          });

          return;

        }

        

        await confirmation.update({

          embeds: [embedManager.create({

            title: '🎶 Anime Openings Quest!',

            description: 'Starting to search for anime openings...',

            color: embedManager.colors.info

          })],

          components: []

        });

        

        // Continue with original message reference

        initialMsg = warningMsg;

      } catch (e) {

        // Timeout or error

        return initialMsg.edit({

          embeds: [embedManager.error('Timeout', 'No response received, cancelling anime openings search.')],

          components: []

        }).catch(() => {});

      }

    }

    // Randomize and take only what we need

    const prioritizedAnime = animePool

      .sort((a, b) => b.animeScore - a.animeScore) // Sort by calculated score

      .slice(0, Math.min(animePool.length, TARGET_ANIME_POOL_SIZE));

    

    // Add some randomness while keeping high-scoring anime

    const topTier = prioritizedAnime.slice(0, prioritizedAnime.length * 0.3); // Top 30%

    const remainder = this._shuffleArray(prioritizedAnime.slice(prioritizedAnime.length * 0.3));

    

    const selectedAnime = [...topTier, ...remainder].slice(0, Math.ceil(desiredCount * 2.5));

    

    // Create search manager instance

    const searchManager = new SearchManager(client);

    

    let processingMsg;

    try {

      processingMsg = await initialMsg.edit({

        embeds: [embedManager.create({

          title: '🎶 Anime Openings Quest!',

          description: `Selected ${selectedAnime.length} potential anime. Now searching for their openings...`,

          color: embedManager.colors.info,

          footer: { text: 'This may take a minute. Please wait.' }

        })]

      });

    } catch (e) {

      logger.error("AnimeOpeningsCommand: Failed to update message", e);

      processingMsg = initialMsg;

    }

    // Display progress updates to user

    let searchProgress = 0;

    let foundTracks = 0;

    

    const updateProgressMessage = async () => {

      if (processingMsg.lastEditTimestamp && (Date.now() - processingMsg.lastEditTimestamp < 3000)) return; // Rate limit edits

      

      try {

        await processingMsg.edit({

          embeds: [embedManager.create({

            title: '🎶 Anime Openings Search',

            description: `Searching for openings: ${searchProgress}/${selectedAnime.length} anime processed.\nFound ${foundTracks} valid openings so far...`,

            color: embedManager.colors.info,

            footer: { text: 'Please wait, this can take a minute.' }

          })]

        });

        processingMsg.lastEditTimestamp = Date.now();

      } catch (e) { /* ignore edit errors */ }

    };

    // Process anime in batches to avoid overloading

    const results = [];

    const batchSize = MAX_CONCURRENT_SEARCHES;

    

    for (let i = 0; i < selectedAnime.length; i += batchSize) {

      const batch = selectedAnime.slice(i, i + batchSize);

      

      const searchPromises = batch.map(anime => 

        this._searchAndSelectOpening(anime, searchManager, message.author)

          .then(result => {

            searchProgress++;

            

            if (result.track) {

              foundTracks++;

              results.push(result);

            }

            

            if (searchProgress % PROGRESS_UPDATE_INTERVAL_ANIME === 0 || foundTracks % 5 === 0) {

              updateProgressMessage();

            }

            

            return result;

          })

          .catch(error => {

            logger.error('AnimeOpeningsCommand', `Error searching for ${anime.title.romaji}:`, error);

            searchProgress++;

            return null;

          })

      );

      

      await Promise.all(searchPromises);

      

      // Check if we have enough tracks

      if (results.filter(r => r.track).length >= desiredCount) {

        break;

      }

    }

    // Filter valid results and shuffle them

    const validResults = results.filter(result => result && result.track);

    const shuffledResults = this._shuffleArray(validResults).slice(0, desiredCount);

    

    // If no valid openings were found

    if (shuffledResults.length === 0) {

      return processingMsg.edit({

        embeds: [embedManager.error('No Openings Found', 'Could not find any suitable anime openings. Please try again or adjust your search criteria.')]

      }).catch(() => {});

    }

    // Create a player if needed

    if (!player) {

      player = musicManager.createPlayer({

        guildId: guild.id,

        voiceChannelId: voiceChannel.id,

        textChannel: channel,

        selfDeaf: true,

        volume: 80

      });

    } else {

      player.queue.clear();

      

      // Connect to the voice channel if needed

    }

    // Build the queue of tracks

    for (const result of shuffledResults) {

      player.queue.add(result.track);

    }

    // Start playing if not already

    if (!player.playing && !player.paused) {

      player.play();

    }

    // Create final success message

    const foundMessage = `Found **${shuffledResults.length}/${desiredCount}** anime openings!`;

    const queueInfo = `Use standard music controls to manage playback.`;

    const animeInfo = shuffledResults.slice(0, 10).map((result, index) => 

      `**${index + 1}.** ${result.animeTitle.slice(0, 40)}`

    ).join('\n');

    

    const moreInfo = shuffledResults.length > 10 ? `\n*...and ${shuffledResults.length - 10} more!*` : '';

    return processingMsg.edit({

      embeds: [embedManager.success(

        '🎵 Anime Openings Ready!',

        `${foundMessage}\n${queueInfo}\n\n**Now in queue:**\n${animeInfo}${moreInfo}`

      )]

    }).catch(() => {});

  }

}

export default new AnimeOpeningsCommand()
      
