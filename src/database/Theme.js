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
import { Database } from './Database.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';

const DEFAULT_THEME = 'default';

/**
 * Theme Database for storing guild-specific NowPlaying card themes
 */
export class Theme extends Database {
  /**
   * Create a new ThemeDatabase instance
   */
  constructor() {
    // Assumes config.database.theme is defined in your config file
    // e.g., theme: 'databases/theme_settings.sqlite'
    // Fallback to 'databases/theme.db' if not defined
    super(config.database.theme || 'database/theme.db');
    this.initTable();
  }

  /**
   * Initialize the guild_themes table
   */
  initTable() {
    try {
      this.exec(`
        CREATE TABLE IF NOT EXISTS guild_themes (
          guild_id TEXT PRIMARY KEY,
          theme_name TEXT NOT NULL DEFAULT '${DEFAULT_THEME}',
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      logger.success('ThemeDatabase', 'guild_themes table initialized successfully.');
    } catch (error) {
      logger.error('ThemeDatabase', 'Failed to initialize guild_themes table.', error);
      throw error;
    }
  }

  /**
   * Ensures a guild has a theme entry in the database.
   * @param {string} guildId - The guild ID.
   * @returns {object} Guild theme data.
   */
  ensureTheme(guildId) {
    let guildTheme = this.get('SELECT * FROM guild_themes WHERE guild_id = ?', [guildId]);
    if (!guildTheme) {
      this.exec('INSERT OR IGNORE INTO guild_themes (guild_id, theme_name) VALUES (?, ?)', [guildId, DEFAULT_THEME]);
      guildTheme = this.get('SELECT * FROM guild_themes WHERE guild_id = ?', [guildId]);
    }
    return guildTheme;
  }

  /**
   * Get a guild's selected theme.
   * @param {string} guildId - The guild ID.
   * @returns {string} - The theme name (e.g., 'default', 'pixel').
   */
  getTheme(guildId) {
    const guildTheme = this.ensureTheme(guildId);
    return guildTheme.theme_name;
  }

  /**
   * Set a guild's theme.
   * @param {string} guildId - The guild ID.
   * @param {string} themeName - The new theme name.
   * @returns {object} - Statement result.
   */
  setTheme(guildId, themeName) {
    this.ensureTheme(guildId); // Ensure entry exists before update
    return this.exec(
      'UPDATE guild_themes SET theme_name = ?, updated_at = CURRENT_TIMESTAMP WHERE guild_id = ?',
      [themeName, guildId]
    );
  }
}
