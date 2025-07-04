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
import os from 'os';

/**
 * Uptime command to check bot and Lavalink uptime along with system info
 */
class UptimeCommand extends Command {
  constructor() {
    super({
      name: 'uptime',
      description: 'Check Avon\'s and Lavalink\'s uptime plus system info',
      usage: 'uptime',
      aliases: ['up', 'online'],
      category: 'information',
      cooldown: 5
    });
  }

  /**
   * Execute the uptime command
   * @param {object} options - Command options
   * @returns {Promise<void>}
   */
  async execute({ message, client, musicManager }) {
    const { guild } = message;
    try {
      const initialEmbed = embedManager.create({
        title: 'Loading...',
        description: `Calculating Lavalink's uptime...`,
        color: embedManager.colors.default,
        timestamp: true
      });

      const sent = await message.reply({ embeds: [initialEmbed] });       

      const player = musicManager.getPlayer(guild.id);
      const nodeStatus = client.music.getNodesStatus?.() || [];
      let uptimeInfo = '';
      const uptime = process.uptime() * 1000;
      const nodeUptime = player?.node?.stats?.uptime || 0;

      const connectedNodes = nodeStatus.filter(node => node.connected);
      if (connectedNodes.length > 0) {
        uptimeInfo = `\n • Lavalink Nodes: **${connectedNodes.length}/${nodeStatus.length}** online`;
      }

      const finalEmbed = embedManager.create({
        title: 'Avon & Lavalink Uptime Info',
        description: [
          `• Avon Uptime: <t:${Math.floor((Date.now() - uptime) / 1000)}:R>`,
          `• Lavalink Uptime: <t:${Math.floor((Date.now() - nodeUptime) / 1000)}:R>`,
          uptimeInfo,
        ].join('\n'),
        color: embedManager.colors.success,
        footer: { text: 'Made with 🧡 by Team Avon' },
        timestamp: true
      });

      await sent.edit({ embeds: [finalEmbed] });
    } catch (error) {
      logger.error('UptimeCommand', 'Error executing uptime command', error);
      const errorEmbed = embedManager.error(
        'Error',
        'An error occurred while checking uptime.'
      );
      message.reply({ embeds: [errorEmbed] });
    }
  }
}

export default new UptimeCommand();