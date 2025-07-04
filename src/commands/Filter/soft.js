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
import { embedManager } from '../../managers/EmbedManager.js';
import { logger } from '../../utils/logger.js';

/**
 * Command to apply the soft filter to the current playing track
 */
class SoftFilterCommand extends Command {
  constructor() {
    super({
      name: 'soft',
      description: 'Softens high frequencies for a more relaxed sound',
      usage: 'soft',
      category: 'filters',
      cooldown: 3,
      sameVoiceRequired: true,
      voiceRequired: true,
      playerRequired: true,
      playingRequired: true,
      examples: ['soft']
    });
  }

  /**
   * Execute the soft filter command
   * @param {object} options - Command options
   * @returns {Promise<void>}
   */
  async execute({ message, client, musicManager }) {
    const { guild } = message;

    try {
      // Check if there's an active player
      const player = musicManager.getPlayer(guild.id);
      if (!player || (!player.queue.current && !player.playing)) {
        const reply = embedManager.error(
          'No Active Player',
          'There is no music currently playing. Use the play command first!'
        );
        return message.reply({ embeds: [reply] });
      }

      // Store the current volume to restore it after filter application
      const currentVolume = player.volume;
      
      // Apply the filter
      try {
        // Clear any existing filters first
        player.shoukaku.clearFilters();
        
        // Get the filter configuration
        const filterConfig = {
          category: "simulation",
          equalizer: [{"band":0,"gain":0},{"band":1,"gain":0},{"band":2,"gain":0},{"band":3,"gain":0},{"band":4,"gain":0},{"band":5,"gain":0},{"band":6,"gain":0},{"band":7,"gain":0},{"band":8,"gain":-0.25},{"band":9,"gain":-0.25},{"band":10,"gain":-0.25},{"band":11,"gain":-0.25},{"band":12,"gain":-0.25},{"band":13,"gain":-0.25}],
          description: "Softens high frequencies for a more relaxed sound"
        };
        
        // Apply the filter
        player.shoukaku.setFilters(filterConfig);
        
        // Restore volume
        player.setVolume(currentVolume);
        
        // Send success message
        const reply = embedManager.success(
          'Filter Applied',
          `Applied **soft** filter

Description: Softens high frequencies for a more relaxed sound`
        );
        return message.reply({ embeds: [reply] });
      } catch (filterError) {
        logger.error('SoftFilterCommand', `Error applying filter soft:`, filterError);
        
        const reply = embedManager.error(
          'Filter Error',
          `Failed to apply filter: soft. Please try again.`
        );
        return message.reply({ embeds: [reply] });
      }
    } catch (error) {
      logger.error('SoftFilterCommand', 'Error executing command:', error);
      
      const reply = embedManager.error(
        'Error',
        'An error occurred while trying to apply the filter.'
      );
      return message.reply({ embeds: [reply] });
    }
  }
}

export default new SoftFilterCommand();
