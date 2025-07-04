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
 * ShardReconnecting event for handling shard reconnection attempts
 */
export default {
  name: 'shardReconnecting',
  /**
   * Execute when a shard starts reconnecting
   * @param {number} shardId - The shard ID that is reconnecting
   * @param {object} client - Discord client
   */
  async execute(shardId, client) {
    try {
      const reconnectInfo = {
        shardId,
        timestamp: new Date().toISOString(),
        attempt: 1 // Discord.js handles retry counting internally
      };

      // Get shard information if available
      const shard = client.ws.shards.get(shardId);
      const shardInfo = shard ? {
        status: shard.status,
        lastPing: shard.ping,
        sequence: shard.sequence,
        closeSequence: shard.closeSequence
      } : null;

      logger.info('ShardReconnecting', `Shard ${shardId} is attempting to reconnect`, {
        ...reconnectInfo,
        shardInfo,
        reason: 'Connection lost or interrupted'
      });

      // Track reconnection attempts
      if (!client.reconnectTracker) {
        client.reconnectTracker = new Map();
      }

      const currentTime = Date.now();
      const trackingKey = `shard-${shardId}`;
      
      if (client.reconnectTracker.has(trackingKey)) {
        const existing = client.reconnectTracker.get(trackingKey);
        existing.attempts += 1;
        existing.lastAttempt = currentTime;
      } else {
        client.reconnectTracker.set(trackingKey, {
          shardId,
          attempts: 1,
          firstAttempt: currentTime,
          lastAttempt: currentTime
        });
      }

      const trackingData = client.reconnectTracker.get(trackingKey);

      // Log detailed reconnection statistics
      logger.debug('ShardReconnecting', `Shard ${shardId} reconnection details`, {
        totalAttempts: trackingData.attempts,
        timeSinceFirstAttempt: currentTime - trackingData.firstAttempt,
        reconnectFrequency: trackingData.attempts > 1 ? 
          (currentTime - trackingData.firstAttempt) / trackingData.attempts : 0
      });

      // Alert if excessive reconnection attempts
      if (trackingData.attempts >= 5) {
        const timeSpan = currentTime - trackingData.firstAttempt;
        logger.warn('ShardReconnecting', `Shard ${shardId} has excessive reconnection attempts`, {
          attempts: trackingData.attempts,
          timeSpan: `${Math.round(timeSpan / 1000)}s`,
          avgTimeBetweenAttempts: `${Math.round(timeSpan / trackingData.attempts / 1000)}s`,
          possibleIssues: [
            'Network instability',
            'Discord API issues',
            'High latency connection',
            'System resource constraints'
          ]
        });
      }

      // Check system-wide reconnection patterns
      const allReconnects = Array.from(client.reconnectTracker.values());
      const recentReconnects = allReconnects.filter(r => 
        currentTime - r.lastAttempt < 300000 // Last 5 minutes
      );

      if (recentReconnects.length >= 3) {
        const affectedShards = recentReconnects.map(r => r.shardId);
        logger.warn('ShardReconnecting', 'Multiple shards reconnecting simultaneously', {
          affectedShards,
          totalReconnectingShards: recentReconnects.length,
          timeframe: '5 minutes',
          possibleCause: 'System-wide connectivity issues or Discord outage'
        });
      }

      // Clean up old tracking data (older than 1 hour)
      for (const [key, data] of client.reconnectTracker.entries()) {
        if (currentTime - data.lastAttempt > 3600000) {
          client.reconnectTracker.delete(key);
        }
      }

      // Log current shard status overview
      const totalShards = client.ws.shards.size;
      const readyShards = client.ws.shards.filter(s => s.status === 0).size;
      const reconnectingShards = client.ws.shards.filter(s => s.status === 6).size;

      logger.debug('ShardReconnecting', 'Current shard status overview', {
        totalShards,
        readyShards,
        reconnectingShards,
        healthPercentage: Math.round((readyShards / totalShards) * 100)
      });

    } catch (error) {
      logger.error('ShardReconnecting', `Error in shardReconnecting event for shard ${shardId}`, error);
    }
  }
};

// Not even this is safe from
// coded by bre4d