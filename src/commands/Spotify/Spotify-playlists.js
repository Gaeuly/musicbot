/**
 * Muffin STUDIO - Bre4d777 & prayag 
 * https://discord.gg/TRPqseUq32
 * give credits or ill touch you in your dreams
 */

import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} from 'discord.js';
import { Command } from '../../structures/Command.js';
import { db } from '../../database/DatabaseManager.js';
import { spotifyManager } from '../../managers/SpotifyManager.js';
import { SearchManager } from '../../managers/SearchManager.js';
import { PlayerManager } from '../../managers/PlayerManager.js';
import { logger } from '../../utils/logger.js';
import { formatDuration, truncate } from '../../utils/formatters.js';
import { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } from 'discord.js';

class SpotifyPlaylistsCommand extends Command {
  constructor() {
    super({
      name: 'spotify-playlists',
      description: 'View and play your linked Spotify playlists',
      usage: 'spotify playlists',
      aliases: ['spotify playlist', 'spotify list', 'spl'],
      category: 'spotify',
      cooldown: 5,
      voiceRequired: false
    });
  }

  createLoadingContainer() {
    return new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('🔍 **Fetching Your Spotify Playlists...**')
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('⏳ Please wait while we fetch your playlists from Spotify.')
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(false).setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('*This may take a moment.*')
      );
  }

  createErrorContainer(title, description) {
    return new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`❌ **${title}**`)
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(description)
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(false).setSpacing(SeparatorSpacingSize.Small)
      )
      .addActionRowComponents(row =>
        row.setComponents(
          new ButtonBuilder()
            .setCustomId('close')
            .setEmoji('🗑️')
            .setStyle(ButtonStyle.Danger)
        )
      );
  }

  createPlaylistsContainer(playlists, selectMenu) {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('🎵 **Your Spotify Playlists**')
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`Found **${playlists.length}** public playlist${playlists.length !== 1 ? 's' : ''} on your profile.`)
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(false).setSpacing(SeparatorSpacingSize.Small)
      );

    const playlistsText = playlists.slice(0, 10).map((playlist, index) =>
      `**${index + 1}.** ${playlist.name} (${playlist.trackCount} tracks)`
    ).join('\n');

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`**Available Playlists:**\n${playlistsText}`)
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('👇 Select a playlist from the dropdown menu below')
    )
    .addActionRowComponents(row => row.setComponents(selectMenu));

    return container;
  }

  createTracksContainer(selectedPlaylist, tracksText, currentPage, totalPages, getActionRow) {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`🎶 **${selectedPlaylist.name}**`)
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`This playlist has **${selectedPlaylist.trackCount}** tracks.`)
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(false).setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**Tracks (Page ${currentPage}/${totalPages}):**\n${tracksText}`)
      )
      .addActionRowComponents(getActionRow(currentPage));

    return container;
  }

  createProcessingContainer(playlistName) {
    return new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('⏳ **Processing Playlist...**')
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`Processing playlist: **${playlistName}**`)
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(false).setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('*This may take a moment...*')
      );
  }

  createSuccessContainer(title, description) {
    return new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`✅ **${title}**`)
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(description)
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(false).setSpacing(SeparatorSpacingSize.Small)
      );
  }

  createTimeoutContainer() {
    return new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('⏰ **Session Expired**')
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('🔄 Run the command again to view your playlists.')
      );
  }

  async execute({ message, args, client, musicManager }) {
    const { author, guild, channel } = message;

    const profile = db.spotify.getProfile(author.id);

    if (!profile) {
      return message.reply({
        components: [this.createErrorContainer('Not Linked', 'You do not have a Spotify profile linked. Use `spotify login <url>` to link your profile.')],
        flags: MessageFlags.IsComponentsV2
      });
    }

    const loadingContainer = this.createLoadingContainer();
    const loadingMsg = await message.reply({ components: [loadingContainer], flags: MessageFlags.IsComponentsV2 });

    try {
      const playlists = await spotifyManager.fetchUserPlaylists(profile.profile_url);

      if (!playlists || playlists.length === 0) {
        return loadingMsg.edit({
          components: [this.createErrorContainer('No Playlists Found', 'No public playlists were found in your Spotify profile. Make sure your playlists are set to public.')]
        });
      }

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('playlist-selector')
        .setPlaceholder('Choose a playlist to view or play')
        .setMaxValues(1);

      playlists.slice(0, 25).forEach((playlist) => {
        selectMenu.addOptions({
          label: truncate(playlist.name, 100),
          description: `${playlist.trackCount} tracks`,
          value: playlist.id
        });
      });

      const playlistsContainer = this.createPlaylistsContainer(playlists, selectMenu);

      await loadingMsg.edit({
        components: [playlistsContainer]
      });

      const collector = loadingMsg.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 300000
      });

      collector.on('collect', async (interaction) => {
        if (interaction.user.id !== author.id) {
          return interaction.reply({
            content: '🔒 Only the command author can interact with this.',
            ephemeral: true
          });
        }

        const playlistId = interaction.values[0];
        const selectedPlaylist = playlists.find(p => p.id === playlistId);

        if (!selectedPlaylist) {
          return interaction.reply({
            content: '❌ Playlist not found.',
            ephemeral: true
          });
        }

        await interaction.deferUpdate();

        const tracks = await spotifyManager.fetchPlaylistTracks(playlistId);

        if (!tracks || tracks.length === 0) {
          return interaction.editReply({
            components: [this.createErrorContainer('No Tracks Found', `The playlist "${selectedPlaylist.name}" doesn't have any tracks or they couldn't be retrieved.`)],
            embeds: []
          });
        }

        const tracksPerPage = 10;
        let currentPage = 1;
        const totalPages = Math.ceil(tracks.length / tracksPerPage);

        const getTracksForPage = (page) => {
          const startIdx = (page - 1) * tracksPerPage;
          const endIdx = startIdx + tracksPerPage;
          return tracks.slice(startIdx, endIdx);
        };

        const generateTracksText = (page) => {
          const pageTracks = getTracksForPage(page);
          return pageTracks.map((track, index) => {
            const trackNumber = (page - 1) * tracksPerPage + index + 1;
            const duration = formatDuration(track.duration);
            return `**${trackNumber}.** ${track.name} - ${track.artist} (${duration})`;
          }).join('\n');
        };

        const getActionRow = (page) => {
          return new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('prev_page')
              .setLabel('◀ Previous')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(page <= 1),
            new ButtonBuilder()
              .setCustomId('next_page')
              .setLabel('Next ▶')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(page >= totalPages),
            new ButtonBuilder()
              .setCustomId('play_playlist')
              .setLabel('▶️ Play Playlist')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId('back_to_playlists')
              .setLabel('↩ Back to Playlists')
              .setStyle(ButtonStyle.Primary)
          );
        };

        let currentPlaylistId = playlistId;
        let currentTracks = tracks;

        const tracksContainer = this.createTracksContainer(selectedPlaylist, generateTracksText(currentPage), currentPage, totalPages, getActionRow);
        await interaction.editReply({
          components: [tracksContainer],
          embeds: []
        });

        const buttonCollector = loadingMsg.createMessageComponentCollector({
          componentType: ComponentType.Button,
          time: 300000
        });

        buttonCollector.on('collect', async (buttonInt) => {
          if (buttonInt.user.id !== author.id) {
            return buttonInt.reply({
              content: '🔒 Only the command author can interact with this.',
              ephemeral: true
            });
          }

          switch (buttonInt.customId) {
            case 'prev_page':
              currentPage--;
              break;
            case 'next_page':
              currentPage++;
              break;
            case 'back_to_playlists':
              await buttonInt.update({
                components: [playlistsContainer],
                embeds: []
              });
              return;
            case 'play_playlist':
              await buttonInt.deferUpdate();

              const voiceChannel = buttonInt.member.voice.channel;
              if (!voiceChannel) {
                await buttonInt.editReply({
                  components: [this.createErrorContainer('Voice Channel Required', 'You need to join a voice channel to play music.')],
                  embeds: []
                });
                return;
              }

              try {
                if (!musicManager || !musicManager.kazagumo) {
                  logger.error('SpotifyPlaylistsCommand', 'Music manager is not initialized');
                  throw new Error('Music system is not ready yet');
                }

                await buttonInt.editReply({
                  components: [this.createProcessingContainer(selectedPlaylist.name)],
                  embeds: []
                });

                const searchManager = new SearchManager(musicManager);
                const playlistUrl = `https://open.spotify.com/playlist/${currentPlaylistId}`;

                const permissions = voiceChannel.permissionsFor(guild.members.me);
                if (!permissions.has('Connect') || !permissions.has('Speak')) {
                  await buttonInt.editReply({
                    components: [this.createErrorContainer('Insufficient Permissions', 'I need permissions to join and speak in your voice channel!')],
                    embeds: []
                  });
                  return;
                }

                let player = musicManager.getPlayer(guild.id);
                let playerNeedsInitialization = false;
                let isPlayerPlaying = false;

                if (!player) {
                  try {
                    player = musicManager.createPlayer({
                      guildId: guild.id,
                      textChannel: channel,
                      voiceChannel
                    });

                    if (!player) {
                      logger.error('SpotifyPlaylistsCommand', 'Player creation failed');
                      throw new Error('Failed to create music player');
                    }

                    let retryCount = 0;
                    const maxRetries = 5;
                    let verifiedPlayer = null;

                    while (retryCount < maxRetries) {
                      await new Promise(resolve => setTimeout(resolve, 500));
                      retryCount++;
                      verifiedPlayer = musicManager.getPlayer(guild.id);
                      if (verifiedPlayer) {
                        break;
                      }
                    }

                    if (verifiedPlayer) {
                      player = verifiedPlayer;
                    }
                    
                    playerNeedsInitialization = true;
                  } catch (playerCreationError) {
                    logger.error('SpotifyPlaylistsCommand', 'Error creating player', playerCreationError);
                    await buttonInt.editReply({
                      components: [this.createErrorContainer('Error', 'An error occurred while creating the music player. Please try again.')],
                      embeds: []
                    });
                    return;
                  }
                } else {
                  isPlayerPlaying = player.playing && !player.paused;
                }

                if (!player || typeof player !== 'object') {
                  logger.error('SpotifyPlaylistsCommand', `Invalid player object for guild ${guild.id}`);
                  await buttonInt.editReply({
                    components: [this.createErrorContainer('Error', 'The music player is invalid. Please try again.')],
                    embeds: []
                  });
                  return;
                }

                const result = await searchManager.search(playlistUrl, {
                  platform: 'spotify',
                  requester: message.author
                });

                if (!result || !result.tracks || !result.tracks.length) {
                  await buttonInt.editReply({
                    components: [this.createErrorContainer('No Results', `Failed to load playlist: **${selectedPlaylist.name}**. Please try again.`)],
                    embeds: []
                  });
                  return;
                }

                const trackToPlayFirst = result.tracks[0];
                const playerManager = new PlayerManager(player);

                if (isPlayerPlaying) {
                  playerManager.queue.add(result.tracks);
                  
                  await buttonInt.editReply({
                    components: [this.createSuccessContainer('Playlist Queued', `Added **${result.tracks.length}** tracks from Spotify playlist **${selectedPlaylist.name}** to the queue.\n\nFirst track: **${trackToPlayFirst.title}**`)],
                    embeds: []
                  });
                } else {
                  try {
                    if (playerNeedsInitialization) {
                      await player.play(trackToPlayFirst);
                    } else {
                      playerManager.queue.add(result.tracks);
                      await playerManager.play();
                    }

                    if (playerNeedsInitialization && result.tracks.length > 1) {
                      const remainingTracks = result.tracks.slice(1);
                      playerManager.queue.add(remainingTracks);
                    }

                    await buttonInt.editReply({
                      components: [this.createSuccessContainer('Spotify Playlist Started', `Playing **${trackToPlayFirst.title}** from Spotify playlist **${selectedPlaylist.name}**.\n\nAdded ${result.tracks.length - 1} more tracks to queue.`)],
                      embeds: []
                    });
                  } catch (playError) {
                    logger.error('SpotifyPlaylistsCommand', 'Error playing playlist:', playError);
                    await buttonInt.editReply({
                      components: [this.createErrorContainer('Playback Error', 'An error occurred while playing the playlist. Please try again.')],
                      embeds: []
                    });
                  }
                }
              } catch (error) {
                logger.error('SpotifyPlaylistsCommand', 'Error handling play playlist:', error);
                await buttonInt.editReply({
                  components: [this.createErrorContainer('Error', 'An error occurred while trying to play this playlist. Please try again.')],
                  embeds: []
                });
              }
              return;
          }

          const updatedTracksContainer = this.createTracksContainer(selectedPlaylist, generateTracksText(currentPage), currentPage, totalPages, getActionRow);
          await buttonInt.update({
            components: [updatedTracksContainer],
            embeds: []
          });
        });
      });

      collector.on('end', () => {
        if (loadingMsg.editable) {
          const timeoutContainer = this.createTimeoutContainer();
          loadingMsg.edit({ components: [timeoutContainer], embeds: [] }).catch(() => {});
        }
      });
    } catch (error) {
      logger.error('SpotifyPlaylistsCommand', 'Error fetching Spotify playlists:', error);
      await loadingMsg.edit({
        components: [this.createErrorContainer('Error', 'An error occurred while fetching your Spotify playlists. Please try again later.')],
        embeds: []
      });
    }
  }
}

export default new SpotifyPlaylistsCommand();
