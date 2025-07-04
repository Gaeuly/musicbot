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

import { PlayerManager } from '../../managers/PlayerManager.js';

/**

 * Player destroyed event for Kazagumo

 */

export default {

  name: 'playerDestroy',

  /**

   * Execute the player destroyed event

   * @param {object} player - Kazagumo player

   * @param {object} client - Discord client

   * @param {object} musicManager - Music manager (added parameter)

   */

  async execute(player, client ) {

    try {
 const musicManager = client.music      // Get the guild

      const guild = client.guilds.cache.get(player.guildId);

      if (!guild) return;

      // Get the text channel

      const channel = guild.channels.cache.get(player.textId);
      if (!channel) return;

         

      // Delete the player message instead of just removing components

      if (player.messageId) {

        try {

          const lastMessage = await channel.messages.fetch(player.messageId).catch(() => null);

          if (lastMessage) {

            await lastMessage.delete().catch((err) => {

              logger.warn('PlayerDestroyed', `Failed to delete player message: ${err.message}`);

            });

         

          }

        } catch (deleteError) {

          logger.error('PlayerDestroyed', 'Error deleting player message', deleteError);

        }

      }

      // Check if 247 mode is enabled for this guild

      // Using the same method as in ready.js - check if guild is in the 247 guilds list

      const guildsWithStayEnabled = client.db.getAll247Guilds();

      const is247Guild = guildsWithStayEnabled.find(g => g.id === player.guildId);

      const is247Enabled = !!is247Guild;

      
      if (player.radio) {
        player.radio = null;  
        player.radioName = null;
        player.radioThumbnail = null;
        player.radioCategory = null;
      }
        
      if (is247Enabled) {


        

        // Get saved voice channel and text channel IDs from the database

        const channelInfo = client.db.get247Channels(player.guildId);

        

        if (channelInfo && channelInfo.voiceChannelId && channelInfo.textChannelId) {

          const voiceChannel = guild.channels.cache.get(channelInfo.voiceChannelId);

          const textChannel = channel || guild.channels.cache.get(channelInfo.textChannelId);

          

          if (voiceChannel && textChannel) {

            // Wait a short delay before recreating the player to avoid race conditions

            setTimeout(async () => {

              try {

                // Check if the player was already recreated by something else

                if (musicManager.getPlayer(player.guildId)) {

                  logger.info('PlayerDestroyed', `Player already exists for ${guild.name}, skipping recreation`);

                  return;

                }

                

                // Check permissions for the voice channel

                const permissions = voiceChannel.permissionsFor(guild.members.me);

                if (!permissions || !permissions.has('Connect') || !permissions.has('Speak')) {

                  logger.warn('PlayerDestroyed', `Insufficient permissions in voice channel ${voiceChannel.name} for guild ${guild.name}`);

                  

                  const permErrorEmbed = embedManager.error(

                    'Insufficient Permissions',

                    `I need permissions to join and speak in ${voiceChannel.name} to maintain 24/7 mode!`

                  );

                  

                  textChannel.send({ embeds: [permErrorEmbed] }).catch(() => {});

                  return;

                }

                

                // Create a new player - using the same structure as in the ready.js

                const newPlayer = await musicManager.createPlayer({

                  guildId: player.guildId,

                  textChannel: textChannel,

                  voiceChannel: voiceChannel,

                  selfDeaf: true,

                  selfMute: false

                });

                

                if (newPlayer) {

               

                  

                  // Create a PlayerManager instance for better control

                  const playerManager = new PlayerManager(newPlayer);

                  

                  // Send a message to notify about 247 mode

                  const embed = embedManager.create({

                    color: embedManager.colors.info,

                    title: '24/7 Mode',

                    description: `Staying connected to <#${voiceChannel.id}> because 24/7 mode is enabled.`,

                    footer: { text: 'Use "247 off" to disable this feature' },

                    timestamp: true

                  });

                  

                  await textChannel.send({ embeds: [embed] }).catch(() => {});

                } else {

                  logger.error('PlayerDestroyed', `Failed to recreate player for ${guild.name} (247 mode)`);

                  

                  const errorEmbed = embedManager.error(

                    '24/7 Player Creation Failed',

                    'Failed to maintain 24/7 mode connection. Please use the 247 command again if you want to re-enable it.'

                  );

                  

                  await textChannel.send({ embeds: [errorEmbed] }).catch(() => {});

                }

              } catch (recreateError) {

                logger.error('PlayerDestroyed', 'Error recreating player for 247 mode', recreateError);

              }

            }, 1000); // 1 second delay

            

            // Return early since we're handling reconnection

            return;

          } else {

            logger.warn('PlayerDestroyed', `Could not find saved voice/text channels for ${guild.name}, cannot maintain 247 mode`);

            if (channel) {

              const missingChannelEmbed = embedManager.error(

                '24/7 Mode Error',

                'Could not find the saved voice or text channel. 24/7 mode might be disabled.'

              );

              channel.send({ embeds: [missingChannelEmbed] }).catch(() => {});

            }

          }

        }

      }

      logger.info('Player', `Player destroyed in ${guild.name}`);

      

      // Delete player state from database only if 247 mode is not enabled

      if (!is247Enabled) {

        db.deletePlayerState(player.guildId);

      } else {

        // Make sure the player state is updated for 247 mode

        const channelInfo = client.db.get247Channels(player.guildId);

        if (channelInfo) {

          db.savePlayerState(player.guildId, {

            textChannelId: channelInfo.textChannelId,

            voiceChannelId: channelInfo.voiceChannelId,

            is247: true

          });

        }

      }


     

    } catch (error) {

      logger.error('PlayerDestroyed', 'Error handling player destroyed event', error);

    }

  },

};
