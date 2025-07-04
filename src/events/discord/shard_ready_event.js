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
 * ShardReady event for handling shard ready state
 */
export default {
  name: 'shardReady',
  /**
   * Execute when a shard becomes ready
   * @param {number} shardId - The shard ID that became ready
   * @param {Set} unavailableGuilds - Set of unavailable guild IDs
   * @param {object} client - Discord client
   */
  async execute(shardId, unavailableGuilds, client) {
    try {
      const shard = client.ws.shards.get(shardId);
      const shardInfo = {
        id: shardId,
        unavailableGuilds: unavailableGuilds ? unavailableGuilds.size : 0,
        ping: shard?.ping || 'N/A',
        status: shard?.status || 'Unknown',
        guilds: client.guilds.cache.filter(g => g.shardId === shardId).size
      };

      logger.info('ShardReady', `Shard ${shardId} is ready!`, {
        shardId,
        unavailableGuilds: shardInfo.unavailableGuilds,
        ping: shardInfo.ping,
        status: shardInfo.status,
        guildsCount: shardInfo.guilds,
        timestamp: new Date().toISOString()
      });

      // Log detailed shard statistics
      if (shard) {
        logger.debug('ShardReady', `Shard ${shardId} detailed statistics`, {
          ping: shard.ping,
          status: shard.status,
          lastPingTimestamp: shard.lastPingTimestamp,
          connectedAt: new Date().toISOString(),
          sequence: shard.sequence,
          closeSequence: shard.closeSequence
        });
      }

      // Check if all shards are ready
      const totalShards = client.ws.shards.size;
      const readyShards = client.ws.shards.filter(s => s.status === 0).size;
      
      if (readyShards === totalShards) {
        logger.info('ShardReady', 'All shards are now ready!', {
          totalShards,
          readyShards,
          allShardsReady: true
        });
      }

    } catch (error) {
      logger.error('ShardReady', `Error in shardReady event for shard ${shardId}`, error);
    }
  }
};

// Not even this is safe from
// coded by bre4d