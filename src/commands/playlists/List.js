/**
 * Muffin STUDIO - Bre4d777 & prayag 
 * https://discord.gg/TRPqseUq32
 * give credits or ill touch you in your dreams
 */

import { Command } from '../../structures/Command.js';
import { db } from '../../database/DatabaseManager.js';
import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  ComponentType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize
} from 'discord.js';
import { PlayerManager } from '../../managers/PlayerManager.js';
import { SearchManager } from '../../managers/SearchManager.js';
import { logger } from '../../utils/logger.js';

class PlaylistsCommand extends Command {
  constructor() {
    super({
      name: 'playlists',
      description: 'View and manage your playlists',
      usage: 'playlists [--all]',
      aliases: ['pl', 'myplaylists', 'list-playlists'],
      category: 'playlists',
      cooldown: 5,
      examples: [
        'playlists',
        'playlists --all'
      ]
    });
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
      );
  }

  createInformationContainer(title, description) {
    return new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`ℹ️ **${title}**`)
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(description)
      );
  }

  createLoadingContainer(title, description) {
    return new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`🔄 **${title}**`)
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
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('*Please wait. This may take a moment.*')
      );
  }

  createMainPlaylistsContainer(userPlaylistsData) {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('🎵 **Your Playlists**')
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );

    if (userPlaylistsData.length) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`You have **${userPlaylistsData.length}** playlist${userPlaylistsData.length !== 1 ? 's' : ''}.`)
      );
      let userPlaylistsText = '';
      userPlaylistsData.forEach((playlist, index) => {
        userPlaylistsText += `**${index + 1}. ${playlist.name}** ` +
          `• ID: \`${playlist.id}\` | Tracks: \`${playlist.trackCount}\` | Updated: \`${playlist.updatedDate}\`\n`;
      });
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`\n📋 **Your Playlists:**\n${userPlaylistsText.trim()}`)
      );
    } else {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent('You don\'t have any playlists yet. Create one with `/create-playlist <name>`')
      );
    }

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    )
    .addActionRowComponents(row =>
      row.setComponents(
        new ButtonBuilder()
          .setCustomId('view_details')
          .setLabel('View Details')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(!userPlaylistsData.length),
        new ButtonBuilder()
          .setCustomId('load_playlist_prompt')
          .setLabel('Load Playlist')
          .setStyle(ButtonStyle.Success)
          .setDisabled(!userPlaylistsData.length),
        new ButtonBuilder()
          .setCustomId('delete_playlist_prompt')
          .setLabel('Delete Playlist')
          .setStyle(ButtonStyle.Danger)
          .setDisabled(!userPlaylistsData.length)
      )
    );
    return container;
  }

  createPlaylistDetailsContainer(playlist, tracks, currentPage, totalPages) {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`🎵 **Playlist: ${playlist.name}**`)
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**ID:** \`${playlist.id}\`\n` +
          `**Created:** ${playlist.createdDate}\n` +
          `**Last Updated:** ${playlist.updatedDate}\n` +
          `**Track Count:** ${tracks.length}\n`
        )
      );

    if (tracks.length) {
      let trackList = '';
      const start = currentPage * 10;
      const end = start + 10;
      tracks.slice(start, end).forEach((track, index) => {
        const absoluteIndex = start + index + 1;
        trackList += `**${absoluteIndex}.** ${track.title} - ${track.author || 'Unknown'}\n`;
      });
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`\n📋 **Tracks (Page ${currentPage + 1}/${totalPages}):**\n${trackList}`)
      );
    } else {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent('\n📋 **Tracks:**\nThis playlist is empty. Add tracks with `/add-to-playlist` command.')
      );
    }

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );

    const navButtons = [];
    if (totalPages > 1) {
      navButtons.push(
        new ButtonBuilder()
          .setCustomId('prev_page')
          .setLabel('Previous')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === 0),
        new ButtonBuilder()
          .setCustomId('next_page')
          .setLabel('Next')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage >= totalPages - 1)
      );
    }

    const actionButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('back_to_playlists')
        .setLabel('Back to Playlists')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('load_normal')
        .setLabel('Load Playlist')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('load_shuffle')
        .setLabel('Load Shuffled')
        .setStyle(ButtonStyle.Primary)
    );

    if (navButtons.length > 0) {
      container.addActionRowComponents(row => row.setComponents(...navButtons));
    }
    container.addActionRowComponents(actionButtons);

    return container;
  }

  createSelectPlaylistContainer(playlists, customIdPrefix, placeholder, warningText = null) {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`${customIdPrefix}_select`)
      .setPlaceholder(placeholder)
      .addOptions(
        playlists.map(playlist => ({
          label: playlist.name,
          description: `${playlist.trackCount} tracks`,
          value: playlist.id.toString()
        }))
      );

    const container = new ContainerBuilder();
    if (warningText) {
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`⚠️ **${warningText}**`)
        )
        .addSeparatorComponents(
            new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );
    }
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**${placeholder}:**`)
    )
    .addSeparatorComponents(
        new SeparatorBuilder().setDivider(false).setSpacing(SeparatorSpacingSize.Small)
    )
    .addActionRowComponents(row => row.setComponents(selectMenu))
    .addActionRowComponents(row =>
      row.setComponents(
        new ButtonBuilder()
          .setCustomId('back_to_playlists')
          .setLabel('Back')
          .setStyle(ButtonStyle.Secondary)
      )
    );
    return container;
  }

  async execute({ message, args, client, musicManager }) {
    const { author, channel, guild, member } = message;
    const showAllPublic = args.includes('--all');

    try {
      const userPlaylists = db.playlist.getPlaylists(author.id);

      if (!userPlaylists.length && !showAllPublic) {
        return message.reply({
          components: [this.createInformationContainer('No Playlists Found', `You don't have any playlists yet.\n\nCreate one with \`/create-playlist <name>\``)],
          flags: MessageFlags.IsComponentsV2
        });
      }

      const formatPlaylist = async (playlist) => {
        const trackCount = db.playlist.countPlaylistTracks(playlist.id);
        const createdDate = new Date(playlist.createdAt).toLocaleDateString();
        const updatedDate = new Date(playlist.updatedAt).toLocaleDateString();
        return {
          id: playlist.id,
          name: playlist.name,
          trackCount,
          createdDate,
          updatedDate
        };
      };

      const userPlaylistsData = await Promise.all(userPlaylists.map(formatPlaylist));

      const mainPlaylistsContainer = this.createMainPlaylistsContainer(userPlaylistsData);
      const reply = await message.reply({
        components: [mainPlaylistsContainer],
        flags: MessageFlags.IsComponentsV2
      });

      if (!userPlaylistsData.length) return;

      const collector = reply.createMessageComponentCollector({
        filter: (i) => i.user.id === author.id,
        time: 300000
      });

      const paginationState = {
        playlist: null,
        tracks: [],
        page: 0,
        pageSize: 10
      };

      collector.on('collect', async (interaction) => {
        if (interaction.isButton()) {
          const buttonId = interaction.customId;
          await interaction.deferUpdate();

          if (buttonId === 'view_details') {
            const selectContainer = this.createSelectPlaylistContainer(userPlaylistsData, 'view_details', 'Select a playlist to view');
            await interaction.editReply({ components: [selectContainer] });
          } else if (buttonId === 'load_playlist_prompt') {
            const selectContainer = this.createSelectPlaylistContainer(userPlaylistsData, 'load_playlist', 'Select a playlist to load');
            await interaction.editReply({ components: [selectContainer] });
          } else if (buttonId === 'delete_playlist_prompt') {
            const selectContainer = this.createSelectPlaylistContainer(userPlaylistsData, 'delete_playlist', 'Select a playlist to delete', 'This action cannot be undone');
            await interaction.editReply({ components: [selectContainer] });
          } else if (buttonId === 'back_to_playlists') {
            await interaction.editReply({
              components: [this.createMainPlaylistsContainer(userPlaylistsData)]
            });
          } else if (buttonId === 'next_page') {
            await this.showPlaylistPage(interaction, paginationState, true);
          } else if (buttonId === 'prev_page') {
            await this.showPlaylistPage(interaction, paginationState, false);
          } else if (buttonId === 'load_normal' || buttonId === 'load_shuffle') {
            const playlistToLoadId = paginationState.playlist?.id;
            if (!playlistToLoadId) {
                await interaction.editReply({ components: [this.createErrorContainer('Error', 'No playlist selected for loading. Please select a playlist first via "View Details".')] });
                return;
            }
            const playlistToLoad = db.playlist.getPlaylistById(playlistToLoadId);
            const shouldShuffle = buttonId === 'load_shuffle';
            await this.loadPlaylist(interaction, {
              playlistId: playlistToLoadId,
              guild,
              voiceChannel: member.voice.channel,
              member,
              channel,
              author,
              client,
              musicManager,
              shouldShuffle,
              playlist: playlistToLoad
            });
          } else if (buttonId.startsWith('confirm_delete_')) {
            const playlistIdToDelete = parseInt(buttonId.replace('confirm_delete_', ''));
            const playlistToDelete = db.playlist.getPlaylistById(playlistIdToDelete);

            if (!playlistToDelete) {
              await interaction.editReply({ components: [this.createErrorContainer('Error', 'Playlist not found.')] });
              return;
            }

            const success = db.playlist.deletePlaylist(playlistIdToDelete);
            if (success) {
              const updatedUserPlaylists = db.playlist.getPlaylists(author.id);
              const updatedUserPlaylistsData = await Promise.all(updatedUserPlaylists.map(formatPlaylist));
              await interaction.editReply({ components: [this.createSuccessContainer('Playlist Deleted', `Successfully deleted playlist: **${playlistToDelete.name}**`)], embeds: [] });
              // Re-send the main playlist view after deletion
              await interaction.followUp({ components: [this.createMainPlaylistsContainer(updatedUserPlaylistsData)], flags: MessageFlags.IsComponentsV2 });
            } else {
              await interaction.editReply({ components: [this.createErrorContainer('Error', 'An error occurred while deleting the playlist. Please try again.')] });
            }
          } else if (buttonId === 'cancel_delete') {
            await interaction.editReply({ components: [this.createInformationContainer('Deletion Cancelled', 'Playlist deletion has been cancelled.')] });
          }
        } else if (interaction.isStringSelectMenu()) {
          const menuId = interaction.customId;
          const selectedValue = interaction.values[0];
          await interaction.deferUpdate();

          if (menuId === 'view_details_select') {
            const playlistId = parseInt(selectedValue);
            const playlist = db.playlist.getPlaylistById(playlistId);
            if (!playlist) {
              await interaction.editReply({ components: [this.createErrorContainer('Error', 'Playlist not found.')] });
              return;
            }
            const tracks = db.playlist.getPlaylistTracks(playlistId);
            const formattedPlaylist = await formatPlaylist(playlist);

            paginationState.playlist = formattedPlaylist;
            paginationState.tracks = tracks;
            paginationState.page = 0;

            await this.showPlaylistPage(interaction, paginationState);
          } else if (menuId === 'load_playlist_select') {
            const playlistId = parseInt(selectedValue);
            const playlist = db.playlist.getPlaylistById(playlistId);
            if (!playlist) {
              await interaction.editReply({ components: [this.createErrorContainer('Error', 'Playlist not found.')] });
              return;
            }

            const voiceChannel = member.voice.channel;
            if (!voiceChannel) {
              await interaction.editReply({ components: [this.createErrorContainer('Voice Channel Required', 'You need to join a voice channel first!')] });
              return;
            }
            
            await this.loadPlaylist(interaction, {
                playlistId,
                guild,
                voiceChannel,
                member,
                channel,
                author,
                client,
                musicManager,
                shouldShuffle: false, // Default to normal load from this path
                playlist
            });

          } else if (menuId === 'delete_playlist_select') {
            const playlistIdToDelete = parseInt(selectedValue);
            const playlistToDelete = db.playlist.getPlaylistById(playlistIdToDelete);

            if (!playlistToDelete) {
              await interaction.editReply({ components: [this.createErrorContainer('Error', 'Playlist not found.')] });
              return;
            }

            const confirmContainer = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`⚠️ **Are you sure you want to delete the playlist "${playlistToDelete.name}"?**\nThis action cannot be undone.`))
                .addActionRowComponents(row => row.setComponents(
                    new ButtonBuilder().setCustomId(`confirm_delete_${playlistIdToDelete}`).setLabel('Yes, Delete').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId('cancel_delete').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
                ));

            await interaction.editReply({ components: [confirmContainer] });
          }
        }
      });

      collector.on('end', () => {
        reply.edit({ components: [this.createInformationContainer('Session Expired', 'This interaction has expired. Please run the command again.')] }).catch(() => {});
      });

    } catch (error) {
      logger.error('PlaylistsCommand', 'Error in playlists command:', error);
      return message.reply({
        components: [this.createErrorContainer('Error', 'An error occurred while retrieving your playlists. Please try again.')],
        flags: MessageFlags.IsComponentsV2
      });
    }
  }

  async showPlaylistPage(interaction, state, nextPage = null) {
    const { playlist, tracks, pageSize } = state;
    
    if (nextPage === true) {
      state.page++;
    } else if (nextPage === false) {
      state.page--;
    }
    
    const totalPages = Math.ceil(tracks.length / pageSize);
    state.page = Math.max(0, Math.min(state.page, totalPages > 0 ? totalPages - 1 : 0)); // Ensure page is valid even for 0 tracks
    
    const detailsContainer = this.createPlaylistDetailsContainer(playlist, tracks, state.page, totalPages);

    await interaction.editReply({
      components: [detailsContainer]
    });
  }

  async loadPlaylist(interaction, options) {
    const {
      playlistId,
      guild,
      voiceChannel, 
      member,
      channel,
      author,
      client,
      musicManager,
      shouldShuffle,
      playlist
    } = options;

    try {
      await interaction.editReply({
        components: [this.createLoadingContainer('Loading Playlist', `🎵 Loading playlist **${playlist.name}**${shouldShuffle ? ' (shuffled)' : ''}...`)]
      });

      const tracks = db.playlist.getPlaylistTracks(playlistId);
      
      if (!tracks.length) {
        await interaction.editReply({
          components: [this.createErrorContainer('Empty Playlist', 'This playlist is empty. Add tracks to it first.')]
        });
        return;
      }

      const permissions = voiceChannel.permissionsFor(guild.members.me);
      if (!permissions.has('Connect') || !permissions.has('Speak')) {
        await interaction.editReply({
          components: [this.createErrorContainer('Insufficient Permissions', 'I need permissions to join and speak in your voice channel!')]
        });
        return;
      }

      if (!musicManager || !musicManager.kazagumo) {
        logger.error('PlaylistsCommand', 'Music manager is not initialized');
        await interaction.editReply({
          components: [this.createErrorContainer('Error', 'Music system is not ready yet. Please try again in a moment.')]
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
            logger.error('PlaylistsCommand', 'Player creation failed, got null from MusicManager');
            await interaction.editReply({
              components: [this.createErrorContainer('Error', 'Failed to create a music player. Please try again later.')]
            });
            return;
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

          if (!verifiedPlayer) {
            logger.player('PlaylistsCommand', 'Player verification failed after max retries, using original player instance.', { guildId: guild.id });
            // Fallback to the initial player instance, which should still be valid.
          } else {
            player = verifiedPlayer;
          }
          
          playerNeedsInitialization = true;
        } catch (playerCreationError) {
          logger.error('PlaylistsCommand', 'Error creating player', playerCreationError);
          await interaction.editReply({
            components: [this.createErrorContainer('Error', 'An error occurred while creating the music player. Please try again.')]
          });
          return;
        }
      } else {
        isPlayerPlaying = player.playing && !player.paused;
      }

      const playerManager = new PlayerManager(player);
      const searchManager = new SearchManager(musicManager);

      await interaction.editReply({
        components: [this.createLoadingContainer('Processing Playlist', `⚙️ Processing playlist **${playlist.name}**...\nConverting tracks. This may take a moment.`)]
      });

      const convertTrack = async (dbTrack) => {
        try {
          if (dbTrack.uri) {
            const result = await searchManager.search(dbTrack.uri, {
              requester: author
            });
            if (result && result.tracks && result.tracks.length) {
              return result.tracks[0];
            }
          }
          const searchQuery = `${dbTrack.title} ${dbTrack.author}`;
          const platform = dbTrack.source || 'youtube'; // Default to youtube if source is unknown or missing
          
          const searchResult = await searchManager.search(searchQuery, {
            requester: author,
            platform: platform
          });
          if (searchResult && searchResult.tracks && searchResult.tracks.length) {
            return searchResult.tracks[0];
          }
          return null;
        } catch (error) {
          logger.error('PlaylistsCommand', `Error converting track: ${dbTrack.title}`, error);
          return null;
        }
      };

      const batchSize = 5;
      const trackBatches = [];

      for (let i = 0; i < tracks.length; i += batchSize) {
        trackBatches.push(tracks.slice(i, i + batchSize));
      }

      const convertedTracks = [];

      for (const batch of trackBatches) {
        const batchResults = await Promise.all(batch.map(dbTrack => convertTrack(dbTrack)));
        const validTracks = batchResults.filter(track => track !== null);
        convertedTracks.push(...validTracks);

        await interaction.editReply({
          components: [this.createLoadingContainer('Processing Playlist', `⚙️ Processing playlist **${playlist.name}**...\nProgress: ${convertedTracks.length}/${tracks.length} tracks processed.`)]
        });
      }

      if (!convertedTracks.length) {
        await interaction.editReply({
          components: [this.createErrorContainer('No Tracks Found', 'Failed to convert any tracks from the playlist to playable format.')]
        });
        return;
      }

      if (shouldShuffle) {
        for (let i = convertedTracks.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [convertedTracks[i], convertedTracks[j]] = [convertedTracks[j], convertedTracks[i]];
        }
      }

      try {
        if (isPlayerPlaying) {
          playerManager.queue.add(convertedTracks);
          
          await interaction.editReply({
            components: [this.createSuccessContainer('Playlist Queued', `Added **${convertedTracks.length}** tracks from playlist **${playlist.name}**${shouldShuffle ? ' (shuffled)' : ''} to the queue.`)]
          });
        } else {
          const firstTrack = convertedTracks.shift();
          
          if (playerNeedsInitialization) {
            await player.play(firstTrack);
          } else {
            playerManager.queue.add(firstTrack);
            await playerManager.play();
          }
          
          if (convertedTracks.length) {
            playerManager.queue.add(convertedTracks);
          }
          
          await interaction.editReply({
            components: [this.createSuccessContainer('Playlist Started', `Now playing **${firstTrack.title}** from playlist **${playlist.name}**${shouldShuffle ? ' (shuffled)' : ''}.\n\nAdded ${convertedTracks.length} more track${convertedTracks.length !== 1 ? 's' : ''} to queue.`)]
          });
        }
      } catch (playbackError) {
        logger.error('PlaylistsCommand', 'Error during track playback', playbackError);
        await interaction.editReply({
          components: [this.createErrorContainer('Playback Error', 'An error occurred during playback setup. Please try again.')]
        });
      }
    } catch (error) {
      logger.error('PlaylistsCommand', 'Error loading playlist:', error);
      await interaction.editReply({
        components: [this.createErrorContainer('Error', 'An error occurred while trying to load the playlist. Please try again.')]
      });
    }
  }
}

export default new PlaylistsCommand();
