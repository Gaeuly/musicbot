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

/**
 * Bump command to move a song to the first position in the queue
 */
class BumpCommand extends Command {
  constructor() {
    super({
      name: 'bump',
      description: 'Move a song in the queue to the first position',
      usage: 'bump <song number>',
      category: 'music',
      aliases: ['addtoupcoming', 'add2upcoming', 'add2top', 'addtotop'],
      cooldown: 2,
      sameVoiceRequired: true,
      voiceRequired: true,
      playerRequired: true,
      args: true
    });
  }

  /**
   * Execute the bump command
   * @param {object} options
   */
  async execute({ message, args, musicManager }) {
    const { guild } = message;
    const player = musicManager.getPlayer(guild.id);

    const index = parseInt(args[0], 10) - 1;

    if (isNaN(index)) {
      const reply = embedManager.error(
        'Invalid Input',
        'Please provide a valid song number to bump.'
      );
      return message.reply({ embeds: [reply] });
    }

    if (index < 0 || index >= player.queue.length) {
      const reply = embedManager.error(
        'Out of Range',
        'The provided song number is out of queue range.'
      );
      return message.reply({ embeds: [reply] });
    }

    const track = player.queue[index];
    player.queue.splice(index, 1);      // Remove from old position
    player.queue.unshift(track);        // Add to beginning of the queue

    const reply = embedManager.success(
      'Added To Upcoming',
      `Added **${track.title}** to the first position in the queue.`
    );
    return message.reply({ embeds: [reply] });
  }
}

export default new BumpCommand();
