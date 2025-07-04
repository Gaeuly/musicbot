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
 * ShardResume event for handling successful shard reconnections
 */
export default {
  name: 'shardResume',
  /**
   * Execute when a shard successfully resumes connection
   * @param {number} shardId - The shard ID that resumed
   * @param {number} replayedEvents - Number of events replayed during resume
   * @param {object} client - Discord client
   */
  async execute(shardId, replayedEvents, client) {
    try {
      const resumeInfo = {
        shardId,
        replayedEvents,
        timestamp: new Date().toISOString()
      };

      // Get current shard information
      const shard = client.ws.shards.get(shardId);
      const shardInfo = shard ? {
        status: shard.status,
        ping: shard.ping,
        sequence: shard.sequence,
        lastPingTimestamp: shard.lastPingTimestamp
      } : null;

      logger.info('ShardResume', `Shard ${shardId} successfully resumed connection`, {
        ...resumeInfo,
        shardInfo,
        eventsReplayed: replayedEvents,
        resumeType: replayedEvents > 0 ? 'with_replay' : 'clean_resume'
      });

      // Calculate downtime if we have reconnection tracking data
      if (client.reconnectTracker && client.reconnectTracker.has(`shard-${shardId}`)) {
        const trackingData = client.reconnectTracker.get(`shard-${shardId}`);
        const downtime = Date.now() - trackingData.firstAttempt;
        const attempts = trackingData.attempts;

        logger.info('ShardResume', `Shard ${shardId} downtime statistics`, {
          totalDowntime: `${Math.round(downtime / 1000)}s`,
          reconnectionAttempts: attempts,
          avgAttemptInterval: attempts > 1 ? `${Math.round(downtime / attempts / 1000)}s` : 'N/A',
          recoverySuccess: true
        });

        // Clean up tracking data for this shard since it's now resumed
        client.reconnectTracker.delete(`shard-${shardId}`);
      }

      // Log event replay information
      if (replayedEvents > 0) {
        logger.debug('ShardResume', `Shard ${shardId} event replay details`, {
          eventsReplayed: replayedEvents,
          replayReason: 'Catching up on missed events during disconnection',
          dataIntegrity: 'maintained'
        });

        // Alert if too many events needed to be replayed
        if (replayedEvents > 1000) {
          logger.warn('ShardResume', `Shard ${shardId} replayed unusually high number of events`, {
            eventsReplayed: replayedEvents,
            possibleCause: 'Extended downtime or high server activity during disconnect',
            impact: 'Temporary increased processing load'
          });
        }
      } else {
        logger.debug('ShardResume', `Shard ${shardId} resumed with clean state`, {
          eventsReplayed: 0,
          resumeType: 'clean',
          reason: 'No events missed during brief disconnection'
        });
      }

      // Check overall bot health after resume
      const totalShards = client.ws.shards.size;
      const readyShards = client.ws.shards.filter(s => s.status === 0).size;
      const healthPercentage = Math.round((readyShards / totalShards) * 100);

      logger.debug('ShardResume', 'Bot health status after shard resume', {
        totalShards,
        readyShards,
        healthPercentage,
        allShardsHealthy: readyShards === totalShards
      });

      // Log performance metrics
      if (shard) {
        logger.debug('ShardResume', `Shard ${shardId} performance metrics`, {
          currentPing: shard.ping,
          status: shard.status,
          guildsCount: client.guilds.cache.filter(g => g.shardId === shardId).size,
          usersCount: client.guilds.cache
            .filter(g => g.shardId === shardId)
            .reduce((acc, guild) => acc + guild.memberCount, 0)
        });
      }

      // Alert if all shards are now healthy after this resume
      if (readyShards === totalShards && totalShards > 1) {
        logger.info('ShardResume', 'All shards are now healthy and operational', {
          totalShards,
          allShardsReady: true,
          lastResumedShard: shardId,
          systemStatus: 'fully_operational'
        });
      }

    } catch (error) {
      logger.error('ShardResume', `Error in shardResume event for shard ${shardId}`, error);
    }
  }
};

// Not even this is safe from
// coded by bre4d