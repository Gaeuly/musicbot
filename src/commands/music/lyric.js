/**
 * Muffin STUDIO - Bre4d777 & prayag 
 * https://discord.gg/TRPqseUq32
 * give credits or ill touch you in your dreams
 */

import { Command } from '../../structures/Command.js';
import {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ButtonBuilder,
  MessageFlags,
  SeparatorSpacingSize,
  ButtonStyle,
  ComponentType
} from 'discord.js';
import axios from 'axios';

class LyricsCommand extends Command {
  constructor() {
    super({
      name: 'lyrics',
      description: 'Display lyrics for the currently playing song',
      usage: 'lyrics',
      aliases: ['lyric', 'l'],
      category: 'music',
      cooldown: 5,
      playerRequired: true,
      playingRequired: true
    });
    this.activeSyncSessions = new Map();
  }

  sanitizeInput(str) {
    return str
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, ' ')
      .toLowerCase()
      .trim();
  }

  parseTimestamp(timestamp) {
    const match = timestamp.match(/(\d+):(\d{2})\.(\d+)/);
    if (!match) return 0;
    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    const milliseconds = parseInt(match[3], 10) / Math.pow(10, match[3].length);
    return minutes * 60 + seconds + milliseconds;
  }

  async searchLyrics(query) {
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
          lyrics: this.cleanLyrics(result.plainLyrics || result.lyrics),
          syncedLyrics: result.syncedLyrics,
          hasSync: !!result.syncedLyrics
        };
      }
      return null;
    } catch (err) {
      return null;
    }
  }

  cleanLyrics(lyrics) {
    if (!lyrics) return '';
    return lyrics.replace(/\]/g, '').trim();
  }

 async startSyncMode(message, lyricsData, player, sent) {
  const sessionKey = `${message.guild.id}-${message.author.id}`;

  if (this.activeSyncSessions.has(sessionKey)) {
    this.activeSyncSessions.get(sessionKey).stop();
  }

  const lines = lyricsData.syncedLyrics
    .split('\n')
    .map(line => {
      const match = line.match(/(\d+:\d{2}\.\d+)\s*(.*)/);
      if (match) {
        return { time: this.parseTimestamp(match[1]), text: this.cleanLyrics(match[2]) };
      }
      return null;
    })
    .filter(line => line && line.text);

  if (!lines.length) return false;

  let currentIndex = 0;
  let isActive = true;

  const syncSession = {
    stop: () => { isActive = false; }
  };

  this.activeSyncSessions.set(sessionKey, syncSession);

  const updateSync = async () => {
    if (!isActive || !player || !player.playing || !player.queue.current) {
      this.activeSyncSessions.delete(sessionKey);
      return;
    }

    const currentTime = (typeof player.position === 'number' ? player.position / 1000 : 0);
    const trackDuration = player.queue.current?.duration || 0;
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
        return `# ${line.text}`; // Bold only the current and next lines
      }
      return line.text;
    }).join('\n') || 'Waiting for lyrics...';

    const progress = Math.min(100, Math.floor((currentIndex / lines.length) * 100));
    const progressBar = this.createProgressBar(progress);

    const syncContainer = this.createSyncContainer(
      lyricsData,
      lyricsContent,
      currentTime,
      actualDuration,
      progressBar,
      currentIndex,
      lines.length
    );

    try {
      await sent.edit({ components: [syncContainer] });
    } catch (err) {
      this.activeSyncSessions.delete(sessionKey);
      return;
    }

    if (isActive) {
      setTimeout(updateSync, 800);
    }
  };

  updateSync();
  return { stop: () => syncSession.stop() };
}

  createProgressBar(percentage, length = 25) {
    const filled = Math.floor((percentage / 100) * length);
    const empty = length - filled;
    const bar = '▰'.repeat(filled) + '▱'.repeat(empty);
    return `${bar} **${percentage}%**`;
  }

  async execute({ message, args, client, musicManager }) {
    const { guild, author } = message;
    const player = musicManager.getPlayer(guild.id);

    if (!player || !player.playing || !player.queue.current) {
      return message.reply({
        components: [this.createErrorContainer('🚫 **No Active Playback**', '▶️ Start playing a song first to view its lyrics!')],
        flags: MessageFlags.IsComponentsV2
      });
    }

    const track = player.queue.current;
    const query = this.sanitizeInput(track.title);
    const artist = this.sanitizeInput(track.author || '');

    const loadingContainer = this.createLoadingContainer(track.title, track.author);
    const sent = await message.reply({
      components: [loadingContainer],
      flags: MessageFlags.IsComponentsV2
    });

    const searchQuery = `${query}${artist ? ` ${artist}` : ''}`;
    const lyricsData = await this.searchLyrics(searchQuery);

    if (!lyricsData || !lyricsData.lyrics) {
      return sent.edit({
        components: [this.createErrorContainer('🔍 **Lyrics Not Found**', `🎵 No lyrics available for **${track.title}**\n💡 Try a different track or check the song title`)]
      });
    }

    const pages = this.splitLyrics(lyricsData.lyrics);
    let currentPage = 0;
    let syncMode = null;
    let isSyncing = false;

    const container = this.createLyricsContainer(lyricsData, pages[currentPage], currentPage, pages.length, lyricsData.hasSync);

    await sent.edit({
      components: [container]
    });

    const collector = sent.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 600000
    });

    collector.on('collect', async (interaction) => {
      if (interaction.user.id !== author.id) {
        return interaction.reply({
          content: '🔒 Only the command author can control these lyrics.',
          ephemeral: true
        });
      }

      await interaction.deferUpdate();

      if (interaction.customId === 'sync' && lyricsData.hasSync) {
        if (isSyncing) {
          if (syncMode) syncMode.stop();
          isSyncing = false;
          const normalContainer = this.createLyricsContainer(lyricsData, pages[currentPage], currentPage, pages.length, lyricsData.hasSync);
          await sent.edit({ components: [normalContainer] });
        } else {
          const currentPlayer = musicManager.getPlayer(guild.id);
          if (!currentPlayer || !currentPlayer.playing || !currentPlayer.queue.current) {
            return interaction.followUp({
              content: '⚠️ No music is currently playing for sync mode.',
              ephemeral: true
            });
          }

          syncMode = await this.startSyncMode(message, lyricsData, currentPlayer, sent);
          if (syncMode) {
            isSyncing = true;
          }
        }
      } else if (interaction.customId === 'prev' && currentPage > 0 && !isSyncing) {
        currentPage--;
        const updatedContainer = this.createLyricsContainer(lyricsData, pages[currentPage], currentPage, pages.length, lyricsData.hasSync);
        await sent.edit({ components: [updatedContainer] });
      } else if (interaction.customId === 'next' && currentPage < pages.length - 1 && !isSyncing) {
        currentPage++;
        const updatedContainer = this.createLyricsContainer(lyricsData, pages[currentPage], currentPage, pages.length, lyricsData.hasSync);
        await sent.edit({ components: [updatedContainer] });
      } else if (interaction.customId === 'delete') {
        return collector.stop('deleted');
      } else if (interaction.customId === 'close') {
        return collector.stop('deleted');
      }
    });

    collector.on('end', async (collected, reason) => {
      if (syncMode) syncMode.stop();
      const sessionKey = `${guild.id}-${author.id}`;
      this.activeSyncSessions.delete(sessionKey);

      if (reason === 'deleted') {
        await sent.delete().catch(() => {});
      } else {
        const timeoutContainer = this.createTimeoutContainer();
        await sent.edit({ components: [timeoutContainer] }).catch(() => {});
      }
    });
  }

  createLoadingContainer(title, artist) {
    return new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('🔄 **Fetching Lyrics**')
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`🎵 **${title}**`)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`🎤 ${artist || 'Unknown Artist'}`)
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(false)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('⏳ *Searching lyrics database...*')
      );
  }

  createErrorContainer(title, description) {
    return new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(title)
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(description)
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(false)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addActionRowComponents(row =>
        row.setComponents(
          new ButtonBuilder()
            .setCustomId('close')
            .setEmoji('<:discotoolsxyzicon70:1347122749876863048>')
            .setStyle(ButtonStyle.Danger)
        )
      );
  }

  createLyricsContainer(lyricsData, pageContent, currentPage, totalPages, hasSync) {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`🎵 **${lyricsData.title}**`)
      );

    if (lyricsData.artist) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`🎤 by **${lyricsData.artist}**`)
      );
    }

    container
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(pageContent)
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(SeparatorSpacingSize.Small)
      );

    if (totalPages > 1) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`📖 Page **${currentPage + 1}** of **${totalPages}** ${hasSync ? '• ✨ Sync Available' : ''}`)
      );
    } else if (hasSync) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent('✨ **Live Sync Available**')
      );
    }

    const navigationButtons = [];
    
    if (totalPages > 1) {
      navigationButtons.push(
        new ButtonBuilder()
          .setCustomId('prev')
          .setEmoji('<:arrow_red_left:1380491961437257778>')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === 0)
      );
    }

    if (hasSync) {
      navigationButtons.push(
        new ButtonBuilder()
          .setCustomId('sync')
          .setEmoji('✨')
          .setStyle(ButtonStyle.Success)
      );
    }

    if (totalPages > 1) {
      navigationButtons.push(
        new ButtonBuilder()
          .setCustomId('next')
          .setEmoji('<:arrow:1380482153808400404>')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === totalPages - 1)
      );
    }

    navigationButtons.push(
      new ButtonBuilder()
        .setCustomId('delete')
        .setEmoji('<:discotoolsxyzicon70:1347122749876863048>')
        .setStyle(ButtonStyle.Danger)
    );

    if (navigationButtons.length > 0) {
      container.addActionRowComponents(row => row.setComponents(...navigationButtons));
    }

    return container;
  }

  createSyncContainer(lyricsData, lyricsContent, currentTime, duration, progressBar, currentLine, totalLines) {
    // Format current time
    const currentMinutes = Math.floor(currentTime / 60);
    const currentSeconds = Math.floor(currentTime % 60);
    
    // Format duration
    const totalMinutes = Math.floor(duration / 60);
    const totalSeconds = duration % 60;
    
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`🎵 **${lyricsData.title}** ✨`)
      );

    if (lyricsData.artist) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`🎤 by **${lyricsData.artist}**`)
      );
    }

    container
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`⏱️ **${currentMinutes}:${String(currentSeconds).padStart(2, '0')}** °Line **${currentLine}**/**${totalLines}**`)
      )
      
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(false)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(lyricsContent)
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('-# 🎵 *Real-time sync with music* • Updates every 0.8s')
      )
      .addActionRowComponents(row =>
        row.setComponents(
          new ButtonBuilder()
            .setCustomId('sync')
            .setEmoji('⏹️')
            .setLabel('Stop Sync')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('delete')
            .setEmoji('<:discotoolsxyzicon70:1347122749876863048>')
            .setStyle(ButtonStyle.Secondary)
        )
      );

    return container;
  }

  createTimeoutContainer() {
    return new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('⏰ **Session Expired**')
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('🔄 Use `/lyrics` again to view lyrics')
      );
  }

  splitLyrics(lyrics, maxLength = 900) {
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
}

export default new LyricsCommand();