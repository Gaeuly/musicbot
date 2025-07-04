/**
 * Muffin STUDIO - Bre4d777 & prayag 
 * https://discord.gg/TRPqseUq32
 * give credits or ill touch you in your dreams
 */

import { ContainerBuilder, TextDisplayBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { logger } from '../utils/logger.js';
import { db } from '../database/DatabaseManager.js';
import { cooldownManager } from '../utils/cooldownManager.js';
import { canUseCommand, getMissingBotPermissions, inSameVoiceChannel, hasPremiumAccess } from '../utils/permissionUtil.js';
import { config } from '../config/config.js';
import { MessageCommandOptionResolver } from '../structures/MessageCommandOptionResolver.js';

export class MessageProcessor {
  constructor(client, musicManager, commandLoader) {
    this.client = client;
    this.musicManager = musicManager;
    this.commandLoader = commandLoader;
    this.debugFlags = new Set(['verbose', 'debug', 'trace', 'timing', 'silent']);
  }
  
  _createCv2Reply(options) {
      const container = new ContainerBuilder()
          .setAccentColor(options.color || 0x5865F2);
  
      if (options.title && options.description) {
          container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${options.title}\n${options.description}`));
      } else if (options.description) {
          container.addTextDisplayComponents(new TextDisplayBuilder().setContent(options.description));
      }
  
      if (options.actionRows) {
          options.actionRows.forEach(row => container.addActionRowComponents(row));
      }
  
      return { components: [container], flags: MessageFlags.IsComponentsV2, ephemeral: options.ephemeral || false };
  }
  
  async _sendCv2Error(message, title, description) {
    const reply = this._createCv2Reply({ title: `<:discotoolsxyzicon87:1347122685267939348> ${title}`, description, color: 0xED4245 });
    return message.reply(reply);
  }

  async processMessage(message) {
    const startTime = performance.now();
    let debugInfo = null;

    try {
      if (message.author.bot || !message.guild) return false;

      const commandInfo = this._parseCommand(message);
      if (!commandInfo) return false;

      const { commandName, args, isPrefixCommand, flags } = commandInfo;
      const isVerbose = flags.has('verbose') || flags.has('debug');

      if (isVerbose) {
        debugInfo = { startTime, commandName, userId: message.author.id, guildId: message.guild.id, steps: [] };
      }

      if (await this._isBlacklisted(message)) {
        this._logDebug(debugInfo, 'Command blocked: User/Guild blacklisted');
        return false;
      }

      await this._checkAndRemoveNoPrefixForNonPremium(message);

      if (await this._isBotMention(message)) return true;

      const command = this._getCommand(commandName);
      if (!command) {
        this._logDebug(debugInfo, `Command not found: ${commandName}`);
        return false;
      }
      this._logDebug(debugInfo, `Command found: ${command.name}`);
      
      let options;
      if (command.messageArgs && command.messageArgs.length > 0) {
          try {
              options = new MessageCommandOptionResolver(this.client, message, command.messageArgs, args);
              await options._parse(command.messageArgs, args);
          } catch (error) {
              this._logDebug(debugInfo, `Argument validation failed: ${error.message}`);
              await this._sendCv2Error(message, 'Invalid Arguments', error.message);
              return true;
          }
      }

      if (!(await this._checkCommandRequirements(message, command, debugInfo))) {
        return true;
      }

      return await this._executeCommand(message, command, args, options, isPrefixCommand, flags, debugInfo);
    } catch (error) {
      logger.error('MessageProcessor', 'Error in processMessage', error);
      this._logDebug(debugInfo, `Fatal error: ${error.message}`);
      return false;
    }
  }

  _parseCommand(message) {
    const content = message.content.trim();
    const guildPrefix = db.getPrefix(message.guild.id);
    const defaultPrefix = config.prefix || '!';
    const botMention = `<@$1131938711639183363>`;
    const botMentionNick = `<@!$1131938711639183363>`;
    const hasNoPrefix = db.hasNoPrefix(message.author.id);

    let commandText = null;
    let isPrefixCommand = false;

    const prefixs = [guildPrefix, defaultPrefix, botMention, botMentionNick];

    for (const prefix of prefixs) {
     if (content.startsWith(prefix)) {
      commandText = content.slice(prefix.length).trim();
      isPrefixCommand = true;
      break;
     }
    }

   if (!commandText && hasNoPrefix) {
    commandText = content;
   }

    if (!commandText) return null;

    const parts = commandText.split(/\s+/);
    const commandName = parts.shift()?.toLowerCase();
    if (!commandName) return null;

    const flags = new Set();
    const args = [];
    
    for (const part of parts) {
      if (part.startsWith('--')) {
        const flag = part.slice(2).toLowerCase();
        if (this.debugFlags.has(flag)) {
          flags.add(flag);
        } else {
          args.push(part);
        }
      } else {
        args.push(part);
      }
    }

    return { commandName, args, isPrefixCommand, flags };
  }

  async _checkAndRemoveNoPrefixForNonPremium(message) {
    const userId = message.author.id;
    const guildId = message.guild.id;
    
    if (!db.hasNoPrefix(userId)) return;

    const hasPremium = hasPremiumAccess(userId, guildId, 'user');
    
    if (!hasPremium) {
      db.setNoPrefix(userId, false, null);
      
      if (Math.random() < 0.3) {
        const button = new ButtonBuilder().setLabel('Get Premium').setURL('https://discord.gg/XYwwyDKhec').setStyle(ButtonStyle.Link);
        const row = new ActionRowBuilder().addComponents(button);
        const reply = this._createCv2Reply({
            title: '<:discotoolsxyzicon87:1347122685267939348> No-Prefix Access Removed',
            description: `**Premium subscription expired**\n\n💎 **Get User Premium to restore access**\n🔓 **Current prefix:** \`${db.getPrefix(guildId)}\``,
            color: 0xFEE75C,
            actionRows: [row]
        });

        try {
          await message.author.send(reply);
        } catch {
          if (Math.random() < 0.2) {
            await message.reply(reply);
          }
        }
      }
      logger.info('MessageProcessor', `Removed no-prefix access for user ${userId}`);
    }
  }

  async _isBlacklisted(message) {
    const userBlacklisted = db.isUserBlacklisted(message.author.id);
    if (userBlacklisted) {
      if (Math.random() < 0.1) {
        await this._sendCv2Error(message, 'Blacklisted', `You're blacklisted: ${userBlacklisted.reason}`);
      }
      return true;
    }

    const guildBlacklisted = db.isGuildBlacklisted(message.guild.id);
    if (guildBlacklisted) {
      if (Math.random() < 0.05) {
        await this._sendCv2Error(message, 'Blacklisted', `Server blacklisted: ${guildBlacklisted.reason}`);
      }
      return true;
    }
    return false;
  }

  async _isBotMention(message) {     
    const mentionRegex = new RegExp(`^<@!?${this.client.user.id}>$`);
    if (!mentionRegex.test(message.content.trim())) return false;
    
    const reply = this._createCv2Reply({
        description: `I am currently undergoing an update. You can still use me btw but i may go off in between.\n- Use **${db.getPrefix(message.guild.id)}help** for my command list\n- Use **${db.getPrefix(message.guild.id)}play** to play a song`
    });
    await message.reply(reply);
    return true;
  }

  _getCommand(commandName) {
    let command = this.commandLoader.commands.get(commandName);
    if (!command) {
      const aliasName = this.commandLoader.aliases.get(commandName);
      if (aliasName) {
        command = this.commandLoader.commands.get(aliasName);
      }
    }
    return command || null;
  }

  async _checkCommandRequirements(message, command, debugInfo) {
    const guildPrefix = db.getPrefix(message.guild.id);
    const userId = message.author.id;
    const isOwner = config.ownerIds?.includes(userId);

    if (command.maintenance && !isOwner) {
      this._logDebug(debugInfo, 'Command blocked: Under maintenance');
      const reply = this._createCv2Reply({ description: '<:byte_info:1372554308150890496> Command under maintenance.', color: 0x3498DB });
      await message.reply(reply);
      return false;
    }

    if (command.ownerOnly && !isOwner) {
      this._logDebug(debugInfo, 'Command blocked: Owner only');
      await this._sendCv2Error(message, 'Permission Denied', 'This is an owner-only command.');
      return false;
    }

    if (command.management && !db.isManager(userId)) {
      this._logDebug(debugInfo, 'Command blocked: No management perms');
      await this._sendCv2Error(message, 'Permission Denied', 'Management permissions are required for this command.');
      return false;
    }

    if (!(await this._checkPremiumRequirements(message, command, debugInfo))) {
      return false;
    }

    if (!canUseCommand(message.member, command)) {
      this._logDebug(debugInfo, 'Command blocked: Insufficient user permissions');
      await this._sendCv2Error(message, 'Insufficient Permissions', 'You do not have the required permissions to use this command.');
      return false;
    }

    if (command.permissions?.length > 0) {
      const missingPermissions = getMissingBotPermissions(message.channel, command.permissions);
      if (missingPermissions.length > 0) {
        this._logDebug(debugInfo, `Command blocked: Missing bot perms: ${missingPermissions.join(', ')}`);
        await this._sendCv2Error(message, 'Missing Bot Permissions', `I am missing the following permissions: \`${missingPermissions.join(', ')}\``);
        return false;
      }
    }

    const cooldownTime = cooldownManager.checkCooldown(userId, command);
    if (cooldownTime) {
      this._logDebug(debugInfo, `Command blocked: Cooldown ${cooldownTime}s`);
      await this._sendCv2Error(message, 'Cooldown Active', `Please wait **${cooldownTime}** more second(s) before using this command.`);
      return false;
    }

    if (command.voiceRequired && !message.member.voice.channel) {
      this._logDebug(debugInfo, 'Command blocked: Not in voice channel');
      await this._sendCv2Error(message, 'Voice Channel Required', 'You must be in a voice channel to use this command.');
      return false;
    }

    if (command.sameVoiceRequired && message.guild.members.me.voice.channel) {
      if (!inSameVoiceChannel(message.member, message.guild.members.me)) {
        this._logDebug(debugInfo, 'Command blocked: Different voice channels');
        const voiceChannelName = message.guild.members.me.voice.channel.name;
        await this._sendCv2Error(message, 'Different Voice Channel', `You must be in the same voice channel as me: **${voiceChannelName}**.`);
        return false;
      }
    }

    if (command.playerRequired || command.playingRequired) {
      const player = this.musicManager.getPlayer(message.guild.id);
      
      const noPlayerReply = this._createCv2Reply({
        description: `**<:discotoolsxyzicon87:1347122685267939348> No music player active**\n-# Use ${guildPrefix}play <song>`,
        color: 0xFEE75C
      });
      const notPlayingReply = this._createCv2Reply({
        description: `**<:discotoolsxyzicon87:1347122685267939348> No music playing**\n-# Use ${guildPrefix}play <song>`,
        color: 0xFEE75C
      });

      if (command.playerRequired && !player) {
        this._logDebug(debugInfo, 'Command blocked: No player');
        await message.reply(noPlayerReply);
        return false;
      }

      if (command.playingRequired && (!player || !player.queue.current)) {
        this._logDebug(debugInfo, 'Command blocked: Nothing playing');
        await message.reply(notPlayingReply);
        return false;
      }
    }

    this._logDebug(debugInfo, 'All requirements passed');
    return true;
  }

  async _checkPremiumRequirements(message, command, debugInfo) {
    const userId = message.author.id;
    const guildId = message.guild.id;

    const premiumTypes = [
      { flag: 'userPrem', type: 'user', title: 'User Premium' },
      { flag: 'guildPrem', type: 'guild', title: 'Guild Premium' },
      { flag: 'anyPrem', type: 'any', title: 'Premium' }
    ];

    for (const { flag, type, title } of premiumTypes) {
      if (command[flag] && !hasPremiumAccess(userId, guildId, type)) {
        this._logDebug(debugInfo, `Command blocked: No ${title}`);
        
        const button = new ButtonBuilder().setLabel('Support Server').setURL('https://discord.gg/XYwwyDKhec').setStyle(ButtonStyle.Link);
        const row = new ActionRowBuilder().addComponents(button);

        const reply = this._createCv2Reply({
            title: `<:discotoolsxyzicon87:1347122685267939348> ${title} Required`,
            description: `**This command requires ${title}!**\n\n💎 Contact the bot owner for access`,
            color: 0xED4245,
            actionRows: [row]
        });
        
        await message.reply(reply);
        return false;
      }
    }
    return true;
  }

  async _executeCommand(message, command, args, options, isPrefixCommand, flags, debugInfo) {
    const executionStart = performance.now();
    
    try {
      cooldownManager.setCooldown(message.author.id, command);
      this._logDebug(debugInfo, 'Executing command');
      
      await command.execute({
        message,
        args,
        options,
        client: this.client,
        musicManager: this.musicManager,
        prefix: db.getPrefix(message.guild.id),
        isNoPrefix: !isPrefixCommand,
        flags
      });
      
      const executionTime = performance.now() - executionStart;
      this._logDebug(debugInfo, `Command executed successfully in ${executionTime.toFixed(2)}ms`);
      
      if (flags.has('timing')) {
        const reply = this._createCv2Reply({ description: `⏱️ Execution time: **${executionTime.toFixed(2)}ms**` });
        await message.channel.send(reply);
      }

      if (debugInfo && (flags.has('verbose') || flags.has('debug'))) {
        await this._sendDebugInfo(message, debugInfo, executionTime);
      }
      
      if (!flags.has('silent')) {
        await this._logCommandUsage(message, command.name, args.join(' '));
      }
      
      return true;
    } catch (error) {
      const executionTime = performance.now() - executionStart;
      this._logDebug(debugInfo, `Command failed after ${executionTime.toFixed(2)}ms: ${error.message}`);
      
      logger.error('MessageProcessor', `Error executing command ${command.name}`, error);
      await this._logErrorToChannel(this.client, error);
      
      if (flags.has('trace')) {
        const traceReply = this._createCv2Reply({
            title: '🔍 Command Trace',
            description: `\`\`\`\n${error.stack || error.message}\n\`\`\``,
            color: 0xE74C3C
        });
        await message.channel.send(traceReply);
      } else {
        await this._sendCv2Error(message, 'Command Error', `An unexpected error occurred while running the \`${command.name}\` command.`);
      }
      
      return true;
    }
  }

  _logDebug(debugInfo, message) {
    if (debugInfo) {
      debugInfo.steps.push({
        timestamp: performance.now() - debugInfo.startTime,
        message
      });
    }
  }

  async _sendDebugInfo(message, debugInfo, executionTime) {
    const totalTime = performance.now() - debugInfo.startTime;
    const steps = debugInfo.steps.map(step => 
      `${step.timestamp.toFixed(2)}ms: ${step.message}`
    ).join('\n');

    const debugDescription = `
**Command**: ${debugInfo.commandName}
**Total Time**: ${totalTime.toFixed(2)}ms
**Execution Time**: ${executionTime.toFixed(2)}ms

**Steps**
\`\`\`
${steps}
\`\`\`
    `;

    const debugReply = this._createCv2Reply({
        title: '🐛 Debug Information',
        description: debugDescription,
        color: 0x3498DB
    });

    await message.channel.send(debugReply);
  }

  async _logCommandUsage(message, commandName, value) {
    try {
      const loggingChannel = await this.client.channels.fetch('1380533796008497312');
      if (!loggingChannel?.isTextBased()) return;

      const logDescription = `
**User**: ${message.author.tag} (\`${message.author.id}\`)
**Command**: \`${commandName}\`
**Args / Value**: \`${value || 'None'}\`
**Server**: ${message.guild.name} (\`${message.guild.id}\`)
      `;

      const logReply = this._createCv2Reply({
        title: '🔍 Command Used',
        description: logDescription,
        color: 0x5865F2
      });

      await loggingChannel.send(logReply);
    } catch (error) {
      logger.error('MessageProcessor', 'Error logging command usage', error);
    }
  }

  async _logErrorToChannel(client, error) {
    const timestamp = new Date().toISOString();
    const errorMessage = `\`\`\`[${timestamp}]\n${error.stack || error.message}\`\`\``;

    try {
      const channel = await client.channels.fetch("1380538525048508417");
      if (channel?.isTextBased()) {
        const errorReply = this._createCv2Reply({
            title: '❌ Logged Error',
            description: errorMessage.substring(0, 4000),
            color: 0x992D22
        });
        await channel.send(errorReply);
      }
    } catch (fetchError) {
      logger.error('MessageProcessor', 'Failed to send error to Discord', fetchError);
    }
  }
}