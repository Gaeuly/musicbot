/**
 * Muffin STUDIO - Bre4d777 & prayag 
 * https://discord.gg/TRPqseUq32
 * give credits or ill touch you in your dreams
 */

import { Database } from './Database.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';

export class Pong extends Database {
  constructor() {
    super(config.database.pong || 'database/pong.db');
    this.initTables();
  }

  initTables() {
    try {
      this.exec(`
        CREATE TABLE IF NOT EXISTS ping_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          guild_id TEXT,
          user_id TEXT,
          channel_id TEXT,
          message_latency REAL NOT NULL,
          api_latency REAL NOT NULL,
          database_latency REAL NOT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      this.exec(`
        CREATE TABLE IF NOT EXISTS ping_stats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          avg_message_latency REAL,
          avg_api_latency REAL,
          avg_database_latency REAL,
          min_message_latency REAL,
          max_message_latency REAL,
          min_api_latency REAL,
          max_api_latency REAL,
          min_database_latency REAL,
          max_database_latency REAL,
          total_pings INTEGER,
          date_recorded DATE DEFAULT CURRENT_DATE
        )
      `);

      const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_ping_guild ON ping_logs(guild_id)',
        'CREATE INDEX IF NOT EXISTS idx_ping_user ON ping_logs(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_ping_timestamp ON ping_logs(timestamp)'
      ];

      indexes.forEach(indexSQL => {
        try {
          this.exec(indexSQL);
        } catch (indexError) {
          logger.warn('PongDatabase', 'Failed to create index', indexError);
        }
      });

      logger.success('PongDatabase', 'Pong tables initialized');
    } catch (error) {
      logger.error('PongDatabase', 'Failed to initialize pong tables', error);
      throw error;
    }
  }

  async measureDatabasePing() {
    const operations = [
      () => this.get('SELECT 1'),
      () => this.get('SELECT COUNT(*) FROM ping_logs'),
      () => this.get('SELECT sqlite_version()'),
      () => this.all('SELECT * FROM ping_logs ORDER BY id DESC LIMIT 1')
    ];

    const times = [];
    
    for (const operation of operations) {
      const start = performance.now();
      try {
        await operation();
        times.push(performance.now() - start);
      } catch (error) {
        times.push(999); // High latency for failed operations
      }
    }

    return {
      avg: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      operations: times.length
    };
  }

  async logPing(guildId, userId, channelId, messageLatency, apiLatency, databaseLatency) {
    try {
      this.exec(`
        INSERT INTO ping_logs (guild_id, user_id, channel_id, message_latency, api_latency, database_latency)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [guildId, userId, channelId, messageLatency, apiLatency, databaseLatency]);
    } catch (error) {
      logger.error('PongDatabase', 'Failed to log ping', error);
    }
  }

  async getPingStats(guildId = null, limit = 100) {
    try {
      const query = guildId 
        ? 'SELECT * FROM ping_logs WHERE guild_id = ? ORDER BY timestamp DESC LIMIT ?'
        : 'SELECT * FROM ping_logs ORDER BY timestamp DESC LIMIT ?';
      
      const params = guildId ? [guildId, limit] : [limit];
      return this.all(query, params);
    } catch (error) {
      logger.error('PongDatabase', 'Failed to get ping stats', error);
      return [];
    }
  }

  async getAverageLatencies(guildId = null, hours = 24) {
    try {
      const query = guildId
        ? `SELECT 
             AVG(message_latency) as avg_message,
             AVG(api_latency) as avg_api,
             AVG(database_latency) as avg_database,
             MIN(message_latency) as min_message,
             MAX(message_latency) as max_message,
             COUNT(*) as total_pings
           FROM ping_logs 
           WHERE guild_id = ? AND timestamp >= datetime('now', '-${hours} hours')`
        : `SELECT 
             AVG(message_latency) as avg_message,
             AVG(api_latency) as avg_api,
             AVG(database_latency) as avg_database,
             MIN(message_latency) as min_message,
             MAX(message_latency) as max_message,
             COUNT(*) as total_pings
           FROM ping_logs 
           WHERE timestamp >= datetime('now', '-${hours} hours')`;

      const params = guildId ? [guildId] : [];
      const result = this.get(query, params);
      
      return {
        avg_message: parseFloat(result?.avg_message || 0).toFixed(2),
        avg_api: parseFloat(result?.avg_api || 0).toFixed(2),
        avg_database: parseFloat(result?.avg_database || 0).toFixed(2),
        min_message: parseFloat(result?.min_message || 0).toFixed(2),
        max_message: parseFloat(result?.max_message || 0).toFixed(2),
        total_pings: result?.total_pings || 0
      };
    } catch (error) {
      logger.error('PongDatabase', 'Failed to get average latencies', error);
      return {
        avg_message: '0.00',
        avg_api: '0.00',
        avg_database: '0.00',
        min_message: '0.00',
        max_message: '0.00',
        total_pings: 0
      };
    }
  }

  async cleanup(daysOld = 30) {
    try {
      const deleted = this.exec(
        'DELETE FROM ping_logs WHERE timestamp < datetime("now", "-' + daysOld + ' days")'
      );
      
      this.exec('VACUUM');
      logger.success('PongDatabase', `Cleaned up ${deleted.changes} old ping records`);
      return deleted.changes;
    } catch (error) {
      logger.error('PongDatabase', 'Failed to cleanup old ping data', error);
      return 0;
    }
  }

  getDatabaseInfo() {
    try {
      const stats = this.get('SELECT COUNT(*) as total_pings FROM ping_logs');
      const recentStats = this.get(`
        SELECT COUNT(*) as recent_pings 
        FROM ping_logs 
        WHERE timestamp >= datetime('now', '-24 hours')
      `);

      return {
        total_pings: stats?.total_pings || 0,
        recent_pings: recentStats?.recent_pings || 0,
        database_path: this.databasePath || config.database.pong || 'database/pong.db'
      };
    } catch (error) {
      logger.error('PongDatabase', 'Failed to get database info', error);
      return {
        total_pings: 0,
        recent_pings: 0,
        database_path: 'unknown'
      };
    }
  }
}