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
 * Command to apply the television filter to the current playing track
 */
class TelevisionFilterCommand extends Command {
  constructor() {
    super({
      name: 'television',
      description: 'Simulates TV audio quality',
      usage: 'television',
      category: 'filters',
      cooldown: 3,
      sameVoiceRequired: true,
      voiceRequired: true,
      playerRequired: true,
      playingRequired: true,
      examples: ['television']
    });
  }

  /**
   * Execute the television filter command
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
          equalizer: [{"band":0,"gain":0},{"band":1,"gain":0},{"band":2,"gain":0},{"band":3,"gain":0},{"band":4,"gain":0},{"band":5,"gain":0},{"band":6,"gain":0},{"band":7,"gain":0.65},{"band":8,"gain":0.65},{"band":9,"gain":0.65},{"band":10,"gain":0.65},{"band":11,"gain":0.65},{"band":12,"gain":0.65},{"band":13,"gain":0.65}],
          description: "Simulates TV audio quality"
        };
        
        // Apply the filter
        player.shoukaku.setFilters(filterConfig);
        
        // Restore volume
        player.setVolume(currentVolume);
        
        // Send success message
        const reply = embedManager.success(
          'Filter Applied',
          `Applied **television** filter

Description: Simulates TV audio quality`
        );
        return message.reply({ embeds: [reply] });
      } catch (filterError) {
        logger.error('TelevisionFilterCommand', `Error applying filter television:`, filterError);
        
        const reply = embedManager.error(
          'Filter Error',
          `Failed to apply filter: television. Please try again.`
        );
        return message.reply({ embeds: [reply] });
      }
    } catch (error) {
      logger.error('TelevisionFilterCommand', 'Error executing command:', error);
      
      const reply = embedManager.error(
        'Error',
        'An error occurred while trying to apply the filter.'
      );
      return message.reply({ embeds: [reply] });
    }
  }
}

export default new TelevisionFilterCommand();
