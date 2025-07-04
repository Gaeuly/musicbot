/**
 * Muffin STUDIO - Bre4d777 & prayag 
 * https://discord.gg/TRPqseUq32
 * give credits or ill touch you in your dreams
 */

import { Kazagumo, Plugins } from 'kazagumo';
import { Connectors } from 'shoukaku';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';
import Spotify from 'kazagumo-spotify';
import Deezer from 'kazagumo-deezer';
import JioSaavn from './pg/Saavn/index.js';

const LOAD_STRATEGIES = ['round-robin', 'least-load', 'random', 'region-based'];
const NODE_STATES = ['DISCONNECTED', 'CONNECTED', 'CONNECTING', 'DISCONNECTING'];
const PLAYER_EVENTS = ['playerStart', 'playerEnd', 'playerEmpty', 'playerClosed', 'playerUpdate', 
  'playerException', 'playerResolveError', 'playerStuck', 'playerResumed', 'playerMoved', 
  'playerDestroy', 'playerCreate', 'queueEnd'];

export class MusicManager {
  constructor(client) {
    this.client = client;
    this.initialized = false;
    this.lastSelectedNodeIndex = -1;
    this.init();
  }

  init() {
    try {
      if (!Array.isArray(config.nodes) || !config.nodes.length) {
        throw new Error('Invalid Lavalink configuration: No nodes configured');
      }

      logger.info('MusicManager', `Initializing with ${config.nodes.length} Lavalink nodes for scale`);

      const plugins = [
        new Plugins.PlayerMoved(this.client),
        new Deezer({ playlistLimit: 20 }),
        new JioSaavn({ baseUrl: 'https://saavn.dev/api', debug: false, searchLimit: 10 })
      ];

      if (config.spotify?.clientId && config.spotify?.clientSecret) {
        try {
          plugins.push(new Spotify({
            clientId: config.spotify.clientId,
            clientSecret: config.spotify.clientSecret,
            playlistPageLimit: 10,
            albumPageLimit: 6,
            searchLimit: 600,
            searchMarket: 'IN'
          }));
          logger.success('MusicManager', 'Spotify plugin initialized successfully');
        } catch (err) {
          logger.error('MusicManager', 'Failed to initialize Spotify plugin', err);
        }
      } else {
        logger.warn('MusicManager', 'Spotify credentials not provided; default search engine may not work');
      }

      const formattedNodes = config.nodes.map(node => ({
        name: node.name, url: node.url, auth: node.auth, secure: Boolean(node.secure),
        requestTimeout: 30000, reconnectInterval: 5000, reconnectTries: 5
      }));

      this.kazagumo = new Kazagumo(
        {
          plugins,
          defaultSearchEngine: 'spotify',
          send: (guildId, payload) => this.client.guilds.cache.get(guildId)?.shard.send(payload)
        },
        new Connectors.DiscordJS(this.client, {
          resume: true, resumeTimeout: 30, resumeByLibrary: true,
          reconnectTries: 5, restTimeout: 30000
        }),
        formattedNodes
      );

      this.initialized = true;
      logger.success('MusicManager', 'Kazagumo and Shoukaku initialized successfully with load balancing');
    } catch (error) {
      logger.error('MusicManager', 'Failed to initialize music system', error);
      console.error('❌ FATAL ERROR INITIALIZING MUSIC SYSTEM:', error);
      this.initialized = false;
    }
  }

  getBestNode(strategy = 'least-load') {
    if (!this.initialized || !this.kazagumo.shoukaku.nodes.size) {
      logger.warn('MusicManager', 'No nodes available for load balancing');
      return null;
    }

    const availableNodes = Array.from(this.kazagumo.shoukaku.nodes.values());
    if (!availableNodes.length) {
      logger.error('MusicManager', 'No nodes available');
      return null;
    }

    let selectedNode;
    switch (strategy) {
      case 'round-robin':
        this.lastSelectedNodeIndex = (this.lastSelectedNodeIndex + 1) % availableNodes.length;
        selectedNode = availableNodes[this.lastSelectedNodeIndex];
        break;
      case 'random':
        selectedNode = availableNodes[Math.floor(Math.random() * availableNodes.length)];
        break;
      case 'least-load':
      case 'region-based':
        selectedNode = availableNodes.reduce((best, current) => 
          (current.stats?.players || 0) < (best.stats?.players || 0) ? current : best);
        break;
      default:
        selectedNode = availableNodes[0];
    }

    logger.debug('MusicManager', `Selected node "${selectedNode.name}" using ${strategy} strategy`, {
      selectedNode: selectedNode.name, totalNodes: availableNodes.length,
      nodeStats: { players: selectedNode.stats?.players || 0, playingPlayers: selectedNode.stats?.playingPlayers || 0, uptime: selectedNode.stats?.uptime || 0 }
    });

    return selectedNode.name;
  }

  registerEvents(eventHandlers) {
    if (!this.initialized || !this.kazagumo) {
      logger.error('MusicManager', 'Cannot register events – not initialized');
      return;
    }

    try {
      logger.debug('MusicManager', 'Registering event handlers', Object.keys(eventHandlers).length ? Object.keys(eventHandlers) : 'None');

      this.kazagumo.shoukaku
        .on('ready', name => {
          logger.success('MusicManager', `Lavalink node "${name}" connected and ready`);
          eventHandlers.nodeConnect?.(name);
        })
        .on('error', (name, err) => {
          logger.error('MusicManager', `Lavalink node "${name}" error:`, err);
          eventHandlers.nodeError?.(name, err);
        })
        .on('close', (name, code, reason) => {
          logger.warn('MusicManager', `Lavalink node "${name}" closed: ${code} – ${reason || 'No reason'}`);
          eventHandlers.nodeDisconnect?.(name, code, reason);
        })
        .on('disconnect', (name, players, moved) => {
          logger.warn('MusicManager', `Lavalink node "${name}" disconnected, players affected: ${players?.length || 0}`);
          eventHandlers.nodeDisconnect?.(name, players, moved);
        });

      PLAYER_EVENTS.forEach(evt => 
        this.kazagumo.on(evt, (...args) => eventHandlers[evt]?.(...args)));

      logger.success('MusicManager', 'Event handlers registered successfully');
    } catch (error) {
      logger.error('MusicManager', 'Failed to register event handlers', error);
    }
  }

  createPlayer(options) {
    if (!this.initialized) {
      logger.error('MusicManager', 'Cannot create player – not initialized');
      return null;
    }

    try {
      const { guildId, textId, voiceId, volume = 100 } = this.parsePlayerOptions(options);
      if (!guildId || !textId || !voiceId) {
        logger.error('MusicManager', 'Missing IDs for player creation', { guildId, textId, voiceId });
        return null;
      }

      const guild = this.client?.guilds?.cache?.get(guildId);
      const shardId = guild?.shardId ?? 'unknown';

      const existing = this.kazagumo.players.get(guildId);
      if (existing) {
        logger.debug('MusicManager', `Player already exists for guild ${guildId} on node "${existing.node.name}" (shard: ${shardId})`);
        return existing;
      }

      const selectedNodeName = this.getBestNode(options.loadBalanceStrategy || 'least-load');
      if (!selectedNodeName) {
        logger.error('MusicManager', `No suitable node available for player creation (shard: ${shardId})`);
        return null;
      }

      logger.info('MusicManager', `Creating player for guild ${guildId} on node "${selectedNodeName}" (shard: ${shardId})`);

      const player = this.kazagumo.createPlayer({
        guildId, textId, voiceId, volume, nodeName: selectedNodeName,
        shardId: typeof shardId === 'number' ? shardId : undefined
      });

      if (!player) {
        logger.error('MusicManager', `Failed to create player for guild ${guildId} on node ${selectedNodeName} (shard: ${shardId})`);
        return null;
      }

      const createdPlayer = this.kazagumo.players.get(guildId) || player;
      logger.success('MusicManager', `Player created successfully for guild ${guildId} on node "${selectedNodeName}" (shard: ${shardId})`);
      return createdPlayer;
    } catch (error) {
      const shardId = options.guildId ? (this.client?.guilds?.cache?.get(options.guildId)?.shardId ?? 'unknown') : 'unknown';
      logger.error('MusicManager', `Error creating player for guild ${options.guildId} (shard: ${shardId}): ${error.message}`);
      return null;
    }
  }

  parsePlayerOptions(options) {
    if (options.guildId && options.textChannelId && options.voiceChannelId) {
      return { guildId: options.guildId, textId: options.textChannelId, voiceId: options.voiceChannelId, volume: options.volume };
    }
    if (options.guildId && options.textChannel && options.voiceChannel) {
      return { guildId: options.guildId, textId: options.textChannel.id, voiceId: options.voiceChannel.id, volume: options.volume };
    }
    logger.error('MusicManager', 'Invalid options for player creation', options);
    return {};
  }

  getNodeStats(nodeName) {
    return this.initialized ? this.kazagumo.shoukaku.nodes.get(nodeName)?.stats || null : null;
  }

  getPlayer(guildId) {
    return this.initialized ? this.kazagumo.players.get(guildId) || null : null;
  }

  destroyPlayer(guildId) {
    if (!this.initialized) return false;
    const player = this.getPlayer(guildId);
    if (!player) return false;
    
    const nodeName = player.node.name;
    logger.info('MusicManager', `Destroying player for guild ${guildId} on node "${nodeName}"`);
    player.destroy();
    logger.debug('MusicManager', `Player destroyed for guild ${guildId}`, {
      nodeName, remainingPlayersOnNode: this.getNodeStats(nodeName)?.players || 'unknown'
    });
    return true;
  }

  async search(query, options = {}) {
    if (!this.initialized) return null;
    try {
      const engine = options.engine || 'spotify';
      const result = await this.kazagumo.search(query, { engine, requester: options.requester });
      if (!result?.tracks?.length) {
        logger.warn('MusicManager', `No tracks found for "${query}" using ${engine}`);
      } else {
        logger.debug('MusicManager', `Found ${result.tracks.length} tracks for "${query}" using ${engine}`);
      }
      return result;
    } catch (error) {
      logger.error('MusicManager', `Search error for "${query}"`, error);
      return null;
    }
  }

  getNodesStatus() {
    if (!this.initialized) return [];
    try {
      const nodes = this.kazagumo.shoukaku.nodes;
      if (!nodes.size) return [];
      
      const nodeStatuses = Array.from(nodes, ([name, node]) => ({
        name, state: 'CONNECTED', connected: true,
        players: node.stats?.players ?? 0,
        playingPlayers: node.stats?.playingPlayers ?? 0,
        uptime: node.stats?.uptime ?? 0,
        memory: node.stats?.memory ?? {},
        cpu: node.stats?.cpu ?? {},
        loadPercentage: this.calculateNodeLoad(node.stats)
      }));

      const totalPlayers = nodeStatuses.reduce((sum, node) => sum + node.players, 0);
      logger.debug('MusicManager', `Current load distribution across ${nodeStatuses.length} nodes`, {
        totalPlayers,
        nodeDistribution: nodeStatuses.map(n => ({ name: n.name, players: n.players, load: n.loadPercentage }))
      });

      return nodeStatuses;
    } catch (error) {
      logger.error('MusicManager', 'Failed to get node status', error);
      return [];
    }
  }

  calculateNodeLoad(stats) {
    if (!stats) return 0;
    const playerLoad = Math.min((stats.players || 0) / 100, 1) * 40;
    const cpuLoad = (stats.cpu?.systemLoad || 0) * 30;
    const memoryLoad = ((stats.memory?.used || 0) / (stats.memory?.allocated || 1)) * 30;
    return Math.min(Math.round(playerLoad + cpuLoad + memoryLoad), 100);
  }

  getNodeStateString(state) {
    return NODE_STATES[state] || 'UNKNOWN';
  }

  getLoadBalancingStats() {
    const nodeStatuses = this.getNodesStatus();
    
    if (!nodeStatuses.length) {
      return { healthy: false, totalNodes: 0, connectedNodes: 0, totalPlayers: 0, averageLoad: 0 };
    }
    
    const totalPlayers = nodeStatuses.reduce((sum, node) => sum + node.players, 0);
    const loads = nodeStatuses.map(n => n.loadPercentage);
    const averageLoad = loads.reduce((sum, load) => sum + load, 0) / loads.length;
    const maxLoad = Math.max(...loads);
    const minLoad = Math.min(...loads);
    
    return {
      healthy: maxLoad < 80 && nodeStatuses.length > 0,
      totalNodes: nodeStatuses.length,
      connectedNodes: nodeStatuses.length,
      totalPlayers,
      averageLoad: Math.round(averageLoad),
      maxLoad, minLoad,
      loadDistribution: nodeStatuses.map(n => ({ name: n.name, load: n.loadPercentage, players: n.players }))
    };
  }
}