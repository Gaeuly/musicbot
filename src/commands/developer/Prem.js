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
import { db } from '../../database/DatabaseManager.js';
import { formatPremiumExpiry } from '../../utils/permissionUtil.js';

class PremiumCommand extends Command {
  constructor() {
    super({
      name: 'premium',
      description: 'Manage premium subscriptions (Owner Only)',
      usage: 'premium <grant|revoke|stats|cleanup> [type] [id] [duration] [reason]',
      aliases: ['prem'],
      category: 'owner',
      management: true,
      examples: [
        'premium grant user 123456789 30d Premium granted',
        'premium grant guild 987654321 perm Guild premium',
        'premium revoke user 123456789',
        'premium stats',
        'premium cleanup'
      ]
    });
  }

  async execute({ message, args }) {
    if (!args.length) {
      return message.reply(this.getHelpText());
    }

    const action = args[0].toLowerCase();

    switch (action) {
      case 'grant':
        return this.handleGrant(message, args.slice(1));
      case 'revoke':
        return this.handleRevoke(message, args.slice(1));
      case 'stats':
        return this.handleStats(message);
      case 'cleanup':
        return this.handleCleanup(message);
      default:
        return message.reply(`Invalid action: ${action}\n${this.getHelpText()}`);
    }
  }

  async handleGrant(message, args) {
    if (args.length < 2) {
      return message.reply('Usage: `premium grant <user|guild> <id> [duration] [reason]`\nDuration: 1d, 7d, 30d, perm (default: 30d)');
    }

    const type = args[0].toLowerCase();
    let id = args[1];
      if (id.startsWith('<@') && id.endsWith('>')) {
  id = id.slice(2, -1); // remove <@ and >
  if (id.startsWith('!')) id = userId.slice(1); // remove ! if present
}
    const durationArg = args[2] || '30d';
    const reason = args.slice(3).join(' ') || 'Premium granted by owner';

    if (!['user', 'guild'].includes(type)) {
      return message.reply('Type must be either `user` or `guild`');
    }

    // Parse duration
    let expiresAt = null;
    if (durationArg !== 'perm' && durationArg !== 'permanent') {
      const duration = this.parseDuration(durationArg);
      if (duration === null) {
        return message.reply('Invalid duration format. Use: 1d, 7d, 30d, or perm');
      }
      expiresAt = Date.now() + duration;
    }

    try {
      let result;
      if (type === 'user') {
        result = db.premium.grantUserPremium(id, message.author.id, expiresAt, reason);
      } else {
        result = db.premium.grantGuildPremium(id, message.author.id, expiresAt, reason);
      }

      if (result && result.changes > 0) {
        const expiryText = expiresAt ? `<t:${Math.floor(expiresAt / 1000)}:R>` : 'Never (Permanent)';
        message.reply(`Successfully granted ${type} premium to \`${id}\`\nExpires: ${expiryText}\nReason: ${reason}`);
      } else {
        message.reply(`Failed to grant premium to ${type} \`${id}\``);
      }
    } catch (error) {
      console.error('Error granting premium:', error);
      message.reply(`Error granting premium: ${error.message}`);
    }
  }

  async handleRevoke(message, args) {
    if (args.length < 2) {
      return message.reply('Usage: `premium revoke <user|guild> <id>`');
    }

    const type = args[0].toLowerCase();
    const id = args[1];

    if (!['user', 'guild'].includes(type)) {
      return message.reply('Type must be either `user` or `guild`');
    }

    try {
      let result;
      if (type === 'user') {
        result = db.premium.revokeUserPremium(id);
      } else {
        result = db.premium.revokeGuildPremium(id);
      }

      if (result && result.changes > 0) {
        message.reply(`Successfully revoked ${type} premium from \`${id}\``);
      } else {
        message.reply(`Failed to revoke premium from ${type} \`${id}\` (may not have premium)`);
      }
    } catch (error) {
      console.error('Error revoking premium:', error);
      message.reply(`Error revoking premium: ${error.message}`);
    }
  }

  async handleStats(message) {
    try {
      const stats = db.premium.getStats();
      
      let response = '**Premium Statistics**\n\n';
      response += `**Users:** ${stats.total.users} (${stats.active.users} active)\n`;
      response += `**Guilds:** ${stats.total.guilds} (${stats.active.guilds} active)\n`;
      response += `**Total Active:** ${stats.active.total}\n`;
      response += `**Total Registered:** ${stats.total.total}`;

      // Get recent premiums
      const userPremiums = db.premium.getAllUserPremiums().slice(0, 5);
      const guildPremiums = db.premium.getAllGuildPremiums().slice(0, 5);

      if (userPremiums.length > 0) {
        response += '\n\n**Recent User Premiums:**\n';
        userPremiums.forEach(prem => {
          const expiry = prem.expires_at ? `<t:${Math.floor(prem.expires_at / 1000)}:R>` : 'Permanent';
          response += `• \`${prem.user_id}\` - ${expiry}\n`;
        });
      }

      if (guildPremiums.length > 0) {
        response += '\n**Recent Guild Premiums:**\n';
        guildPremiums.forEach(prem => {
          const expiry = prem.expires_at ? `<t:${Math.floor(prem.expires_at / 1000)}:R>` : 'Permanent';
          response += `• \`${prem.guild_id}\` - ${expiry}\n`;
        });
      }

      message.reply(response);
    } catch (error) {
      console.error('Error fetching stats:', error);
      message.reply(`Error fetching stats: ${error.message}`);
    }
  }

  async handleCleanup(message) {
    try {
      const result = db.premium.cleanupExpired();
      message.reply(`Cleanup completed!\nRemoved ${result.usersRevoked} expired user premiums and ${result.guildsRevoked} expired guild premiums.\nTotal cleaned: ${result.total}`);
    } catch (error) {
      console.error('Error during cleanup:', error);
      message.reply(`Error during cleanup: ${error.message}`);
    }
  }

  parseDuration(duration) {
    const match = duration.match(/^(\d+)([dhm])$/i);
    if (!match) return null;

    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case 'm': return value * 60 * 1000; // minutes
      case 'h': return value * 60 * 60 * 1000; // hours
      case 'd': return value * 24 * 60 * 60 * 1000; // days
      default: return null;
    }
  }

  getHelpText() {
    return `**Premium Management Commands:**
\`premium grant <user|guild> <id> [duration] [reason]\` - Grant premium
\`premium revoke <user|guild> <id>\` - Revoke premium
\`premium stats\` - View premium statistics
\`premium cleanup\` - Remove expired premiums

**Duration formats:** 1d, 7d, 30d, perm (default: 30d)
**Examples:**
• \`premium grant user 123456789 30d VIP user\`
• \`premium grant guild 987654321 perm Server boost\`
• \`premium revoke user 123456789\``;
  }
}

export default new PremiumCommand();