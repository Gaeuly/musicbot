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
 * Loop command for changing the loop mode
 */
class LoopCommand extends Command {
  constructor() {
    super({
      name: 'loop',
      description: 'Change the loop mode (none, track, queue)',
      usage: 'loop [mode]',
      aliases: ['repeat'],
      category: 'music',
      cooldown: 3,
      sameVoiceRequired: true,
      voiceRequired: true,
      playerRequired: true,
      playingRequired: true
    });
  }

  /**
   * Execute the loop command
   * @param {object} options - Command options
   * @returns {Promise<void>}
   */
  async execute({ message, args, client, musicManager }) {
    const { guild } = message;

    try {
      // Get the player
      const player = musicManager.getPlayer(guild.id);

      // Create player manager
      const playerManager = new PlayerManager(player);

      // If no mode was provided
      if (!args.length) {
         // Determine default loop mode based on queue length
         const queueLength = player.queue.length;
         const defaultMode = queueLength === 0 ? 'track' : 'queue';

        // Set the loop mode
        const playerManager = new PlayerManager(player);
        const newMode = playerManager.setLoop(defaultMode);
        playerManager.saveState();

        // Emoji based on new mode
        const emoji = newMode === 'track' ? '🔂' : newMode === 'queue' ? '🔁' : '❌';

        const reply = embedManager.success(
        'Loop Mode Set Automatically',
        `${emoji} Only \`loop\` used. Set loop mode to **${newMode}** based on the current queue.`
       );
       return message.reply({ embeds: [reply] });
      }

      // Parse the mode argument
      const mode = args[0].toLowerCase();

      // Check if the mode is valid
      if (!['none', 'track', 'queue'].includes(mode)) {
        const reply = embedManager.error(
          'Invalid Mode',
          `Please provide a valid loop mode: \`none\`, \`track\`, or \`queue\`.\n\nUsage: \`${this.usage}\``
        );
        return message.reply({ embeds: [reply] });
      }

      // Set the loop mode
      const newMode = playerManager.setLoop(mode);

      // Save player state
      playerManager.saveState();

      // Create response embed with appropriate emoji
      let emoji = '❌';
      if (newMode === 'track') emoji = '🔂';
      else if (newMode === 'queue') emoji = '🔁';

      const reply = embedManager.success(
        'Loop Mode Changed',
        `${emoji} Loop mode set to **${newMode}**`
      );

      return message.reply({ embeds: [reply] });
    } catch (error) {
      console.error('Loop command error:', error);
      const reply = embedManager.error(
        'Error',
        'An error occurred while trying to change the loop mode.'
      );
      return message.reply({ embeds: [reply] });
    }
  }
}

export default new LoopCommand();

// coded by bre4d777
// with little help of prayag.exe
