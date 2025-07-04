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
 * Command to apply the pop filter to the current playing track
 */
class PopFilterCommand extends Command {
  constructor() {
    super({
      name: 'pop',
      description: 'EQ preset optimized for pop music',
      usage: 'pop',
      category: 'filters',
      cooldown: 3,
      sameVoiceRequired: true,
      voiceRequired: true,
      playerRequired: true,
      playingRequired: true,
      examples: ['pop']
    });
  }

  /**
   * Execute the pop filter command
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
          category: "genre",
          equalizer: [{"band":0,"gain":0.65},{"band":1,"gain":0.45},{"band":2,"gain":-0.45},{"band":3,"gain":-0.65},{"band":4,"gain":-0.35},{"band":5,"gain":0.45},{"band":6,"gain":0.55},{"band":7,"gain":0.6},{"band":8,"gain":0.6},{"band":9,"gain":0.6},{"band":10,"gain":0},{"band":11,"gain":0},{"band":12,"gain":0},{"band":13,"gain":0}],
          description: "EQ preset optimized for pop music"
        };
        
        // Apply the filter
        player.shoukaku.setFilters(filterConfig);
        
        // Restore volume
        player.setVolume(currentVolume);
        
        // Send success message
        const reply = embedManager.success(
          'Filter Applied',
          `Applied **pop** filter

Description: EQ preset optimized for pop music`
        );
        return message.reply({ embeds: [reply] });
      } catch (filterError) {
        logger.error('PopFilterCommand', `Error applying filter pop:`, filterError);
        
        const reply = embedManager.error(
          'Filter Error',
          `Failed to apply filter: pop. Please try again.`
        );
        return message.reply({ embeds: [reply] });
      }
    } catch (error) {
      logger.error('PopFilterCommand', 'Error executing command:', error);
      
      const reply = embedManager.error(
        'Error',
        'An error occurred while trying to apply the filter.'
      );
      return message.reply({ embeds: [reply] });
    }
  }
}

export default new PopFilterCommand();
