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
import { db } from '../../database/DatabaseManager.js';
import { AttachmentBuilder } from 'discord.js';
import { playerButtons } from '../../structures/PlayerButtons.js'; // Ensure this is the updated one
import { PlayerManager } from '../../managers/PlayerManager.js';
import { themeManager } from '../../managers/ThemeManager.js';
import VoiceStatusManager from '../../managers/voiceStatusManager.js';

const updateTimeouts = new Map();

export default {
  name: 'playerStart',
  async execute(player, track, client) {
    try {
      if (!client || !client.channels) return;
      
      const textChannel = client.channels.cache?.get(player.textId);
      if (!textChannel) return;
      
      const voiceStatus = new VoiceStatusManager(client);
      await voiceStatus.updateForStart(player);

      this.clearUpdateTimeout(player.guildId);

      if (player.messageId) {
        try {
          const previousMessage = await textChannel.messages.fetch(player.messageId).catch(() => null);
          if (previousMessage) {
            await previousMessage.delete().catch(() => {});
          }
        } catch (deleteError) {
          // Silent fail
        }
      }

      try {
        const playerManager = new PlayerManager(player);
        
        if (!track._fromHistory && !player.radio) {
          playerManager.addToHistory(track);
          player._currentTrack = track;
        }
        
        if (track.requester && track.requester.id && !player.radio) {
          const userId = track.requester.id;
          db.user.addToHistory(userId, playerManager.cleanTrackForStorage(track));
        }
      } catch (historyError) {
        // Silent fail
      }

      let isLiked = false;
      if (track.requester && track.requester.id && track.uri && !player.radio) {
        isLiked = db.user.isTrackLiked(track.requester.id, track.uri);
      }

      if (!client.guilds) return;
      const guild = client.guilds.cache?.get(player.guildId);
      const guildName = guild ? guild.name : 'Discord Server';
      const guildIcon = guild ? guild.iconURL({ extension: 'png', size: 128 }) : null;
        
        

  if (player.data?.guessing) {
  await textChannel.send({
    content: '🎮 A Guess The Song round has started! Use `/guess` to play!',
  });
  return;
}
      

      if (player.radio && player.radioName) {
        track.title = player.radioName;
        track.thumbnail = player.radioThumbnail || track.thumbnail;
        track.isStream = true;
      } else {
        player.radioName = null;
        player.radioThumbnail = null;
        player.radioCategory = null;
      }

      await this.updatePlayerCard(player, track, client, textChannel, guildName, guildIcon, isLiked);
      
      if (!track.isStream) {
        this.scheduleNextUpdate(player, track, client, textChannel, guildName, guildIcon, isLiked);
      }
    } catch (error) {
      logger.error('PlayerStart', 'Error handling playerStart event', error);
    }
  },

  /**
   * Updates the player card message with current track info and buttons.
   * This is a simplified version, ideally the full `updatePlayerButtons` from
   * interactionCreate should be imported/used if consistent behavior is desired.
   * For now, it regenerates the card and buttons for `playerStart` event.
   * @param {object} player - The current music player.
   * @param {object} track - The track being played.
   * @param {object} client - The Discord client.
   * @param {object} textChannel - The text channel where the player message is.
   * @param {string} guildName - The name of the guild.
   * @param {string} guildIcon - The URL of the guild icon.
   * @param {boolean} isLiked - Whether the track is liked by the requester.
   */
  async updatePlayerCard(player, track, client, textChannel, guildName, guildIcon, isLiked) {
    try {
      const MusicCardClass = await themeManager.getMusicCardClass(player.guildId);
      const musicCard = new MusicCardClass();

      const imageBuffer = await musicCard.generateNowPlayingCard({
        track: track,
        position: player.position || 0,
        isLiked: isLiked,
        guildName: guildName,
        guildIcon: guildIcon,
        player: player
      });
      
      const attachment = new AttachmentBuilder(imageBuffer, { name: 'nowplaying.png' });

      const playerState = {
        paused: player.paused,
        loop: player.loop,
        volume: player.volume || 100,
        isLiked: isLiked,
        isRadio: player.radio || false
      };
      
      const primaryButtons = playerButtons.createPlayerControls(playerState);
      const secondaryButtons = playerButtons.createSecondaryControls(playerState); // This will include the Lyric button

      if (player.messageId) {
        try {
          const existingMessage = await textChannel.messages.fetch(player.messageId).catch(() => null);
          if (existingMessage) {
            await existingMessage.edit({
              files: [attachment],
              components: [primaryButtons, secondaryButtons]
            });
            return;
          }
        } catch (editError) {
          logger.warn('PlayerStart', 'Error editing player message, sending new one.', editError.message);
        }
      }
      
      const sentMsg = await textChannel.send({
        files: [attachment],
        components: [primaryButtons, secondaryButtons]
      });
      
      player.messageId = sentMsg.id;
    } catch (error) {
      logger.error('PlayerStart', 'Error updating player card', error);
    }
  },

  /**
   * Calculates the next update time for the player card.
   * @param {object} player - The music player.
   * @param {object} track - The current track.
   * @returns {number|null} - Time in milliseconds until next update, or null.
   */
  calculateNextUpdate(player, track) {
    if (!track || track.isStream) return null;
    const position = player.position || 0;
    const duration = track.length || 0;
    if (position >= duration - 2000) return null;
    const timeToEnd = duration - position;
    return Math.min(15000, timeToEnd);
  },

  /**
   * Schedules the next player card update.
   * @param {object} player - The music player.
   * @param {object} track - The current track.
   * @param {object} client - The Discord client.
   * @param {object} textChannel - The text channel.
   * @param {string} guildName - Guild name.
   * @param {string} guildIcon - Guild icon URL.
   * @param {boolean} isLiked - Whether track is liked.
   */
  scheduleNextUpdate(player, track, client, textChannel, guildName, guildIcon, isLiked) {
    const updateTime = this.calculateNextUpdate(player, track);
    if (updateTime === null) return;
    
    this.clearUpdateTimeout(player.guildId);
    
    const timeoutId = setTimeout(async () => {
      try {
        if (!player || player.destroyed || !client.music.kazagumo.shoukaku.players.has(player.guildId)) return;
        const currentTrack = player.queue?.current;
        if (!currentTrack || currentTrack.uri !== track.uri) return;
        
        await this.updatePlayerCard(player, track, client, textChannel, guildName, guildIcon, isLiked);
        this.scheduleNextUpdate(player, track, client, textChannel, guildName, guildIcon, isLiked);
      } catch (error) {
        logger.error('PlayerUpdateTimeout', 'Error in update timeout', error);
      }
    }, updateTime);
    
    updateTimeouts.set(player.guildId, timeoutId);
  },

  /**
   * Clears any pending player card update timeout for a guild.
   * @param {string} guildId - The ID of the guild.
   */
  clearUpdateTimeout(guildId) {
    if (updateTimeouts.has(guildId)) {
      clearTimeout(updateTimeouts.get(guildId));
      updateTimeouts.delete(guildId);
    }
  }
};
