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

 * AutoPlay command for enabling/disabling automatic song recommendations

 */

class AutoPlayCommand extends Command {

  constructor() {

    super({

      name: 'autoplay',

      description: 'Enable or disable automatic song recommendations when your queue ends.',

      usage: 'autoplay [on|off]',

      aliases: ['ap', 'auto'],

      category: 'music',

      cooldown: 2,

      voiceRequired: true,
      anyprem:true,
      examples: [

        'autoplay',

        'autoplay on',

        'autoplay off'

      ],

    });

  }

  /**

   * Execute the autoplay command

   * @param {object} options - Command options

   * @returns {Promise<void>}

   */

  async execute({ message, args, client, musicManager }) {

    const { guild, channel, member } = message;

    try {

      // Get the player

      const player = musicManager.getPlayer(guild.id);

      // Check if a player exists

      if (!player) {

        const reply = embedManager.error(

          'No Music Playing',

          'I\'m not playing anything right now. Start playing something first!'

        );

        return message.reply({ embeds: [reply] });

      }

      // Check if the user is in the same voice channel

      if (player.voiceId && member.voice.channelId !== player.voiceId) {

        const reply = embedManager.error(

          'Wrong Voice Channel',

          'You must be in the same voice channel as the bot to use this command!'

        );

        return message.reply({ embeds: [reply] });

      }

      // Initialize the autoplay property if it doesn't exist

      if (player.autoplay === undefined) {

        player.autoplay = false;

      }

      // Get the current state or toggle it

      if (!args.length) {

        // If no arguments, toggle the current state

        player.autoplay = !player.autoplay;

      } else {

        // Set state based on argument

        const state = args[0].toLowerCase();

        if (state === 'on' || state === 'enable' || state === 'true' || state === '1') {

          player.autoplay = true;

        } else if (state === 'off' || state === 'disable' || state === 'false' || state === '0') {

          player.autoplay = false;

        } else {

          const reply = embedManager.error(

            'Invalid Argument',

            'Please use `on` or `off` to set the autoplay state.'

          );

          return message.reply({ embeds: [reply] });

        }

      }

      // Create and send the response embed

      const statusText = player.autoplay ? 'Enabled ✅' : 'Disabled ❌';

      const description = player.autoplay 

        ? 'Autoplay is now enabled. When your queue ends, I\'ll automatically add similar songs based on your listening history.'

        : 'Autoplay is now disabled. The player will stop when your queue ends.';

      const embed = embedManager.create({

        color: player.autoplay ? embedManager.colors.success : embedManager.colors.info,

        title: `Autoplay: ${statusText}`,

        description: description,

        footer: { text: player.autoplay ? 'I\'ll keep the music flowing!' : 'Use "autoplay on" to enable' },

        timestamp: true

      });

      return message.reply({ embeds: [embed] });

    } catch (error) {

      logger.error('AutoPlayCommand', 'Error executing autoplay command', error);

      const reply = embedManager.error(

        'Error',

        'An error occurred while trying to toggle autoplay.'

      );

      return message.reply({ embeds: [reply] });

    }

  }

}

export default new AutoPlayCommand();
