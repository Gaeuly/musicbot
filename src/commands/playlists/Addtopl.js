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
  ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags, ComponentType
} from 'discord.js';

class AddToPlaylistCommand extends Command {
  constructor() {
    super({
      name: 'add-to-playlist',
      description: 'Add the current playing track or tracks from queue to a playlist',
      usage: 'add-to-playlist [playlist_id] [--current|--queue|--at <position>]',
      aliases: ['add2pl', 'playlist-add', 'pl-add'],
      category: 'playlists',
      cooldown: 5,
      playerRequired: true,
      examples: [
        'add-to-playlist',
        'add-to-playlist 5 --current',
        'add-to-playlist 3 --queue',
        'add-to-playlist 2 --at 3',
      ]
    });
  }

  /**
   * Creates a ContainerBuilder for displaying error messages.
   * @param {string} title - The title of the error.
   * @param {string} description - The description of the error.
   * @returns {ContainerBuilder}
   */
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

  /**
   * Creates a ContainerBuilder for displaying success messages.
   * @param {string} title - The title of the success message.
   * @param {string} description - The description of the success message.
   * @returns {ContainerBuilder}
   */
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

  /**
   * Creates the initial interactive menu with options to add current track,
   * entire queue, or select from queue.
   * @param {object} currentTrack - The currently playing track.
   * @param {Array<object>} queueTracks - The array of tracks in the queue.
   * @returns {ContainerBuilder}
   */
  createInteractiveMenuContainer(currentTrack, queueTracks) {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('🎵 **Add to Playlist**')
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('Select what you want to add to your playlist:')
      );

    if (currentTrack) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`▶️ **Currently Playing:** ${currentTrack.title} by *${currentTrack.author || 'Unknown'}*`)
      );
    }

    const safeQueueTracks = Array.isArray(queueTracks) ? queueTracks : [];

    if (safeQueueTracks.length > 0) {
      let queueList = safeQueueTracks.slice(0, 5).map((track, index) =>
        `**${index + 1}.** ${track.title} - ${track.author || 'Unknown'}`
      ).join('\n');

      if (safeQueueTracks.length > 5) {
        queueList += `\n*...and ${safeQueueTracks.length - 5} more tracks*`;
      }
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`📋 **Queue:**\n${queueList}`)
      );
    }

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(false).setSpacing(SeparatorSpacingSize.Small)
    )
    .addActionRowComponents(row =>
      row.setComponents(
        new ButtonBuilder()
          .setCustomId('add_current')
          .setLabel('Current Track')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(!currentTrack),
        new ButtonBuilder()
          .setCustomId('add_queue')
          .setLabel('Entire Queue')
          .setStyle(ButtonStyle.Success)
          .setDisabled(!currentTrack && safeQueueTracks.length === 0), // Enabled if current track exists OR queue has tracks
        new ButtonBuilder()
          .setCustomId('select_from_queue')
          .setLabel('Select from Queue')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(safeQueueTracks.length === 0) // Disabled only if queue is empty
      )
    );
    return container;
  }

  /**
   * Creates the playlist selection menu.
   * @param {Array<object>} userPlaylists - The list of user's playlists.
   * @param {string} actionType - The type of action ('current', 'queue', 'specific').
   * @param {string} [trackTitle=null] - The title of the track being added (for single track actions).
   * @param {number} [trackIndex=null] - The index of the track in the queue (for specific track).
   * @param {number} [queueLength=null] - The total number of tracks in the queue (for entire queue action).
   * @returns {ContainerBuilder}
   */
  createPlaylistSelectionContainer(userPlaylists, actionType, trackTitle = null, trackIndex = null, queueLength = null) {
    let contentText = '';
    if (actionType === 'current' && trackTitle) {
      contentText = `Select a playlist to add the current track "**${trackTitle}**":`;
    } else if (actionType === 'queue' && queueLength !== null) {
      contentText = `Select a playlist to add the entire queue (**${queueLength}** tracks):`;
    } else if (actionType === 'specific' && trackTitle && trackIndex !== null) {
      contentText = `Select a playlist to add track **${trackIndex + 1}. ${trackTitle}** from queue:`;
    } else {
      contentText = 'Select a playlist:';
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('playlist_select')
      .setPlaceholder('Choose a playlist')
      .addOptions(
        userPlaylists.map(playlist => ({
          label: playlist.name,
          description: `ID: ${playlist.id} - ${db.playlist.countPlaylistTracks(playlist.id)} tracks`,
          value: playlist.id.toString()
        }))
      );

    return new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(contentText)
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      )
      .addActionRowComponents(row => row.setComponents(selectMenu))
      .addActionRowComponents(row =>
        row.setComponents(
          new ButtonBuilder()
            .setCustomId('back_to_menu')
            .setLabel('Back')
            .setStyle(ButtonStyle.Secondary)
        )
      );
  }

  /**
   * Creates the queue track selection menu.
   * @param {Array<object>} queueTracks - The array of tracks in the queue.
   * @returns {ContainerBuilder}
   */
  createQueueSelectionContainer(queueTracks) {
    const safeQueueTracks = Array.isArray(queueTracks) ? queueTracks : [];

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('queue_track_select')
      .setPlaceholder('Select a track from the queue')
      .addOptions(
        safeQueueTracks.slice(0, 25).map((track, index) => ({
          label: `${index + 1}. ${track.title.substring(0, 80)}`,
          description: track.author ? track.author.substring(0, 80) : 'Unknown',
          value: index.toString()
        }))
      );

    return new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('**Select a track from the queue to add to a playlist:**')
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      )
      .addActionRowComponents(row => row.setComponents(selectMenu))
      .addActionRowComponents(row =>
        row.setComponents(
          new ButtonBuilder()
            .setCustomId('back_to_menu')
            .setLabel('Back')
            .setStyle(ButtonStyle.Secondary)
        )
      );
  }

  /**
   * Executes the add-to-playlist command.
   * @param {object} options - Command options including message, args, client, musicManager.
   * @returns {Promise<void>}
   */
  async execute({ message, args, client, musicManager }) {
    const { author, guild } = message;

    const player = musicManager.getPlayer(guild.id);
    if (!player) {
      return message.reply({
        components: [this.createErrorContainer('No Active Player', 'There is no active music player in this server.')],
        flags: MessageFlags.IsComponentsV2
      });
    }

    const currentTrack = player.queue.current;
    // IMPORTANT CHANGE: Use player.queue directly if it's the array, as in the old code.
    // If your musicManager player structure uses player.queue.tracks for the array, change this back.
    const queueTracks = Array.isArray(player.queue) ? player.queue : []; 

    if (!currentTrack && queueTracks.length === 0) {
      return message.reply({
        components: [this.createErrorContainer('Nothing Playing', 'There is nothing currently playing or in the queue to add to a playlist.')],
        flags: MessageFlags.IsComponentsV2
      });
    }

    const userPlaylists = db.playlist.getPlaylists(author.id);

    if (!userPlaylists || userPlaylists.length === 0) {
      return message.reply({
        components: [this.createErrorContainer('No Playlists Available', `You don't have any playlists yet.\n\nCreate one first with \`create-playlist <name>\``)],
        flags: MessageFlags.IsComponentsV2
      });
    }

    let playlistId = null;
    let addCurrent = false;
    let addQueue = false;
    let positionToAdd = null;

    if (args.length > 0 && !isNaN(args[0])) {
      playlistId = parseInt(args[0]);

      const playlist = db.playlist.getPlaylistById(playlistId);
      if (!playlist || playlist.userId !== author.id) {
        return message.reply({
          components: [this.createErrorContainer('Playlist Not Found', `Playlist with ID ${playlistId} was not found in your playlists. Use \`playlists\` to see your playlists.`)],
          flags: MessageFlags.IsComponentsV2
        });
      }
    }

    if (args.includes('--current')) {
      addCurrent = true;
    } else if (args.includes('--queue')) {
      addQueue = true;
    } else if (args.includes('--at')) {
      const atIndex = args.indexOf('--at');
      if (atIndex + 1 < args.length) {
        const pos = parseInt(args[atIndex + 1]);
        if (!isNaN(pos) && pos >= 1 && pos <= queueTracks.length) {
          positionToAdd = pos;
        } else {
          return message.reply({
            components: [this.createErrorContainer('Invalid Position', `Please provide a valid position between 1 and ${queueTracks.length}.`)],
            flags: MessageFlags.IsComponentsV2
          });
        }
      }
    }

    if (!playlistId || (!addCurrent && !addQueue && positionToAdd === null)) {
      return this.showInteractiveMenu(message, userPlaylists, currentTrack, queueTracks);
    }

    if (addCurrent && currentTrack) {
      const success = db.playlist.addTrack(playlistId, currentTrack);
      if (success) {
        const playlist = db.playlist.getPlaylistById(playlistId);
        return message.reply({
          components: [this.createSuccessContainer('Track Added to Playlist', `Added **${currentTrack.title}** to playlist **${playlist.name}**.` )],
          flags: MessageFlags.IsComponentsV2
        });
      } else {
        return message.reply({
          components: [this.createErrorContainer('Error Adding to Playlist', 'Failed to add the current track to the playlist. Please try again.')],
          flags: MessageFlags.IsComponentsV2
        });
      }
    }
    else if (addQueue && (currentTrack || queueTracks.length > 0)) {
      // Ensure all tracks (current + queue) are included when adding the entire queue
      const allTracks = currentTrack ? [currentTrack, ...queueTracks] : [...queueTracks];
      const success = db.playlist.addTracks(playlistId, allTracks);
      if (success) {
        const playlist = db.playlist.getPlaylistById(playlistId);
        return message.reply({
          components: [this.createSuccessContainer('Queue Added to Playlist', `Added ${allTracks.length} tracks from the queue to playlist **${playlist.name}**.` )],
          flags: MessageFlags.IsComponentsV2
        });
      } else {
        return message.reply({
          components: [this.createErrorContainer('Error Adding to Playlist', 'Failed to add the queue to the playlist. Please try again.')],
          flags: MessageFlags.IsComponentsV2
        });
      }
    }
    else if (positionToAdd !== null) {
      const trackToAdd = queueTracks[positionToAdd - 1];
      if (trackToAdd) {
        const success = db.playlist.addTrack(playlistId, trackToAdd);
        if (success) {
          const playlist = db.playlist.getPlaylistById(playlistId);
          return message.reply({
            components: [this.createSuccessContainer('Track Added to Playlist', `Added **${trackToAdd.title}** from queue position ${positionToAdd} to playlist **${playlist.name}**.` )],
            flags: MessageFlags.IsComponentsV2
          });
        } else {
          return message.reply({
            components: [this.createErrorContainer('Error Adding to Playlist', 'Failed to add the track to the playlist. Please try again.')],
            flags: MessageFlags.IsComponentsV2
          });
        }
      } else {
        return message.reply({
          components: [this.createErrorContainer('Track Not Found', `Could not find a track at position ${positionToAdd} in the queue.`)],
          flags: MessageFlags.IsComponentsV2
        });
      }
    }

    return message.reply({
      components: [this.createErrorContainer('Error Adding to Playlist', 'An error occurred while adding to the playlist. Please try again.')],
      flags: MessageFlags.IsComponentsV2
    });
  }

  /**
   * Displays the interactive menu and handles user interactions.
   * @param {object} message - The Discord message object.
   * @param {Array<object>} userPlaylists - The list of user's playlists.
   * @param {object} currentTrack - The currently playing track.
   * @param {Array<object>} queueTracks - The array of tracks in the queue.
   */
  async showInteractiveMenu(message, userPlaylists, currentTrack, queueTracks) {
    const { author } = message;

    const interactiveMenuContainer = this.createInteractiveMenuContainer(currentTrack, queueTracks);
    const reply = await message.reply({
      components: [interactiveMenuContainer],
      flags: MessageFlags.IsComponentsV2
    });

    const sessionState = {
      actionType: null, // 'current', 'queue', 'specific'
      trackToAdd: null, // For single track
      tracksToAdd: null, // For entire queue
      specificTrackIndex: null, // For specific track from queue
    };

    const collector = reply.createMessageComponentCollector({
      filter: (i) => i.user.id === author.id,
      time: 60000
    });

    collector.on('collect', async (interaction) => {
      try {
        const customId = interaction.customId;

        if (customId === 'add_current') {
          sessionState.actionType = 'current';
          sessionState.trackToAdd = currentTrack;
          sessionState.tracksToAdd = null;
          sessionState.specificTrackIndex = null;
          await interaction.update({
            components: [this.createPlaylistSelectionContainer(userPlaylists, sessionState.actionType, currentTrack?.title)],
            embeds: []
          });
        }
        else if (customId === 'add_queue') {
          sessionState.actionType = 'queue';
          // Combine current track and queue tracks for "entire queue" action
          const allTracks = currentTrack ? [currentTrack, ...(Array.isArray(queueTracks) ? queueTracks : [])] : [...(Array.isArray(queueTracks) ? queueTracks : [])];
          sessionState.tracksToAdd = allTracks; 
          sessionState.trackToAdd = null;
          sessionState.specificTrackIndex = null;
          await interaction.update({
            components: [this.createPlaylistSelectionContainer(userPlaylists, sessionState.actionType, null, null, sessionState.tracksToAdd?.length)],
            embeds: []
          });
        }
        else if (customId === 'select_from_queue') {
          sessionState.actionType = 'specific';
          sessionState.trackToAdd = null;
          sessionState.tracksToAdd = null;
          sessionState.specificTrackIndex = null;
          await interaction.update({
            components: [this.createQueueSelectionContainer(queueTracks)],
            embeds: []
          });
        }
        else if (customId === 'back_to_menu') {
          sessionState.actionType = null;
          sessionState.trackToAdd = null;
          sessionState.tracksToAdd = null;
          sessionState.specificTrackIndex = null;
          await interaction.update({
            components: [this.createInteractiveMenuContainer(currentTrack, queueTracks)],
            embeds: []
          });
        }
        else if (customId === 'queue_track_select' && interaction.isStringSelectMenu()) {
          const selectedIndex = parseInt(interaction.values[0]);
          const selectedTrack = queueTracks[selectedIndex];
          
          sessionState.specificTrackIndex = selectedIndex;
          sessionState.trackToAdd = selectedTrack;
          sessionState.tracksToAdd = null;
          sessionState.actionType = 'specific';

          await interaction.update({
            components: [this.createPlaylistSelectionContainer(userPlaylists, sessionState.actionType, selectedTrack?.title, selectedIndex)],
            embeds: []
          });
        }
        else if (customId === 'playlist_select' && interaction.isStringSelectMenu()) {
          const selectedPlaylistId = parseInt(interaction.values[0]);
          const playlist = db.playlist.getPlaylistById(selectedPlaylistId);

          let success = false;
          let successMessage = '';
          
          // Helper to format track data consistently for the database
          const formatTrackForDB = (track) => ({
            title: track.title || 'Unknown Title',
            author: track.author || 'Unknown Artist',
            uri: track.uri || '',
            thumbnail: track.thumbnail || '',
            length: track.length || 0,
            source: track.source || db.playlist.detectSourceFromUri(track.uri), // Assuming db.playlist has this method
          });


          if (sessionState.actionType === 'current' && sessionState.trackToAdd) {
            success = db.playlist.addTrack(selectedPlaylistId, formatTrackForDB(sessionState.trackToAdd));
            if (success) {
              successMessage = `Added **${sessionState.trackToAdd.title}** to your playlist.`;
            }
          } else if (sessionState.actionType === 'queue' && sessionState.tracksToAdd && sessionState.tracksToAdd.length > 0) {
            const formattedTracks = sessionState.tracksToAdd.map(track => formatTrackForDB(track));
            success = db.playlist.addTracks(selectedPlaylistId, formattedTracks);
            if (success) {
              successMessage = `Added ${sessionState.tracksToAdd.length} tracks from the queue to your playlist.`;
            }
          } else if (sessionState.actionType === 'specific' && sessionState.trackToAdd) {
            success = db.playlist.addTrack(selectedPlaylistId, formatTrackForDB(sessionState.trackToAdd));
            if (success) {
              successMessage = `Added **${sessionState.trackToAdd.title}** from queue position ${sessionState.specificTrackIndex + 1} to your playlist.`;
            }
          }

          if (success) {
            await interaction.update({
              components: [this.createSuccessContainer('Added to Playlist', `${successMessage}\n\nPlaylist: **${playlist.name}**`)],
              embeds: []
            });
          } else {
            await interaction.update({
              components: [this.createErrorContainer('Error', 'Failed to add to playlist. Please try again.')],
              embeds: []
            });
          }
        }
      } catch (error) {
        console.error('Error handling interaction:', error);
        try {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
              components: [this.createErrorContainer('Error', 'An unexpected error occurred. Please try again.')],
              ephemeral: true,
              flags: MessageFlags.IsComponentsV2
            });
          } else {
            await interaction.editReply({
              components: [this.createErrorContainer('Error', 'An unexpected error occurred. Please try again.')],
              embeds: []
            });
          }
        } catch (replyError) {
          console.error('Error sending error response:', replyError);
        }
      }
    });

    collector.on('end', (collected, reason) => {
      try {
        if (reason === 'time') {
          reply.edit({
            components: [this.createErrorContainer('Timed Out', 'This interaction has expired. Please run the command again.')]
          }).catch(() => {});
        }
      } catch (error) {
        console.error('Error handling collector end:', error);
      }
    });
  }
}

export default new AddToPlaylistCommand();
