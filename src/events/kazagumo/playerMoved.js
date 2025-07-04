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

/**
 * Player moved event for Shoukaku/Kazagumo (triggered when the bot is moved between voice channels)
 */
export default {
  name: 'playerMoved',
  /**
   * Execute the player moved event
   * @param {object} player - Kazagumo player
   * @param {object} state - The state of the move (MOVED or LEFT)
   * @param {object} channels - Old and new channel IDs
   * @param {object} client - Discord client
   */
  async execute(player, state, channels, client) {
    try {
      if (!client || !client.guilds) return;
      
      const guild = client.guilds.cache?.get(player.guildId);
      if (!guild || !guild.channels) return;
      
      const textChannel = client.channels.cache?.get(player.textId);
      if (!textChannel) return;
      
      const is247Enabled = client.db.is247Enabled(guild.id);
      
      switch (state) {
        case "MOVED":
          if (player.paused && !player._state?.pausedDueToMute) {
            player.pause(false);
          }
          
          const newVoiceChannel = guild.channels.cache.get(channels.newChannelId);
          
          if (is247Enabled) {
            client.db.set247Mode(guild.id, true, channels.newChannelId, player.textId);
            player.voiceId = channels.newChannelId;
            
            const movedEmbed = embedManager.create({
              color: embedManager.colors.info,
              title: '🔄 Channel Changed',
              description: `I've been moved to ${newVoiceChannel ? newVoiceChannel.name : 'another channel'}.\n24/7 mode settings have been updated to stay in this channel.`,
              timestamp: true
            });
            
            await textChannel.send({ embeds: [movedEmbed] });
          } else {
            const movedEmbed = embedManager.create({
              color: embedManager.colors.info,
              title: '🔄 Channel Changed',
              description: `I've been moved to ${newVoiceChannel ? newVoiceChannel.name : 'another channel'}.`,
              timestamp: true
            });
            
            await textChannel.send({ embeds: [movedEmbed] });
          }
          break;
          
        case "LEFT":
          if (is247Enabled) {
            
            
          } else {
          if (player) {
              await player.destroy();
            }
            
            const leftEmbed = embedManager.create({
              color: embedManager.colors.error,
              title: '👋 Disconnected',
              description: 'I was disconnected from the voice channel and have ended the music session.',
              timestamp: true
            });
            
            await textChannel.send({ embeds: [leftEmbed] });
          }
          break;
          
        default:
          logger.warn(`Unknown playerMoved state: ${state}`);
      }
    } catch (error) {
      logger.error('PlayerMoved', 'Error handling player moved event', error);
    }
  },
};
