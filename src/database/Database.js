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
import BetterSQLite3 from 'better-sqlite3';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Database class to handle all SQLite operations
 */
export class Database {
  /**
   * Create a new Database instance
   * @param {string} dbPath - Path to the database file
   */
  constructor(dbPath) {
    this.path = path.resolve(__dirname, '..', '..', dbPath);

    // Ensure the directory exists
    fs.ensureDirSync(path.dirname(this.path));

    try {
      this.db = new BetterSQLite3(this.path, {
        fileMustExist: false,
        verbose: process.env.NODE_ENV === 'development'
          ? console.log
          : null
      });

      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');

     
    } catch (error) {
      logger.error('Database', `Failed to connect to ${path.basename(dbPath)}`, error);
      throw error;
    }
  }

  /**
   * Execute a SQL statement
   * @param {string} sql - SQL statement to execute
   * @param {any[]} params - Parameters to bind to the statement
   * @returns {object} - Statement result
   */
  exec(sql, params = []) {
    try {
      return this.db.prepare(sql).run(params);
    } catch (error) {
      logger.error('Database', `Failed to execute SQL: ${sql}`, error);
      throw error;
    }
  }

  /**
   * Get a single row from the database
   * @param {string} sql - SQL statement to execute
   * @param {any[]} params - Parameters to bind to the statement
   * @returns {object|undefined} - Row or undefined if not found
   */
  get(sql, params = []) {
    try {
      return this.db.prepare(sql).get(params);
    } catch (error) {
      logger.error('Database', `Failed to get row: ${sql}`, error);
      throw error;
    }
  }

  /**
   * Get all rows from the database
   * @param {string} sql - SQL statement to execute
   * @param {any[]} params - Parameters to bind to the statement
   * @returns {object[]} - Array of rows
   */
  all(sql, params = []) {
    try {
      return this.db.prepare(sql).all(params);
    } catch (error) {
      logger.error('Database', `Failed to get all rows: ${sql}`, error);
      throw error;
    }
  }

  /**
   * Prepare a statement for later execution
   * @param {string} sql - SQL statement to prepare
   * @returns {object} - Prepared statement
   */
  prepare(sql) {
    try {
      return this.db.prepare(sql);
    } catch (error) {
      logger.error('Database', `Failed to prepare statement: ${sql}`, error);
      throw error;
    }
  }

  /**
   * Close the database connection
   */
  close() {
    try {
      this.db.close();
      logger.info('Database', `Closed connection to ${path.basename(this.path)}`);
    } catch (error) {
      logger.error('Database', `Failed to close connection to ${path.basename(this.path)}`, error);
    }
  }
}

// This code made with blood, sweat and tears
// coded by bre4d
