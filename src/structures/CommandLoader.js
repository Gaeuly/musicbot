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
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Responsible for loading command files from the filesystem
 */
export class CommandLoader {
  constructor() {
    this.commands = new Map();
    this.aliases = new Map();
    this.categories = new Map();
    this.commandPaths = new Map();
  }

  /**
   * Load commands from directory
   * @param {string} [dirPath='../commands'] - Directory path
   * @returns {Promise<Map>} - Map of loaded commands
   */
  async loadCommands(dirPath = '../commands') {
    try {
      // Clear existing collections
      this.commands.clear();
      this.aliases.clear();
      this.categories.clear();
      this.commandPaths.clear();
      
      const commandsPath = path.join(__dirname, dirPath);
      // Get category directories
      const categoryDirs = fs.readdirSync(commandsPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      for (const category of categoryDirs) {
        const categoryPath = path.join(commandsPath, category);
        const commandFiles = fs.readdirSync(categoryPath)
          .filter(file => file.endsWith('.js'));

        this.categories.set(category, []);

        for (const file of commandFiles) {
          const filePath = path.join(categoryPath, file);
          const command = await this._loadCommandFile(filePath, category);
          
          if (command) {
            // Add to category
            this.categories.get(category).push(command);
          }
        }
      }

      logger.success('CommandLoader', `Loaded ${this.commands.size} commands in ${this.categories.size} categories`);
      return this.commands;
    } catch (error) {
      logger.error('CommandLoader', 'Failed to load commands', error);
      return this.commands;
    }
  }

  /**
   * Load a single command file
   * @param {string} filePath - Path to command file
   * @param {string} category - Command category
   * @returns {Object|null} - Loaded command or null
   */
  async _loadCommandFile(filePath, category) {
    try {
      // Force a fresh import with a timestamp query param
      const timestamp = Date.now();
      const modulePath = `file://${filePath}?update=${timestamp}`;
      
      
      // Import the module
      const commandModule = await import(modulePath);
      
      // Skip if no default export
      if (!commandModule || !commandModule.default) {
        logger.warn('CommandLoader', `Invalid command file structure: ${path.basename(filePath)}`);
        return null;
      }

      const command = commandModule.default;
      command.category = category;
      
      // Store the full file path for reloading
      this.commandPaths.set(command.name, filePath);
      
      // Register command
      this.commands.set(command.name, command);
      
      // Register aliases
      command.aliases.forEach(alias => {
        this.aliases.set(alias, command.name);
      });

      logger.info('CommandLoader', `Loaded command: ${command.name}`);
      return command;
    } catch (error) {
      logger.error('CommandLoader', `Failed to load command: ${path.basename(filePath)}`, error);
      return null;
    }
  }

  /**
   * Reload a specific command
   * @param {string} commandName - Command name to reload
   * @returns {Object} - Status of reload operation
   */
  async reloadCommand(commandName) {
    try {
      // Check if command exists
      if (!this.commands.has(commandName)) {
        return {
          success: false,
          message: `Command '${commandName}' not found`
        };
      }

      const command = this.commands.get(commandName);
      const filePath = this.commandPaths.get(commandName);
      const category = command.category;

      // Remove command and aliases
      this.commands.delete(commandName);
      for (const [alias, cmd] of this.aliases.entries()) {
        if (cmd === commandName) {
          this.aliases.delete(alias);
        }
      }

      // Remove from category
      const categoryCommands = this.categories.get(category);
      if (categoryCommands) {
        const index = categoryCommands.findIndex(cmd => cmd.name === commandName);
        if (index !== -1) {
          categoryCommands.splice(index, 1);
        }
      }

      // Reload the command
      const reloadedCommand = await this._loadCommandFile(filePath, category);
      
      if (!reloadedCommand) {
        return {
          success: false,
          message: `Failed to reload command '${commandName}'`
        };
      }

      return {
        success: true,
        message: `Successfully reloaded command '${commandName}'`
      };
    } catch (error) {
      logger.error('CommandLoader', `Error reloading command '${commandName}'`, error);
      return {
        success: false,
        message: `Error reloading command '${commandName}': ${error.message}`
      };
    }
  }

  /**
   * Reload all commands
   * @returns {Object} - Status of reload operation
   */
  async reloadAllCommands() {
    try {
      const commandNames = Array.from(this.commands.keys());
      const total = commandNames.length;
      let success = 0;
      let failed = 0;
      const details = [];

      // Save paths before clearing
      const commandPaths = new Map(this.commandPaths);
      
      // Load commands again from scratch
      await this.loadCommands();
      
      // Calculate stats
      for (const [commandName, path] of commandPaths) {
        const isSuccess = this.commands.has(commandName);
        if (isSuccess) {
          success++;
        } else {
          failed++;
        }
        
        details.push({
          name: commandName,
          success: isSuccess,
          error: isSuccess ? null : 'Failed to reload'
        });
      }
      
      logger.success('CommandLoader', `Reloaded ${success}/${total} commands`);
      
      return {
        total,
        success,
        failed,
        details
      };
    } catch (error) {
      logger.error('CommandLoader', 'Failed to reload commands', error);
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
}
