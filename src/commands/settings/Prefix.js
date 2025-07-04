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

import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';

import { db } from '../../database/DatabaseManager.js';

import { config } from '../../config/config.js';

/**

 * Prefix command to view or change the bot prefix for a server

 */

class PrefixCommand extends Command {

  constructor() {

    super({

      name: 'prefix',

      description: 'View or change the ByteCord prefix for this server',

      usage: 'prefix [new prefix]',

      aliases: ['setprefix'],

      category: 'settings',

      cooldown: 10,

      permissions: [PermissionFlagsBits.SendMessages]

    });

  }

  /**

   * Execute the prefix command

   * @param {object} options - Command options

   * @returns {Promise<void>}

   */

  async execute({ message, args, prefix }) {

    // If no arguments, show current prefix

    if (args.length === 0) {

      const embed = new EmbedBuilder()

        .setColor('#3498db')

        .setTitle('Server Prefix')

        .setDescription(`Current prefix for this server: \`${prefix}\``)

        .addFields(

          { name: 'Usage', value: `To change it: \`${prefix}prefix <new prefix>\`` },

          { name: 'Default Prefix', value: `The default prefix is: \`${config.prefix}\`` }

        )

        .setFooter({ text: 'Note: Only server admins can change the prefix' })

        .setTimestamp();

      return message.channel.send({ embeds: [embed] });

    }

    // Check if user has permissions (admin)

    if (!message.member.permissions.has(PermissionFlagsBits.Administrator) &&

        !config.ownerIds.includes(message.author.id)) {

      const embed = new EmbedBuilder()

        .setColor('#e74c3c')

        .setTitle('Permission Denied')

        .setDescription('Only server administrators can change the bot prefix.')

        .setTimestamp();

      return message.channel.send({ embeds: [embed] });

    }

    // Get the new prefix

    const newPrefix = args[0];

    // Check prefix length

    if (newPrefix.length > 5) {

      const embed = new EmbedBuilder()

        .setColor('#e74c3c')

        .setTitle('Error')

        .setDescription('Prefix is too long. Maximum 5 characters allowed.')

        .setTimestamp();

      return message.channel.send({ embeds: [embed] });

    }

    // Set the new prefix

    db.setPrefix(message.guild.id, newPrefix);

    // Confirm with embed

    const embed = new EmbedBuilder()

      .setColor('#2ecc71')

      .setTitle('Prefix Updated')

      .setDescription(`Server prefix has been updated to \`${newPrefix}\``)

      .addFields(

        { name: 'Example', value: `Use commands with: \`${newPrefix}help\`` }

      )

      .setFooter({ text: 'All members will need to use this new prefix' })

      .setTimestamp();

    message.channel.send({ embeds: [embed] });

  }

}

export default new PrefixCommand();
