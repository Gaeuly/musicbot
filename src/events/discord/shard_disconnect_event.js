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
 * ShardDisconnect event for handling shard disconnections
 */
export default {
  name: 'shardDisconnect',
  /**
   * Execute when a shard disconnects
   * @param {CloseEvent} event - The WebSocket close event
   * @param {number} shardId - The shard ID that disconnected
   * @param {object} client - Discord client
   */
  async execute(event, shardId, client) {
    try {
      const disconnectInfo = {
        shardId,
        code: event.code,
        reason: event.reason || 'No reason provided',
        wasClean: event.wasClean,
        timestamp: new Date().toISOString()
      };

      // Determine disconnect reason description
      const disconnectReasons = {
        1000: 'Normal Closure',
        1001: 'Going Away',
        1002: 'Protocol Error',
        1003: 'Unsupported Data',
        1005: 'No Status Received',
        1006: 'Abnormal Closure',
        1007: 'Invalid Frame Payload Data',
        1008: 'Policy Violation',
        1009: 'Message Too Big',
        1010: 'Mandatory Extension',
        1011: 'Internal Error',
        1012: 'Service Restart',
        1013: 'Try Again Later',
        1014: 'Bad Gateway',
        1015: 'TLS Handshake',
        4000: 'Unknown Error',
        4001: 'Unknown Opcode',
        4002: 'Decode Error',
        4003: 'Not Authenticated',
        4004: 'Authentication Failed',
        4005: 'Already Authenticated',
        4007: 'Invalid Sequence',
        4008: 'Rate Limited',
        4009: 'Session Timed Out',
        4010: 'Invalid Shard',
        4011: 'Sharding Required',
        4012: 'Invalid API Version',
        4013: 'Invalid Intents',
        4014: 'Disallowed Intents'
      };

      const reasonDescription = disconnectReasons[event.code] || 'Unknown';

      // Determine log level based on disconnect reason
      const expectedDisconnects = [1000, 1001];
      const criticalDisconnects = [4004, 4010, 4011, 4013, 4014];
      
      let logLevel = 'info';
      if (criticalDisconnects.includes(event.code)) {
        logLevel = 'error';
      } else if (!expectedDisconnects.includes(event.code)) {
        logLevel = 'warn';
      }

      logger[logLevel]('ShardDisconnect', `Shard ${shardId} disconnected`, {
        ...disconnectInfo,
        reasonDescription,
        severity: logLevel,
        willReconnect: !criticalDisconnects.includes(event.code)
      });

      // Get shard statistics before disconnect
      const shard = client.ws.shards.get(shardId);
      if (shard) {
        logger.debug('ShardDisconnect', `Shard ${shardId} final statistics`, {
          lastPing: shard.ping,
          sequence: shard.sequence,
          closeSequence: shard.closeSequence,
          uptime: shard.connectedAt ? Date.now() - shard.connectedAt : 'Unknown'
        });
      }

      // Check overall shard health
      const totalShards = client.ws.shards.size;
      const connectedShards = client.ws.shards.filter(s => s.status === 0).size;
      
      if (connectedShards < totalShards * 0.5) {
        logger.warn('ShardDisconnect', 'Multiple shards disconnected - potential connectivity issues', {
          totalShards,
          connectedShards,
          disconnectedShards: totalShards - connectedShards
        });
      }

    } catch (error) {
      logger.error('ShardDisconnect', `Error in shardDisconnect event for shard ${shardId}`, error);
    }
  }
};

// Not even this is safe from
// coded by bre4d