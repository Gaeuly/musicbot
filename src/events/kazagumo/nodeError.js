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
 * Node error event for Shoukaku
 */
export default {
  name: 'nodeError',
  /**
   * Execute the node error event
   * @param {string} name - Node name
   * @param {Error} error - Error object
   * @param {object} client - Discord client
   */
  execute(name, error, client) {
    logger.error('Lavalink', `Node ${name} encountered an error:`, error);
  },
};

// coded by bre4d
