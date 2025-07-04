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
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

export class Guild extends Database {
  constructor() {
    super(config.database.guild);
    this.initTable();
  }

  initTable() {
    this.exec(`
      CREATE TABLE IF NOT EXISTS guilds (
        id TEXT PRIMARY KEY,
        prefix TEXT DEFAULT '${config.prefix}',
        volume INTEGER DEFAULT 100,
        auto_play BOOLEAN DEFAULT FALSE,
        auto_leave BOOLEAN DEFAULT TRUE,
        auto_leave_timeout INTEGER DEFAULT 60000,
        stay_247 BOOLEAN DEFAULT FALSE,
        twenty_four_seven_voice_id TEXT DEFAULT NULL,
        twenty_four_seven_text_id TEXT DEFAULT NULL,
        request_system BOOLEAN DEFAULT FALSE,
        blacklisted BOOLEAN DEFAULT FALSE,
        blacklist_reason TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    try {
      const tableInfo = this.all("PRAGMA table_info(guilds)");
      
      const requiredColumns = [
        { name: 'stay_247', type: 'BOOLEAN', default: 'FALSE' },
        { name: 'twenty_four_seven_voice_id', type: 'TEXT', default: 'NULL' },
        { name: 'twenty_four_seven_text_id', type: 'TEXT', default: 'NULL' },
        { name: 'request_system', type: 'BOOLEAN', default: 'FALSE' }
      ];

      for (const column of requiredColumns) {
        const hasColumn = tableInfo.some(col => col.name === column.name);
        if (!hasColumn) {
          this.exec(`ALTER TABLE guilds ADD COLUMN ${column.name} ${column.type} DEFAULT ${column.default}`);
        }
      }
    } catch (error) {
      logger.error('GuildDatabase', 'Error adding columns to guilds table', error);
    }
  }

  getGuild(guildId) {
    return this.get('SELECT * FROM guilds WHERE id = ?', [guildId]);
  }

  ensureGuild(guildId) {
    const guild = this.getGuild(guildId);
    if (!guild) {
      this.exec('INSERT INTO guilds (id) VALUES (?)', [guildId]);
      return this.getGuild(guildId);
    }
    return guild;
  }

  getPrefix(guildId) {
    const guild = this.ensureGuild(guildId);
    return guild.prefix;
  }

  setPrefix(guildId, prefix) {
    this.ensureGuild(guildId);
    return this.exec(
      'UPDATE guilds SET prefix = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [prefix, guildId]
    );
  }

  getVolume(guildId) {
    const guild = this.ensureGuild(guildId);
    return guild.volume;
  }

  setVolume(guildId, volume) {
    this.ensureGuild(guildId);
    return this.exec(
      'UPDATE guilds SET volume = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [volume, guildId]
    );
  }

  is247Enabled(guildId) {
    const guild = this.ensureGuild(guildId);
    return guild.stay_247 === 1;
  }

  get247Channels(guildId) {
    const guild = this.ensureGuild(guildId);
    
    if (!guild.stay_247 || !guild.twenty_four_seven_voice_id) {
      return null;
    }
    
    return {
      voiceChannelId: guild.twenty_four_seven_voice_id,
      textChannelId: guild.twenty_four_seven_text_id
    };
  }

  set247Mode(guildId, enabled, voiceChannelId = null, textChannelId = null) {
    this.ensureGuild(guildId);
    return this.exec(
      `UPDATE guilds SET 
        stay_247 = ?, 
        twenty_four_seven_voice_id = ?, 
        twenty_four_seven_text_id = ?, 
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?`,
      [enabled ? 1 : 0, voiceChannelId, textChannelId, guildId]
    );
  }

  getAll247Guilds() {
    return this.all('SELECT * FROM guilds WHERE stay_247 = 1 AND twenty_four_seven_voice_id IS NOT NULL');
  }

  isRequestSystemEnabled(guildId) {
    const guild = this.ensureGuild(guildId);
    return guild.request_system === 1;
  }

  setRequestSystem(guildId, enabled, textChannelId = null) {
    this.ensureGuild(guildId);
    return this.exec(
      `UPDATE guilds SET 
        request_system = ?, 
        twenty_four_seven_text_id = ?, 
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?`,
      [enabled ? 1 : 0, textChannelId, guildId]
    );
  }

  getRequestChannel(guildId) {
    const guild = this.ensureGuild(guildId);
    
    if (!guild.request_system || !guild.twenty_four_seven_text_id) {
      return null;
    }
    
    return guild.twenty_four_seven_text_id;
  }

  getAllRequestGuilds() {
    return this.all('SELECT * FROM guilds WHERE request_system = 1 AND twenty_four_seven_text_id IS NOT NULL');
  }

  getAllGuilds() {
    return this.all('SELECT * FROM guilds');
  }

  updateSettings(guildId, settings) {
    this.ensureGuild(guildId);
    const keys = Object.keys(settings).filter(key =>
      ['prefix', 'volume', 'auto_play', 'auto_leave', 'auto_leave_timeout', 
       'stay_247', 'twenty_four_seven_voice_id', 'twenty_four_seven_text_id', 'request_system'].includes(key)
    );

    if (keys.length === 0) return null;

    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const values = keys.map(key => settings[key]);
    values.push(guildId);

    return this.exec(
      `UPDATE guilds SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
  }

  blacklistGuild(guildId, reason = 'No reason provided') {
    this.ensureGuild(guildId);
    return this.exec(
      'UPDATE guilds SET blacklisted = 1, blacklist_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [reason, guildId]
    );
  }

  unblacklistGuild(guildId) {
    this.ensureGuild(guildId);
    return this.exec(
      'UPDATE guilds SET blacklisted = 0, blacklist_reason = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [guildId]
    );
  }

  isBlacklisted(guildId) {
    const guild = this.getGuild(guildId);
    if (!guild || !guild.blacklisted) return false;

    return {
      blacklisted: true,
      reason: guild.blacklist_reason || 'No reason provided'
    };
  }

  getAllBlacklistedGuilds() {
    return this.all('SELECT * FROM guilds WHERE blacklisted = 1');
  }
}