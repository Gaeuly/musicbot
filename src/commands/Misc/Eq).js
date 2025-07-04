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
import { embedManager } from '../../managers/EmbedManager.js';
import { logger } from '../../utils/logger.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder } from 'discord.js';

/**
 * Advanced equalizer command with interactive controls and visualizations
 */
class EqualizerCommand extends Command {
  constructor() {
    super({
      name: 'equalizer',
      aliases: ['eq', 'customequal', 'eqset'],
      description: 'Advanced equalizer with interactive controls to customize your sound profile',
      usage: 'equalizer [preset]',
      category: 'filters',
      cooldown: 5,
      sameVoiceRequired: true,
      voiceRequired: true,
      playerRequired: true,
      playingRequired: true,
      examples: ['equalizer', 'equalizer bass', 'equalizer electronic']
    });
    
    // Default EQ settings
    this.defaultEqualizer = [
      { band: 0, gain: 0.0 }, // 25 Hz
      { band: 1, gain: 0.0 }, // 40 Hz
      { band: 2, gain: 0.0 }, // 63 Hz
      { band: 3, gain: 0.0 }, // 100 Hz
      { band: 4, gain: 0.0 }, // 160 Hz
      { band: 5, gain: 0.0 }, // 250 Hz
      { band: 6, gain: 0.0 }, // 400 Hz
      { band: 7, gain: 0.0 }, // 630 Hz
      { band: 8, gain: 0.0 }, // 1k Hz
      { band: 9, gain: 0.0 }, // 1.6k Hz
      { band: 10, gain: 0.0 }, // 2.5k Hz
      { band: 11, gain: 0.0 }, // 4k Hz
      { band: 12, gain: 0.0 }, // 6.3k Hz
      { band: 13, gain: 0.0 }, // 10k Hz
      { band: 14, gain: 0.0 }  // 16k Hz
    ];
    
    // Band frequency labels with improved formatting
    this.bandLabels = [
      '25Hz', '40Hz', '63Hz', '100Hz', '160Hz', 
      '250Hz', '400Hz', '630Hz', '1kHz', '1.6kHz', 
      '2.5kHz', '4kHz', '6.3kHz', '10kHz', '16kHz'
    ];
    
    // Enhanced preset EQ configurations with more options
    this.presets = {
      'flat': this.defaultEqualizer,
      'bass': [
        { band: 0, gain: 0.6 },
        { band: 1, gain: 0.7 },
        { band: 2, gain: 0.8 },
        { band: 3, gain: 0.55 },
        { band: 4, gain: 0.25 },
        { band: 5, gain: 0 },
        { band: 6, gain: -0.25 },
        { band: 7, gain: -0.45 },
        { band: 8, gain: -0.55 },
        { band: 9, gain: -0.7 },
        { band: 10, gain: -0.3 },
        { band: 11, gain: -0.25 },
        { band: 12, gain: 0 },
        { band: 13, gain: 0 },
        { band: 14, gain: 0 },
      ],
      'treble': [
        { band: 0, gain: -0.2 },
        { band: 1, gain: -0.2 },
        { band: 2, gain: -0.2 },
        { band: 3, gain: -0.15 },
        { band: 4, gain: -0.1 },
        { band: 5, gain: 0 },
        { band: 6, gain: 0.15 },
        { band: 7, gain: 0.25 },
        { band: 8, gain: 0.4 },
        { band: 9, gain: 0.55 },
        { band: 10, gain: 0.7 },
        { band: 11, gain: 0.75 },
        { band: 12, gain: 0.8 },
        { band: 13, gain: 0.85 },
        { band: 14, gain: 0.9 },
      ],
      'vocal': [
        { band: 0, gain: -0.2 },
        { band: 1, gain: -0.15 },
        { band: 2, gain: -0.1 },
        { band: 3, gain: 0 },
        { band: 4, gain: 0.15 },
        { band: 5, gain: 0.3 },
        { band: 6, gain: 0.45 },
        { band: 7, gain: 0.6 },
        { band: 8, gain: 0.5 },
        { band: 9, gain: 0.3 },
        { band: 10, gain: 0.15 },
        { band: 11, gain: 0 },
        { band: 12, gain: -0.1 },
        { band: 13, gain: -0.15 },
        { band: 14, gain: -0.2 },
      ],
      'electronic': [
        { band: 0, gain: 0.375 },
        { band: 1, gain: 0.35 },
        { band: 2, gain: 0.125 },
        { band: 3, gain: 0 },
        { band: 4, gain: 0 },
        { band: 5, gain: -0.125 },
        { band: 6, gain: -0.125 },
        { band: 7, gain: 0 },
        { band: 8, gain: 0.25 },
        { band: 9, gain: 0.125 },
        { band: 10, gain: 0.15 },
        { band: 11, gain: 0.2 },
        { band: 12, gain: 0.25 },
        { band: 13, gain: 0.35 },
        { band: 14, gain: 0.4 },
      ],
      'classical': [
        { band: 0, gain: 0.3 },
        { band: 1, gain: 0.2 },
        { band: 2, gain: 0.1 },
        { band: 3, gain: 0 },
        { band: 4, gain: -0.1 },
        { band: 5, gain: -0.1 },
        { band: 6, gain: 0 },
        { band: 7, gain: 0.1 },
        { band: 8, gain: 0.2 },
        { band: 9, gain: 0.2 },
        { band: 10, gain: 0.2 },
        { band: 11, gain: 0.1 },
        { band: 12, gain: 0 },
        { band: 13, gain: -0.1 },
        { band: 14, gain: -0.2 },
      ],
      'rock': [
        { band: 0, gain: 0.3 },
        { band: 1, gain: 0.25 },
        { band: 2, gain: 0.2 },
        { band: 3, gain: 0.1 },
        { band: 4, gain: 0.05 },
        { band: 5, gain: -0.05 },
        { band: 6, gain: -0.15 },
        { band: 7, gain: -0.1 },
        { band: 8, gain: 0 },
        { band: 9, gain: 0.15 },
        { band: 10, gain: 0.3 },
        { band: 11, gain: 0.45 },
        { band: 12, gain: 0.6 },
        { band: 13, gain: 0.5 },
        { band: 14, gain: 0.4 },
      ],
      'acoustic': [
        { band: 0, gain: 0.1 },
        { band: 1, gain: 0.1 },
        { band: 2, gain: 0.05 },
        { band: 3, gain: 0 },
        { band: 4, gain: 0 },
        { band: 5, gain: 0.05 },
        { band: 6, gain: 0.15 },
        { band: 7, gain: 0.2 },
        { band: 8, gain: 0.25 },
        { band: 9, gain: 0.3 },
        { band: 10, gain: 0.25 },
        { band: 11, gain: 0.2 },
        { band: 12, gain: 0.1 },
        { band: 13, gain: 0.05 },
        { band: 14, gain: 0 },
      ],
      'pop': [
        { band: 0, gain: -0.1 },
        { band: 1, gain: -0.1 },
        { band: 2, gain: -0.05 },
        { band: 3, gain: 0 },
        { band: 4, gain: 0.1 },
        { band: 5, gain: 0.2 },
        { band: 6, gain: 0.3 },
        { band: 7, gain: 0.3 },
        { band: 8, gain: 0.3 },
        { band: 9, gain: 0.2 },
        { band: 10, gain: 0.1 },
        { band: 11, gain: 0 },
        { band: 12, gain: -0.05 },
        { band: 13, gain: -0.1 },
        { band: 14, gain: -0.15 },
      ],
    };
    
    // Max EQ values for safety and Discord API limits
    this.maxGain = 0.75;
    this.minGain = -0.75;
  }

  /**
   * Execute the enhanced equalizer command
   * @param {object} options - Command options
   * @returns {Promise<void>}
   */
  async execute({ message, args, client, musicManager }) {
    const { guild } = message;

    try {
      // Check if there's an active player
      const player = musicManager.getPlayer(guild.id);
      if (!player || (!player.queue.current && !player.playing)) {
        const reply = embedManager.error(
          'No Active Player',
          'There is no music currently playing. Use the play command first!'
        );
        return message.reply({ embeds: [reply] });
      }

      // Store current volume to restore after filter application
      const currentVolume = player.volume;
      
      // Handle preset directly from command arguments
      if (args.length > 0) {
        const presetName = args[0].toLowerCase();
        if (this.presets[presetName]) {
          await this.applyEqualizer(player, this.presets[presetName], currentVolume);
          
          const presetEmbed = embedManager.success(
            '🎚️ Equalizer Preset Applied',
            `Applied the "${presetName}" preset to the current playback.`
          );
          
          // Add visualization of the preset
          presetEmbed.addFields([
            { 
              name: 'EQ Profile', 
              value: this.createEQVisualization(this.presets[presetName]) 
            }
          ]);
          
          return message.reply({ embeds: [presetEmbed] });
        } else {
          // Show available presets if the requested one doesn't exist
          const availablePresets = Object.keys(this.presets).join(', ');
          return message.reply({ 
            embeds: [embedManager.info(
              'Invalid Preset',
              `The preset "${args[0]}" doesn't exist. Available presets: ${availablePresets}`
            )] 
          });
        }
      }
      
      // Initialize with current EQ or default
      let currentEQ = this.defaultEqualizer;
      let currentPage = 0;
      const pageSize = 5; // Show 5 bands per page
      const totalPages = Math.ceil(this.defaultEqualizer.length / pageSize);
      
      // Create initial equalizer message
      const initialEmbed = this.createEqualizerEmbed(currentEQ, currentPage, pageSize);
      
      // Create preset rows (split into two rows for better organization)
      const presetRow1 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('preset_flat')
            .setLabel('Flat')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('preset_bass')
            .setLabel('Bass')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('preset_treble')
            .setLabel('Treble')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('preset_vocal')
            .setLabel('Vocal')
            .setStyle(ButtonStyle.Secondary),  
          new ButtonBuilder()
            .setCustomId('preset_electronic')
            .setLabel('Electronic')
            .setStyle(ButtonStyle.Secondary),
        );
        
      const presetRow2 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('preset_classical')
            .setLabel('Classical')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('preset_rock')
            .setLabel('Rock')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('preset_acoustic')
            .setLabel('Acoustic')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('preset_pop')
            .setLabel('Pop')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('apply')
            .setLabel('✅ Apply')
            .setStyle(ButtonStyle.Success),
        );
      
      // Create navigation row with additional controls
      const navRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('prev_page')
            .setLabel('◀️ Previous')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === 0),
          new ButtonBuilder()
            .setCustomId('next_page')
            .setLabel('Next ▶️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === totalPages - 1),
          new ButtonBuilder()
            .setCustomId('reset')
            .setLabel('🔄 Reset')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('preview')
            .setLabel('🔊 Preview')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('random')
            .setLabel('🎲 Random')
            .setStyle(ButtonStyle.Secondary),
        );
      
      // Create EQ adjustment buttons
      const createEQRow = (pageStart) => {
        const eqRow = new ActionRowBuilder();
        
        for (let i = 0; i < pageSize; i++) {
          const bandIndex = pageStart + i;
          if (bandIndex < currentEQ.length) {
            eqRow.addComponents(
              new ButtonBuilder()
                .setCustomId(`adjust_${bandIndex}`)
                .setLabel(`${this.bandLabels[bandIndex]}`)
                .setStyle(ButtonStyle.Secondary)
            );
          }
        }
        
        return eqRow;
      };
      
      // Create adjustment value row with more precise controls
      const valueRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('minus_0.75')
            .setLabel('-0.75')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('minus_0.25')
            .setLabel('-0.25')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('plus_0.25')
            .setLabel('+0.25')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('plus_0.75')
            .setLabel('+0.75')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('band_reset')
            .setLabel('Reset Band')
            .setStyle(ButtonStyle.Secondary)
        );
      
      // Send initial message with components
      const eqRow = createEQRow(currentPage * pageSize);
      const reply = await message.reply({ 
        embeds: [initialEmbed], 
        components: [presetRow1, presetRow2, navRow, eqRow, valueRow]
      });
      
      // Create the collector for button interactions with increased timeout
      const collector = reply.createMessageComponentCollector({ 
        componentType: ComponentType.Button, 
        time: 600000 // 10 minutes
      });
      
      let selectedBand = null;
      
      // Function to update embed and components
      const updateMessage = async (interaction) => {
        const updatedEmbed = this.createEqualizerEmbed(currentEQ, currentPage, pageSize, selectedBand);
        
        // Update navigation buttons
        navRow.components[0].setDisabled(currentPage === 0);
        navRow.components[1].setDisabled(currentPage === totalPages - 1);
        
        // Update the EQ row for the current page
        const updatedEQRow = createEQRow(currentPage * pageSize);
        
        try {
          // Update the message with all component rows
          await interaction.update({ 
            embeds: [updatedEmbed], 
            components: [presetRow1, presetRow2, navRow, updatedEQRow, valueRow]
          });
        } catch (err) {
          logger.error('EnhancedEqualizerCommand', 'Failed to update interaction:', err);
          // Fallback to editing the original message
          try {
            await reply.edit({ 
              embeds: [updatedEmbed], 
              components: [presetRow1, presetRow2, navRow, updatedEQRow, valueRow]
            });
          } catch (editErr) {
            logger.error('EnhancedEqualizerCommand', 'Failed to edit message:', editErr);
          }
        }
      };
      
      collector.on('collect', async interaction => {
        // Ensure only the command author can use the controls
        if (interaction.user.id !== message.author.id) {
          await interaction.reply({ 
            content: 'This equalizer belongs to someone else. Please use the `equalizer` command to create your own.', 
            ephemeral: true 
          });
          return;
        }
        
        const customId = interaction.customId;
        
        try {
          // Handle preset selection
          if (customId.startsWith('preset_')) {
            const presetName = customId.replace('preset_', '');
            if (this.presets[presetName]) {
              currentEQ = JSON.parse(JSON.stringify(this.presets[presetName])); // Deep copy
              selectedBand = null;
              
              // Preview the preset immediately
              await this.applyEqualizer(player, currentEQ, currentVolume);
              
              await interaction.reply({
                content: `🎚️ "${presetName}" preset applied! Use the Apply button to confirm.`,
                ephemeral: true
              });
              
              await updateMessage(interaction);
              return;
            }
          }
          // Handle page navigation
          else if (customId === 'prev_page') {
            if (currentPage > 0) {
              currentPage--;
              selectedBand = null;
              await updateMessage(interaction);
            }
          }
          else if (customId === 'next_page') {
            if (currentPage < totalPages - 1) {
              currentPage++;
              selectedBand = null;
              await updateMessage(interaction);
            }
          }
          // Handle reset
          else if (customId === 'reset') {
            currentEQ = JSON.parse(JSON.stringify(this.defaultEqualizer)); // Deep copy
            selectedBand = null;
            
            // Reset equalizer immediately
            await this.applyEqualizer(player, currentEQ, currentVolume);
            
            await interaction.reply({
              content: '🔄 Equalizer has been reset to default settings!',
              ephemeral: true
            });
            
            await updateMessage(interaction);
            return;
          }
          // Handle random EQ generation
          else if (customId === 'random') {
            // Generate random EQ settings
            for (let i = 0; i < currentEQ.length; i++) {
              // Random value between min and max gain, rounded to 2 decimal places
              currentEQ[i].gain = parseFloat((Math.random() * (this.maxGain - this.minGain) + this.minGain).toFixed(2));
            }
            
            selectedBand = null;
            
            // Preview the random EQ
            await this.applyEqualizer(player, currentEQ, currentVolume);
            
            await interaction.reply({
              content: '🎲 Random equalizer settings generated! Use the Apply button to confirm.',
              ephemeral: true
            });
            
            await updateMessage(interaction);
            return;
          }
          // Handle preview
          else if (customId === 'preview') {
            // Apply current EQ for preview
            await this.applyEqualizer(player, currentEQ, currentVolume);
            
            await interaction.reply({
              content: '🔊 Previewing current equalizer settings. Use the Apply button to confirm.',
              ephemeral: true
            });
            return;
          }
          // Handle apply
          else if (customId === 'apply') {
            // Apply the current equalizer settings permanently
            await this.applyEqualizer(player, currentEQ, currentVolume);
            
            // Generate a nice visualization for the applied EQ
            const eqProfile = this.createEQVisualization(currentEQ);
            
            const successEmbed = embedManager.success(
              '✅ Equalizer Applied',
              `Your custom equalizer has been applied to the current playback.\n\n${eqProfile}`
            );
            
            await interaction.reply({
              embeds: [successEmbed],
              ephemeral: false
            });
            return;
          }
          // Handle band selection
          else if (customId.startsWith('adjust_')) {
            selectedBand = parseInt(customId.split('_')[1]);
            
            // Highlight the selected band
            await updateMessage(interaction);
          }
          // Handle band reset
          else if (customId === 'band_reset') {
            if (selectedBand !== null) {
              // Reset just the selected band to 0
              currentEQ[selectedBand].gain = 0.0;
              
              // Preview the change
              await this.applyEqualizer(player, currentEQ, currentVolume);
              
              await interaction.reply({
                content: `🔄 Reset band ${this.bandLabels[selectedBand]} to 0.0`,
                ephemeral: true
              });
              
              await updateMessage(interaction);
              return;
            } else {
              await interaction.reply({
                content: '⚠️ Please select a frequency band first!',
                ephemeral: true
              });
              return;
            }
          }
          // Handle value adjustment
          else if (customId.startsWith('minus_') || customId.startsWith('plus_')) {
            if (selectedBand !== null) {
              const value = parseFloat(customId.split('_')[1]);
              const sign = customId.startsWith('minus_') ? -1 : 1;
              
              // Apply the adjustment to the selected band with improved bounds checking
              const newGain = Math.max(this.minGain, Math.min(this.maxGain, 
                currentEQ[selectedBand].gain + (sign * value)));
              currentEQ[selectedBand].gain = parseFloat(newGain.toFixed(2));
              
              // Preview the change
              await this.applyEqualizer(player, currentEQ, currentVolume);
              
              await interaction.reply({
                content: `Adjusted ${this.bandLabels[selectedBand]} to ${currentEQ[selectedBand].gain.toFixed(2)}`,
                ephemeral: true
              });
              
              await updateMessage(interaction);
              return;
            } else {
              await interaction.reply({
                content: '⚠️ Please select a frequency band first!',
                ephemeral: true
              });
              return;
            }
          }
          
          // Update the message after processing the interaction
          await updateMessage(interaction);
          
        } catch (error) {
          logger.error('EnhancedEqualizerCommand', 'Error handling button interaction:', error);
          try {
            await interaction.reply({
              content: '⚠️ There was an error processing your request. Please try again.',
              ephemeral: true
            });
          } catch (replyError) {
            // Ignore if already replied
          }
        }
      });
      
      collector.on('end', async (collected, reason) => {
        try {
          // Create a summary of changes before ending
          const finalEmbed = new EmbedBuilder()
            .setColor('#FF5500')
            .setTitle('🎛️ Equalizer Session Ended')
            .setDescription(
              'The equalizer control session has timed out.\n\n' +
              `**Final EQ Settings:**\n${this.createEQVisualization(currentEQ)}\n\n` +
              'To make more adjustments, use the `equalizer` command again.'
            )
            .setFooter({ text: `Session ended: ${reason}` });
          
          await reply.edit({ 
            embeds: [finalEmbed], 
            components: [] 
          });
        } catch (error) {
          // Ignore errors if the message was deleted
          logger.debug('EnhancedEqualizerCommand', 'Failed to edit final message, it may have been deleted');
        }
      });
      
    } catch (error) {
      logger.error('EnhancedEqualizerCommand', 'Error executing command:', error);
      
      const reply = embedManager.error(
        'Error',
        'An error occurred while setting up the equalizer. Please try again later.'
      );
      return message.reply({ embeds: [reply] });
    }
  }
  
  /**
   * Creates a compact visualization of the entire EQ curve
   * @param {Array} equalizer - Current equalizer settings
   * @returns {string} - Markdown formatted visualization
   */
  createEQVisualization(equalizer) {
    let visualization = '```\n';
    
    // Create a simpler visualization showing the entire EQ curve
    const maxBars = 15; // Maximum number of bars to display (matches number of bands)
    
    for (let i = 0; i < equalizer.length; i++) {
      const band = equalizer[i];
      const label = this.bandLabels[i].padEnd(5, ' ');
      
      // Convert gain to visual bar (range is -0.75 to 0.75)
      const normalizedGain = (band.gain + 0.75) / 1.5; // Normalize to 0-1
      const barLength = Math.round(normalizedGain * maxBars);
      
      // Create compact bar visualization
      let bar = '';
      for (let j = 0; j < maxBars; j++) {
        if (j === Math.floor(maxBars / 2)) {
          bar += '|'; // Center line
        } else if (j < barLength) {
          bar += '█';
        } else {
          bar += ' ';
        }
      }
      
      visualization += `${label} [${band.gain.toFixed(2)}]: ${bar}\n`;
    }
    
    visualization += '```';
    return visualization;
  }
  
  /**
   * Creates the improved equalizer embed with visual representation of current settings
   * @param {Array} equalizer - Current equalizer settings
   * @param {number} page - Current page
   * @param {number} pageSize - Number of bands per page
   * @param {number|null} selectedBand - Currently selected band index
   * @returns {EmbedBuilder} - Formatted embed
   */
  createEqualizerEmbed(equalizer, page, pageSize, selectedBand = null) {
    const startIdx = page * pageSize;
    const endIdx = Math.min(startIdx + pageSize, equalizer.length);
    
    // Generate enhanced equalizer visualization
    let description = '```\n';
    description += `📊 Frequency Bands ${startIdx+1} - ${endIdx} of ${equalizer.length}\n\n`;
    
    for (let i = startIdx; i < endIdx; i++) {
      const band = equalizer[i];
      const label = this.bandLabels[i].padEnd(6, ' ');
      
      // Convert gain to visual bar (range is -0.75 to 0.75)
      const normalizedGain = (band.gain + 0.75) / 1.5; // Normalize to 0-1
      const barLength = Math.round(normalizedGain * 30); // Increased bar length for more precision
      
      // Create enhanced bar visualization
      let bar = '';
      for (let j = 0; j < 30; j++) {
        if (j === 15) {
          bar += '|'; // Center line
        } else if (j < barLength) {
          bar += '█';
        } else {
          bar += ' ';
        }
      }
      
      // Add selected indicator and improved formatting
      const selectedIndicator = (i === selectedBand) ? '▶ ' : '  ';
      const gainDisplay = band.gain.toFixed(2).padStart(5, ' ');
      
      description += `${selectedIndicator}${label} [${gainDisplay}]: ${bar}\n`;
    }
    description += '```';
    
    description += '\n**Instructions:**\n';
    description += '1. Click on a frequency band button to select it\n';
    description += '2. Use +/- buttons to adjust the selected band\n';
    description += '3. Try preset buttons for quick sound profiles\n';
    description += '4. Click "Apply" when satisfied with your EQ settings\n';
    
    if (selectedBand !== null) {
      description += `\n**Currently Editing:** ${this.bandLabels[selectedBand]} (Band ${selectedBand})\n`;
    }
    
    // Create the embed
    const embed = embedManager.info(
      '🎛️ Advanced Audio Equalizer',
      description
    );
    
    // Add footer with stats and improved guidance
    embed.setFooter({ 
      text: `Page ${page + 1}/${Math.ceil(equalizer.length / pageSize)} | Bands ${startIdx + 1}-${endIdx} | Current Profile: Custom`
    });
    
    return embed;
  }
  
  /**
   * Apply equalizer settings to the player with enhanced error handling
   * @param {Player} player - Music player instance
   * @param {Array} equalizer - Equalizer settings to apply
   * @param {number} volume - Volume level to restore
   * @returns {Promise<boolean>} - Success status
   */
  async applyEqualizer(player, equalizer, volume) {
    try {
      // Validate the equalizer settings first
      const validatedEQ = equalizer.map(band => {
        return {
          band: band.band,
          gain: Math.max(this.minGain, Math.min(this.maxGain, band.gain))
        };
      });
      
      // Create filter configuration
      const filterConfig = {
        equalizer: validatedEQ
      };
      
      // Apply the equalizer with improved approach
      await player.shoukaku.clearFilters();
      await player.shoukaku.setFilters(filterConfig);
      
      // Add a small delay to ensure filters are applied
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Restore volume after slight delay to prevent audio popping
      await player.setVolume(volume);
      
      return true;
    } catch (error) {
      logger.error('EnhancedEqualizerCommand', 'Error applying equalizer:', error);
      return false;
    }
  }
  
  /**
   * Creates a snapshot of current settings for reference
   * @param {Array} equalizer - Current EQ settings
   * @returns {string} - String representation of settings
   */
  createSettingsSnapshot(equalizer) {
    return equalizer.map(band => `Band ${band.band}: ${band.gain.toFixed(2)}`).join(', ');
  }
  
  /**
   * Helper method to sync EQ changes with player in real-time
   * @param {Player} player - Music player instance 
   * @param {Array} equalizer - Equalizer settings
   * @param {number} volume - Current volume
   * @returns {Promise<void>}
   */
  async syncEQChanges(player, equalizer, volume) {
    try {
      // Batch multiple updates to minimize API calls
      const batchedEQ = [...equalizer];
      
      // Apply the update with a slight throttle
      await this.applyEqualizer(player, batchedEQ, volume);
    } catch (error) {
      logger.error('EnhancedEqualizerCommand', 'Failed to sync EQ changes:', error);
    }
  }
}

export default new EqualizerCommand();
