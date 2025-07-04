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
import { PlayerManager } from '../../managers/PlayerManager.js';
import { embedManager } from '../../managers/EmbedManager.js';

/**
 * Stop command for stopping playback and clearing the queue
 */
class StopCommand extends Command {
  constructor() {
    super({
      name: 'stop',
      description: 'Stop playback and clear the queue',
      usage: 'stop',
      aliases: ['clear', 'leave', 'disconnect', 'dc'],
      category: 'music',
      cooldown: 2,
      sameVoiceRequired: true,
      voiceRequired: true,
      playerRequired: true
    });
  }

  /**
   * Execute the stop command
   * @param {object} options - Command options
   * @returns {Promise<void>}
   */
  async execute({ message, client, musicManager }) {
    const { guild } = message;

    try {
      // Get the player
      const player = musicManager.getPlayer(guild.id);

      // Create player manager
      const playerManager = new PlayerManager(player);

      // Stop playback and clear the queue
      const success = playerManager.stop();

      if (!success) {
        const reply = embedManager.error(
          'Failed to Stop',
          'Failed to stop playback.'
        );
        return message.reply({ embeds: [reply] });
      }

      

      const reply = embedManager.success(
        'Stopped',
        'Playback stopped and queue cleared.'
      );
      return message.reply({ embeds: [reply] });
    } catch (error) {
      console.error('Stop command error:', error);
      const reply = embedManager.error(
        'Error',
        'An error occurred while trying to stop playback.'
      );
      return message.reply({ embeds: [reply] });
    }
  }
}

export default new StopCommand();

// coded by bre4d777
// with little help of prayag.exe
