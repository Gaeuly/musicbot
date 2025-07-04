/**
 * Muffin STUDIO - Bre4d777 & prayag 
 * https://discord.gg/TRPqseUq32
 * give credits or ill touch you in your dreams
 */

/**
 * Base Command class for structuring commands (for both message and slash)
 */
export class Command {
  /**
   * Create a new Command
   * @param {object} options - Command options
   * @param {import('discord.js').SlashCommandBuilder} [options.data] - Slash command data builder (required for slash commands)
   */
  constructor(options = {}) {
    this.name = options.name;
    this.description = options.description || 'No description provided';
    this.usage = options.usage || this.name;
    this.aliases = options.aliases || [];
    this.category = options.category || 'Miscellaneous';
    this.cooldown = options.cooldown || 3;
    this.permissions = options.permissions || [];
    this.userPermissions = options.userPermissions || [];
    this.ownerOnly = options.ownerOnly || false;
    this.management = options.management || false;
    this.voiceRequired = options.voiceRequired || false;
    this.sameVoiceRequired = options.sameVoiceRequired || false;
    this.playerRequired = options.playerRequired || false;
    this.playingRequired = options.playingRequired || false;
    this.maintenance = options.maintenance || false;
    this.examples = options.examples || [];

    this.messageArgs = options.messageArgs || [];

    this.userPrem = options.userPrem || false;
    this.guildPrem = options.guildPrem || false;
    this.anyPrem = options.anyPrem || false;

    this.data = options.data;
  }

  /**
   * Execute the command
   * @param {object} context - Command execution context
   * @param {import('discord.js').Client} context.client - The Discord client
   * @param {import('discord.js').Message} [context.message] - The message object (if triggered by message)
   * @param {import('discord.js').ChatInputCommandInteraction} [context.interaction] - The interaction object (if triggered by slash command)
   * @param {string[]} [context.args] - Command arguments (for message commands)
   * @param {import('./MessageCommandOptionResolver.js').MessageCommandOptionResolver | import('discord.js').CommandInteractionOptionResolver} [context.options] - Command options
   * @param {import('../managers/MusicManager.js').MusicManager} context.musicManager - The Music Manager instance
   * @param {string} [context.prefix] - The prefix used (for message commands)
   * @param {boolean} [context.isNoPrefix] - If the message command was used without a prefix (special user)
   * @returns {Promise<*>} - Command result
   */
  async execute(context) {
    throw new Error(`Command ${this.name || this.data?.name} doesn't provide an execute method!`);
  }

  async reply(context, options, edit = false) {
    if (context.interaction) {
      if (edit) {
         if (context.interaction.deferred || context.interaction.replied) {
              return await context.interaction.editReply(options);
         } else {
               console.warn("Attempted to edit an interaction that wasn't deferred or replied to.");
              return await context.interaction.reply(options);
         }
      } else {
          if (context.interaction.replied || context.interaction.deferred) {
              return await context.interaction.followUp(options);
          } else {
              return await context.interaction.reply(options);
          }
      }
    } else if (context.message) {
      return await context.message.reply(options);
    } else {
      console.error("Attempted to reply with no interaction or message context.");
    }
  }

  async deferReply(context, options) {
      if (context.interaction && !context.interaction.deferred && !context.interaction.replied) {
          return await context.interaction.deferReply(options);
      }
  }

    matches(input, prefix) {
        if (!this.name) return false;
        const commandName = input.slice(prefix.length).trim().split(/\s+/)[0].toLowerCase();
        return this.name === commandName || this.aliases.includes(commandName);
  }
}