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
import { logger } from '../../utils/logger.js';
import { PlayerManager } from '../../managers/PlayerManager.js';
import { playerButtons } from '../../structures/PlayerButtons.js';
import { EmbedBuilder, ActionRowBuilder, AttachmentBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ComponentType, ButtonStyle, ButtonBuilder } from 'discord.js';
import { db } from '../../database/DatabaseManager.js';
import { MusicCard } from '../../structures/canvas/MusicCard.js';
import axios from 'axios';

const activeLyricSessions = new Map();

async function updatePlayerButtons(interaction, client, player) {
  try {
    if (!player || !player.textId) {
      logger.debug('updatePlayerButtons', 'Missing player or textId, cannot update message.');
      return;
    }

    const channel = client.channels.cache.get(player.textId);
    if (!channel) {
      logger.debug('updatePlayerButtons', `Text channel ${player.textId} not found or not cached.`);
      return;
    }

    let targetMessage = null;
    if (player.messageId) {
      try {
        targetMessage = await channel.messages.fetch(player.messageId);
      } catch (fetchError) {
        logger.debug('updatePlayerButtons', `Failed to fetch stored message ${player.messageId}. It might have been deleted. Error: ${fetchError.message}`);
        player.messageId = null;
      }
    }

    if (!targetMessage) {
      logger.debug('updatePlayerButtons', 'No valid stored message. Searching for player message in recent messages.');
      const messages = await channel.messages.fetch({ limit: 15 });
      const botMessages = messages.filter(msg =>
        msg.author.id === client.user.id &&
        msg.components.length > 0 &&
        msg.attachments.size > 0
      );

      if (botMessages.size > 0) {
        targetMessage = botMessages.first();
        player.messageId = targetMessage.id;
        logger.debug('updatePlayerButtons', `Found player message ${targetMessage.id} through search.`);
      } else {
        logger.debug('updatePlayerButtons', 'No suitable player message found to update.');
        return;
      }
    }

    const currentTrack = player.queue?.current;
    const guild = interaction.guild;
    const interactingUser = interaction.user;
      
    let isLikedByInteractingUser = false;
    if (interactingUser?.id && currentTrack?.uri) {
      try {
        isLikedByInteractingUser = await db.user.isTrackLiked(interactingUser.id, currentTrack.uri);
      } catch (dbError) {
        logger.error('updatePlayerButtons', 'Failed to get like status from DB for interacting user', dbError);
      }
    }

    let isLikedByRequesterForCard = false;
    if (currentTrack?.requester?.id && currentTrack?.uri) {
        try {
            isLikedByRequesterForCard = await db.user.isTrackLiked(currentTrack.requester.id, currentTrack.uri);
        } catch (dbError) {
            logger.error('updatePlayerButtons', 'Failed to get like status from DB for card display (requester)', dbError);
        }
    }

    let loopState = 'none';
    if (typeof player.trackRepeat === 'boolean' && typeof player.queueRepeat === 'boolean') {
        if (player.trackRepeat) loopState = 'track';
        else if (player.queueRepeat) loopState = 'queue';
    } else if (player.loop) {
        loopState = player.loop;
    }

    const playerHasPreviousTrack = !!(player.queue?.previous || (typeof player.getPrevious === 'function' && player.getPrevious()));

    const playerState = {
      paused: player.paused,
      loop: loopState,
      volume: player.volume || 100,
      isLiked: isLikedByInteractingUser,
      hasPrevious: playerHasPreviousTrack,
      hasNext: player.queue && player.queue.length > 0,
      isRadio: player.radio || false,
    };

    const controlRow = playerButtons.createPlayerControls(playerState);
    const secondaryRow = playerButtons.createSecondaryControls(playerState);

    let newFiles = [];
    let newEmbeds = [];

    if (currentTrack && guild) {
      try {
        const musicCard = new MusicCard();
        const imageBuffer = await musicCard.generateNowPlayingCard({
          track: currentTrack,
          position: player.position || 0,
          isLiked: isLikedByRequesterForCard,
          guildName: guild.name,
          guildIcon: guild.iconURL({ format: 'png', size: 128 }),
          player: player,
        });
        const newAttachment = new AttachmentBuilder(imageBuffer, { name: 'nowplaying.png' });
        newFiles = [newAttachment];
      } catch (cardError) {
        logger.error('updatePlayerButtons', 'Failed to generate or prepare music card', cardError);
        if (targetMessage.attachments.size > 0) {
            newFiles = Array.from(targetMessage.attachments.values());
        }
      }
    }

    await targetMessage.edit({
      content: null,
      embeds: newEmbeds,
      files: newFiles,
      components: [controlRow, secondaryRow]
    });

    logger.debug('updatePlayerButtons', `Player message ${targetMessage.id} updated with new card and buttons.`);
  } catch (error) {
    logger.error('updatePlayerButtons', 'Error updating player message (card and buttons)', error);
  }
}

function sanitizeInput(str) {
  if (!str) return '';
  return str
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
}

function parseTimestamp(timestamp) {
  const match = timestamp.match(/(\d+):(\d{2})\.(\d+)/);
  if (!match) return 0;
  const minutes = parseInt(match[1], 10);
  const seconds = parseInt(match[2], 10);
  const milliseconds = parseInt(match[3], 10) / Math.pow(10, match[3].length);
  return minutes * 60 + seconds + milliseconds;
}

async function searchLyrics(query) {
  try {
    const res = await axios.get('https://lrclib.net/api/search', {
      params: { q: query },
      timeout: 5000
    }).catch(err => {
      if (err.response?.status === 404) return { data: [] };
      throw err;
    });

    const result = res.data[0];
    if (result) {
      return {
        title: result.trackName || result.name,
        artist: result.artistName || result.artist,
        lyrics: cleanLyrics(result.plainLyrics || result.lyrics),
        syncedLyrics: result.syncedLyrics,
        hasSync: !!result.syncedLyrics
      };
    }
    return null;
  } catch (err) {
    logger.error('LyricsSearch', `Error searching lyrics for "${query}": ${err.message}`, err);
    return null;
  }
}

function cleanLyrics(lyrics) {
  if (!lyrics) return '';
  return lyrics.replace(/\]/g, '').trim();
}

async function startSyncMode(message, lyricsData, player) {
  const sessionKey = message.id;

  if (activeLyricSessions.has(sessionKey)) {
    activeLyricSessions.get(sessionKey).stop();
  }

  const lines = lyricsData.syncedLyrics
    .split('\n')
    .map(line => {
      const match = line.match(/(\d+:\d{2}\.\d+)\s*(.*)/);
      if (match) {
        return { time: parseTimestamp(match[1]), text: cleanLyrics(match[2]) };
      }
      return null;
    })
    .filter(line => line && line.text);

  if (!lines.length) return null;

  let currentIndex = 0;
  let isActive = true;
  let timeoutId = null;

  const syncSession = {
    stop: () => {
      isActive = false;
      if (timeoutId) clearTimeout(timeoutId);
      activeLyricSessions.delete(sessionKey);
      logger.debug('SyncMode', `Sync session for message ${message.id} stopped.`);
    }
  };

  activeLyricSessions.set(sessionKey, syncSession);
  logger.debug('SyncMode', `Sync session for message ${message.id} started.`);

  const updateSync = async () => {
    if (!isActive || !player || !player.playing || !player.queue.current) {
      syncSession.stop();
      return;
    }

    const currentTime = (typeof player.position === 'number' ? player.position / 1000 : 0);
    const trackDuration = player.queue.current?.length || 0;
    const actualDuration = trackDuration ? Math.floor(trackDuration / 1000) : 0;

    while (currentIndex < lines.length && lines[currentIndex].time <= currentTime) {
      currentIndex++;
    }

    const windowSize = 6;
    const halfWindow = Math.floor(windowSize / 2);

    let startIndex = Math.max(0, currentIndex - halfWindow - 1);
    let endIndex = Math.min(lines.length, startIndex + windowSize);

    if (endIndex - startIndex < windowSize && endIndex === lines.length) {
      startIndex = Math.max(0, endIndex - windowSize);
    }
    const visibleLines = lines.slice(startIndex, endIndex);

    // Modified logic to bold only the current and next lines based on index
    const lyricsContent = visibleLines.map((line, index) => {
      const globalIndex = startIndex + index; // Calculate the global index of the line
      if (globalIndex === currentIndex - 1 || globalIndex === currentIndex) {
        return `**${line.text}**`; // Bold only the current and next lines
      }
      return `-# ${line.text}`;
    }).join('\n') || 'Waiting for lyrics...';

    const progress = Math.min(100, Math.floor((currentTime / actualDuration) * 100) || 0);
    
    const { embed: syncEmbed, components: syncComponents } = createSyncDisplay(
      lyricsData,
      lyricsContent,
      currentTime,
      actualDuration,
      progress,
      currentIndex,
      lines.length
    );

    try {
      await message.edit({ files: [], embeds: [syncEmbed], components: syncComponents });
    } catch (err) {
      logger.error('SyncMode', `Error updating sync message ${message.id}: ${err.message}`, err);
      syncSession.stop();
      return;
    }

    if (isActive) {
      timeoutId = setTimeout(updateSync, 800);
    }
  };

  updateSync();
  return syncSession.stop;
}

function createProgressBar(percentage, length = 25) {
  const filled = Math.floor((percentage / 100) * length);
  const empty = length - filled;
  const bar = '▰'.repeat(filled) + '▱'.repeat(empty);
  return `[${bar}](https://discord.gg/argo-hq-1064090724653613126) **${percentage}%**`;
}

function createLoadingDisplay(title, artist) {
  const embed = new EmbedBuilder()
    .setColor('#f1c40f')
    .setTitle('🔄 Fetching Lyrics')
    .setDescription(`🎵 **${title}**\n🎤 ${artist || 'Unknown Artist'}\n\n⏳ *Searching lyrics database...*`);
  
  return { embed, components: [] };
}

function createErrorDisplay(title, description) {
  const embed = new EmbedBuilder()
    .setColor('#e74c3c')
    .setTitle(title)
    .setDescription(description);

  const actionRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('close_lyrics_error')
      .setEmoji('<:discotoolsxyzicon70:1347122749876863048>')
      .setStyle(ButtonStyle.Danger)
  );
  return { embed, components: [actionRow] };
}

function createLyricsDisplay(lyricsData, pageContent, currentPage, totalPages, hasSync) {
  const embed = new EmbedBuilder()
    .setColor('#9b59b6')
    .setTitle(`🎵 ${lyricsData.title}`)
    .setDescription(pageContent);

  if (lyricsData.artist) {
    embed.addFields({ name: 'Artist', value: `🎤 ${lyricsData.artist}`, inline: true });
  }

  let footerText = '';
  if (totalPages > 1) {
    footerText += `📖 Page ${currentPage + 1} of ${totalPages}`;
  }
  if (hasSync) {
    footerText += (footerText ? ' • ' : '') + '✨ Live Sync Available';
  }
  if (footerText) {
    embed.setFooter({ text: footerText });
  }

  const navigationButtons = [];
  
  if (totalPages > 1) {
    navigationButtons.push(
      new ButtonBuilder()
        .setCustomId('prev_lyric_page')
        .setEmoji('<:arrow_red_left:1380491961437257778>')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === 0)
    );
  }

  if (hasSync) {
    navigationButtons.push(
      new ButtonBuilder()
        .setCustomId('start_sync')
        .setEmoji('✨')
        .setLabel('Start Sync')
        .setStyle(ButtonStyle.Success)
    );
  }

  if (totalPages > 1) {
    navigationButtons.push(
      new ButtonBuilder()
        .setCustomId('next_lyric_page')
        .setEmoji('<:arrow:1380482153808400404>')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === totalPages - 1)
    );
  }

  navigationButtons.push(
    new ButtonBuilder()
      .setCustomId('close_lyrics')
      .setEmoji('<:discotoolsxyzicon70:1347122749876863048>')
      .setStyle(ButtonStyle.Danger)
  );

  const components = [];
  if (navigationButtons.length > 0) {
    components.push(new ActionRowBuilder().addComponents(...navigationButtons));
  }

  return { embed, components };
}

function createSyncDisplay(lyricsData, lyricsContent, currentTime, duration, progressPercentage, currentLine, totalLines) {
  const currentMinutes = Math.floor(currentTime / 60);
  const currentSeconds = Math.floor(currentTime % 60);
  
  const progressBar = createProgressBar(progressPercentage);

  const embed = new EmbedBuilder()
    .setColor('#3498db')
    .setTitle(`🎵 ${lyricsData.title} ✨`)
    .setDescription(lyricsContent)
    .addFields(
      { name: 'Time', value: `⏱️ **${currentMinutes}:${String(currentSeconds).padStart(2, '0')}** • Line **${currentLine}**/**${totalLines}**`, inline: true },
      { name: 'Progress', value: progressBar, inline: true },
      { name: 'Info', value: '-# 🎵 *Real-time sync with music* • Updates every 0.8s', inline: false }
    );

  if (lyricsData.artist) {
    embed.setAuthor({ name: `🎤 by ${lyricsData.artist}` });
  }

  const components = [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('stop_sync')
        .setEmoji('⏹️')
        .setLabel('Stop Sync')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('close_lyrics')
        .setEmoji('<:discotoolsxyzicon70:1347122749876863048>')
        .setStyle(ButtonStyle.Secondary)
    )
  ];

  return { embed, components };
}

function createTimeoutDisplay() {
  const embed = new EmbedBuilder()
    .setColor('#f39c12')
    .setTitle('⏰ Session Expired')
    .setDescription(`🔄 Use lyrics command again to view lyrics`);

  const actionRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('close_lyrics_timeout')
      .setEmoji('<:discotoolsxyzicon70:1347122749876863048>')
      .setStyle(ButtonStyle.Danger)
  );
  return { embed, components: [actionRow] };
}

function splitLyrics(lyrics, maxLength = 900) {
  const lines = lyrics.split('\n');
  const pages = [];
  let chunk = '';

  for (const line of lines) {
    const potentialChunk = chunk ? `${chunk}\n${line}` : line;
    if (potentialChunk.length > maxLength && chunk) {
      pages.push(chunk);
      chunk = line;
    } else {
      chunk = potentialChunk;
    }
  }

  if (chunk) pages.push(chunk);
  return pages.length > 0 ? pages : ['No lyrics content available'];
}

export default {
  name: 'interactionCreate',
  async execute(interaction, client) {
    try {
      if (!interaction.isButton() && !interaction.isModalSubmit()) return;

      const guildId = interaction.guild?.id;
      if (!guildId) {
        logger.warn('InteractionCreate', 'Interaction received without guildId.');
        if (interaction.isRepliable()) {
            await interaction.reply({ content: '❌ This command can only be used in a server.', ephemeral: true }).catch(e => logger.error('InteractionCreate', 'Failed to reply for missing guildId', e));
        }
        return;
      }

      let player = client.music.getPlayer(guildId);

      if (interaction.isModalSubmit()) {
        if (interaction.customId === 'volume-modal') {
          await interaction.deferReply({ ephemeral: true });

          const newVolume = parseInt(interaction.fields.getTextInputValue('volume-input'));

          if (isNaN(newVolume) || newVolume < 0 || newVolume > 150) {
            await interaction.editReply({
              content: '❌ Please enter a valid volume between 0 and 150.',
            });
            return;
          }

          if (!player) {
            await interaction.editReply({
              content: '<:discotoolsxyzicon87:1347122685267939348> There is no active music player in this server to set volume for.',
            });
            return;
          }
          let playerManager = new PlayerManager(player);
          await playerManager.setVolume(newVolume);

          await interaction.editReply({
            content: `<:discotoolsxyzicon69:1347122753613987890> Volume has been set to **${newVolume}%**`,
          });

          await updatePlayerButtons(interaction, client, player);
        }
        return;
      }

      const buttonId = interaction.customId;
      const isPlayerButton = Object.values(playerButtons.ids).includes(buttonId);

      if (buttonId === playerButtons.ids.lyric) {
        await this.handleLyricButtonPress(interaction, client, player);
        return;
      }

      if (!isPlayerButton) {
        logger.debug('InteractionCreate', `Ignoring non-player button: ${buttonId}`);
        return;
      }

      if (!player) {
        return interaction.reply({
          content: '<:discotoolsxyzicon87:1347122685267939348> There is no active music player in this server.',
          ephemeral: true
        });
      }

      const user = interaction.user;
      const isSocialOrInfoButton = [
        playerButtons.ids.like,
        playerButtons.ids.queue,
        playerButtons.ids.volume
      ].includes(buttonId);

      if (!isSocialOrInfoButton) {
        const member = interaction.guild.members.cache.get(user.id);
        const voiceChannelId = member?.voice?.channelId;

        if (!voiceChannelId || voiceChannelId !== player.voiceId) {
          return interaction.reply({
            content: `<:discotoolsxyzicon87:1347122685267939348> You need to be in the same voice channel (<#${player.voiceId}>) to use player controls.`,
            ephemeral: true
          });
        }
      }

      if (buttonId !== playerButtons.ids.volume && buttonId !== playerButtons.ids.queue) {
        await interaction.deferReply({ ephemeral: true });
      }

      let playerManager = new PlayerManager(player);
      await this.processButtonInteraction(interaction, client, player, playerManager, buttonId);

    } catch (error) {
      logger.error('InteractionCreate', 'Error handling interaction', error);
      try {
        const errorMessage = '<:discotoolsxyzicon87:1347122685267939348> An error occurred while processing your request.';
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ content: errorMessage }).catch(e => logger.error('InteractionCreate', 'Failed to editReply on error', e));
        } else if (interaction.isRepliable()){
          await interaction.reply({ content: errorMessage, ephemeral: true }).catch(e => logger.error('InteractionCreate', 'Failed to reply on error', e));
        }
      } catch (replyError) {
        logger.error('InteractionCreate', 'Failed to send error reply to interaction', replyError);
      }
    }
  },

  async handleLyricButtonPress(interaction, client, player) {
    const originalLyricButtonUser = interaction.user;

    if (!player || !player.playing || !player.queue.current) {
        await interaction.reply({
            content: '🚫 **No Active Playback**\n▶️ Start playing a song first to view its lyrics!',
            ephemeral: true
        });
        return;
    }

    const track = player.queue.current;
    
    const query = sanitizeInput(track.title);
    const artist = sanitizeInput(track.author || '');
    const searchQuery = `${query}${artist ? ` ${artist}` : ''}`;
    
    let sentMessage;
    const { embed: loadingEmbed, components: loadingComponents } = createLoadingDisplay(track.title, track.author);
    
    try {
        await interaction.deferReply();
        sentMessage = await interaction.followUp({
            embeds: [loadingEmbed],
            components: loadingComponents,
           
        });
    } catch (e) {
        logger.error('handleLyricButtonPress', 'Failed to send initial ephemeral message', e);
        return;
    }

    let lyricsData = await searchLyrics(searchQuery);

    if (!lyricsData || !lyricsData.lyrics) {
        const { embed: errorEmbed, components: errorComponents } = createErrorDisplay('🔍 **Lyrics Not Found**', `🎵 No lyrics available for **${track.title}**\n💡 Try a different track or check the song title`);
        await sentMessage.edit({ embeds: [errorEmbed], components: errorComponents }).catch(e => logger.error('handleLyricButtonPress', 'Failed to edit with error message', e));
        return;
    }

    const pages = splitLyrics(lyricsData.lyrics);
    let currentPage = 0;
    let syncModeStopFunction = null; 
    let isSyncing = false;

    const { embed: initialEmbed, components: initialComponents } = createLyricsDisplay(lyricsData, pages[currentPage], currentPage, pages.length, lyricsData.hasSync);
    await sentMessage.edit({ embeds: [initialEmbed], components: initialComponents }).catch(e => logger.error('handleLyricButtonPress', 'Failed to edit with initial lyrics message', e));

    sentMessage._lyricsCurrentPage = currentPage;
    sentMessage._lyricsIsSyncing = isSyncing;

    const collector = sentMessage.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 600000
    });

    collector.on('collect', async (i) => {
        if (i.user.id !== originalLyricButtonUser.id) {
            return i.reply({
                content: '🔒 Only the user who requested these lyrics can control them.',
                ephemeral: true
            });
        }

        await i.deferUpdate();

        const currentLyricsData = lyricsData;
        const currentPages = pages;
        let currentLyricsCurrentPage = sentMessage._lyricsCurrentPage;
        let currentLyricsIsSyncing = sentMessage._lyricsIsSyncing;

        if (i.customId === 'start_sync' && currentLyricsData.hasSync) {
            if (currentLyricsIsSyncing) {
                if (syncModeStopFunction) syncModeStopFunction();
                currentLyricsIsSyncing = false;
                syncModeStopFunction = null;
                const { embed: normalEmbed, components: normalComponents } = createLyricsDisplay(currentLyricsData, currentPages[currentLyricsCurrentPage], currentLyricsCurrentPage, currentPages.length, currentLyricsData.hasSync);
                await sentMessage.edit({ embeds: [normalEmbed], components: normalComponents }).catch(e => logger.error('LyricCollector', 'Failed to revert from sync to normal', e));
            } else {
                const currentPlayer = client.music.getPlayer(interaction.guild.id);
                if (!currentPlayer || !currentPlayer.playing || !currentPlayer.queue.current) {
                    return i.followUp({
                        content: '⚠️ No music is currently playing for sync mode.',
                        ephemeral: true
                    });
                }
                syncModeStopFunction = await startSyncMode(sentMessage, currentLyricsData, currentPlayer);
                if (syncModeStopFunction) {
                    currentLyricsIsSyncing = true;
                }
            }
        } else if (i.customId === 'stop_sync') {
            if (syncModeStopFunction) syncModeStopFunction();
            currentLyricsIsSyncing = false;
            syncModeStopFunction = null;
            const { embed: normalEmbed, components: normalComponents } = createLyricsDisplay(currentLyricsData, currentPages[currentLyricsCurrentPage], currentLyricsCurrentPage, currentPages.length, currentLyricsData.hasSync);
            await sentMessage.edit({ embeds: [normalEmbed], components: normalComponents }).catch(e => logger.error('LyricCollector', 'Failed to stop sync and revert to normal', e));
        } else if (i.customId === 'prev_lyric_page' && currentLyricsCurrentPage > 0 && !currentLyricsIsSyncing) {
            currentLyricsCurrentPage--;
            const { embed: updatedEmbed, components: updatedComponents } = createLyricsDisplay(currentLyricsData, currentPages[currentLyricsCurrentPage], currentLyricsCurrentPage, currentPages.length, currentLyricsData.hasSync);
            await sentMessage.edit({ embeds: [updatedEmbed], components: updatedComponents }).catch(e => logger.error('LyricCollector', 'Failed to go to previous page', e));
        } else if (i.customId === 'next_lyric_page' && currentLyricsCurrentPage < currentPages.length - 1 && !currentLyricsIsSyncing) {
            currentLyricsCurrentPage++;
            const { embed: updatedEmbed, components: updatedComponents } = createLyricsDisplay(currentLyricsData, currentPages[currentLyricsCurrentPage], currentLyricsCurrentPage, currentPages.length, currentLyricsData.hasSync);
            await sentMessage.edit({ embeds: [updatedEmbed], components: updatedComponents }).catch(e => logger.error('LyricCollector', 'Failed to go to next page', e));
        } else if (['close_lyrics', 'close_lyrics_error', 'close_lyrics_timeout'].includes(i.customId)) {
            if (syncModeStopFunction) syncModeStopFunction();
            collector.stop('closed_by_user');
            return;
        }

        sentMessage._lyricsCurrentPage = currentLyricsCurrentPage;
        sentMessage._lyricsIsSyncing = currentLyricsIsSyncing;
    });

    collector.on('end', async (collected, reason) => {
        if (syncModeStopFunction) syncModeStopFunction();

        if (reason === 'closed_by_user') {
            await sentMessage.delete().catch(e => logger.error('LyricCollector', 'Failed to delete message after user closed', e));
        } else {
            const { embed: timeoutEmbed, components: timeoutComponents } = createTimeoutDisplay();
            await sentMessage.edit({ embeds: [timeoutEmbed], components: timeoutComponents }).catch(e => logger.error('LyricCollector', 'Failed to edit message on timeout', e));
        }
    });
  },

  async processButtonInteraction(interaction, client, player, playerManager, buttonId) {
    let responseMessage;
    let shouldUpdatePlayerMessage = true;
    let shouldEditReply = true;

    switch (buttonId) {
      case playerButtons.ids.previous:
        responseMessage = await this.handlePreviousButton(player, playerManager);
        break;
      case playerButtons.ids.pause:
        responseMessage = await this.handlePauseButton(player, playerManager);
        break;
      case playerButtons.ids.stop:
        responseMessage = await this.handleStopButton(player, playerManager);
        break;
      case playerButtons.ids.skip:
        responseMessage = await this.handleSkipButton(player, playerManager);
        break;
      case playerButtons.ids.loop:
        responseMessage = await this.handleLoopButton(player, playerManager);
        break;
      case playerButtons.ids.shuffle:
        responseMessage = await this.handleShuffleButton(player, playerManager);
        break;
      case playerButtons.ids.autoplay:
        responseMessage = await this.handleAutoplayButton(player, playerManager);
        break;
      case playerButtons.ids.like:
        responseMessage = await this.handleLikeButton(interaction, player, playerManager);
        shouldUpdatePlayerMessage = true;
        break;
      case playerButtons.ids.queue:
        await this.handleQueueButton(interaction, player);
        shouldEditReply = false;
        shouldUpdatePlayerMessage = false;
        break;
      case playerButtons.ids.volume:
        await this.handleVolumeButton(interaction, player);
        shouldEditReply = false;
        shouldUpdatePlayerMessage = false;
        break;
      default:
        logger.warn('processButtonInteraction', `Unknown button ID: ${buttonId}`);
        shouldUpdatePlayerMessage = false;
        shouldEditReply = false;
        break;
    }

    if (shouldEditReply && interaction.deferred && responseMessage) {
        await interaction.editReply({ content: responseMessage }).catch(e => logger.error('processButtonInteraction', 'Failed to editReply for player control', e));
    } else if (shouldEditReply && !interaction.deferred && interaction.isRepliable() && responseMessage) {
        await interaction.reply({ content: responseMessage, ephemeral: true }).catch(e => logger.error('processButtonInteraction', 'Failed to reply for player control', e));
    }

    if (shouldUpdatePlayerMessage) {
      await updatePlayerButtons(interaction, client, player);
    }
  },

  async handlePreviousButton(player, playerManager) {
    if (!player.queue?.previous) {
      return '<:discotoolsxyzicon87:1347122685267939348> There is no previous track in the queue.';
    }
    await playerManager.previous();
    return '<:discotoolsxyzicon69:1347122753613987890> Playing the previous track.';
  },

  async handlePauseButton(player, playerManager) {
    if (player.paused) {
      await playerManager.resume();
      return '<:discotoolsxyzicon69:1347122753613987890> Resumed the player.';
    } else {
      await playerManager.pause();
      return '<:discotoolsxyzicon69:1347122753613987890> Paused the player.';
    }
  },

  async handleStopButton(player, playerManager) {
    await playerManager.destroy();
    return '<:discotoolsxyzicon69:1347122753613987890> Stopped the player and cleared the queue.';
  },

  async handleSkipButton(player, playerManager) {
    if (!player.queue.length && !player.queueRepeat) {
      return '<:discotoolsxyzicon87:1347122685267939348> No more tracks in the queue to skip.';
    }
    await playerManager.skip();
    return '<:discotoolsxyzicon69:1347122753613987890> Skipped the current track.';
  },

  async handleLoopButton(player, playerManager) {
    const loopState = player.trackRepeat ? 'track' : (player.queueRepeat ? 'queue' : 'none');
    let nextLoopState;
    let response;

    switch (loopState) {
      case 'none':
        await playerManager.setLoop('track');
        nextLoopState = 'track';
        response = '<:discotoolsxyzicon69:1347122753613987890> Looping the current track.';
        break;
      case 'track':
        await playerManager.setLoop('queue');
        nextLoopState = 'queue';
        response = '<:discotoolsxyzicon69:1347122753613987890> Looping the entire queue.';
        break;
      case 'queue':
        await playerManager.setLoop('none');
        nextLoopState = 'none';
        response = '<:discotoolsxyzicon69:1347122753613987890> Loop mode turned off.';
        break;
    }
    return response;
  },

  async handleShuffleButton(player, playerManager) {
    if (player.queue.length < 2) {
      return '<:discotoolsxyzicon87:1347122685267939348> Need at least 2 tracks in the queue to shuffle.';
    }
    await playerManager.shuffle();
    return '<:discotoolsxyzicon69:1347122753613987890> Queue has been shuffled.';
  },

  async handleAutoplayButton(player, playerManager) {
    const newAutoplayState = !player.autoplay;
    await playerManager.setAutoplay(newAutoplayState);
    return newAutoplayState
      ? '<:discotoolsxyzicon69:1347122753613987890> Autoplay mode is now **ON**.'
      : '<:discotoolsxyzicon69:1347122753613987890> Autoplay mode is now **OFF**.';
  },

  async handleLikeButton(interaction, player, playerManager) {
    const currentTrack = player.queue?.current;
    if (!currentTrack) {
      return '<:discotoolsxyzicon87:1347122685267939348> No track is currently playing.';
    }

    const userId = interaction.user.id;
    const trackUri = currentTrack.uri;
    const isLiked = await db.user.isTrackLiked(userId, trackUri);

    if (isLiked) {
      await db.user.unlikeTrack(userId, trackUri);
      return '<:discotoolsxyzicon69:1347122753613987890> Track removed from your liked songs.';
    } else {
      await db.user.likeTrack(userId, trackUri, currentTrack);
      return '<:discotoolsxyzicon69:1347122753613987890> Track added to your liked songs!';
    }
  },

  async handleQueueButton(interaction, player) {
    if (!player || !player.queue || player.queue.size === 0) {
        return interaction.reply({ content: '<:discotoolsxyzicon87:1347122685267939348> The queue is empty.', ephemeral: true });
    }

    const currentPage = 0;
    const tracksPerPage = 10;
    const maxQueueDisplayPages = 5;

    const createQueueEmbed = (page) => {
        const start = page * tracksPerPage;
        const end = start + tracksPerPage;
        const currentTracks = player.queue.slice(start, end);
        const totalPages = Math.min(Math.ceil(player.queue.size / tracksPerPage), maxQueueDisplayPages);

        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('🎶 Music Queue')
            .setDescription(`**Now Playing:** [${player.queue.current.title}](${player.queue.current.uri})\n\n` +
                            currentTracks.map((track, index) =>
                                `**${start + index + 1}.** [${track.title}](${track.uri}) by ${track.author}`
                            ).join('\n') +
                            (player.queue.size > end ? `\n... ${player.queue.size - end} more tracks` : ''));

        if (totalPages > 1) {
            embed.setFooter({ text: `Page ${page + 1} of ${totalPages}` });
        }

        return embed;
    };

    const createQueueButtons = (page, totalPages) => {
        const actionRow = new ActionRowBuilder();
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId('prev_queue_page')
                .setEmoji('<:arrow_red_left:1380491961437257778>')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page === 0)
        );
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId('next_queue_page')
                .setEmoji('<:arrow:1380482153808400404>')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page >= totalPages - 1)
        );
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId('close_queue_display')
                .setEmoji('<:discotoolsxyzicon70:1347122749876863048>')
                .setStyle(ButtonStyle.Danger)
        );
        return [actionRow];
    };

    const totalQueuePages = Math.min(Math.ceil(player.queue.size / tracksPerPage), maxQueueDisplayPages);
    let queueMessagePage = currentPage;

    const initialEmbed = createQueueEmbed(queueMessagePage);
    const initialComponents = createQueueButtons(queueMessagePage, totalQueuePages);

    const sentQueueMessage = await interaction.reply({
        embeds: [initialEmbed],
        components: initialComponents,
        ephemeral: true,
        fetchReply: true
    });

    const collector = sentQueueMessage.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 120000
    });

    collector.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) {
            return i.reply({ content: '🔒 Only the command author can control this queue display.', ephemeral: true });
        }
        await i.deferUpdate();

        if (i.customId === 'prev_queue_page' && queueMessagePage > 0) {
            queueMessagePage--;
        } else if (i.customId === 'next_queue_page' && queueMessagePage < totalQueuePages - 1) {
            queueMessagePage++;
        } else if (i.customId === 'close_queue_display') {
            collector.stop('closed');
            return;
        }

        const updatedEmbed = createQueueEmbed(queueMessagePage);
        const updatedComponents = createQueueButtons(queueMessagePage, totalQueuePages);
        await sentQueueMessage.edit({ embeds: [updatedEmbed], components: updatedComponents }).catch(e => logger.error('QueueCollector', 'Failed to update queue display', e));
    });

    collector.on('end', async (collected, reason) => {
        if (reason === 'closed') {
            await sentQueueMessage.delete().catch(e => logger.error('QueueCollector', 'Failed to delete queue message on close', e));
        } else {
            const timeoutEmbed = new EmbedBuilder()
                .setColor('#f39c12')
                .setTitle('⏰ Queue Display Expired')
                .setDescription('🔄 Use queue command again to view the queue.');
            await sentQueueMessage.edit({ embeds: [timeoutEmbed], components: [] }).catch(e => logger.error('QueueCollector', 'Failed to edit queue message on timeout', e));
        }
    });
  },

  async handleVolumeButton(interaction, player) {
    if (!player) {
      return interaction.reply({
        content: '<:discotoolsxyzicon87:1347122685267939348> There is no active music player in this server to set volume for.',
        ephemeral: true
      });
    }

    const modal = new ModalBuilder()
      .setCustomId('volume-modal')
      .setTitle('Set Volume');

    const volumeInput = new TextInputBuilder()
      .setCustomId('volume-input')
      .setLabel(`Current volume: ${player.volume}% (0-150)`)
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setValue(String(player.volume));

    const firstActionRow = new ActionRowBuilder().addComponents(volumeInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
  },
};