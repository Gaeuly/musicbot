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
 * Command to apply the vaporwave filter to the current playing track
 */
class VaporwaveFilterCommand extends Command {
  constructor() {
    super({
      name: 'vaporwave',
      description: 'Slowed down pitch with reverb and tremolo',
      usage: 'vaporwave',
      category: 'filters',
      cooldown: 3,
      sameVoiceRequired: true,
      voiceRequired: true,
      playerRequired: true,
      playingRequired: true,
      examples: ['vaporwave']
    });
  }

  /**
   * Execute the vaporwave filter command
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
          category: "tempo",
          equalizer: [{"band":0,"gain":0.3},{"band":1,"gain":0.3}],
          timescale: {"pitch":0.5},
          tremolo: {"depth":0.3,"frequency":14},
          description: "Slowed down pitch with reverb and tremolo"
        };
        
        // Apply the filter
        player.shoukaku.setFilters(filterConfig);
        
        // Restore volume
        player.setVolume(currentVolume);
        
        // Send success message
        const reply = embedManager.success(
          'Filter Applied',
          `Applied **vaporwave** filter

Description: Slowed down pitch with reverb and tremolo`
        );
        return message.reply({ embeds: [reply] });
      } catch (filterError) {
        logger.error('VaporwaveFilterCommand', `Error applying filter vaporwave:`, filterError);
        
        const reply = embedManager.error(
          'Filter Error',
          `Failed to apply filter: vaporwave. Please try again.`
        );
        return message.reply({ embeds: [reply] });
      }
    } catch (error) {
      logger.error('VaporwaveFilterCommand', 'Error executing command:', error);
      
      const reply = embedManager.error(
        'Error',
        'An error occurred while trying to apply the filter.'
      );
      return message.reply({ embeds: [reply] });
    }
  }
}

export default new VaporwaveFilterCommand();
