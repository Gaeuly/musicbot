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
 * Command to apply the electronic filter to the current playing track
 */
class ElectronicFilterCommand extends Command {
  constructor() {
    super({
      name: 'electronic',
      description: 'EQ preset optimized for electronic music',
      usage: 'electronic',
      category: 'filters',
      cooldown: 3,
      sameVoiceRequired: true,
      voiceRequired: true,
      playerRequired: true,
      playingRequired: true,
      examples: ['electronic']
    });
  }

  /**
   * Execute the electronic filter command
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
          equalizer: [{"band":0,"gain":0.375},{"band":1,"gain":0.35},{"band":2,"gain":0.125},{"band":5,"gain":-0.125},{"band":6,"gain":-0.125},{"band":8,"gain":0.25},{"band":9,"gain":0.125},{"band":10,"gain":0.15},{"band":11,"gain":0.2},{"band":12,"gain":0.25},{"band":13,"gain":0.35},{"band":14,"gain":0.4}],
          description: "EQ preset optimized for electronic music"
        };
        
        // Apply the filter
        player.shoukaku.setFilters(filterConfig);
        
        // Restore volume
        player.setVolume(currentVolume);
        
        // Send success message
        const reply = embedManager.success(
          'Filter Applied',
          `Applied **electronic** filter

Description: EQ preset optimized for electronic music`
        );
        return message.reply({ embeds: [reply] });
      } catch (filterError) {
        logger.error('ElectronicFilterCommand', `Error applying filter electronic:`, filterError);
        
        const reply = embedManager.error(
          'Filter Error',
          `Failed to apply filter: electronic. Please try again.`
        );
        return message.reply({ embeds: [reply] });
      }
    } catch (error) {
      logger.error('ElectronicFilterCommand', 'Error executing command:', error);
      
      const reply = embedManager.error(
        'Error',
        'An error occurred while trying to apply the filter.'
      );
      return message.reply({ embeds: [reply] });
    }
  }
}

export default new ElectronicFilterCommand();
