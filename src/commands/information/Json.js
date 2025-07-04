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

import { AttachmentBuilder } from 'discord.js';

import { logger } from '../../utils/logger.js';

class JsonCommand extends Command {

  constructor() {

    super({

      name: 'json',

      description: 'Export all command information in JSON format',

      usage: 'json',

      aliases: ['export', 'commandjson'],

      category: 'utility',

      cooldown: 10,

      examples: ['json']

      // Removed permissions requirement

    });

  }

  async execute({ message, client }) {

    try {

      // Get all commands from the command handler

      const { commands } = client.commandHandler;

      const commandsData = [];

      // Convert Map to array and format each command

      commands.forEach(cmd => {

        // Extract all relevant information

        const commandInfo = {

          name: cmd.name,

          description: cmd.description || 'No description available',

          usage: cmd.usage || cmd.name,

          aliases: cmd.aliases || [],

          category: cmd.category || 'Uncategorized',

          cooldown: cmd.cooldown || 0,

          examples: cmd.examples || [],

          // Removed permissions from output

          requirements: this.getCommandRequirements(cmd),

          ownerOnly: cmd.ownerOnly || false,

          voiceRequired: cmd.voiceRequired || false,

          sameVoiceRequired: cmd.sameVoiceRequired || false,

          playerRequired: cmd.playerRequired || false,

          playingRequired: cmd.playingRequired || false,

          customRequirements: cmd.customRequirements || []

        };

        commandsData.push(commandInfo);

      });

      // Sort commands alphabetically

      commandsData.sort((a, b) => a.name.localeCompare(b.name));

      // Structure the final output with only the requested fields

      const output = {

        botName: client.user.username,

        commands: commandsData

      };

      // Convert to formatted JSON string with a proper BigInt handler

      const jsonOutput = JSON.stringify(output, (key, value) => {

        // Handle BigInt values properly

        if (typeof value === 'bigint') {

          return value.toString();

        }

        return value;

      }, 2);

      // Send as a file attachment

      const buffer = Buffer.from(jsonOutput, 'utf-8');

      const attachment = new AttachmentBuilder(buffer, { name: 'commands.json' });

      await message.reply({

        content: `Here's your command data in JSON format:`,

        files: [attachment]

      });

      logger.info('JsonCommand', `JSON command data exported by ${message.author.tag}`);

    } catch (error) {

      logger.error('JsonCommand', 'Error generating command JSON:', error);

      message.reply({ content: 'An error occurred while generating the JSON data.' });

    }

  }

  /**

   * Get command requirements as readable strings

   */

  getCommandRequirements(command) {

    const requirements = [];

    if (command.ownerOnly || command.category?.toLowerCase() === 'owner') {

      requirements.push('Bot Owner Only');

    } else if(command.category?.toLowerCase() === 'developer'){

      requirements.push('Bot Developer Only');

    }

    // Removed permissions check from requirements

    if (command.voiceRequired) {

      requirements.push('Must be in a voice channel');

    }

    if (command.sameVoiceRequired) {

      requirements.push('Must be in same voice channel as bot');

    }

    if (command.playerRequired) {

      requirements.push('Music player must be active');

    }

    if (command.playingRequired) {

      requirements.push('Music must be playing');

    }

    if (command.customRequirements && command.customRequirements.length > 0) {

      command.customRequirements.forEach(req => {

        requirements.push(req);

      });

    }

    return requirements;

  }

  // Removed formatPermission method as it's no longer needed

}

export default new JsonCommand();
