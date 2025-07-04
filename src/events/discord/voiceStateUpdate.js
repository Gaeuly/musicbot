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
import { PlayerManager } from '../../managers/PlayerManager.js';
import { EmbedBuilder } from 'discord.js';
import { joinVoiceChannel } from '@discordjs/voice'

export default {
  name: 'voiceStateUpdate',

  /**
   * @param {VoiceState} oldState 
   * @param {VoiceState} newState 
   * @param {Client} client 
   */
  async execute(oldState, newState, client) {
    try {
      const guild = oldState?.guild;
      if (!guild) return;

      const player = client.music?.getPlayer(guild.id);
      if (!player) return;

      const channel = guild.channels?.cache.get(player.voiceId);
      if (!channel) return;

      const textChannel = client.channels?.cache.get(player.textId);
      const playerManager = new PlayerManager(player);

      // Check if 24/7 mode is enabled for this guild
      const is247Enabled = client.db?.is247Enabled(guild.id) || false;
      
      // Avoid double-pause/resume using internal state
      if (!player._state) player._state = { pausedDueToMute: false, pausedDueToVC: false };

      // Handle mute/unmute
      if (oldState.serverMute !== newState.serverMute) {
        try {
          if (newState.serverMute) {
            if (!player.paused) {
              await playerManager.pause();
              player._state.pausedDueToMute = true;

              const embed = new EmbedBuilder()
                .setColor('Yellow')
                .setTitle('Nyaa~? I got muted, senpai...')
         .setDescription(`${client.emoji?.paused || '⏸️'} I had to pause the music because I was <a:byte_muted:1372109843627774034> server-muted~!\n-# Unmute me so I can keep singing for you, okay~?`);
              
              if (textChannel) {
                player._muteMessage = await textChannel.send({ embeds: [embed] }).catch(() => null);
              }
            }
          } else {
            if (player.paused && player._state.pausedDueToMute) {
              await playerManager.resume();
              player._state.pausedDueToMute = false;

              if (player._muteMessage?.deletable) {
                await player._muteMessage.delete().catch(() => {});
              }
              
              if (textChannel) {
                const embed = new EmbedBuilder()
                  .setColor('Green')
                  .setTitle('Yatta~! I’ve been unmuted, senpai~!')
                  .setDescription(`${client.emoji?.playing || '▶️'} The music is back because I was <a:byte_mic:1372109775638102096> unmuted~!\n-# Let’s keep jamming together, okay~?`);
                
                const resumedMessage = await textChannel.send({ embeds: [embed] }).catch(() => null);
                if (resumedMessage) {
                  setTimeout(() => resumedMessage.delete().catch(() => {}), 5000);
                }
              }
            }
          }
        } catch (err) {
          // Silently handle errors in mute/unmute handling
        }
      }

      // Handle empty VC
      try {
        const nonBotMembers = channel.members?.filter(m => !m?.user?.bot) || new Map();
        
        if (nonBotMembers.size === 0) {
          if (!player.paused && !player._state.pausedDueToMute && player.playing) {
            await playerManager.pause().catch(() => {});
            player._state.pausedDueToVC = true;

            if (textChannel) {
              const embed = new EmbedBuilder()
                .setTitle('Uwah~ Everyone left the voice channel 😔')
                .setColor('Orange')
                .setDescription(`${client.emoji?.paused || '▶️'} I’ve paused the music for now~  
${!is247Enabled ? '**I’ll leave in 3 minutes if no one comes back...**' : '*Don’t worry, I’ll wait here since 24/7 mode is on~*'}`);

              player._vcEmptyMessage = await textChannel.send({ embeds: [embed] }).catch(() => null);
            }

            // Only set the leave timeout if 24/7 mode is disabled
            if (!is247Enabled && !player._leaveTimeout) {
              player._leaveTimeout = setTimeout(async () => {
                try {
                  const currentChannel = guild.channels?.cache.get(player.voiceId);
                  if (!currentChannel) return;
                  
                  const stillEmpty = currentChannel.members?.filter(m => !m?.user?.bot).size === 0;
                  // Double-check 24/7 status again in case it was enabled during the timeout
                  const currentIs247 = client.db?.is247Enabled(guild.id) || false;
                  
                  if (stillEmpty && !currentIs247 && client.kazagumo?.players?.has(player.guildId)) {
                    await playerManager.destroy().catch(() => {});

                    if (textChannel) {
                      const embed = new EmbedBuilder()
                        .setColor('Red')
.setTitle('*Sniff sniff*... You really left me alone, senpai...')                       .setDescription('👋 I left the voice channel after 3 minutes of no one coming back~\n-# Call me again when you want to listen together, okay~?');
                      
                      await textChannel.send({ embeds: [embed] }).catch(() => {});
                    }
                  }
                } catch (err) {
                  // Silently handle leave timeout errors
                }
              }, 3 * 60 * 1000);
            }
          }
        } else {
          if (player.paused && player._state.pausedDueToVC) {
            await playerManager.resume().catch(() => {});
            player._state.pausedDueToVC = false;
              
            if (player._vcEmptyMessage?.deletable) {
              await player._vcEmptyMessage.delete().catch(() => {});
              player._vcEmptyMessage = null;
            }

            if (textChannel) {
              const embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('Yay~! Someone came back')
                .setDescription(`${client.emoji?.playing || '▶️'} I resumed the music just for you~\n-# Let’s enjoy it together, okay~?`);
              
              const resumedMessage = await textChannel.send({ embeds: [embed] }).catch(() => null);
              if (resumedMessage) {
                setTimeout(() => resumedMessage.delete().catch(() => {}), 5000);
              }
            }
          }

          if (player._leaveTimeout) {
            clearTimeout(player._leaveTimeout);
            player._leaveTimeout = null;
          }
        }
      } catch (err) {
        // Silently handle empty VC check errors
      }

      // Handle bot disconnection
      try {
        if (oldState.channelId && !newState.channelId && oldState.id === client.user?.id) {
          // If 24/7 mode is enabled, attempt to rejoin
          if (is247Enabled) {
            try {
              const channel = oldState.channel;
              if (!channel) return;

              joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: false,
              });
              
              // Update 24/7 settings with the new channel (just to be sure)
              if (client.db?.set247Mode) {
                client.db.set247Mode(guild.id, true, channel.id, player.textId);
              }
              
              if (textChannel) {
                const embed = new EmbedBuilder()
                  .setColor('Green')
                  .setTitle('Teehee~ I came back on my own, senpai~!')
                  .setDescription('🔄 I auto-reconnected to the voice channel ‘cause 24/7 mode is active~\n-# I’ll stay with you no matter what~!');
                
                await textChannel.send({ embeds: [embed] }).catch(() => {});
              }
            } catch (error) {
              if (textChannel) {
                const errorEmbed = new EmbedBuilder()
                  .setColor('DarkRed')
                  .setDescription('⚠️ Failed to rejoin the voice channel.');
                
                await textChannel.send({ embeds: [errorEmbed] }).catch(() => {});
              }
            }
          }
        }
      } catch (err) {
        // Silently handle bot disconnection errors
      }
    } catch (err) {
      // Silently handle any unexpected errors in the main execution
    }
  }
};
