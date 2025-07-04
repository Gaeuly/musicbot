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
import { BotClient } from './structures/BotClient.js';
import { logger } from './utils/logger.js';

// Create bot instance
const client = new BotClient();

// Initialize the bot
client.init()
  .then(() => {
    logger.success('Main', 'Bot is now running and ready to play music!');
    logger.info('Main', `Connected to ${client.guilds.cache.size} guilds`);
  })
  .catch(error => {
    logger.error('Init', 'Failed to initialize bot', error);
    process.exit(1);
  });

// Handle process events
process.on('unhandledRejection', (reason, promise) => {
  logger.error('UnhandledRejection', `Unhandled rejection at: ${promise}`, reason);
});

process.on('uncaughtException', (error) => {
  logger.error('UncaughtException', 'Uncaught exception', error);
  // For uncaught exceptions, attempt to clean up and then exit
  client.cleanup().finally(() => {
    process.exit(1);
  });
});

// Handle graceful shutdown
const shutdown = async () => {
  logger.warn('Shutdown', 'Received shutdown signal, cleaning up...');

  try {
    await client.cleanup();
    logger.success('Shutdown', 'Cleanup completed, shutting down gracefully.');
    process.exit(0);
  } catch (error) {
    logger.error('Shutdown', 'Error during cleanup', error);
    process.exit(1);
  }
};

// Register process signal handlers
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// If this is a test or development environment, also handle SIGUSR2
// (commonly used by nodemon for restart)
if (process.env.NODE_ENV !== 'production') {
  process.on('SIGUSR2', async () => {
    logger.warn('Restart', 'Received restart signal, cleaning up...');

    try {
      await client.cleanup();
      logger.success('Restart', 'Cleanup completed, restarting...');
      process.kill(process.pid, 'SIGUSR2');
    } catch (error) {
      logger.error('Restart', 'Error during cleanup', error);
      process.kill(process.pid, 'SIGUSR2');
    }
  });
}

/*
 *
 *
 *
 *
 * coded by bre4d
 */
export default client
