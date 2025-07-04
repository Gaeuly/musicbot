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

// Directory handling for ESM modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * EventHandler class for managing events
 */
export class EventHandler {
  /**
   * Create a new EventHandler
   * @param {object} client - Discord client
   * @param {object} musicManager - MusicManager instance
   */
  constructor(client, musicManager) {
    this.client = client;
    this.musicManager = musicManager;
    this.events = new Map();
    this.kazagumoEvents = new Map();
  }

  /**
   * Load all events
   * @returns {Promise<boolean>} - Whether events were loaded
   */
  async loadEvents() {
    try {
      // Load Discord client events
      await this.loadDiscordEvents();

      // Load Kazagumo events
      await this.loadKazagumoEvents();

      logger.success('EventHandler', `Loaded ${this.events.size} Discord events and ${this.kazagumoEvents.size} Kazagumo events`);
      return true;
    } catch (error) {
      logger.error('EventHandler', 'Failed to load events', error);
      return false;
    }
  }

  /**
   * Load Discord client events
   * @returns {Promise<boolean>} - Whether events were loaded
   */
  async loadDiscordEvents() {
    try {
      const eventsPath = path.join(__dirname, '../events/discord');
      const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

      for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);

        try {
          // Dynamic import for ESM modules
          const eventModule = await import(`file://${filePath}`);

          // Skip if no default export
          if (!eventModule || !eventModule.default) {
            logger.warn('EventHandler', `Invalid event file structure: ${file}`);
            continue;
          }

          const event = eventModule.default;

          if (event.once) {
            this.client.once(event.name, (...args) => event.execute(...args, this.client));
          } else {
            this.client.on(event.name, (...args) => event.execute(...args, this.client));
          }

          this.events.set(event.name, event);
          logger.info('EventHandler', `Loaded Discord event: ${event.name}`);
        } catch (error) {
          logger.error('EventHandler', `Failed to load Discord event: ${file}`, error);
        }
      }

      return true;
    } catch (error) {
      logger.error('EventHandler', 'Failed to load Discord events', error);
      return false;
    }
  }

  /**
   * Load Kazagumo events
   * @returns {Promise<boolean>} - Whether events were loaded
   */
  async loadKazagumoEvents() {
    try {
      const eventsPath = path.join(__dirname, '../events/kazagumo');
      const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

      // Create an empty handlers object
      const eventHandlers = {};

      for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);

        try {
          // Dynamic import for ESM modules
          const eventModule = await import(`file://${filePath}`);

          // Skip if no default export
          if (!eventModule || !eventModule.default) {
            logger.warn('EventHandler', `Invalid Kazagumo event file structure: ${file}`);
            continue;
          }

          const event = eventModule.default;

          // Add the handler to the handlers object
          eventHandlers[event.name] = (...args) => event.execute(...args, this.client);

          this.kazagumoEvents.set(event.name, event);
          logger.info('EventHandler', `Loaded Kazagumo event: ${event.name}`);
        } catch (error) {
          logger.error('EventHandler', `Failed to load Kazagumo event: ${file}`, error);
        }
      }

      // Register the event handlers with the MusicManager
      this.musicManager.registerEvents(eventHandlers);

      return true;
    } catch (error) {
      logger.error('EventHandler', 'Failed to load Kazagumo events', error);
      return false;
    }
  }

  /**
   * Reload all events
   * @returns {Promise<boolean>} - Whether events were reloaded
   */
  async reloadEvents() {
    try {
      // Remove all listeners
      this.events.forEach(event => {
        this.client.removeAllListeners(event.name);
      });

      // Clear event collections
      this.events.clear();
      this.kazagumoEvents.clear();

      // Reload events
      await this.loadEvents();

      logger.success('EventHandler', 'Reloaded all events');
      return true;
    } catch (error) {
      logger.error('EventHandler', 'Failed to reload events', error);
      return false;
    }
  }
}

// Greetings from deep within the code
// coded by bre4d
