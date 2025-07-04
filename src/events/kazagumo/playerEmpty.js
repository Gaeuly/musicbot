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
import { embedManager } from '../../managers/EmbedManager.js';
import { autoplayManager } from '../../managers/AutoplayManager.js';
import VoiceStatusManager from '../../managers/voiceStatusManager.js';

export default {
  name: 'playerEmpty',
  async execute(player, client) {
    try {
      if (!player?.guildId) return;
      
      const guild = client.guilds.cache.get(player.guildId);
      const channel = guild?.channels.cache.get(player.textId);
      if (!channel) return;

      if (player.messageId) {
        channel.messages.fetch(player.messageId)
          .then(msg => msg?.delete())
          .catch(() => {});
        player.messageId = null;
      }
      
      Object.assign(player, {
        radio: false,
        radioName: null,
        radioThumbnail: null,
        radioCategory: null,
        autoplay: player.autoplay ?? false
      });
      
      const is247Enabled = client.db?.is247Enabled?.(player.guildId) || false;
      const voiceStatus = new VoiceStatusManager(client);
      
      await voiceStatus.updateForEmpty(player, is247Enabled, player.autoplay);

      if (player.autoplay) {
        try {
          const autoplayed = await autoplayManager.handleAutoplay(player);
          
          if (autoplayed) {
            const embed = embedManager.create({
              color: embedManager.colors.success,
              title: '🎵 Autoplay Active',
              description: 'Added similar songs to keep the music going!',
              timestamp: true
            });
            
            channel.send({ embeds: [embed] })
              .then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000))
              .catch(() => {});
            return;
          }
        } catch (error) {
          logger.error('PlayerEmpty', `Autoplay failed: ${error.message}`);
        }
      }

      if (is247Enabled) {
        client.db?.savePlayerState?.(player.guildId, {
          voiceChannelId: player.voiceId,
          textChannelId: player.textId,
          queue: [],
          currentTrack: null,
          autoplay: player.autoplay
        });
        return;
      }
      
      const embed = embedManager.create({
        color: embedManager.colors.info,
        title: '🎵 Queue Empty',
        description: 'Use play command to add more songs!',
        timestamp: true
      });
        
      channel.send({ embeds: [embed] })
        .then(msg => setTimeout(() => msg.delete().catch(() => {}), 8000))
        .catch(() => {
          player?.destroy();
        });
      
      client.db?.deletePlayerState?.(player.guildId);
      
    } catch (error) {
      logger.error('PlayerEmpty', error.message);
      player?.destroy();
    }
  },
};