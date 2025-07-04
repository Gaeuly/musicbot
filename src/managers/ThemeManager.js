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
import { db } from '../database/DatabaseManager.js';
import { logger } from '../utils/logger.js';

// Import default cards
import { MusicCard as DefaultMusicCard } from '../structures/canvas/MusicCard.js';
import { QueueCard as DefaultQueueCard } from '../structures/canvas/QueueCard.js';
import { SearchCard as DefaultSearchCard } from '../structures/canvas/SearchCard.js';
import { HelpCanvas as DefaultHelpCanvas } from '../structures/canvas/help.js';

// Import pixel-themed cards
import { MusicCard as PixelMusicCard } from '../structures/canvas/MusicCardpixel.js';
import { QueueCard as PixelQueueCard } from '../structures/canvas/QueueCardpixel.js';
import { SearchCard as PixelSearchCard } from '../structures/canvas/SearchCardpixel.js';
import { HelpCanvas as PixelHelpCanvas } from '../structures/canvas/helppixel.js';


class ThemeManager {
  constructor() {
    this.themes = {
      default: {
        music: DefaultMusicCard,
        queue: DefaultQueueCard,
        search: DefaultSearchCard,
        help: DefaultHelpCanvas,
      },
      pixel: {
        music: PixelMusicCard,
        queue: PixelQueueCard,
        search: PixelSearchCard,
        help: PixelHelpCanvas,
      }
      // Add more themes here, each with their respective card classes
      // e.g., 'neon': { music: NeonMusicCard, queue: NeonQueueCard, ... }
    };
    this.defaultThemeName = 'default';
  }

  async getGuildThemeName(guildId) {
    try {
      return db.getGuildTheme(guildId);
    } catch (error) {
      logger.error('ThemeManager', `Error fetching theme name for guild ${guildId}:`, error);
      return this.defaultThemeName;
    }
  }

  async setGuildTheme(guildId, themeName) {
    if (!this.themes[themeName]) {
      logger.warn('ThemeManager', `Attempted to set invalid theme "${themeName}" for guild ${guildId}.`);
      return false;
    }
    try {
      db.setGuildTheme(guildId, themeName);
      logger.info('ThemeManager', `Theme for guild ${guildId} set to "${themeName}".`);
      return true;
    } catch (error) {
      logger.error('ThemeManager', `Error setting theme for guild ${guildId}:`, error);
      return false;
    }
  }

  async _getCardClass(guildId, cardType) {
    const themeName = await this.getGuildThemeName(guildId);
    const themeSet = this.themes[themeName] || this.themes[this.defaultThemeName];
    const CardClass = themeSet ? themeSet[cardType] : null;

    if (!CardClass) {
      logger.error('ThemeManager', `No card class found for type "${cardType}" in theme "${themeName}" or default. Falling back to absolute default.`);
      // Absolute fallback to the 'default' theme's specific card type
      return this.themes[this.defaultThemeName][cardType];
    }
    return CardClass;
  }

  async getMusicCardClass(guildId) {
    return this._getCardClass(guildId, 'music');
  }

  async getQueueCardClass(guildId) {
    return this._getCardClass(guildId, 'queue');
  }

  async getSearchCardClass(guildId) {
    return this._getCardClass(guildId, 'search');
  }

  async getHelpCanvasClass(guildId) {
    return this._getCardClass(guildId, 'help');
  }

  getAvailableThemes() {
    return Object.keys(this.themes);
  }
}

export const themeManager = new ThemeManager();
