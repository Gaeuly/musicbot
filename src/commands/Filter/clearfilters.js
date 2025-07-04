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
 * Command to clear all active audio filters
 */
class ClearFiltersCommand extends Command {
  constructor() {
    super({
      name: 'clearfilters',
      description: 'Remove all active audio filters',
      usage: 'clearfilters',
      aliases: ['nofilter', 'resetfilter', 'filteroff'],
      category: 'filters',
      cooldown: 3,
      sameVoiceRequired: true,
      voiceRequired: true,
      playerRequired: true,
      playingRequired: true,
      examples: ['clearfilters', 'nofilter']
    });
  }

  /**
   * Execute the clear filters command
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

      // Store the current volume
      const currentVolume = player.volume;
      
      // Clear filters
      player.shoukaku.clearFilters();
      
      // Restore volume
      player.setVolume(currentVolume);
      
      // Send success message
      const reply = embedManager.success(
        'Filters Cleared',
        'All audio filters have been removed.'
      );
      return message.reply({ embeds: [reply] });
    } catch (error) {
      logger.error('ClearFiltersCommand', 'Error clearing filters:', error);
      
      const reply = embedManager.error(
        'Error',
        'An error occurred while trying to clear filters.'
      );
      return message.reply({ embeds: [reply] });
    }
  }
}

export default new ClearFiltersCommand();
