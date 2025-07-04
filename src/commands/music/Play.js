/**
 * Muffin STUDIO - Bre4d777 & prayag 
 * https://discord.gg/TRPqseUq32
 * give credits or ill touch you in your dreams
 */

import { Command } from '../../structures/Command.js';
import { PlayerManager } from '../../managers/PlayerManager.js';
import { SearchManager } from '../../managers/SearchManager.js';
import { logger } from '../../utils/logger.js';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  MessageFlags,
  SeparatorSpacingSize
} from 'discord.js';

const PLATFORMS = {
  youtube: ['youtube', 'yt'], spotify: ['spotify', 'sp'], soundcloud: ['soundcloud', 'sc'],
  apple: ['apple', 'am'], deezer: ['deezer', 'dz'], jiosaavn: ['jiosaavn', 'js']
};

const PLATFORM_NAMES = {
  spotify: 'Spotify', youtube: 'YouTube', jiosaavn: 'JioSaavn',
  apple: 'Apple', deezer: 'Deezer', soundcloud: 'SoundCloud', http: 'Direct Audio'
};

class PlayCommand extends Command {
  constructor() {
    super({
      name: 'play', description: 'Play music from direct audio links or various sources including YouTube, Spotify, SoundCloud',
      usage: 'play <song name or URL> [--platform youtube|spotify|soundcloud|jiosaavn]',
      aliases: ['p'], category: 'music', cooldown: 2, voiceRequired: true,
      examples: ['play astronomia', 'play daft punk --platform youtube', 'play blinding lights --platform spotify']
    });
  }

  async execute({ message, args, client, musicManager }) {
    const { channel, member, guild } = message;

    if (!args.length) return this.sendComponentError(message, 'Invalid Usage', `Please provide a song to play!\n\nUsage: \`${this.usage}\``);

    const { platform, query } = this.parseArgs(args);
    if (!query) return this.sendComponentError(message, 'Invalid Usage', `Please provide a song to play!\n\nUsage: \`${this.usage}\``);

    const voiceChannel = member.voice.channel;
    if (!voiceChannel) return this.sendComponentError(message, 'Voice Channel Required', 'You need to join a voice channel first!');

    const permissions = voiceChannel.permissionsFor(guild.members.me);
    if (!permissions.has(['Connect', 'Speak'])) {
      return this.sendComponentError(message, 'Insufficient Permissions', 'I need permissions to join and speak in your voice channel!');
    }

    if (!musicManager?.kazagumo) {
      return this.sendComponentError(message, 'Error', 'Music system is not ready yet. Please try again in a moment.');
    }

    const searchingMsg = await this.sendComponentSearching(message, query, platform);

    try {
      const { searchManager, result, finalPlatform } = await this.performSearch(musicManager, query, platform, message.author);

      if (!result?.tracks?.length) {
        return this.updateComponentMessage(searchingMsg, this.createComponentError('No Results', `No results found for: \`${query}\` on ${PLATFORM_NAMES[finalPlatform] || 'Default'}`));
      }

      const player = await this.getOrCreatePlayer(musicManager, guild, channel, voiceChannel, searchingMsg);
      if (!player) return;

      const playerManager = new PlayerManager(player);
      const isPlaylist = result.type === "PLAYLIST";
      const mainTrack = result.tracks[0];

      if (finalPlatform === 'http' && !mainTrack.thumbnail) {
        mainTrack.thumbnail = searchManager.getDefaultThumbnail('http');
      }

      if (player.playing || (!player.paused && player.queue.current)) {
        await this.handleQueueing(playerManager, result, isPlaylist, mainTrack, finalPlatform, searchingMsg, message, musicManager, guild);
      } else {
        await this.handleDirectPlay(playerManager, result, isPlaylist, mainTrack, finalPlatform, searchingMsg);
      }
    } catch (error) {
      logger.error('PlayCommand', 'Command execution error:', error);
      this.updateComponentMessage(searchingMsg, this.createComponentError('Error', 'An error occurred while trying to play that song.'));
    }
  }

  parseArgs(args) {
    let platform = 'spotify';
    const queryArgs = [];

    for (let i = 0; i < args.length; i++) {
      if ((args[i] === '--platform' || args[i] === '--pl') && i + 1 < args.length) {
        const requested = args[i + 1].toLowerCase();
        platform = Object.keys(PLATFORMS).find(p => PLATFORMS[p].includes(requested)) || platform;
        i++;
      } else {
        queryArgs.push(args[i]);
      }
    }

    return { platform, query: queryArgs.join(' ') };
  }

  async sendComponentSearching(message, query, platform) {
    const container = new ContainerBuilder()    
      .setAccentColor(16744448)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('<a:loading_red:1378726957138575403> Searching for'),
        new TextDisplayBuilder().setContent(`\`${query}\` on ${PLATFORM_NAMES[platform] || 'Default'}`)
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('This may take a moment.')
      );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  }

  createComponentError(title, description) {
    return new ContainerBuilder()   
      .setAccentColor(16744448)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`❌ **${title}**`)
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(description)
      );
  }

  async performSearch(musicManager, query, platform, author) {
    const searchManager = new SearchManager(musicManager);
    let finalPlatform = platform;

    if (searchManager.isUrl(query)) {
      const detected = searchManager.detectSourceFromUrl(query);
      if (detected) {
        finalPlatform = detected;
      } else if (searchManager.isDirectAudioLink(query)) {
        finalPlatform = 'http';
      }
    }

    const result = await searchManager.search(query, { platform: finalPlatform, requester: author, limit: 100 });
    return { searchManager, result, finalPlatform };
  }

  async getOrCreatePlayer(musicManager, guild, channel, voiceChannel, searchingMsg) {
    let player = musicManager.getPlayer(guild.id);

    if (!player) {
      try {
        player = musicManager.createPlayer({ guildId: guild.id, textChannel: channel, voiceChannel });
        if (!player) throw new Error('Player creation returned null');

        for (let i = 0; i < 5; i++) {
          await new Promise(resolve => setTimeout(resolve, 500));
          const verified = musicManager.getPlayer(guild.id);
          if (verified) {
            player = verified;
            break;
          }
        }
      } catch (error) {
        logger.error('PlayCommand', 'Error creating player', error);
        this.updateComponentMessage(searchingMsg, this.createComponentError('Error', 'An error occurred while creating the music player. Please try again.'));
        return null;
      }
    }

    return player;
  }

  async handleQueueing(playerManager, result, isPlaylist, mainTrack, platform, searchingMsg, message, musicManager, guild) {
    if (isPlaylist) {
      playerManager.queue.add(result.tracks);
      const playlistQueuedContainer = new ContainerBuilder()      
        .setAccentColor(16744448)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('✅ **Playlist Queued**')
        )
        .addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`Added **${result.tracks.length}** tracks from ${PLATFORM_NAMES[platform] || ''} playlist **${result.playlistName || 'playlist'}** to the queue.`),
          new TextDisplayBuilder().setContent(`First track: **${mainTrack.title || 'Unknown'}**`)
        );
      return this.updateComponentMessage(searchingMsg, playlistQueuedContainer);
    }

    const queueIndex = playerManager.queue.size;
    playerManager.queue.add(mainTrack);

    const trackQueuedContainer = new ContainerBuilder()
      .setAccentColor(16744448)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('✅ **Track Queued**')
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`Added [${mainTrack.title || 'Unknown Track'}](${mainTrack.uri}) ${this.getSourceText(platform)} to the queue.`),
        new TextDisplayBuilder().setContent(`Artist: **${mainTrack.author || 'Unknown Artist'}**`)
      );

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`play_upcoming_${queueIndex}`).setLabel('Play Upcoming').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`play_now_${queueIndex}`).setLabel('Play Now').setStyle(ButtonStyle.Primary)
    );

    trackQueuedContainer.addActionRowComponents(row => row.setComponents(buttons.components));

    const editedMessage = await this.updateComponentMessage(searchingMsg, trackQueuedContainer);
    this.setupButtonCollector(editedMessage, message, musicManager, guild, queueIndex, mainTrack);
  }

  setupButtonCollector(message, originalMessage, musicManager, guild, targetIndex, track) {
    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (i) => i.user.id === originalMessage.author.id && musicManager.getPlayer(guild.id)?.queue,
      time: 60000
    });

    collector.on('collect', async (interaction) => {
      await interaction.deferUpdate();
      const player = musicManager.getPlayer(guild.id);

      if (!player?.queue || targetIndex >= player.queue.size || player.queue[targetIndex]?.identifier !== track.identifier) {
        const errorContainer = this.createComponentError('Error', 'Track is no longer available or has moved.');
        await message.edit({ components: [errorContainer] }).catch(() => {});
        return collector.stop();
      }

      const trackToMove = player.queue[targetIndex];
      const isPlayNow = interaction.customId.includes('play_now');

      try {
        player.queue.splice(targetIndex, 1);
        player.queue.unshift(trackToMove);

        let statusTitle;
        let statusDescription;

        if (isPlayNow) {
          if (player.playing || player.queue.current) {
            player.skip();
            statusTitle = '▶️ **Now Playing**';
            statusDescription = `Skipping current track and playing [${trackToMove.title || 'Unknown Track'}](${trackToMove.uri}) ${this.getSourceText(trackToMove.source)}.`;
          } else {
            statusTitle = '▶️ **Now Playing**';
            statusDescription = `Playing [${trackToMove.title || 'Unknown Track'}](${trackToMove.uri}) ${this.getSourceText(trackToMove.source)} now.`;
            if (!player.playing && player.connected) await player.play();
          }
        } else {
          statusTitle = '➡️ **Playing Next**';
          statusDescription = `Moved [${trackToMove.title || 'Unknown Track'}](${trackToMove.uri}) ${this.getSourceText(trackToMove.source)} to play next.`;
        }

        const updatedContainer = new ContainerBuilder()       
          .setAccentColor(16744448)
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(statusTitle)
          )
          .addSeparatorComponents(
            new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
          )
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(statusDescription),
            new TextDisplayBuilder().setContent(`Artist: **${trackToMove.author || 'Unknown Artist'}**`)
          );

        await message.edit({ components: [updatedContainer], flags: MessageFlags.IsComponentsV2 });
        collector.stop();
      } catch (err) {
        logger.error('PlayCommand', 'Button interaction error:', err);
        const errorContainer = this.createComponentError('Error', 'An error occurred during action.');
        await message.edit({ components: [errorContainer] }).catch(() => {});
        collector.stop();
      }
    });

    collector.on('end', async () => {
        try {
            await message.edit({ components: [] });
        } catch (error) {
            logger.error('PlayCommand', 'Failed to clear components:', error);
        }
    });
  }

  async handleDirectPlay(playerManager, result, isPlaylist, mainTrack, platform, searchingMsg) {
    const tracksToAdd = isPlaylist ? result.tracks : [mainTrack];
    playerManager.queue.add(tracksToAdd);

    if (!playerManager.player.playing) await playerManager.play();

    if (isPlaylist) {
      const playlistStartedContainer = new ContainerBuilder()      
        .setAccentColor(16744448)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`▶️ **${PLATFORM_NAMES[platform] || ''} Playlist Started**`)
        )
        .addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`Playing **${mainTrack.title}** from ${PLATFORM_NAMES[platform] || ''} playlist **${result.playlistName || 'playlist'}**.`),
          new TextDisplayBuilder().setContent(`${result.tracks.length > 1 ? `Added ${result.tracks.length - 1} more tracks to queue.` : ''}`)
        );
      return this.updateComponentMessage(searchingMsg, playlistStartedContainer);
    }

    const nowPlayingContainer = new ContainerBuilder()
      .setAccentColor(16744448)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('▶️ **Now Playing**')
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`[${mainTrack.title || 'Unknown Track'}](${mainTrack.uri}) ${this.getSourceText(platform)}`),
        new TextDisplayBuilder().setContent(`Artist: **${mainTrack.author || 'Unknown Artist'}**`)
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`Join Date: <t:${Math.floor(Date.now() / 1000)}:R>`)
      );
    this.updateComponentMessage(searchingMsg, nowPlayingContainer);
  }

  getSourceText(platform) {
    const sources = {
      spotify: 'from Spotify', youtube: 'from YouTube', jiosaavn: 'from JioSaavn',
      soundcloud: 'from SoundCloud', http: '(Direct Audio)'
    };
    return sources[platform] || '';
  }

  sendComponentError(message, title, description) {
    const errorContainer = this.createComponentError(title, description);
    return message.reply({ components: [errorContainer], flags: MessageFlags.IsComponentsV2 });
  }

  updateComponentMessage(message, container, actionRows = []) {
    return message.edit({ components: [container, ...actionRows], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
  }
}

export default new PlayCommand();