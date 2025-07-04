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
import { config } from '../../config/config.js';
import { db } from '../../database/DatabaseManager.js';
import { embedManager } from '../../managers/EmbedManager.js';
import { EmbedBuilder } from 'discord.js';

class BlacklistCommand extends Command {
  constructor() {
    super({
      name: 'blacklist',
      description: 'Blacklist a user or guild from using the bot',
      usage: 'blacklist <user/guild> <on/off> <mention/userId/guildId?> [reason]',
      aliases: ['bl'],
      category: 'owner',
      ownerOnly: false,
      management: true
    });
  }

  async execute({ message, args }) {
    const type = args[0]?.toLowerCase();
    const action = args[1]?.toLowerCase();
    const enabled = ['on', 'enable', 'true'].includes(action);
    const disable = ['off', 'disable', 'false'].includes(action);

    if (!['user', 'guild'].includes(type) || (!enabled && !disable)) {
      return message.reply({
        embeds: [
          embedManager.create({
            color: embedManager.colors.error,
            title: 'Invalid Usage',
            description: 'Usage: `blacklist <user/guild> <on/off> <userMention/userId/guildId?> [reason]`'
          })
        ]
      });
    }

    let targetId;
    let reason;

    if (type === 'user') {
      const user = message.mentions.users.first() || await message.client.users.fetch(args[2]).catch(() => null);
      if (!user) {
        return message.reply({
          embeds: [
            embedManager.create({
              color: embedManager.colors.error,
              title: 'Invalid User',
              description: 'Please mention a valid user or provide a valid user ID.'
            })
          ]
        });
      }

      // 🚫 Skip protected user
      if (config.ownerIds.includes(user.id)) {
        return message.reply({
          embeds: [
            embedManager.create({
              color: embedManager.colors.error,
              title: 'Trying to blacklist my developers?',
              image: 'https://images-ext-1.discordapp.net/external/Qz297jxmFbhYxKxpiKelwZ5_ziiS6dzAQE4ozhMGhoo/https/media.tenor.com/yE6g1zv53wgAAAPo/aji-lund-mera-template-lund.mp4'
            })
          ]
        });
      }

      targetId = user.id;
      reason = args.slice(3).join(' ') || null;

      if (enabled) db.blacklistUser(targetId, reason);
      else db.unblacklistUser(targetId, reason);

      // Send a message to the user blacklist channel
      const userBlacklistChannelId = '1380534037780758559';
      const userBlacklistChannel = await message.client.channels.fetch(userBlacklistChannelId).catch(() => null);
      if (userBlacklistChannel && userBlacklistChannel.isTextBased()) {
        await userBlacklistChannel.send({
          embeds: [
            embedManager.create({
              color: enabled ? embedManager.colors.warning : embedManager.colors.success,
              title: `User ${enabled ? 'Blacklisted' : 'Unblacklisted'}`,
              description: `**User:** <@${targetId}> (\`${targetId}\`)\n` +
                           (reason ? `**Reason:** ${reason}` : 'No reason provided.'),
              timestamp: true
            })
          ]
        });
      }
    }

    if (type === 'guild') {
      const guildId = args[2] || message.guild?.id;
      if (!guildId) {
        return message.reply({
          embeds: [
            embedManager.create({
              color: embedManager.colors.error,
              title: 'Invalid Guild',
              description: 'Please provide a guild ID or use this in a server.'
            })
          ]
        });
      }

      targetId = guildId;
      reason = args.slice(3).join(' ') || null;

      if (enabled) db.blacklistGuild(targetId, reason);
      else db.unblacklistGuild(targetId, reason);

      // Send a message to the guild blacklist channel
      const guildBlacklistChannelId = '1380534187747966987';
      const guildBlacklistChannel = await message.client.channels.fetch(guildBlacklistChannelId).catch(() => null);
      if (guildBlacklistChannel && guildBlacklistChannel.isTextBased()) {
        await guildBlacklistChannel.send({
          embeds: [
            embedManager.create({
              color: enabled ? embedManager.colors.warning : embedManager.colors.success,
              title: `Guild ${enabled ? 'Blacklisted' : 'Unblacklisted'}`,
              description: `**Guild ID:** \`${targetId}\`\n` +
                           (reason ? `**Reason:** ${reason}` : 'No reason provided.'),
              timestamp: true
            })
          ]
        });
      }
    }

    const embed = embedManager.create({
      color: enabled ? embedManager.colors.warning : embedManager.colors.success,
      title: `${type === 'user' ? 'User' : 'Guild'} ${enabled ? 'Blacklisted' : 'Unblacklisted'}`,
      description: `**ID:** \`${targetId}\`\n` +
                   `**Type:** \`${type}\`\n` +
                   (reason ? `**Reason:** ${reason}` : ''),
      footer: { text: `${enabled ? 'Restricted from using' : 'Allowed to use'} the bot` },
      timestamp: true
    });

    return message.reply({ embeds: [embed] });
  }
}

export default new BlacklistCommand();