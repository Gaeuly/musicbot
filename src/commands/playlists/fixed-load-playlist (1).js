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
import { embedManager } from '../../managers/EmbedManager.js';
import { db } from '../../database/DatabaseManager.js';
import { PlayerManager } from '../../managers/PlayerManager.js';
import { SearchManager } from '../../managers/SearchManager.js';
import { logger } from '../../utils/logger.js';

/**
 * Command to load and play tracks from a playlist
 */
class LoadPlaylistCommand extends Command {
  constructor() {
    super({
      name: 'load-playlist',
      description: 'Load and play tracks from a playlist',
      usage: 'load-playlist <playlist_id> [--shuffle]',
      aliases: ['playlist-load', 'pl-load', 'playpl', 'play-playlist'],
      category: 'playlists',
      cooldown: 5,
      voiceRequired: true,
      examples: [
        'load-playlist 3',
        'load-playlist 2 --shuffle'
      ]
    });
  }

  /**
   * Execute the load-playlist command
   * @param {object} options - Command options
   * @returns {Promise<void>}
   */
  async execute({ message, args, client, musicManager }) {
    const { author, guild, member, channel } = message;

    if (!args.length) {
      const reply = embedManager.error(
        'Missing Playlist ID',
        `Please provide a playlist ID to load.\n\nUsage: \`${this.usage}\``
      );
      return message.reply({ embeds: [reply] });
    }

    // Parse playlist ID
    const playlistId = parseInt(args[0]);
    if (isNaN(playlistId)) {
      const reply = embedManager.error(
        'Invalid Playlist ID',
        'Please provide a valid playlist ID number.'
      );
      return message.reply({ embeds: [reply] });
    }

    // Check if shuffle flag is provided
    const shouldShuffle = args.includes('--shuffle');

    // Check if playlist exists
    const playlist = db.playlist.getPlaylistById(playlistId);
    if (!playlist) {
      const reply = embedManager.error(
        'Playlist Not Found',
        `Playlist with ID ${playlistId} was not found. Use \`playlists\` to see available playlists.`
      );
      return message.reply({ embeds: [reply] });
    }

    // Check ownership
    if (playlist.userId !== author.id) {
      const reply = embedManager.error(
        'Access Denied',
        'You do not have permission to load this playlist.'
      );
      return message.reply({ embeds: [reply] });
    }

    // Get tracks from playlist
    const tracks = db.playlist.getPlaylistTracks(playlistId);
    if (!tracks.length) {
      const reply = embedManager.error(
        'Empty Playlist',
        'This playlist is empty. Add tracks to it first.'
      );
      return message.reply({ embeds: [reply] });
    }

    // Send loading message
    const loadingEmbed = embedManager.create({
      color: embedManager.colors.default,
      title: '🔄 Loading Playlist...',
      description: `Loading ${tracks.length} tracks from playlist **${playlist.name}**...`,
      timestamp: true
    });

    const loadingMsg = await message.reply({ embeds: [loadingEmbed] });

    try {
      // Connect to the voice channel
      const voiceChannel = member.voice.channel;

      if (!voiceChannel) {
        const reply = embedManager.error(
          'Voice Channel Required',
          'You need to join a voice channel first!'
        );
        return loadingMsg.edit({ embeds: [reply] });
      }

      // Check permissions
      const permissions = voiceChannel.permissionsFor(guild.members.me);
      if (!permissions.has('Connect') || !permissions.has('Speak')) {
        const reply = embedManager.error(
          'Insufficient Permissions',
          'I need permissions to join and speak in your voice channel!'
        );
        return loadingMsg.edit({ embeds: [reply] });
      }

      // Check if musicManager is initialized
      if (!musicManager || !musicManager.kazagumo) {
        logger.error('LoadPlaylistCommand', 'Music manager is not initialized');
        const reply = embedManager.error(
          'Error',
          'Music system is not ready yet. Please try again in a moment.'
        );
        return loadingMsg.edit({ embeds: [reply] });
      }

      // Log node status but continue regardless (copied from play command)
      try {
        const nodes = musicManager.kazagumo.shoukaku.nodes;
        if (nodes) {
          const nodeCount = nodes.size;
          const connectedNodes = Array.from(nodes.values()).filter(n => n.state === 1).length;
          logger.info('LoadPlaylistCommand', `Node status: ${connectedNodes}/${nodeCount} connected`);
        } else {
          logger.warn('LoadPlaylistCommand', 'No nodes available, but proceeding anyway');
        }
      } catch (nodeError) {
        logger.warn('LoadPlaylistCommand', 'Error checking node status', nodeError);
      }

      // Get or create player
      let player = musicManager.getPlayer(guild.id);
      let playerNeedsInitialization = false;
      let isPlayerPlaying = false;

      // If no player exists, create one (similar to play command)
      if (!player) {
        // Make sure we have all required parameters for creating a player
        if (!guild.id || !channel || !voiceChannel) {
          const reply = embedManager.error(
            'Error',
            'Failed to create a music player. Missing required parameters.'
          );
          return loadingMsg.edit({ embeds: [reply] });
        }

        try {
          // Create the player directly (synchronously)
          player = musicManager.createPlayer({
            guildId: guild.id,
            textChannel: channel,
            voiceChannel
          });

          if (!player) {
            logger.error('LoadPlaylistCommand', 'Player creation failed, got null from MusicManager');
            const reply = embedManager.error(
              'Error',
              'Failed to create a music player. Please try again later.'
            );
            return loadingMsg.edit({ embeds: [reply] });
          }

          // Implement a retry mechanism
          let retryCount = 0;
          const maxRetries = 5;
          let verifiedPlayer = null;

          while (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 500));
            retryCount++;

            // Try to get the player from the collection
            verifiedPlayer = musicManager.getPlayer(guild.id);

            if (verifiedPlayer) {
              logger.player('LoadPlaylistCommand', `Player verified after ${retryCount} attempts`, {
                guildId: guild.id,
                retryCount
              });
              break;
            }

            logger.player('LoadPlaylistCommand', `Player not found after attempt ${retryCount}`, {
              guildId: guild.id
            });
          }

          // If we still don't have a verified player after all retries
          if (!verifiedPlayer) {
            logger.player('LoadPlaylistCommand', `Player verification failed after ${maxRetries} attempts`, {
              guildId: guild.id,
              originalPlayer: player
            });

            // Use the original player instance as fallback
            logger.player('LoadPlaylistCommand', 'Using unverified player as fallback', { guildId: guild.id });

            // We'll send an informational message to the user
            const infoEmbed = embedManager.create({
              color: embedManager.colors.warning,
              title: 'Setting up Music Player',
              description: 'This is the first time using the music player. The playlist will play shortly. If it doesn\'t, please try the command again.',
              footer: { text: 'First-time setup may take a moment...' },
              timestamp: true
            });

            await loadingMsg.edit({ embeds: [infoEmbed] });
          } else {
            // Use the verified player
            player = verifiedPlayer;
          }

          logger.player('LoadPlaylistCommand', `Player initialized for guild ${guild.id}`, player);
          playerNeedsInitialization = true;
        } catch (playerCreationError) {
          logger.error('LoadPlaylistCommand', 'Error creating player', playerCreationError);
          const reply = embedManager.error(
            'Error',
            'An error occurred while creating the music player. Please try again.'
          );
          return loadingMsg.edit({ embeds: [reply] });
        }
      } else {
        // Check if the player is already playing something
        isPlayerPlaying = player.playing && !player.paused;
        logger.info('LoadPlaylistCommand', `Found existing player, isPlaying: ${isPlayerPlaying}`);
      }

      // Verify that the player instance is valid
      if (!player || typeof player !== 'object') {
        logger.error('LoadPlaylistCommand', `Invalid player object for guild ${guild.id}`);
        const reply = embedManager.error(
          'Error',
          'The music player is invalid. Please try again.'
        );
        return loadingMsg.edit({ embeds: [reply] });
      }

      // Create a player manager instance for easier control
      const playerManager = new PlayerManager(player);
      const searchManager = new SearchManager(musicManager);

      // Update loading message to indicate track conversion
      const processingEmbed = embedManager.create({
        color: embedManager.colors.default,
        title: '⚙️ Processing Playlist...',
        description: `Converting tracks from playlist **${playlist.name}**...\nThis may take a moment.`,
        timestamp: true
      });

      await loadingMsg.edit({ embeds: [processingEmbed] });

      // Function to convert a DB track to a playable track
      const convertTrack = async (dbTrack) => {
        try {
          // If we already have a valid URI, search for it directly
          if (dbTrack.uri) {
            const result = await searchManager.search(dbTrack.uri, {
              requester: message.author
            });

            if (result && result.tracks && result.tracks.length) {
              return result.tracks[0];
            }
          }

          // Fallback to searching by title & author
          const searchQuery = `${dbTrack.title} ${dbTrack.author}`;
          const platform = dbTrack.source || 'spotify'; // Default to spotify like in the play command
          
          const searchResult = await searchManager.search(searchQuery, {
            requester: message.author,
            platform: platform
          });

          if (searchResult && searchResult.tracks && searchResult.tracks.length) {
            return searchResult.tracks[0];
          }

          return null;
        } catch (error) {
          logger.error('LoadPlaylistCommand', `Error converting track: ${dbTrack.title}`, error);
          return null;
        }
      };

      // Convert tracks in batches to prevent timeouts
      const batchSize = 5;
      const trackBatches = [];

      for (let i = 0; i < tracks.length; i += batchSize) {
        trackBatches.push(tracks.slice(i, i + batchSize));
      }

      const convertedTracks = [];

      for (const batch of trackBatches) {
        // Process each batch
        const batchResults = await Promise.all(batch.map(dbTrack => convertTrack(dbTrack)));

        // Filter out null results
        const validTracks = batchResults.filter(track => track !== null);
        convertedTracks.push(...validTracks);

        // Update processing message
        const progressEmbed = embedManager.create({
          color: embedManager.colors.default,
          title: '⚙️ Processing Playlist...',
          description: `Converting tracks from playlist **${playlist.name}**...\n` +
                      `Progress: ${convertedTracks.length}/${tracks.length} tracks processed.`,
          timestamp: true
        });

        await loadingMsg.edit({ embeds: [progressEmbed] });
      }

      // Check if we have tracks to play
      if (!convertedTracks.length) {
        const reply = embedManager.error(
          'No Tracks Found',
          'Failed to convert any tracks from the playlist to playable format.'
        );
        return loadingMsg.edit({ embeds: [reply] });
      }

      // Shuffle tracks if requested
      if (shouldShuffle) {
        for (let i = convertedTracks.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [convertedTracks[i], convertedTracks[j]] = [convertedTracks[j], convertedTracks[i]];
        }
      }

      // Handle playing based on whether the player is active
      try {
        if (isPlayerPlaying) {
          // If player is already playing, add tracks to queue
          playerManager.queue.add(convertedTracks);
          
          const successEmbed = embedManager.success(
            'Playlist Queued',
            `Added **${convertedTracks.length}** tracks from playlist **${playlist.name}**${shouldShuffle ? ' (shuffled)' : ''} to the queue.`
          );
          
          return loadingMsg.edit({ embeds: [successEmbed] });
        } else {
          // If nothing is playing, start playing the first track
          const firstTrack = convertedTracks.shift();
          
          // For newly created players, play directly
          if (playerNeedsInitialization) {
            await player.play(firstTrack);
          } else {
            // For existing but stopped players, add to queue and play
            playerManager.queue.add(firstTrack);
            await playerManager.play();
          }
          
          // Add remaining tracks to queue if there are any
          if (convertedTracks.length) {
            playerManager.queue.add(convertedTracks);
          }
          
          const successEmbed = embedManager.success(
            'Playlist Started',
            `Now playing **${firstTrack.title}** from playlist **${playlist.name}**${shouldShuffle ? ' (shuffled)' : ''}.\n\n` +
            `Added ${convertedTracks.length} more track${convertedTracks.length !== 1 ? 's' : ''} to queue.`
          );
          
          return loadingMsg.edit({ embeds: [successEmbed] });
        }
      } catch (playbackError) {
        logger.error('LoadPlaylistCommand', 'Error during track playback', playbackError);
        const reply = embedManager.error(
          'Playback Error',
          'An error occurred during playback setup. Please try again.'
        );
        return loadingMsg.edit({ embeds: [reply] });
      }
    } catch (error) {
      logger.error('LoadPlaylistCommand', 'Command execution error:', error);
      const reply = embedManager.error(
        'Error',
        'An error occurred while trying to load the playlist. Please try again.'
      );
      return loadingMsg.edit({ embeds: [reply] });
    }
  }
}

export default new LoadPlaylistCommand();
