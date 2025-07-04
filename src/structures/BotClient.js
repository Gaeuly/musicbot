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
import {
  Client,
  GatewayIntentBits,
  Collection,
  DefaultWebSocketManagerOptions
} from 'discord.js';
import { ClusterClient, getInfo } from 'discord-hybrid-sharding';
import { CommandHandler } from './CommandHandler.js';
import { EventHandler } from './EventHandler.js';
import { MusicManager } from '../managers/MusicManager.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';
import { db } from '../database/DatabaseManager.js';
import { emoji } from '../config/emoji.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

const intents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildMessageReactions,
  GatewayIntentBits.GuildMessageTyping,
  GatewayIntentBits.GuildVoiceStates,
  GatewayIntentBits.GuildEmojisAndStickers,
  GatewayIntentBits.GuildIntegrations,
  GatewayIntentBits.GuildWebhooks,
  GatewayIntentBits.GuildInvites,
  GatewayIntentBits.GuildScheduledEvents,
  GatewayIntentBits.GuildModeration,
  GatewayIntentBits.DirectMessages,
  GatewayIntentBits.DirectMessageReactions,
  GatewayIntentBits.DirectMessageTyping,
  GatewayIntentBits.MessageContent
];

export class BotClient extends Client {
  constructor(options = {}) {
    const shardInfo = getInfo();
    
    super({
      shards: shardInfo.SHARD_LIST,
      shardCount: shardInfo.TOTAL_SHARDS,
      intents,
      failIfNotExists: false,
      waitGuildTimeout: 30000,
      ...options
    });

    this.cluster = new ClusterClient(this);
    this.commands = new Collection();
    this.logger = logger;
    this.config = config;
    this.emoji = emoji;

    this.music = new MusicManager(this);
    this.commandHandler = new CommandHandler(this, this.music);
    this.eventHandler = new EventHandler(this, this.music);

    this.db = db;
    this.startTime = Date.now();
    this.shardStatus = new Map();
    this.lastGuildCount = 0;

    // Setup shard event listeners
    this.setupShardListeners();
  }

  setupShardListeners() {
    this.on('shardReady', shardId => {
      this.shardStatus.set(shardId, 'ready');
      this.logger.success(`Shard ${shardId} is now ready`);
      this.logShardStatus();
    });

    this.on('shardResumed', shardId => {
      this.shardStatus.set(shardId, 'resumed');
      this.logger.info(`Shard ${shardId} has resumed`);
    });

    this.on('shardDisconnect', (event, shardId) => {
      this.shardStatus.set(shardId, 'disconnected');
      this.logger.warn(`Shard ${shardId} disconnected:`, event);
    });

    this.on('shardReconnecting', shardId => {
      this.shardStatus.set(shardId, 'reconnecting');
      this.logger.info(`Shard ${shardId} is reconnecting...`);
    });

    this.on('shardError', (error, shardId) => {
      this.shardStatus.set(shardId, 'error');
      this.logger.error(`Shard ${shardId} encountered an error:`, error);
    });

    this.on('guildCreate', guild => {
      this.logger.debug(`Joined guild ${guild.name} (${guild.id}) on shard ${guild.shardId}`);
      this.logGuildCounts();
    });

    this.on('guildDelete', guild => {
      this.logger.debug(`Left guild ${guild.name} (${guild.id}) on shard ${guild.shardId}`);
      this.logGuildCounts();
    });
  }

  async init() {
    try {
      this.logger.info('ByteCord', `Initializing bot (Cluster ${this.cluster.id})...`);
      
      // Configure websocket options
      DefaultWebSocketManagerOptions.identifyProperties.browser = 'Discord iOS';
      DefaultWebSocketManagerOptions.identifyTimeout = 30000;

      // Get gateway information
      const rest = new REST({ version: '10' }).setToken(this.config.token);
      const gateway = await rest.get(Routes.gatewayBot());
      this.logger.debug('Gateway info:', {
        url: gateway.url,
        shards: gateway.shards,
        sessionStartLimit: gateway.session_start_limit
      });

      // Validate shard count
      const shardList = getInfo().SHARD_LIST;
      const totalShards = getInfo().TOTAL_SHARDS;
      this.logger.debug(`Cluster ${this.cluster.id} managing shards ${shardList.join(', ')} of ${totalShards}`);

      // Initialize components
      await this.eventHandler.loadEvents();
      await this.commandHandler.loadCommands();
      
      // Connect to Discord
      await this.login(this.config.token);

      // Start periodic status checks
      this.startStatusMonitoring();

      this.logger.success('ByteCord', `Cluster ${this.cluster.id} initialized successfully`);
      return true;
    } catch (error) {
      this.logger.error('ByteCord', 'Failed to initialize bot', error);
      process.exit(1); // Exit with error to allow cluster manager to restart
    }
  }

  startStatusMonitoring() {
    // Initial status log
    setTimeout(() => this.logShardStatus(), 5000);
    
    // Periodic status checks
    this.statusInterval = setInterval(() => {
      this.logShardStatus();
      this.logGuildCounts();
    }, 30000);
  }

  logShardStatus() {
    const statusReport = [];
    for (const [shardId, status] of this.shardStatus) {
      statusReport.push(`Shard ${shardId}: ${status}`);
    }
    this.logger.debug('Shard Status:', statusReport.join('\n'));
  }

  logGuildCounts() {
    const currentGuildCount = this.guilds.cache.size;
    if (currentGuildCount !== this.lastGuildCount) {
      this.logger.info(`Guild count changed: ${this.lastGuildCount} → ${currentGuildCount}`);
      this.lastGuildCount = currentGuildCount;
    }

    const shardGuilds = new Map();
    this.guilds.cache.forEach(guild => {
      const count = shardGuilds.get(guild.shardId) || 0;
      shardGuilds.set(guild.shardId, count + 1);
    });
    
    shardGuilds.forEach((count, shardId) => {
      this.logger.debug(`Shard ${shardId} is managing ${count} guilds`);
    });
  }

  get uptime() {
    return Date.now() - this.startTime;
  }

  async reload() {
    try {
      this.logger.info('ByteCord', 'Reloading commands and events...');
      await this.eventHandler.reloadEvents();
      await this.commandHandler.reloadCommands();
      this.logger.success('ByteCord', 'Reloaded commands and events successfully');
      return true;
    } catch (error) {
      this.logger.error('ByteCord', 'Failed to reload commands and events', error);
      return false;
    }
  }

  async cleanup() {
    try {
      this.logger.info('ByteCord', 'Cleaning up before shutdown...');
      clearInterval(this.statusInterval);

      const activePlayers = this.music.kazagumo?.players?.size || 0;
      if (activePlayers > 0) {
        this.logger.info('ByteCord', `Saving state for ${activePlayers} active players`);

        for (const [guildId, player] of this.music.kazagumo.players) {
          try {
            const currentTrack = player.queue?.current
              ? this.cleanTrackForStorage(player.queue.current)
              : null;

            let queueTracks = [];
            try {
              if (player.queue?.data?.length) {
                queueTracks = player.queue.data.map(track =>
                  this.cleanTrackForStorage(track)
                );
              } else if (Array.isArray(player.queue)) {
                queueTracks = player.queue.map(track =>
                  this.cleanTrackForStorage(track)
                );
              }
            } catch (queueError) {
              this.logger.warn('ByteCord', `Could not extract queue for guild ${guildId}`, queueError);
            }

            this.db.savePlayerState(guildId, {
              voiceChannelId: player.voiceId,
              textChannelId: player.textId,
              volume: player.volume,
              loopMode: player.loop,
              paused: player.paused,
              currentTrack,
              queue: queueTracks
            });

            player.destroy();
          } catch (playerError) {
            this.logger.error('ByteCord', `Failed to save state for player in guild ${guildId}`, playerError);
          }
        }
      }

      await this.db.closeAll();
      this.logger.success('ByteCord', 'Cleanup completed successfully');
    } catch (error) {
      this.logger.error('ByteCord', 'Error during cleanup', error);
    }
  }

  cleanTrackForStorage(track) {
    if (!track) return null;

    try {
      return {
        title: track.title,
        uri: track.uri,
        author: track.author,
        duration: track.duration,
        identifier: track.identifier,
        thumbnail: track.thumbnail,
        requester: track.requester
      };
    } catch (e) {
      this.logger.warn('ByteCord', 'Failed to clean track for storage', e);
      return null;
    }
  }
}