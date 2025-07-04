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

/**
 * Management Database for storing bot managers
 */
export class Management extends Database {
  /**
   * Create a new Management Database instance
   */
  constructor() {
    super(config.database.management || 'database/management.db');
    this.initTables();
  }

  /**
   * Initialize the management tables
   */
  initTables() {
    // Managers table
    this.exec(`
      CREATE TABLE IF NOT EXISTS managers (
        user_id TEXT PRIMARY KEY,
        added_by TEXT NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reason TEXT DEFAULT 'No reason provided',
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    logger.success('ManagementDatabase', 'Management tables initialized successfully');
  }

  /**
   * Add a user to management
   * @param {string} userId - The user ID to add as manager
   * @param {string} addedBy - Who added them as manager
   * @param {string} reason - Reason for adding as manager
   * @returns {object} - Statement result
   */
  addManager(userId, addedBy, reason = 'No reason provided') {
    return this.exec(
      `INSERT OR REPLACE INTO managers 
       (user_id, added_by, reason, active, updated_at) 
       VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)`,
      [userId, addedBy, reason]
    );
  }

  /**
   * Remove a user from management
   * @param {string} userId - The user ID to remove from management
   * @returns {object} - Statement result
   */
  removeManager(userId) {
    return this.exec(
      'UPDATE managers SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [userId]
    );
  }

  /**
   * Check if user is a manager
   * @param {string} userId - The user ID
   * @returns {object|false} - Manager data or false if not a manager
   */
  isManager(userId) {
    const manager = this.get(
      'SELECT * FROM managers WHERE user_id = ? AND active = 1',
      [userId]
    );

    if (!manager) return false;

    return {
      userId: manager.user_id,
      addedBy: manager.added_by,
      addedAt: manager.added_at,
      reason: manager.reason
    };
  }

  /**
   * Get all active managers
   * @returns {object[]} - All active managers
   */
  getAllManagers() {
    return this.all(
      'SELECT * FROM managers WHERE active = 1 ORDER BY added_at DESC'
    );
  }

  /**
   * Get all managers (including inactive)
   * @returns {object[]} - All managers
   */
  getAllManagersIncludingInactive() {
    return this.all(
      'SELECT * FROM managers ORDER BY added_at DESC'
    );
  }

  /**
   * Get management statistics
   * @returns {object} - Management statistics
   */
  getStats() {
    const activeManagers = this.get(
      'SELECT COUNT(*) as count FROM managers WHERE active = 1'
    ).count;

    const totalManagers = this.get('SELECT COUNT(*) as count FROM managers').count;

    return {
      active: activeManagers,
      total: totalManagers,
      inactive: totalManagers - activeManagers
    };
  }

  /**
   * Check if a manager exists (even if inactive)
   * @param {string} userId - The user ID
   * @returns {boolean} - Whether the user has ever been a manager
   */
  managerExists(userId) {
    const manager = this.get(
      'SELECT user_id FROM managers WHERE user_id = ?',
      [userId]
    );
    return !!manager;
  }

  /**
   * Reactivate a manager
   * @param {string} userId - The user ID to reactivate
   * @param {string} reactivatedBy - Who reactivated them
   * @returns {object} - Statement result
   */
  reactivateManager(userId, reactivatedBy) {
    return this.exec(
      'UPDATE managers SET active = 1, added_by = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [reactivatedBy, userId]
    );
  }
}