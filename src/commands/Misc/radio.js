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
import { Command } from '../../structures/Command.js';
import { PlayerManager } from '../../managers/PlayerManager.js';
import { SearchManager } from '../../managers/SearchManager.js';
import { embedManager } from '../../managers/EmbedManager.js';
import { logger } from '../../utils/logger.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import { radioStations } from '../../config/radio.js';

/**
 * Radio command for playing internet radio stations
 */
class RadioCommand extends Command {
  constructor() {
    super({
      name: 'radio',
      description: 'Play live radio stations from various categories',
      usage: 'radio [stop]',
      aliases: ['station', 'fm'],
      category: 'misc',
      cooldown: 3,
      voiceRequired: true,
      examples: [
        'radio',
        'radio stop',
        'station',
        'fm'
      ]
    });
  }

  /**
   * Execute the radio command
   * @param {object} options - Command options
   * @returns {Promise<void>}
   */
  async execute({ message, args, client, musicManager }) {
    const { channel, member, guild } = message;

    try {
      // Get the user's voice channel
      const voiceChannel = member.voice.channel;

      if (!voiceChannel) {
        const reply = embedManager.error(
          'Voice Channel Required',
          'You need to join a voice channel first!'
        );
        return message.reply({ embeds: [reply] });
      }

      // Check if the bot can join and speak in the voice channel
      const permissions = voiceChannel.permissionsFor(guild.members.me);
      if (!permissions.has('Connect') || !permissions.has('Speak')) {
        const reply = embedManager.error(
          'Insufficient Permissions',
          'I need permissions to join and speak in your voice channel!'
        );
        return message.reply({ embeds: [reply] });
      }
      
      // Get the player if it exists
      let player = musicManager.getPlayer(guild.id);
      
      // Handle "radio stop" command
      if (args[0]?.toLowerCase() === 'stop') {
        if (!player || !player.radio) {
          const reply = embedManager.error(
            'No Radio Playing',
            'There is no radio station currently playing.'
          );
          return message.reply({ embeds: [reply] });
        }
        
        // Create a player manager for easier control
        const playerManager = new PlayerManager(player);
        
        // Stop the radio
        await playerManager.stop();
        
        // Reset radio properties
        player.radio = false;
        player.radioName = null;
        player.radioThumbnail = null;
        player.radioCategory = null;
        
        const reply = embedManager.success(
          'Radio Stopped',
          'The radio station has been stopped.'
        );
        return message.reply({ embeds: [reply] });
      }
      
      // Check if a radio station is already playing
      if (player && player.radio) {
        const stationName = player.radioName || 'Unknown Station';
        const categoryName = player.radioCategory ? 
          (player.radioCategory.charAt(0).toUpperCase() + player.radioCategory.slice(1)) : 
          'Unknown Category';
          
        // Create stop button
        const stopButton = new ButtonBuilder()
          .setCustomId('radio_stop')
          .setLabel('Stop Radio')
          .setStyle(ButtonStyle.Danger);
          
        const changeButton = new ButtonBuilder()
          .setCustomId('radio_change')
          .setLabel('Change Station')
          .setStyle(ButtonStyle.Primary);
        
        const buttonRow = new ActionRowBuilder().addComponents(stopButton, changeButton);
        
        const reply = embedManager.create({
          color: embedManager.colors.warning,
          title: '📻 Radio Already Playing',
          description: `A radio station is already playing:\n\n**${stationName}**\nCategory: **${categoryName}**`,
          thumbnail: player.radioThumbnail,
          footer: { text: 'You must stop the current radio before playing a new station' },
          timestamp: true
        });
        
        const replyMsg = await message.reply({
          embeds: [reply],
          components: [buttonRow]
        });
        
        // Create a collector for button interactions
        const filter = i => i.user.id === message.author.id && i.customId.startsWith('radio_');
        const collector = replyMsg.createMessageComponentCollector({
          filter,
          time: 60000, // 1 minute
          max: 1
        });
        
        collector.on('collect', async interaction => {
          await interaction.deferUpdate();
          
          if (interaction.customId === 'radio_stop') {
            // Check if player still exists
            player = musicManager.getPlayer(guild.id);
            if (!player) {
              const noPlayerEmbed = embedManager.error(
                'No Player',
                'The music player is no longer active.'
              );
              return replyMsg.edit({
                embeds: [noPlayerEmbed],
                components: []
              });
            }
            
            // Create a player manager for easier control
            const playerManager = new PlayerManager(player);
            
            // Stop the radio
            await playerManager.stop();
            
            // Reset radio properties
            player.radio = false;
            player.radioName = null;
            player.radioThumbnail = null;
            player.radioCategory = null;
            
            const stoppedEmbed = embedManager.success(
              'Radio Stopped',
              'The radio station has been stopped.'
            );
            
            await replyMsg.edit({
              embeds: [stoppedEmbed],
              components: []
            });
            
          } else if (interaction.customId === 'radio_change') {
            // Delete the current message to avoid confusion
            await replyMsg.delete().catch(() => {});
            
            // Stop the current radio
            if (player) {
              const playerManager = new PlayerManager(player);
              await playerManager.stop();
              
              // Reset radio properties
              player.radio = false;
              player.radioName = null;
              player.radioThumbnail = null;
              player.radioCategory = null;
            }
            
            // Continue with regular radio selection (reuse existing code)
            // This will effectively restart the command with a clean state
            this.showRadioCategories(message, client, musicManager);
          }
        });
        
        collector.on('end', collected => {
          if (collected.size === 0) {
            const timeoutEmbed = embedManager.error(
              'Selection Timeout',
              'Button selection timed out.'
            );
            
            replyMsg.edit({
              embeds: [timeoutEmbed],
              components: []
            }).catch(() => {});
          }
        });
        
        return;
      }

      // Show radio categories if no radio is playing
      await this.showRadioCategories(message, client, musicManager);
      
    } catch (error) {
      logger.error('RadioCommand', 'Command execution error:', error);
      
      const reply = embedManager.error(
        'Error',
        'An error occurred while trying to access radio stations.'
      );
      
      return message.reply({ embeds: [reply] });
    }
  }
  
  /**
   * Show radio categories selection
   * @param {object} message - Discord message object
   * @param {object} client - Discord client
   * @param {object} musicManager - Music manager
   * @returns {Promise<void>}
   */
  async showRadioCategories(message, client, musicManager) {
    const { channel, member, guild } = message;
    
    // Get available radio categories
    const categories = Object.keys(radioStations);
    
    if (categories.length === 0) {
      const reply = embedManager.error(
        'No Radio Stations',
        'No radio stations are configured. Please contact the bot owner.'
      );
      return message.reply({ embeds: [reply] });
    }

    // Create the category selection embed
    const categoryEmbed = embedManager.create({
      color: embedManager.colors.default,
      title: '📻 Radio Categories',
      description: 'Select a radio category to view available stations:',
      footer: { text: 'Select a category to continue' },
      timestamp: true
    });

    // Create buttons for categories (5 per row max)
    const categoryRows = [];
    let currentRow = new ActionRowBuilder();
    let buttonsInCurrentRow = 0;
    
    categories.forEach((category, index) => {
      // Create a button for this category
      const button = new ButtonBuilder()
        .setCustomId(`radio_category_${category}`)
        .setLabel(category.charAt(0).toUpperCase() + category.slice(1))
        .setStyle(ButtonStyle.Primary);
      
      // Add button to current row
      currentRow.addComponents(button);
      buttonsInCurrentRow++;
      
      // If we've reached 5 buttons or this is the last category, push the row
      if (buttonsInCurrentRow === 5 || index === categories.length - 1) {
        categoryRows.push(currentRow);
        currentRow = new ActionRowBuilder();
        buttonsInCurrentRow = 0;
      }
    });

    // Send the category selection message
    const categoryMsg = await message.reply({
      embeds: [categoryEmbed],
      components: categoryRows
    });

    // Create a collector for button interactions
    const filter = i => i.user.id === message.author.id && i.customId.startsWith('radio_category_');
    const collector = categoryMsg.createMessageComponentCollector({
      filter,
      time: 60000, // 1 minute
      max: 1
    });

    collector.on('collect', async interaction => {
      await interaction.deferUpdate();
      
      // Extract the selected category
      const selectedCategory = interaction.customId.replace('radio_category_', '');
      const stations = radioStations[selectedCategory];
      
      if (!stations || stations.length === 0) {
        const noStationsEmbed = embedManager.error(
          'No Stations',
          `No radio stations found in the ${selectedCategory} category.`
        );
        return categoryMsg.edit({
          embeds: [noStationsEmbed],
          components: []
        });
      }

      // Create station selection embed
      const stationEmbed = embedManager.create({
        color: embedManager.colors.default,
        title: `📻 ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Radio Stations`,
        description: 'Select a station from the dropdown menu below:',
        fields: stations.map((station, index) => ({
          name: `${index + 1}. ${station.name}`,
          value: station.description || 'No description available'
        })),
        footer: { text: 'Select a station to start playing' },
        timestamp: true
      });

      // Create station selection dropdown
      const stationSelect = new StringSelectMenuBuilder()
        .setCustomId('radio_station_select')
        .setPlaceholder('Select a radio station')
        .addOptions(stations.map((station, index) => ({
          label: station.name,
          value: `${selectedCategory}_${index}`,
          description: station.description?.substring(0, 100) || 'No description available'
        })));

      const selectRow = new ActionRowBuilder().addComponents(stationSelect);

      // Update the message with station selection
      await categoryMsg.edit({
        embeds: [stationEmbed],
        components: [selectRow]
      });

      // Create a collector for the dropdown menu
      const stationFilter = i => i.user.id === message.author.id && i.customId === 'radio_station_select';
      const stationCollector = categoryMsg.createMessageComponentCollector({
        filter: stationFilter,
        time: 60000, // 1 minute
        max: 1
      });

      stationCollector.on('collect', async stationInteraction => {
        await stationInteraction.deferUpdate();
        
        // Extract the selected station
        const [stationCategory, stationIndex] = stationInteraction.values[0].split('_');
        const selectedStation = radioStations[stationCategory][parseInt(stationIndex)];
        
        if (!selectedStation || !selectedStation.url) {
          const errorEmbed = embedManager.error(
            'Station Error',
            'The selected station is not available.'
          );
          return categoryMsg.edit({
            embeds: [errorEmbed],
            components: []
          });
        }

        // Display "connecting" message
        const connectingEmbed = embedManager.create({
          color: embedManager.colors.default,
          title: '🔄 Connecting to Radio Station',
          description: `Connecting to **${selectedStation.name}**...\nPlease wait a moment.`,
          thumbnail: selectedStation.thumbnail,
          footer: { text: 'Radio stations may take a few seconds to connect' },
          timestamp: true
        });
        
        await categoryMsg.edit({
          embeds: [connectingEmbed],
          components: []
        });

        try {
          // Get or create player
          let player = musicManager.getPlayer(guild.id);
          
          // Create player if it doesn't exist
          if (!player) {
            player = musicManager.createPlayer({
              guildId: guild.id,
              textChannel: channel,
              voiceChannel: member.voice.channel
            });
            
            // Wait for player initialization
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Verify player was created
            player = musicManager.getPlayer(guild.id);
            if (!player) {
              throw new Error('Failed to create player');
            }
          }
          
          // Create a player manager for easier control
          const playerManager = new PlayerManager(player);
          
          // Stop any currently playing music
          if (player.queue.length > 0 || player.playing || player.paused) {
            await playerManager.stop();
          }
          
          // Set radio properties
          player.radio = true;
          player.radioName = selectedStation.name;
          player.radioThumbnail = selectedStation.thumbnail;
          player.radioCategory = stationCategory;
          
          // Use the SearchManager for proper track resolution
          const searchManager = new SearchManager(musicManager);
          
          // Resolve the radio URL to a proper track
          const result = await searchManager.search(selectedStation.url, {
            requester: message.author,
            platform: 'http' // Treat as direct link
          });
          
          if (!result || !result.tracks || !result.tracks.length) {
            throw new Error('Could not resolve radio stream URL');
          }
          
          // Get the first track
          const radioTrack = result.tracks[0];
          
          // Customize the track with radio station info
          radioTrack.title = selectedStation.name;
          radioTrack.author = `${stationCategory.charAt(0).toUpperCase() + stationCategory.slice(1)} Radio`;
          radioTrack.thumbnail = selectedStation.thumbnail;
          radioTrack.isStream = true;
          
          // Play the resolved track
          await player.play(radioTrack);
          
          // Update the message to show it's playing
          const playingEmbed = embedManager.success(
            '📻 Radio Station Connected',
            `Now playing: **${selectedStation.name}**\nCategory: **${stationCategory.charAt(0).toUpperCase() + stationCategory.slice(1)}**`
          );
          
          await categoryMsg.edit({
            embeds: [playingEmbed],
            components: []
          });
          
        } catch (error) {
          logger.error('RadioCommand', 'Error playing radio station', error);
          
          const errorEmbed = embedManager.error(
            'Radio Playback Error',
            'An error occurred while trying to play the radio station.'
          );
          
          await categoryMsg.edit({
            embeds: [errorEmbed],
            components: []
          });
        }
      });

      stationCollector.on('end', collected => {
        if (collected.size === 0) {
          const timeoutEmbed = embedManager.error(
            'Selection Timeout',
            'Radio station selection timed out.'
          );
          
          categoryMsg.edit({
            embeds: [timeoutEmbed],
            components: []
          }).catch(() => {});
        }
      });
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        const timeoutEmbed = embedManager.error(
          'Selection Timeout',
          'Radio category selection timed out.'
        );
        
        categoryMsg.edit({
          embeds: [timeoutEmbed],
          components: []
        }).catch(() => {});
      }
    });
  }
}

export default new RadioCommand();
