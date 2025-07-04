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
 * Node connect event for Shoukaku
 */
export default {
  name: 'nodeConnect',
  /**
   * Execute the node connect event
   * @param {string} name - Node name
   * @param {object} client - Discord client
   */
  execute(name, client) {
    logger.success('Lavalink', `Node ${name} connected successfully`);

  },
};
