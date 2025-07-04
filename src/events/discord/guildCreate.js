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
import { logger } from '../../utils/logger.js';

import { EmbedBuilder } from 'discord.js';

/**

 * GuildCreate event for handling when the bot joins a new server

 */

export default {

  name: 'guildCreate',

  /**

   * Execute the guildCreate event

   * @param {object} guild - The guild object

   * @param {object} client - Discord client

   */

  async execute(guild, client) {

    try {

      const logChannelId = '1329803223762075691';

      const logChannel = await client.channels.fetch(logChannelId).catch(() => null);

      if (!logChannel) {

        logger.warn('GuildCreate', `Log channel with ID ${logChannelId} not found.`);

        return;

      }

      const embed = new EmbedBuilder()

        .setTitle('📥 Bot Joined a New Server')

        .setColor('Green')

        .addFields(

          { name: 'Server Name', value: guild.name, inline: true },

          { name: 'Server ID', value: guild.id, inline: true },

          { name: 'Member Count', value: `${guild.memberCount}`, inline: true },

          { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },

        )

        .setTimestamp();

      await logChannel.send({ embeds: [embed] });

      logger.info('GuildCreate', `Joined ${guild.name} (${guild.id})`);

    } catch (error) {

      logger.error('GuildCreate', 'Error handling guildCreate', error);

    }

  },

};