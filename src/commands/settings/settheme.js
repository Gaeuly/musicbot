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
import { themeManager } from '../../managers/ThemeManager.js';
import { PermissionFlagsBits } from 'discord.js';
import { logger } from '../../utils/logger.js';

class SetThemeCommand extends Command {
  constructor() {
    super({
      name: 'settheme',
      description: 'Set the NowPlaying card theme for this server.',
      usage: 'settheme <theme_name>',
      aliases: ['themeset', 'cardtheme'],
      category: 'settings', // Or 'music' if you prefer
      cooldown: 5,
      guildPrem: true,
      requiredPermissions: [PermissionFlagsBits.ManageGuild],
      examples: [
        'settheme default', 
        'settheme pixel'
      ],
    });
  }

  async execute({ message, args, client }) {
    const { guild, member } = message;

    if (!guild) {
        // Should not happen if ManageGuild permission is checked, but good practice
        return message.reply({ embeds: [embedManager.error("This command can only be used in a server.")] });
    }
    
    if (!member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply({
        embeds: [embedManager.error("You need the **Manage Server** permission to use this command.")],
      });
    }


    const availableThemes = themeManager.getAvailableThemes();

    if (!args.length) {
      const reply = embedManager.info(
        'Set NowPlaying Theme',
        `Choose a theme for the NowPlaying card.\nUsage: \`${this.usage}\`\nAvailable themes: \`${availableThemes.join('`, `')}\``
      );
      return message.reply({ embeds: [reply] });
    }

    const themeName = args[0].toLowerCase();

    if (!availableThemes.includes(themeName)) {
      const reply = embedManager.error(
        'Invalid Theme',
        `"${themeName}" is not a valid theme. Available themes are: \`${availableThemes.join('`, `')}\`.`
      );
      return message.reply({ embeds: [reply] });
    }

    try {
      const success = await themeManager.setGuildTheme(guild.id, themeName);
      if (success) {
        const reply = embedManager.success(
          'Theme Updated',
          `The NowPlaying card theme for this server has been set to \`${themeName}\`.`
        );
        return message.reply({ embeds: [reply] });
      } else {
        // This case might occur if themeManager.setGuildTheme returns false without throwing an error
        // (e.g., validation failed internally but was handled gracefully)
        const errorReply = embedManager.error(
            'Theme Not Set',
            `Could not set the theme to \`${themeName}\`. It might be an invalid option.`
        );
        return message.reply({ embeds: [errorReply] });
      }
    } catch (error) {
      logger.error('SetThemeCommand', `Error setting theme for guild ${guild.id} to ${themeName}:`, error);
      const reply = embedManager.error(
        'Error Setting Theme',
        'An unexpected error occurred while trying to set the theme. Please try again later.'
      );
      return message.reply({ embeds: [reply] });
    }
  }
}

export default new SetThemeCommand();
