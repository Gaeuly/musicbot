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
import { ActivityType } from 'discord.js';
import { logger } from '../../utils/logger.js';
import { config } from '../../config/config.js';
import { PlayerManager } from '../../managers/PlayerManager.js';
import { SearchManager } from '../../managers/SearchManager.js';
import { embedManager } from '../../managers/EmbedManager.js';
import { Guild } from '../../database/Guild.js';
import fs from 'fs';
import path from 'path';
import { AttachmentBuilder } from 'discord.js';

const guildDB = new Guild();

export default {
  name: 'ready',
  once: true,
  async execute(client) {
    logger.info('Bot', 'Scheduling database backups every 30 minutes');
    sendDatabaseBackups(client);
    setInterval(() => sendDatabaseBackups(client), 30 * 60 * 1000);
    
    const { user, guilds } = client;
    logger.success('Bot', `Logged in as ${user.tag}`);
    logger.info('Bot', `Serving ${guilds.cache.size} guilds`);
      
    const updateStatus = () => {
      let members = guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
      user.setActivity({
        name: `is this a comeback?`,
        type: getStatusType(config.status.type),
      });
    };
  
    updateStatus();
    setInterval(updateStatus, 10 * 60 * 1000);
    user.setStatus(config.status.status || 'dnd');

    const nodes = client.music.getNodesStatus();
    if (nodes.length > 0) {
      nodes.forEach(node => {
        const status = node.connected ? 'Connected' : 'Disconnected';
        logger.info('Lavalink', `Node: ${node.name} - Status: ${status}`);
      });
    } else {
      logger.warn('Lavalink', 'No Lavalink nodes configured');
    }

    logger.info('Bot', 'Scheduling recovery in 10 seconds...');
    setTimeout(async () => {
      logger.info('Bot', 'Starting recovery process.');
      await recover247Players(client);
      await recoverRequestChannels(client);
    }, 10000);
  },
};

function getStatusType(type) {
  const types = {
    'PLAYING': ActivityType.Playing,
    'STREAMING': ActivityType.Streaming,
    'LISTENING': ActivityType.Listening,
    'WATCHING': ActivityType.Watching,
    'COMPETING': ActivityType.Competing,
    'CUSTOM': ActivityType.Custom
  };
  return types[type] || ActivityType.Custom;
}

async function recover247Players(client) {
  logger.info('Recovery', 'Starting 24/7 player recovery.');
  try {
    const guildsWithStayEnabled = guildDB.getAll247Guilds();
    logger.info('Recovery', `Found ${guildsWithStayEnabled.length} guilds with 24/7 mode enabled`);

    for (const guildData of guildsWithStayEnabled) {
      await recoverGuildPlayer(client, guildData.id);
    }

    logger.info('Recovery', 'Finished 24/7 player recovery.');
  } catch (error) {
    logger.error('Recovery', 'Failed to recover 24/7 players', error);
  }
}

async function recoverRequestChannels(client) {
  logger.info('Recovery', 'Starting request channel recovery.');
  try {
    const guildsWithRequests = guildDB.getAllRequestGuilds();
    logger.info('Recovery', `Found ${guildsWithRequests.length} guilds with request system enabled`);

    for (const guildData of guildsWithRequests) {
      const guild = client.guilds.cache.get(guildData.id);
      if (!guild) {
        logger.warn('Recovery', `Guild ${guildData.id} not found, cleaning up request system`);
        guildDB.setRequestSystem(guildData.id, false, null);
        continue;
      }

      const channel = guild.channels.cache.get(guildData.twenty_four_seven_text_id);
      if (!channel) {
        logger.warn('Recovery', `Request channel not found for guild ${guild.name}, cleaning up`);
        guildDB.setRequestSystem(guildData.id, false, null);
        continue;
      }

      const permissions = channel.permissionsFor(guild.members.me);
      if (!permissions.has('SendMessages') || !permissions.has('ManageMessages')) {
        logger.warn('Recovery', `Insufficient permissions in request channel for guild ${guild.name}`);
        continue;
      }

      logger.info('Recovery', `Request system active for guild ${guild.name} in channel ${channel.name}`);
    }

    logger.info('Recovery', 'Finished request channel recovery.');
  } catch (error) {
    logger.error('Recovery', 'Failed to recover request channels', error);
  }
}

async function sendDatabaseBackups(client) {
  try {
    const backupChannelId = '1223205399163834419';
    const channel = client.channels.cache.get(backupChannelId);
    
    if (!channel) {
      logger.error('Backup', `Backup channel ${backupChannelId} not found`);
      return;
    }
    
    const dbDirectory = path.join(process.cwd(), 'database');
    const files = fs.readdirSync(dbDirectory);
    const dbFiles = files.filter(file => file.endsWith('.db'));
    
    logger.info('Backup', `Sending ${dbFiles.length} database files to backup channel`);
    
    for (const file of dbFiles) {
      const filePath = path.join(dbDirectory, file);
      const attachment = new AttachmentBuilder(filePath, { name: file });
      await channel.send({ files: [attachment] });
    }
    
    logger.success('Backup', 'Database backup files sent successfully');
  } catch (error) {
    logger.error('Backup', 'Failed to send database backups', error);
  }
}

async function recoverGuildPlayer(client, guildId) {
  try {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      logger.warn('Recovery', `Guild ${guildId} not found, skipping recovery`);
      return;
    }

    const channelInfo = guildDB.get247Channels(guildId);
    if (!channelInfo || !channelInfo.voiceChannelId || !channelInfo.textChannelId) {
      logger.warn('Recovery', `No valid 24/7 channel info found for guild ${guild.name}`);
      return;
    }

    const voiceChannel = guild.channels.cache.get(channelInfo.voiceChannelId);
    const textChannel = guild.channels.cache.get(channelInfo.textChannelId);

    if (!voiceChannel) {
      logger.warn('Recovery', `Voice channel not found for guild ${guild.name}`);
      return;
    }

    if (!textChannel) {
      logger.warn('Recovery', `Text channel not found for guild ${guild.name}`);
    }

    const permissions = voiceChannel.permissionsFor(guild.members.me);
    if (!permissions || !permissions.has('Connect') || !permissions.has('Speak')) {
      logger.warn('Recovery', `Insufficient permissions in voice channel for guild ${guild.name}`);
      
      if (textChannel) {
        textChannel.send(`Cannot join ${voiceChannel.name} due to missing permissions. 24/7 mode has been cleared.`).catch(() => {});
      }
      return;
    }

    const player = await client.music.createPlayer({
      guildId: guildId,
      textChannel: textChannel, 
      voiceChannel: voiceChannel, 
      selfDeaf: true,
      selfMute: false
    });

    if (!player) {
      logger.error('Recovery', `Failed to create player for guild ${guild.name}`);
      return;
    }

    const playerManager = new PlayerManager(player);
    
    let queueToRestore = [];
    let currentTrackToRestore = null;
    
    const playerState = client.db.getPlayerState(guildId);
    
    if (playerState) {
      if (playerState.queue && Array.isArray(playerState.queue)) {
        queueToRestore = playerState.queue;
      }
      if (playerState.currentTrack) {
        currentTrackToRestore = playerState.currentTrack;
      }
    }

    const searchManager = new SearchManager(client.music);
    let botMember = guild.members.me;
    let requester = botMember ? {
      id: botMember.id,
      username: botMember.user.username,
      avatar: botMember.user.displayAvatarURL({ dynamic: true })
    } : null;

    let hasRestoredTracks = false;

    if (currentTrackToRestore) {
      try {
        let searchQuery = '';
        if (currentTrackToRestore.uri && searchManager.isUrl(currentTrackToRestore.uri)) {
          searchQuery = currentTrackToRestore.uri;
        } else {
          searchQuery = `${currentTrackToRestore.title} ${currentTrackToRestore.author || ''}`.trim();
        }
        
        let platform = 'spotify'; 
        if (currentTrackToRestore.uri) {
          const detectedPlatform = searchManager.detectSourceFromUrl(currentTrackToRestore.uri);
          if (detectedPlatform) {
            platform = detectedPlatform;
          }
        }
        
        const searchResult = await searchManager.search(searchQuery, {
          platform: platform,
          requester: requester,
          limit: 1
        });
        
        if (searchResult && searchResult.tracks && searchResult.tracks.length > 0) {
          const freshTrack = searchResult.tracks[0];
          await player.play(freshTrack);
          hasRestoredTracks = true;
        } else {
          logger.warn('Recovery', `Could not find match for current track "${searchQuery}" for ${guild.name}`);
        }
      } catch (searchError) {
        logger.error('Recovery', `Failed to search for current track for ${guild.name}: ${searchError.message}`, searchError);
      }
    }

    if (queueToRestore && queueToRestore.length > 0) {
      try {
        const restoredQueue = [];
        for (const savedTrack of queueToRestore) {
          try {
            let searchQuery = '';
            if (savedTrack.uri && searchManager.isUrl(savedTrack.uri)) {
              searchQuery = savedTrack.uri;
            } else {
              searchQuery = `${savedTrack.title} ${savedTrack.author || ''}`.trim();
            }
            
            let platform = 'spotify';
            if (savedTrack.uri) {
              const detectedPlatform = searchManager.detectSourceFromUrl(savedTrack.uri);
              if (detectedPlatform) {
                platform = detectedPlatform;
              }
            }
            
            const searchResult = await searchManager.search(searchQuery, {
              platform: platform,
              requester: savedTrack.requester || requester,
              limit: 1
            });
            
            if (searchResult && searchResult.tracks && searchResult.tracks.length > 0) {
              restoredQueue.push(searchResult.tracks[0]);
            }
          } catch (trackError) {
            logger.error('Recovery', `Error restoring queue track: ${trackError.message}`);
          }
        }
        
        if (restoredQueue.length > 0) {
          playerManager.queue.add(restoredQueue);
          hasRestoredTracks = true;
          logger.info('Recovery', `Restored ${restoredQueue.length} tracks to queue for ${guild.name}`);
        }
      } catch (queueError) {
        logger.error('Recovery', `Failed to restore queue for ${guild.name}: ${queueError.message}`, queueError);
      }
    }

    if (textChannel) {
      try {
        if (hasRestoredTracks) {
          const recoveryEmbed = embedManager.create({
            color: embedManager.colors.success,
            title: `${client.emoji.success} Session Recovered`,
            description: `Recovered previous session for 24/7 mode.\n${
              playerManager.queue.size > 0 ? `${playerManager.queue.size} tracks in queue.` : 'Queue is now empty.'
            }${
              player.current ? `\nNow playing: **${player.current.title}**` : ''
            }`,
            footer: { text: '24/7 mode is active.' },
            timestamp: true
          });
          await textChannel.send({ embeds: [recoveryEmbed] });
        }
      } catch (msgError) {
        logger.error('Recovery', `Failed to send recovery message to ${textChannel.name}: ${msgError.message}`);
      }
    }

    if (!player.current && playerManager.queue.size > 0) {
      try {
        await playerManager.play();
        logger.info('Recovery', `Started playback from queue for ${guild.name}`);
      } catch (startError) {
        logger.error('Recovery', `Failed to start playback from queue for ${guild.name}: ${startError.message}`, startError);
      }
    }

  } catch (error) {
    logger.error('Recovery', `Error recovering player for guild ${guildId}`, error);
    const guild = client.guilds.cache.get(guildId);
    if (guild) {
      const channelInfo = guildDB.get247Channels(guildId);
      if (channelInfo && channelInfo.textChannelId) {
        const textChannel = guild.channels.cache.get(channelInfo.textChannelId);
        if (textChannel) {
          textChannel.send(`⚠️ An error occurred while trying to restore the player for 24/7 mode. 24/7 mode for this guild has been temporarily disabled. Please re-enable it if desired. Error: ${error.message}`).catch(e => logger.error('Recovery', `Failed to send error message: ${e.message}`));
        }
      }
    }
  }
}