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
 * Move command to change position of a song in the queue
 */
class MoveCommand extends Command {
  constructor() {
    super({
      name: 'move',
      description: 'Move a song in the queue to a new position',
      usage: 'move <from> <to>',
      aliases: ['shift'],
      category: 'music',
      cooldown: 2,
      sameVoiceRequired: true,
      voiceRequired: true,
      playerRequired: true,
      args: true
    });
  }

  /**
   * Execute the move command
   * @param {object} options
   */
  async execute({ message, args, musicManager }) {
    const { guild } = message;
    const player = musicManager.getPlayer(guild.id);

    const from = parseInt(args[0], 10) - 1;
    const to = parseInt(args[1], 10) - 1;

    if (isNaN(from) || isNaN(to)) {
      const reply = embedManager.error(
        'Invalid Positions',
        'Please provide valid numbers for the positions.'
      );
      return message.reply({ embeds: [reply] });
    }

    if (
      from < 0 || from >= player.queue.length ||
      to < 0 || to >= player.queue.length
    ) {
      const reply = embedManager.error(
        'Out of Range',
        'The provided positions are out of queue range.'
      );
      return message.reply({ embeds: [reply] });
    }

    const track = player.queue[from];
    player.queue.splice(from, 1);
    player.queue.splice(to, 0, track);

    const reply = embedManager.success(
      'Song Moved',
      `Moved **${track.title}** from position \`${from + 1}\` to \`${to + 1}\`.`
    );
    return message.reply({ embeds: [reply] });
  }
}

export default new MoveCommand();

// coded by bre4d777
// with little help of prayag.exe
