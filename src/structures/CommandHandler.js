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
import { logger } from '../utils/logger.js';
import { CommandLoader } from './CommandLoader.js';
import { MessageProcessor } from './MessageProcessor.js';

/**
 * Main command handler that orchestrates loading and message processing
 */
export class CommandHandler {
  /**
   * Create a new CommandHandler
   * @param {object} client - Discord client
   * @param {object} musicManager - MusicManager instance
   */
  constructor(client, musicManager) {
    this.client = client;
    this.musicManager = musicManager;
    
    // Initialize components
    this.commandLoader = new CommandLoader();
    this.messageProcessor = new MessageProcessor(client, musicManager, this.commandLoader);
    
    // Expose command collections from loader
    this.commands = this.commandLoader.commands;
    this.aliases = this.commandLoader.aliases;
    this.categories = this.commandLoader.categories;
    this.commandPaths = this.commandLoader.commandPaths;
  }

  /**
   * Load commands from directory
   * @param {string} [dirPath='../commands'] - Directory path
   * @returns {Promise<Map>} - Map of loaded commands
   */
  async loadCommands(dirPath = '../commands') {
    return await this.commandLoader.loadCommands(dirPath);
  }

  /**
   * Handle message for command execution
   * @param {object} message - Discord message object
   * @returns {Promise<boolean>} - Whether a command was executed
   */
  async handleMessage(message) {
    return await this.messageProcessor.processMessage(message);
  }

  /**
   * Reload all commands
   * @returns {Promise<object>} - Reload status
   */
  async reloadCommands() {
    try {
      logger.info('CommandHandler', 'Reloading all commands...');
      return await this.commandLoader.reloadAllCommands();
    } catch (error) {
      logger.error('CommandHandler', 'Failed to reload commands', error);
      return {
        total: this.commands.size,
        success: 0,
        failed: this.commands.size,
        details: [{
          name: 'commands',
          success: false,
          error: error.message
        }]
      };
    }
  }

  /**
   * Reload a specific command
   * @param {string} commandName - Command name to reload
   * @returns {Promise<object>} - Reload status
   */
  async reloadCommand(commandName) {
    try {
      logger.info('CommandHandler', `Reloading command: ${commandName}`);
      return await this.commandLoader.reloadCommand(commandName);
    } catch (error) {
      logger.error('CommandHandler', `Failed to reload command: ${commandName}`, error);
      return {
        success: false,
        message: `Error reloading command '${commandName}': ${error.message}`
      };
    }
  }

  /**
   * Get loaded command statistics
   * @returns {object} - Command statistics
   */
  getStats() {
    return {
      totalCommands: this.commands.size,
      totalAliases: this.aliases.size,
      totalCategories: this.categories.size,
      categoryCounts: Object.fromEntries(
        Array.from(this.categories.entries()).map(
          ([category, commands]) => [category, commands.length]
        )
      )
    };
  }
}
