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
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';

// Helper function
function getPlatformDisplayName(key) {
    if (!key) return 'the specified source';
    key = key.toLowerCase();
    if (key === 'spotify' || key === 'sp') return 'Spotify';
    if (key === 'youtube' || key === 'yt') return 'YouTube';
    if (key === 'jiosaavn' || key === 'js') return 'JioSaavn';
    if (key === 'applemusic' || key === 'apple' || key === 'am') return 'Apple Music';
    if (key === 'deezer' || key === 'dz') return 'Deezer';
    if (key === 'soundcloud' || key === 'sc') return 'SoundCloud';
    if (key === 'http') return 'a Direct Audio Link';
    return key.charAt(0).toUpperCase() + key.slice(1);
}

class SoundCloudCommand extends Command {
  constructor() {
    super({
      name: 'soundcloud',
      description: 'Play music from SoundCloud.',
      usage: 'soundcloud <song name or URL>',
      aliases: ['sc'],
      category: 'music',
      cooldown: 2,
      voiceRequired: true,
      examples: [
        'soundcloud lofi hip hop beats',
        'soundcloud https://soundcloud.com/user-name/track-name',
        'soundcloud https://soundcloud.com/user-name/sets/playlist-name'
      ]
    });
  }

  async execute({ message, args, client, musicManager }) {
    const { channel, member, guild } = message;
    const fixedPlatform = 'soundcloud';
    const platformDisplayName = getPlatformDisplayName(fixedPlatform);

    if (!args.length) {
      const reply = embedManager.error(
        'Invalid Usage',
        `Please provide a song name or SoundCloud URL to play!\n\nUsage:  \`${this.usage}\``
      );
      return message.reply({ embeds: [reply] });
    }

    const query = args.join(' ');
    let searchingMsg = null;

    try {
      const voiceChannel = member.voice.channel;
      if (!voiceChannel) {
        const reply = embedManager.error('Voice Channel Required', 'You need to join a voice channel first!');
        return message.reply({ embeds: [reply] });
      }

      const permissions = voiceChannel.permissionsFor(guild.members.me);
      if (!permissions.has('Connect') || !permissions.has('Speak')) {
        const reply = embedManager.error('Insufficient Permissions', 'I need permissions to join and speak in your voice channel!');
        return message.reply({ embeds: [reply] });
      }

      const searchingEmbed = embedManager.create({
        color: embedManager.colors.default,
        description: `<a:byte_loading:1370748439918280864> Searching for \`${query}\` on ${platformDisplayName}`,
        footer: { text: 'This may take a moment.' },
        timestamp: true
      });
      searchingMsg = await message.reply({ embeds: [searchingEmbed] });

      if (!musicManager || !musicManager.kazagumo) {
        logger.error(`${this.name}Command`, 'Music manager is not initialized');
        const reply = embedManager.error('Error', 'Music system is not ready yet. Please try again in a moment.');
        return searchingMsg.edit({ embeds: [reply] });
      }

      const searchManager = new SearchManager(musicManager);
      let player = musicManager.getPlayer(guild.id);
      let isPlayerPlaying = false;

      if (!player) {
        if (!guild.id || !channel || !voiceChannel) {
          const reply = embedManager.error('Error', 'Failed to create a music player. Missing required parameters.');
          return searchingMsg.edit({ embeds: [reply] });
        }
        try {
          player = musicManager.createPlayer({ guildId: guild.id, textChannel: channel, voiceChannel });
          if (!player) {
            logger.error(`${this.name}Command`, 'Player creation failed, got null from MusicManager');
            const reply = embedManager.error('Error', 'Failed to create a music player. Please try again later.');
            return searchingMsg.edit({ embeds: [reply] });
          }

          let retryCount = 0;
          const maxRetries = 5;
          let verifiedPlayer = null;
          while (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 500));
            retryCount++;
            verifiedPlayer = musicManager.getPlayer(guild.id);
            if (verifiedPlayer) {
              logger.player(`${this.name}Command`, `Player verified after ${retryCount} attempts`, { guildId: guild.id, retryCount });
              break;
            }
            logger.player(`${this.name}Command`, `Player not found after attempt ${retryCount}`, { guildId: guild.id });
          }

          if (!verifiedPlayer) {
            logger.player(`${this.name}Command`, `Player verification failed after ${maxRetries} attempts`, { guildId: guild.id });
            const infoEmbed = embedManager.create({
              color: embedManager.colors.warning,
              title: '<a:byte_loading:1370748439918280864> Setting up Music Player',
              description: 'This is the first time using the music player. The song will play shortly. If it doesn\'t, please try the command again.',
              footer: { text: 'First-time setup may take a moment...' },
              timestamp: true
            });
            await searchingMsg.edit({ embeds: [infoEmbed] });
          } else {
            player = verifiedPlayer;
          }
        } catch (playerCreationError) {
          logger.error(`${this.name}Command`, 'Error creating player', playerCreationError);
          const reply = embedManager.error('Error', 'An error occurred while creating the music player. Please try again.');
          return searchingMsg.edit({ embeds: [reply] });
        }
      } else {
        isPlayerPlaying = player.playing || (!player.paused && player.queue.current);
      }

      if (!player || typeof player !== 'object') {
        logger.error(`${this.name}Command`, `Invalid player object for guild ${guild.id}`);
        const reply = embedManager.error('Error', 'The music player is invalid. Please try again.');
        return searchingMsg.edit({ embeds: [reply] });
      }

      const playerManager = new PlayerManager(player);
      logger.debug(`${this.name}Command`, `Performing search with query: "${query}", platform: ${fixedPlatform}`);

      const result = await searchManager.search(query, {
        platform: fixedPlatform,
        requester: message.author,
        limit: 100
      });

      if (!result || !result.tracks || !result.tracks.length) {
        const reply = embedManager.error('No Results', `No results found for: \`${query}\` on ${platformDisplayName}`);
        return searchingMsg.edit({ embeds: [reply] });
      }

      const isPlaylist = result.type === "PLAYLIST";
      const trackToPlayFirst = result.tracks[0];

      if (isPlayerPlaying) {
        if (isPlaylist) {
          playerManager.queue.add(result.tracks);
          const playlistTitle = result.playlistName || 'playlist';
          const reply = embedManager.success(
            `${platformDisplayName} Playlist Queued`,
            `Added **${result.tracks.length}** tracks from ${platformDisplayName} playlist **${playlistTitle}** to the queue.\n\n` +
            `First track: **${trackToPlayFirst.title || 'Unknown'}**`
          );
          return searchingMsg.edit({ embeds: [reply], components: [] });
        } else {
          const queueLengthBeforeAdd = playerManager.queue.size;
          playerManager.queue.add(trackToPlayFirst);
          const addedTrackIndex = queueLengthBeforeAdd;

          const trackTitle = trackToPlayFirst.title || 'Unknown Track';
          const artistName = trackToPlayFirst.author || 'Unknown Artist';

          const reply = embedManager.success(
            'Track Queued',
            `Added [${trackTitle}](${trackToPlayFirst.uri}) from ${platformDisplayName} to the queue.\n` +
            `Artist: **${artistName}**`
          );

          const playUpcomingButton = new ButtonBuilder().setCustomId(`play_upcoming_${addedTrackIndex}`).setLabel('Play Upcoming').setStyle(ButtonStyle.Secondary);
          const playNowButton = new ButtonBuilder().setCustomId(`play_now_${addedTrackIndex}`).setLabel('Play Now').setStyle(ButtonStyle.Primary);
          const row = new ActionRowBuilder().addComponents(playUpcomingButton, playNowButton);
          const editedMessage = await searchingMsg.edit({ embeds: [reply], components: [row] });

          const collector = editedMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter: (interaction) => interaction.user.id === message.author.id && musicManager.getPlayer(guild.id)?.queue,
            time: 60000
          });

          collector.on('collect', async (interaction) => {
            await interaction.deferUpdate();
            const localPlayer = musicManager.getPlayer(guild.id);
            if (!localPlayer || !localPlayer.queue) {
              await interaction.followUp({ embeds: [embedManager.error('Error', 'Player is no longer available.')], ephemeral: true });
              return collector.stop('player_gone');
            }

            const customIdParts = interaction.customId.split('_');
            const action = customIdParts[0] + '_' + customIdParts[1];
            const targetIndex = parseInt(customIdParts[2], 10);

            if (targetIndex >= localPlayer.queue.size || !localPlayer.queue.tracks[targetIndex] || localPlayer.queue.tracks[targetIndex].identifier !== trackToPlayFirst.identifier) {
                await interaction.followUp({ embeds: [embedManager.error('Error', 'This track is no longer at the expected position in the queue or has already been played/removed.')], ephemeral: true });
                await editedMessage.edit({ components: [] }).catch(e => logger.error(`${this.name}Collector`, 'Failed to disable buttons on invalid state', e));
                return collector.stop('track_moved');
            }

            const trackToMove = localPlayer.queue.tracks[targetIndex];

            try {
                localPlayer.queue.remove(targetIndex);
                localPlayer.queue.add(trackToMove, 0);

                let confirmationMsg = `Moved **${trackToMove.title}** to the next position in the queue.`;
                if (action === 'play_now') {
                    if (localPlayer.playing || localPlayer.queue.current) {
                        localPlayer.skip();
                        confirmationMsg = `Skipping current track and playing **${trackToMove.title}** now.`;
                    } else {
                       confirmationMsg = `Playing **${trackToMove.title}** now as it was moved to the front.`;
                       if (!localPlayer.playing && localPlayer.connected) await localPlayer.play();
                    }
                }
                await editedMessage.edit({ embeds: [reply], components: [] });
                await interaction.followUp({ embeds: [embedManager.success('Action Complete', confirmationMsg)], ephemeral: true });
                collector.stop('action_taken');
            } catch (err) {
                 logger.error(`${this.name}Collector`, 'Error handling button interaction:', err);
                 await interaction.followUp({ embeds: [embedManager.error('Error', 'An error occurred while performing the action.')], ephemeral: true });
                 await editedMessage.edit({ components: [] }).catch(e => {});
                 collector.stop('error');
             }
          });
          collector.on('end', (collected, reason) => {
            if (reason !== 'action_taken' && reason !== 'player_gone' && reason !== 'track_moved' && reason !== 'error') {
              editedMessage.edit({ components: [] }).catch(e => logger.warn(`${this.name}Collector`, 'Failed to remove buttons on collector end', e));
            }
          });
        }
      } else {
        try {
          const tracksToAdd = isPlaylist ? result.tracks : [trackToPlayFirst];
          playerManager.queue.add(tracksToAdd);
          if (!player.playing) await playerManager.play();

          if (isPlaylist) {
            const playlistTitle = result.playlistName || 'playlist';
            const queueMsg = result.tracks.length > 1 ? `\nAdded ${result.tracks.length - 1} more tracks to queue.` : '';
            const reply = embedManager.success(
              `${platformDisplayName} Playlist Started`,
              `Playing **${trackToPlayFirst.title}** from ${platformDisplayName} playlist **${playlistTitle}**.${queueMsg}`
            );
            await searchingMsg.edit({ embeds: [reply], components: [] });
          } else {
            const trackTitle = trackToPlayFirst.title || 'Unknown Track';
            const artistName = trackToPlayFirst.author || 'Unknown Artist';
            const embed = embedManager.create({
              color: embedManager.colors.success,
              title: `Now Playing from ${platformDisplayName}`,
              description: `Playing [${trackTitle}](${trackToPlayFirst.uri})\nArtist: **${artistName}**`,
              timestamp: true
            });
            await searchingMsg.edit({ embeds: [embed], components: [] });
          }
        } catch (playbackError) {
          logger.error(`${this.name}Command`, 'Error during initial track playback', playbackError);
          const reply = embedManager.error('Playback Error', 'An error occurred during playback setup. Please try again.');
          return searchingMsg.edit({ embeds: [reply], components: [] });
        }
      }
    } catch (error) {
      logger.error(`${this.name}Command`, 'Command execution error:', error);
      const reply = embedManager.error('Error', `An error occurred while trying to play from ${platformDisplayName}.`);
      if (searchingMsg) {
        return searchingMsg.edit({ embeds: [reply], components: [] }).catch(() => {});
      }
      return message.reply({ embeds: [reply] });
    }
  }
}
export default new SoundCloudCommand();
