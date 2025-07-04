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
 * Remove command to delete a song from the queue
 */
class RemoveCommand extends Command {
  constructor() {
    super({
      name: 'remove',
      description: 'Remove a song from the queue by position',
      usage: 'remove <position>',
      aliases: ['rm'],
      category: 'music',
      cooldown: 2,
      sameVoiceRequired: true,
      voiceRequired: true,
      playerRequired: true,
      args: true
    });
  }

  /**
   * Execute the remove command
   * @param {object} options
   */
  async execute({ message, args, musicManager }) {
    const { guild } = message;
    const player = musicManager.getPlayer(guild.id);

    const position = parseInt(args[0], 10) - 1;

    if (isNaN(position)) {
      const reply = embedManager.error(
        'Invalid Input',
        'Please provide a valid number for the song position.'
      );
      return message.reply({ embeds: [reply] });
    }

    if (position < 0 || position >= player.queue.length) {
      const reply = embedManager.error(
        'Out of Range',
        'That position is out of the queue range.'
      );
      return message.reply({ embeds: [reply] });
    }

    const removed = player.queue.splice(position, 1)[0];

    const reply = embedManager.success(
      'Removed Song',
      `Removed **${removed.title}** from position \`${position + 1}\`.`
    );
    return message.reply({ embeds: [reply] });
  }
}

export default new RemoveCommand();

// coded by bre4d777
// with little help of prayag.exe
