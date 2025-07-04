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
import { EmbedBuilder } from 'discord.js';
import { db } from '../../database/DatabaseManager.js';
import { embedManager } from '../../managers/EmbedManager.js';

/**
 * NoPrefixToggle command - Premium users can toggle their own no-prefix mode
 */
class NoPrefixToggleCommand extends Command {
  constructor() {
    super({
      name: 'noptoggle',
      description: 'Toggle your personal no-prefix mode (Premium Only)',
      usage: 'noptoggle [on/off]',
      aliases: ['npt', 'noprefixtoggle', 'noprefix', 'nop'],
      category: 'premium',
      cooldown: 5,
      userPrem: true // Requires user premium
    });
  }

  /**
   * Execute the noptoggle command
   * @param {object} options - Command options
   * @returns {Promise<void>}
   */
  async execute({ message, args, client }) {
    const userId = message.author.id;
    const currentStatus = db.hasNoPrefix(userId);

    let newStatus;
    let action;

    // Check if user specified on/off
    if (args.length > 0) {
      const arg = args[0].toLowerCase();
      if (arg === 'on' || arg === 'enable' || arg === 'true') {
        newStatus = true;
        action = 'enabled';
      } else if (arg === 'off' || arg === 'disable' || arg === 'false') {
        newStatus = false;
        action = 'disabled';
      } else {
        const errorEmbed = embedManager.create({
          color: embedManager.colors.error,
          title: '<:discotoolsxyzicon87:1347122685267939348> Invalid Option',
          description: `**Invalid option:** \`${arg}\`\n\n` +
                      `**Valid options:**\n` +
                      `• \`on\` / \`enable\` - Enable no-prefix mode\n` +
                      `• \`off\` / \`disable\` - Disable no-prefix mode\n` +
                      `• No argument - Toggle current state`,
          footer: { text: 'Premium Feature' }
        });
        return message.reply({ embeds: [errorEmbed] });
      }
    } else {
      // Toggle current status
      newStatus = !currentStatus;
      action = newStatus ? 'enabled' : 'disabled';
    }

    // Set the new status (permanent for premium users)
    db.setNoPrefix(userId, newStatus, null);

    // Create success embed
    const successEmbed = embedManager.create({
      color: newStatus ? embedManager.colors.success : embedManager.colors.warning,
      title: `<:discotoolsxyzicon83:1347122696856539197> No-Prefix Mode ${newStatus ? 'Enabled' : 'Disabled'}`,
      description: `**Your no-prefix mode has been ${action}!**\n\n` +
                  (newStatus ? 
                    `💎 **You can now use commands without any prefix!**\n` +
                    `• Just type command names directly\n` +
                    `• Example: \`play never gonna give you up\`\n` +
                    `• This works in all servers where I'm present` :
                    `**You now need to use prefixes for commands**\n` +
                    `• Use server prefix or mention me\n` +
                    `• Example: \`!play song\` or \`@${client.user.username} play song\``
                  ),
      fields: [
        {
          name: 'Current Status',
          value: newStatus ? '✅ Enabled' : '❌ Disabled',
          inline: true
        },
        {
          name: 'Premium Perk',
          value: '💎 User Premium',
          inline: true
        }
      ],
      footer: { text: `User ID: ${userId} • Premium Feature` },
      timestamp: true
    });

    await message.reply({ embeds: [successEmbed] });
  }
}

export default new NoPrefixToggleCommand();