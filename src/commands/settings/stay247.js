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

/**
 * 24/7 command for keeping the bot in voice channel
 */
class Stay247Command extends Command {
  constructor() {
    super({
      name: '247',
      description: 'Enable or disable 24/7 mode for ByteCord in this server',
      usage: '247 [on|off]',
      aliases: ['stay', '24/7', 'stayin'],
      category: 'music',
      cooldown: 5,
      guildPrem: true,
      //requiredPermissions: [PermissionFlagsBits.ManageGuild],
      examples: [
        '247', 
        '247 on', 
        '247 off'
      ],

 
    });
  }

  /**
   * Execute the 247 command
   * @param {object} options - Command options
   * @returns {Promise<void>}
   */
  async execute({ message, args, client, musicManager }) {
    const { guild, member, channel } = message;
    const action = args[0]?.toLowerCase();

    // Check if the user has permission to use this command
   // if (!member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    //  const reply = embedManager.error(
      //  'Permission Denied',
       // 'You need the **Manage Server** permission to use this command!'
     // );
     // return message.reply({ embeds: [reply] });
  //  }

    // Get current 24/7 status
    const is247Enabled = client.db.is247Enabled(guild.id);
    
    // Send loading message
    const loadingEmbed = embedManager.create({
      color: embedManager.colors.default,
      title: '⏳ Processing...',
      description: `Processing 24/7 mode request...`,
      timestamp: true
    });
    
    const responseMsg = await message.reply({ embeds: [loadingEmbed] });

    try {
      // Toggle mode if no argument is provided
      if (!action) {
        return await this.toggle247Mode(guild, member, channel, !is247Enabled, client, musicManager, responseMsg);
      }

      // Handle explicit on/off arguments
      if (['on', 'enable', 'true', 'yes', '1'].includes(action)) {
        return await this.toggle247Mode(guild, member, channel, true, client, musicManager, responseMsg);
      }
      
      if (['off', 'disable', 'false', 'no', '0'].includes(action)) {
        return await this.toggle247Mode(guild, member, channel, false, client, musicManager, responseMsg);
      }
      
      // Invalid argument
      const invalidEmbed = embedManager.error(
        'Invalid Usage',
        `Invalid option: \`${action}\`\n\nUsage: \`${this.usage}\``
      );
      return responseMsg.edit({ embeds: [invalidEmbed] });
      
    } catch (error) {
      logger.error('247Command', 'Error executing command', error);
      
      const errorEmbed = embedManager.error(
        'Error',
        'An error occurred while processing your request. Please try again later.'
      );
      return responseMsg.edit({ embeds: [errorEmbed] });
    }
  }
  
  /**
   * Toggle 24/7 mode on or off
   * @param {object} guild - Discord guild
   * @param {object} member - Discord member
   * @param {object} channel - Discord text channel
   * @param {boolean} enable - Whether to enable or disable 24/7 mode
   * @param {object} client - Discord client
   * @param {object} musicManager - Music manager
   * @param {object} responseMsg - Message to edit with response
   * @returns {Promise<void>}
   */
  async toggle247Mode(guild, member, channel, enable, client, musicManager, responseMsg) {
    // Check if turning on or off
    if (enable) {
      // Get current voice channel or ask user to join one
      const voiceChannel = member.voice.channel;
      
      if (!voiceChannel) {
        const noVoiceEmbed = embedManager.error(
          'Voice Channel Required',
          'You need to join a voice channel first to enable 24/7 mode!'
        );
        return responseMsg.edit({ embeds: [noVoiceEmbed] });
      }
      
      // Check bot permissions for the voice channel
      const permissions = voiceChannel.permissionsFor(guild.members.me);
      if (!permissions.has('Connect') || !permissions.has('Speak')) {
        const noPermsEmbed = embedManager.error(
          'Insufficient Permissions',
          'I need permissions to join and speak in your voice channel!'
        );
        return responseMsg.edit({ embeds: [noPermsEmbed] });
      }
      
      // Check if bot is already connected to a different voice channel
      let player = musicManager.getPlayer(guild.id);
      const currentVoiceChannel = player ? guild.channels.cache.get(player.voiceId) : null;
      
      // If bot is in a different voice channel, move to the new one
      if (currentVoiceChannel && currentVoiceChannel.id !== voiceChannel.id) {
        const moveEmbed = embedManager.create({
          color: embedManager.colors.warning,
          title: '⚠️ Channel Change',
          description: `I'm currently in ${currentVoiceChannel}. Do you want me to move to ${voiceChannel}?`,
          footer: { text: 'This will disconnect me from the current voice channel.' },
          timestamp: true
        });
        
        responseMsg.edit({ embeds: [moveEmbed] });
        
        // Delete any existing player
        if (player) {
          player.destroy();
          player = null;
        }
      }
      
      // Create a new player if one doesn't exist
      if (!player) {
        player = musicManager.createPlayer({
          guildId: guild.id,
          textChannel: channel,
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
      
      // Save 24/7 status in database
      client.db.set247Mode(guild.id, true, voiceChannel.id, channel.id);
      
      const enabledEmbed = embedManager.success(
        '24/7 Mode Enabled',
        `24/7 mode is now **enabled**.\n\nI'll stay connected to ${voiceChannel} and listen for commands in this channel.`,
        { footer: { text: 'Use "247 off" to disable 24/7 mode' } }
      );
      
      return responseMsg.edit({ embeds: [enabledEmbed] });
      
    } else {
      // Disable 24/7 mode
      client.db.set247Mode(guild.id, false, null, null);
      
      // Don't destroy the player immediately, just update the status
      const disabledEmbed = embedManager.success(
        '24/7 Mode Disabled',
        'I will now disconnect from voice channels when the queue is empty.',
        { footer: { text: 'Use "247 on" to enable 24/7 mode again' } }
      );
      
      return responseMsg.edit({ embeds: [disabledEmbed] });
    }
  }
}

export default new Stay247Command();
