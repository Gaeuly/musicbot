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
 * Shuffle command for randomizing the queue
 */
class ShuffleCommand extends Command {
  constructor() {
    super({
      name: 'shuffle',
      description: 'Shuffle the current music queue',
      usage: 'shuffle',
      aliases: ['mix', 'randomize'],
      category: 'music',
      cooldown: 3,
      sameVoiceRequired: true,
      voiceRequired: true,
      playerRequired: true
    });
  }

  /**
   * Execute the shuffle command
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

      // Check if there are enough tracks to shuffle
      if (playerManager.queue.size < 2) {
        const reply = embedManager.error(
          'Cannot Shuffle',
          'Need at least 2 songs in the queue to shuffle.'
        );
        return message.reply({ embeds: [reply] });
      }

      // Shuffle the queue
      const success = playerManager.queue.shuffle();

      if (!success) {
        const reply = embedManager.error(
          'Shuffle Failed',
          'Failed to shuffle the queue.'
        );
        return message.reply({ embeds: [reply] });
      }

      // Save player state
      playerManager.saveState();

      const reply = embedManager.success(
        'Queue Shuffled',
        `🔀 Successfully shuffled the queue with ${playerManager.queue.size} tracks.`
      );

      return message.reply({ embeds: [reply] });
    } catch (error) {
      console.error('Shuffle command error:', error);
      const reply = embedManager.error(
        'Error',
        'An error occurred while trying to shuffle the queue.'
      );
      return message.reply({ embeds: [reply] });
    }
  }
}

export default new ShuffleCommand();

// coded by bre4d777
// with little help of prayag.exe
