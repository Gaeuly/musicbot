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
import { PermissionFlagsBits } from 'discord.js';
import { Guild } from '../../database/Guild.js';

const guildDB = new Guild();

class RequestCommand extends Command {
  constructor() {
    super({
      name: 'request',
      description: 'Set up request channel system for the bot',
      usage: 'request [on|off] [#channel]',
      aliases: ['req'],
      category: 'music',
      cooldown: 5,
      requiredPermissions: [PermissionFlagsBits.ManageGuild],
      examples: [
        'request', 
        'request on', 
        'request on #music-requests',
        'request off'
      ],
    });
  }

  async execute({ message, args, client, musicManager }) {
    const { guild, member, channel } = message;
    const action = args[0]?.toLowerCase();

    if (!member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      const reply = embedManager.error(
        'Permission Denied',
        'You need the **Manage Server** permission to use this command!'
      );
      return message.reply({ embeds: [reply] });
    }

    const isRequestEnabled = guildDB.isRequestSystemEnabled(guild.id);
    const is247Enabled = guildDB.is247Enabled(guild.id);
    
    const loadingEmbed = embedManager.create({
      color: embedManager.colors.default,
      title: '⏳ Processing...',
      description: 'Processing request channel setup...',
      timestamp: true
    });
    
    const responseMsg = await message.reply({ embeds: [loadingEmbed] });

    try {
      if (!action) {
        return await this.toggleRequestSystem(guild, member, channel, !isRequestEnabled, client, musicManager, responseMsg);
      }

      if (['on', 'enable', 'true', 'yes', '1'].includes(action)) {
        const targetChannel = message.mentions.channels.first() || channel;
        return await this.toggleRequestSystem(guild, member, channel, true, client, musicManager, responseMsg, targetChannel);
      }
      
      if (['off', 'disable', 'false', 'no', '0'].includes(action)) {
        return await this.toggleRequestSystem(guild, member, channel, false, client, musicManager, responseMsg);
      }
      
      const invalidEmbed = embedManager.error(
        'Invalid Usage',
        `Invalid option: \`${action}\`\n\nUsage: \`${this.usage}\``
      );
      return responseMsg.edit({ embeds: [invalidEmbed] });
      
    } catch (error) {
      logger.error('RequestCommand', 'Error executing command', error);
      
      const errorEmbed = embedManager.error(
        'Error',
        'An error occurred while processing your request. Please try again later.'
      );
      return responseMsg.edit({ embeds: [errorEmbed] });
    }
  }
  
  async toggleRequestSystem(guild, member, channel, enable, client, musicManager, responseMsg, targetChannel = null) {
    if (enable) {
      const requestChannel = targetChannel || channel;
      
      const permissions = requestChannel.permissionsFor(guild.members.me);
      if (!permissions.has('SendMessages') || !permissions.has('ManageMessages')) {
        const noPermsEmbed = embedManager.error(
          'Insufficient Permissions',
          'I need permissions to send and manage messages in the request channel!'
        );
        return responseMsg.edit({ embeds: [noPermsEmbed] });
      }

      const is247Enabled = guildDB.is247Enabled(guild.id);
      
      if (is247Enabled) {
        const voiceChannelId = guildDB.get247Channels(guild.id)?.voiceChannelId;
        guildDB.set247Mode(guild.id, true, voiceChannelId, requestChannel.id);
      } else {
        if (!member.voice.channel) {
          const noVoiceEmbed = embedManager.error(
            'Voice Channel Required',
            'You need to join a voice channel first to set up the request system!'
          );
          return responseMsg.edit({ embeds: [noVoiceEmbed] });
        }

        const voiceChannel = member.voice.channel;
        const voicePermissions = voiceChannel.permissionsFor(guild.members.me);
        if (!voicePermissions.has('Connect') || !voicePermissions.has('Speak')) {
          const noPermsEmbed = embedManager.error(
            'Insufficient Permissions',
            'I need permissions to join and speak in your voice channel!'
          );
          return responseMsg.edit({ embeds: [noPermsEmbed] });
        }

        let player = musicManager.getPlayer(guild.id);
        if (!player) {
          player = musicManager.createPlayer({
            guildId: guild.id,
            textChannel: requestChannel,
            voiceChannel: voiceChannel
          });
          
          if (!player) {
            const createFailedEmbed = embedManager.error(
              'Player Creation Failed',
              'Failed to create a player. Please try again later.'
            );
            return responseMsg.edit({ embeds: [createFailedEmbed] });
          }
        }
      }
      
      guildDB.setRequestSystem(guild.id, true, requestChannel.id);
      
      const enabledEmbed = embedManager.success(
        'Request System Enabled',
        `Request system is now **enabled** in ${requestChannel}.\n\nUsers can now send song requests directly in this channel.`,
        { footer: { text: 'Use "request off" to disable the request system' } }
      );
      
      return responseMsg.edit({ embeds: [enabledEmbed] });
      
    } else {
      guildDB.setRequestSystem(guild.id, false, null);
      
      const disabledEmbed = embedManager.success(
        'Request System Disabled',
        'Request system has been disabled.',
        { footer: { text: 'Use "request on" to enable the request system again' } }
      );
      
      return responseMsg.edit({ embeds: [disabledEmbed] });
    }
  }
}

export default new RequestCommand();