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
import { logger } from '../../utils/logger.js';

/**
 * ShardError event for handling shard errors
 */
export default {
  name: 'shardError',
  /**
   * Execute when a shard encounters an error
   * @param {Error} error - The error that occurred
   * @param {number} shardId - The shard ID that encountered the error
   * @param {object} client - Discord client
   */
  async execute(error, shardId, client) {
    try {
      const errorInfo = {
        shardId,
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        timestamp: new Date().toISOString()
      };

      // Get shard information
      const shard = client.ws.shards.get(shardId);
      const shardInfo = shard ? {
        status: shard.status,
        ping: shard.ping,
        sequence: shard.sequence,
        lastPingTimestamp: shard.lastPingTimestamp
      } : null;

      // Determine error severity
      const criticalErrors = [
        'ECONNRESET',
        'ENOTFOUND', 
        'ETIMEDOUT',
        'ECONNREFUSED'
      ];

      const isCritical = criticalErrors.some(errType => 
        error.message.includes(errType) || error.code === errType
      );

      const logLevel = isCritical ? 'error' : 'warn';

      logger[logLevel]('ShardError', `Shard ${shardId} encountered an error`, {
        ...errorInfo,
        shardInfo,
        isCritical,
        errorCode: error.code || 'Unknown',
        errorType: error.constructor.name
      });

      // Log additional context for network errors
      if (error.code && ['ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT'].includes(error.code)) {
        logger.warn('ShardError', `Network error detected on shard ${shardId}`, {
          errorCode: error.code,
          possibleCause: 'Network connectivity issues or Discord API problems',
          recommendation: 'Monitor for reconnection attempts'
        });
      }

      // Log memory usage if error might be memory related
      if (error.message.includes('memory') || error.name.includes('Memory')) {
        const memUsage = process.memoryUsage();
        logger.error('ShardError', `Potential memory issue on shard ${shardId}`, {
          memoryUsage: {
            rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
            external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
          }
        });
      }

      // Check if multiple shards are having errors
      const currentTime = Date.now();
      if (!client.shardErrorTracker) {
        client.shardErrorTracker = new Map();
      }

      // Track error frequency
      const errorKey = `${shardId}-${currentTime}`;
      client.shardErrorTracker.set(errorKey, { shardId, timestamp: currentTime, error: error.message });

      // Clean old entries (older than 5 minutes)
      for (const [key, value] of client.shardErrorTracker.entries()) {
        if (currentTime - value.timestamp > 300000) {
          client.shardErrorTracker.delete(key);
        }
      }

      // Check for error patterns
      const recentErrors = Array.from(client.shardErrorTracker.values())
        .filter(entry => currentTime - entry.timestamp < 60000); // Last minute

      if (recentErrors.length >= 3) {
        logger.error('ShardError', 'Multiple shard errors detected in short timeframe', {
          recentErrorCount: recentErrors.length,
          affectedShards: [...new Set(recentErrors.map(e => e.shardId))],
          timeframe: '1 minute',
          possibleIssue: 'System-wide connectivity or performance problems'
        });
      }

    } catch (logError) {
      // Fallback logging in case the main error handler fails
      console.error(`[CRITICAL] Error in shardError event handler for shard ${shardId}:`, logError);
      console.error(`[CRITICAL] Original shard error:`, error);
    }
  }
};

// Not even this is safe from
// coded by bre4d