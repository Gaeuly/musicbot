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
import { embedManager } from '../../managers/EmbedManager.js';
import { db } from '../../database/DatabaseManager.js';
import { resolve } from 'path';
import { createAudioResource, createAudioPlayer, AudioPlayerStatus, NoSubscriberBehavior } from '@discordjs/voice';

/**
 * Player created event for Kazagumo
 * This event fires when a new player is created and initialized by Kazagumo
 */
export default {
  name: 'playerCreate',
  /**
   * Execute the player created event
   * @param {object} player - Kazagumo player instance
   * @param {object} client - Discord client
   */
  async execute(player, client) {
    try {
      // Get the guild
      const guild = client.guilds.cache.get(player.guildId);
      if (!guild) {
        logger.error('PlayerCreated', `Guild not found for id ${player.guildId}`);
        return;
      }

      // Get the text channel
      const channel = guild.channels.cache.get(player.textId);
      if (!channel) {
        logger.error('PlayerCreated', `Text channel not found for id ${player.textId}`);
        return;
      }

      // Get the voice channel
      const voiceChannel = guild.channels.cache.get(player.voiceId);
      if (!voiceChannel) {
        logger.error('PlayerCreated', `Voice channel not found for id ${player.voiceId}`);
        return;
      }

      // Ensure player instance is registered in the players collection
      // This is a double-check for race conditions
      const isRegistered = client.music.kazagumo.players.has(player.guildId);
      if (!isRegistered) {
        logger.warn('PlayerCreated', `Player is not registered in the players collection yet. This is unusual.`);

        // Try to get the players collection size for debugging
        const playerCount = client.music.kazagumo.players.size;
        logger.info('PlayerCreated', `Current player count: ${playerCount}`);
      }

      // Set the player volume from guild settings
      const guildVolume = db.guild.getVolume(guild.id);
      if (guildVolume && guildVolume !== player.volume) {
        player.setVolume(guildVolume)
      }

      

      // Log successful initialization
      logger.success('PlayerCreated', `Player fully initialized for guild ${guild.name}`);
    } catch (error) {
      logger.error('PlayerCreated', 'Error handling player created event', error);
    }
  },
};

// coded by bre4d
