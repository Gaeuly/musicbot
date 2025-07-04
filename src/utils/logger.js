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
import chalk from 'chalk';
import { config } from '../config/config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper to get the directory name in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Calculate the log directory path (in the project root)
const LOG_DIR = path.resolve(__dirname, '../../logs');

class Logger {
  constructor() {
    this.infoColor = chalk.hex(config.colors.info);
    this.successColor = chalk.hex(config.colors.success);
    this.warningColor = chalk.hex(config.colors.warning);
    this.errorColor = chalk.hex(config.colors.error);

    // Initialize log files
    this.initLogFiles();
  }

  /**
   * Initialize log directory and files
   */
  initLogFiles() {
    try {
      // Create logs directory if it doesn't exist
      if (!fs.existsSync(LOG_DIR)) {
        fs.mkdirSync(LOG_DIR, { recursive: true });
        console.log(`Created log directory at ${LOG_DIR}`);
      }

      // Define log file paths
      this.logFilePath = path.join(LOG_DIR, 'bot.log');
      this.errorLogFilePath = path.join(LOG_DIR, 'error.log');
      this.playerLogFilePath = path.join(LOG_DIR, 'player.log'); // Added player log file

      // Rotate logs if they get too big (over 5MB)
      this.rotateLogFileIfNeeded(this.logFilePath);
      this.rotateLogFileIfNeeded(this.errorLogFilePath);
      this.rotateLogFileIfNeeded(this.playerLogFilePath);

      // Log initialization success
      this.writeToLogFile(this.logFilePath,
        `========== Log started at ${new Date().toISOString()} ==========`);

      // Initialize player log
      this.writeToLogFile(this.playerLogFilePath,
        `========== Player log started at ${new Date().toISOString()} ==========`);
    } catch (error) {
      console.error('Failed to initialize log files:', error);
    }
  }

  /**
   * Rotate log file if it exceeds the size limit
   * @param {string} filePath - Path to the log file
   */
  rotateLogFileIfNeeded(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const fileSizeInMB = stats.size / (1024 * 1024);

        if (fileSizeInMB > 5) {
          // Create a backup with timestamp
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const backupPath = `${filePath}.${timestamp}`;
          fs.renameSync(filePath, backupPath);
          console.log(`Rotated log file: ${filePath} -> ${backupPath}`);
        }
      }
    } catch (error) {
      console.error(`Failed to rotate log file ${filePath}:`, error);
    }
  }

  /**
   * Write to log file
   * @param {string} filePath - Path to the log file
   * @param {string} content - Content to write
   */
  writeToLogFile(filePath, content) {
    try {
      fs.appendFileSync(filePath, content + '\n');
    } catch (error) {
      console.error(`Failed to write to log file ${filePath}:`, error);
    }
  }

  /**
   * Format log message for file
   * @param {string} level - Log level
   * @param {string} context - Log context
   * @param {string} message - Log message
   * @returns {string} - Formatted log message
   */
  formatLogMessage(level, context, message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${context}] ${message}`;
  }

  /**
   * Get current timestamp
   * @returns {string} Current timestamp in HH:MM:SS format
   */
  get timestamp() {
    return new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Log info message
   * @param {string} context - The context of the log
   * @param {string} message - The message to log
   */
  info(context, message) {
    // Console output
    console.log(
      chalk.blue(`[${this.timestamp}]`),
      chalk.bold(this.infoColor(`[${context}]`)),
      chalk.whiteBright(message)
    );

    // File output
    this.writeToLogFile(
      this.logFilePath,
      this.formatLogMessage('INFO', context, message)
    );

    // Log to player log if it's a player-related context
    if (this.isPlayerContext(context)) {
      this.writeToLogFile(
        this.playerLogFilePath,
        this.formatLogMessage('INFO', context, message)
      );
    }
  }

  /**
   * Log success message
   * @param {string} context - The context of the log
   * @param {string} message - The message to log
   */
  success(context, message) {
    // Console output
    console.log(
      chalk.green(`[${this.timestamp}]`),
      chalk.bold(this.successColor(`[${context}]`)),
      chalk.whiteBright(message)
    );

    // File output
    this.writeToLogFile(
      this.logFilePath,
      this.formatLogMessage('SUCCESS', context, message)
    );

    // Log to player log if it's a player-related context
    if (this.isPlayerContext(context)) {
      this.writeToLogFile(
        this.playerLogFilePath,
        this.formatLogMessage('SUCCESS', context, message)
      );
    }
  }

  /**
   * Log warning message
   * @param {string} context - The context of the log
   * @param {string} message - The message to log
   */
  warn(context, message) {
    // Console output
    console.log(
      chalk.yellow(`[${this.timestamp}]`),
      chalk.bold(this.warningColor(`[${context}]`)),
      chalk.whiteBright(message)
    );

    // File output
    this.writeToLogFile(
      this.logFilePath,
      this.formatLogMessage('WARN', context, message)
    );

    // Log to player log if it's a player-related context
    if (this.isPlayerContext(context)) {
      this.writeToLogFile(
        this.playerLogFilePath,
        this.formatLogMessage('WARN', context, message)
      );
    }
  }

  /**
   * Log error message
   * @param {string} context - The context of the log
   * @param {string} message - The message to log
   * @param {Error} [error] - Optional error object
   */
  error(context, message, error) {
    // Console output
    console.log(
      chalk.red(`[${this.timestamp}]`),
      chalk.bold(this.errorColor(`[${context}]`)),
      chalk.red(message)
    );

    if (error) {
      console.error(error);
    }

    // File output - main log
    this.writeToLogFile(
      this.logFilePath,
      this.formatLogMessage('ERROR', context, message)
    );

    // File output - error log
    let errorLog = this.formatLogMessage('ERROR', context, message);
    if (error) {
      errorLog += `\nStack trace: ${error.stack || error}`;
    }
    this.writeToLogFile(this.errorLogFilePath, errorLog);

    // Log to player log if it's a player-related context
    if (this.isPlayerContext(context)) {
      this.writeToLogFile(
        this.playerLogFilePath,
        errorLog
      );
    }
  }

  /**
   * Log debug message (only when in debug mode)
   * @param {string} context - The context of the log
   * @param {string} message - The message to log
   */
  debug(context, message) {
    if (process.env.NODE_ENV === 'development' || config.debug) {
      // Console output
      console.log(
        chalk.magenta(`[${this.timestamp}]`),
        chalk.bold.magenta(`[${context}]`),
        chalk.whiteBright(message)
      );

      // File output
      this.writeToLogFile(
        this.logFilePath,
        this.formatLogMessage('DEBUG', context, message)
      );

      // Log to player log if it's a player-related context
      if (this.isPlayerContext(context)) {
        this.writeToLogFile(
          this.playerLogFilePath,
          this.formatLogMessage('DEBUG', context, message)
        );
      }
    }
  }

  /**
   * Log player event specifically (always goes to player log)
   * @param {string} context - The context of the log
   * @param {string} message - The message to log
   * @param {object} [playerState] - Optional player state object to log
   */
  player(context, message, playerState = null) {
    // Console output
    console.log(
      chalk.cyan(`[${this.timestamp}]`),
      chalk.bold.cyan(`[Player:${context}]`),
      chalk.whiteBright(message)
    );

    // Format log message
    let logMessage = this.formatLogMessage('PLAYER', context, message);

    // Add player state if provided
    if (playerState) {
      const safePlayerState = this.sanitizePlayerState(playerState);
      logMessage += `\nPlayer state: ${JSON.stringify(safePlayerState, null, 2)}`;
    }

    // Always log to the main log file
    this.writeToLogFile(this.logFilePath, logMessage);

    // Always log to the player log file
    this.writeToLogFile(this.playerLogFilePath, logMessage);
  }

  /**
   * Check if the context is player-related
   * @param {string} context - The context to check
   * @returns {boolean} - Whether the context is player-related
   */
  isPlayerContext(context) {
    const playerContexts = [
      'Player', 'PlayCommand', 'PlayerManager', 'QueueManager', 'MusicManager',
      'playerCreated', 'playerDestroyed', 'playerEmpty', 'playerEnd', 'playerStart',
      'queueEnd', 'nodeConnect', 'nodeError'
    ];

    return playerContexts.some(playerContext =>
      context.includes(playerContext) ||
      context.toLowerCase().includes('player') ||
      context.toLowerCase().includes('queue') ||
      context.toLowerCase().includes('music')
    );
  }

  /**
   * Remove sensitive data from player state for logging
   * @param {object} playerState - The player state object
   * @returns {object} - Sanitized player state object
   */
  sanitizePlayerState(playerState) {
    // Create a shallow copy of the player state to avoid modifying the original
    const sanitized = { ...playerState };

    // Remove potential circular references and large objects
    delete sanitized.node;
    delete sanitized.shoukaku;
    delete sanitized.kazagumo;

    // If there's a queue array, replace it with just the length
    if (Array.isArray(sanitized.queue)) {
      sanitized.queueSize = sanitized.queue.length;
      delete sanitized.queue;
    }

    return sanitized;
  }
}

export const logger = new Logger();

/*
   .
   .
   .
   .
   .
   .
   .
   .
   coded by bre4d
*/
