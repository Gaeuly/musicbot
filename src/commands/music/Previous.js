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
 * Previous command for playing the previous song
 */
class PreviousCommand extends Command {
  constructor() {
    super({
      name: 'previous',
      description: 'Play the previous song in history',
      usage: 'previous',
      aliases: ['prev', 'back'],
      category: 'music',
      cooldown: 2,
      sameVoiceRequired: true,
      voiceRequired: true,
      playerRequired: true
    });
  }

  /**
   * Execute the previous command
   * @param {object} options - Command options
   * @returns {Promise<void>}
   */
  async execute({ message, client, musicManager }) {
    const { guild } = message;

    try {
      const player = musicManager.getPlayer(guild.id);
      if (!player) {
        const reply = embedManager.error(
          'No Active Player',
          'There is no active music player in this server.'
        );
        return message.reply({ embeds: [reply] });
      }


      const previous = player.getPrevious(); // we get the previous track without removing it first

        if (!previous) return message.reply("No previous track found!");

        

      ;

    
 await player.play(player.getPrevious(true));
      const reply = embedManager.success(
        'Playing Previous Track',
        'Now playing the previous track from history.'
      );
      return message.reply({ embeds: [reply] });

    } catch (error) {
      logger.error('PreviousCommand', 'Error executing previous command', error);
      const reply = embedManager.error(
        'Error',
        'An error occurred while trying to play the previous track.'
      );
      return message.reply({ embeds: [reply] });
    }
  }
}

export default new PreviousCommand();

// coded by bre4d777
// with little help of prayag.exe
