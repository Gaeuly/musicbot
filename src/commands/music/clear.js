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
 * Clear command to clear the queue without stopping the playback
 */
class ClearCommand extends Command {
  constructor() {
    super({
      name: 'clear',
      description: 'Clear the entire queue',
      usage: 'clear',
      aliases: ['qclear', 'flush'],
      category: 'music',
      cooldown: 2,
      sameVoiceRequired: true,
      voiceRequired: true,
      playerRequired: true
    });
  }

  /**
   * Execute the clear command
   * @param {object} options
   */
  async execute({ message, musicManager }) {
    const { guild } = message;
    const player = musicManager.getPlayer(guild.id);

    if (!player.queue.length) {
      const reply = embedManager.error(
        'Empty Queue',
        'There are no songs to clear from the queue.'
      );
      return message.reply({ embeds: [reply] });
    }

    player.queue.clear();

    const reply = embedManager.success(
      'Queue Cleared',
      'All songs have been removed from the queue.'
    );
    return message.reply({ embeds: [reply] });
  }
}

export default new ClearCommand();

// coded by bre4d777
// with little help of prayag.exe
