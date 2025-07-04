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
import { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { embedManager } from '../../managers/EmbedManager.js';
import { filters, getFiltersByCategory } from '../../utils/filters.js';
import { logger } from '../../utils/logger.js';

/**
 * Filter command for applying audio filters to enhance your music experience
 */
class FilterCommand extends Command {
  constructor() {
    super({
      name: 'filter',
      description: 'Apply audio filters to enhance your music experience',
      usage: 'filter',
      aliases: ['filters', 'fx'],
      category: 'music',
      cooldown: 5,
     
        sameVoiceRequired: true,

      voiceRequired: true,

      playerRequired: true,

      playingRequired: true,
      examples: [
        'filter',
        'filters',
        'fx'
      ]
    });
    
    // Store active filters by guild
    this.activeFilters = new Map();
  }

  /**
   * Execute the filter command
   * @param {object} options - Command options
   * @returns {Promise<void>}
   */
  async execute({ message, args, client, musicManager }) {
    const { channel, member, guild } = message;

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

      // Get all filter categories
      const filterCategories = getFiltersByCategory();
      
      // If an argument is provided, try to apply the filter directly
      if (args.length > 0) {
        const filterName = args[0].toLowerCase();
        
        // Handle clearing filters
        if (filterName === 'clear' || filterName === 'reset' || filterName === 'off') {
          return this.clearFilters(message, player);
        }
        
        // Check if the filter exists
        if (filters[filterName]) {
          return this.applyFilter(message, player, filterName);
        } else {
          const reply = embedManager.error(
            'Invalid Filter',
            `Filter "${filterName}" not found. Use the command without arguments to see all available filters.`
          );
          return message.reply({ embeds: [reply] });
        }
      }
      
      // Create the category selection menu
      const categorySelectMenu = new StringSelectMenuBuilder()
        .setCustomId('filter-category-select')
        .setPlaceholder('Select a filter category')
        .addOptions(
          Object.keys(filterCategories).map(category => {
            const displayName = category.charAt(0).toUpperCase() + category.slice(1);
            return new StringSelectMenuOptionBuilder()
              .setLabel(displayName)
              .setDescription(`${displayName} filters and effects`)
              .setValue(category)
          })
        );

      // Add an option to clear all filters
      categorySelectMenu.addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('Clear All Filters')
          .setDescription('Remove all active filters')
          .setValue('clear-all')
          .setEmoji('🔄')
      );
      
      const row = new ActionRowBuilder().addComponents(categorySelectMenu);
      
      // Create an embed for the filter menu
      const embed = embedManager.create({
        color: embedManager.colors.default,
        title: '🎛️ Audio Filter Selection',
        description: 'Select a category to view available filters, then choose a specific filter to apply.',
        fields: [
          {
            name: 'Available Categories',
            value: Object.keys(filterCategories).map(cat => `• **${cat.charAt(0).toUpperCase() + cat.slice(1)}**`).join('\n'),
            inline: false
          },
          {
            name: 'Current Active Filter',
            value: this.getActiveFilterText(guild.id),
            inline: false
          }
        ],
        footer: { text: 'Filters will modify the audio output. Select "Clear All Filters" to reset.' },
        timestamp: true
      });
      
      // Send the initial message with the category select menu
      const menuMessage = await message.reply({ 
        embeds: [embed],
        components: [row]
      });
      
      // Create a collector for the category selection
      const categoryFilter = i => i.user.id === message.author.id && i.customId === 'filter-category-select';
      const categoryCollector = menuMessage.createMessageComponentCollector({ 
        filter: categoryFilter,
        time: 60000 // 60 seconds timeout
      });
      
      // Handle category selection
      categoryCollector.on('collect', async interaction => {
        await interaction.deferUpdate();
        const selectedCategory = interaction.values[0];
        
        // Handle the "clear all" option
        if (selectedCategory === 'clear-all') {
          await this.clearFilters(message, player, menuMessage);
          categoryCollector.stop();
          return;
        }
        
        // Get filters for the selected category
        const filtersInCategory = filterCategories[selectedCategory];
        
        // Create a filter select menu for the chosen category
        const filterSelectMenu = new StringSelectMenuBuilder()
          .setCustomId('filter-select')
          .setPlaceholder(`Select a ${selectedCategory} filter`)
          .addOptions(
            filtersInCategory.map(filter => 
              new StringSelectMenuOptionBuilder()
                .setLabel(filter.name)
                .setDescription(filter.description)
                .setValue(filter.name)
            )
          );
        
        // Add a back option
        filterSelectMenu.addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel('⬅️ Back to Categories')
            .setDescription('Return to category selection')
            .setValue('back')
        );
        
        const filterRow = new ActionRowBuilder().addComponents(filterSelectMenu);
        
        // Update the category embed
        const categoryEmbed = embedManager.create({
          color: embedManager.colors.default,
          title: `🎛️ ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Filters`,
          description: `Select a filter to apply to the currently playing music:`,
          fields: [
            {
              name: 'Available Filters',
              value: filtersInCategory.map(filter => `• **${filter.name}**: ${filter.description}`).join('\n'),
              inline: false
            },
            {
              name: 'Current Active Filter',
              value: this.getActiveFilterText(guild.id),
              inline: false
            }
          ],
          footer: { text: 'Select a filter to apply it immediately' },
          timestamp: true
        });
        
        await menuMessage.edit({ 
          embeds: [categoryEmbed],
          components: [filterRow]
        });
        
        // Create a collector for the filter selection
        const filterSelectFilter = i => i.user.id === message.author.id && i.customId === 'filter-select';
        const filterSelectCollector = menuMessage.createMessageComponentCollector({ 
          filter: filterSelectFilter,
          time: 60000 // 60 seconds timeout
        });
        
        // Handle filter selection
        filterSelectCollector.on('collect', async filterInteraction => {
          await filterInteraction.deferUpdate();
          const selectedFilter = filterInteraction.values[0];
          
          // Handle back button
          if (selectedFilter === 'back') {
            await menuMessage.edit({ 
              embeds: [embed],
              components: [row]
            });
            filterSelectCollector.stop();
            return;
          }
          
          // Apply the selected filter
          await this.applyFilter(message, player, selectedFilter, menuMessage);
          
          // Update the filter menu to show active filter
          const updatedCategoryEmbed = embedManager.create({
            color: embedManager.colors.success,
            title: `🎛️ ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Filters`,
            description: `Filter applied! Select another filter or return to categories.`,
            fields: [
              {
                name: 'Available Filters',
                value: filtersInCategory.map(filter => `• **${filter.name}**: ${filter.description}`).join('\n'),
                inline: false
              },
              {
                name: 'Current Active Filter',
                value: this.getActiveFilterText(guild.id),
                inline: false
              }
            ],
            footer: { text: 'Select a filter to apply it immediately' },
            timestamp: true
          });
          
          await menuMessage.edit({ 
            embeds: [updatedCategoryEmbed],
            components: [filterRow]
          });
        });
        
        // Handle timeout for filter selection
        filterSelectCollector.on('end', async collected => {
          if (collected.size === 0) {
            const timeoutEmbed = embedManager.create({
              color: embedManager.colors.error,
              title: '⏰ Filter Selection Timed Out',
              description: 'You took too long to select a filter. Use the command again if you want to apply a filter.',
              timestamp: true
            });
            
            await menuMessage.edit({ 
              embeds: [timeoutEmbed],
              components: [] 
            });
          }
        });
      });
      
      // Handle timeout for category selection
      categoryCollector.on('end', async collected => {
        if (collected.size === 0) {
          const timeoutEmbed = embedManager.create({
            color: embedManager.colors.error,
            title: '⏰ Category Selection Timed Out',
            description: 'You took too long to select a category. Use the command again if you want to apply a filter.',
            timestamp: true
          });
          
          await menuMessage.edit({ 
            embeds: [timeoutEmbed],
            components: [] 
          });
        }
      });
      
    } catch (error) {
      logger.error('FilterCommand', 'Error in filter command:', error);
      const reply = embedManager.error(
        'Error',
        'An error occurred while trying to apply the filter.'
      );
      return message.reply({ embeds: [reply] });
    }
  }
  
  /**
   * Apply a filter to the player
   * @param {object} message - Discord message object
   * @param {object} player - Music player instance
   * @param {string} filterName - Name of the filter to apply
   * @param {object} existingMessage - Existing message to edit (optional)
   * @returns {Promise<void>}
   */
  async applyFilter(message, player, filterName, existingMessage = null) {
    try {
      // Store the current volume to restore it after filter application
      const currentVolume = player.volume;
      
      // Get the filter configuration
      const filterConfig = filters[filterName];
      
      if (!filterConfig) {
        const reply = embedManager.error(
          'Invalid Filter',
          `Filter "${filterName}" not found.`
        );
        return message.reply({ embeds: [reply] });
      }
      
      // Apply the filter
      
      try {
        // Clear any existing filters first
        player.shoukaku.clearFilters();
        
        // Apply the new filter
        player.shoukaku.setFilters(filterConfig);
        
        // Restore volume
        player.setVolume(currentVolume);
        
        // Store the active filter
        this.activeFilters.set(message.guild.id, {
          name: filterName,
          config: filterConfig
        });
        
        
        // Send success message if we're not using an interaction
        if (!existingMessage) {
          const reply = embedManager.success(
            'Filter Applied',
            `Applied filter: **${filterName}**\n\nDescription: ${filterConfig.description}`
          );
          return message.reply({ embeds: [reply] });
        }
      } catch (filterError) {
        logger.error('FilterCommand', `Error applying filter ${filterName}:`, filterError);
        
        if (!existingMessage) {
          const reply = embedManager.error(
            'Filter Error',
            `Failed to apply filter: ${filterName}. Please try again.`
          );
          return message.reply({ embeds: [reply] });
        }
      }
    } catch (error) {
      logger.error('FilterCommand', 'Error applying filter:', error);
      
      if (!existingMessage) {
        const reply = embedManager.error(
          'Error',
          'An error occurred while trying to apply the filter.'
        );
        return message.reply({ embeds: [reply] });
      }
    }
  }
  
  /**
   * Clear all active filters
   * @param {object} message - Discord message object
   * @param {object} player - Music player instance
   * @param {object} existingMessage - Existing message to edit (optional)
   * @returns {Promise<void>}
   */
  async clearFilters(message, player, existingMessage = null) {
    try {
      // Store the current volume
      const currentVolume = player.volume;
      
      // Clear filters
      player.shoukaku.clearFilters();
      
      // Restore volume
      player.setVolume(currentVolume);
      
      // Remove from active filters
      this.activeFilters.delete(message.guild.id);
      
      
      // If we're handling this directly (not from an interaction)
      if (!existingMessage) {
        const reply = embedManager.success(
          'Filters Cleared',
          'All audio filters have been removed.'
        );
        return message.reply({ embeds: [reply] });
      } else {
        // Update the existing message
        const clearEmbed = embedManager.create({
          color: embedManager.colors.success,
          title: '🔄 Filters Cleared',
          description: 'All audio filters have been removed. Use the filter command again to apply a new filter.',
          timestamp: true
        });
        
        await existingMessage.edit({ 
          embeds: [clearEmbed],
          components: [] 
        });
      }
    } catch (error) {
      logger.error('FilterCommand', 'Error clearing filters:', error);
      
      if (!existingMessage) {
        const reply = embedManager.error(
          'Error',
          'An error occurred while trying to clear filters.'
        );
        return message.reply({ embeds: [reply] });
      }
    }
  }
  
  /**
   * Get text describing the currently active filter
   * @param {string} guildId - Discord guild ID
   * @returns {string} - Text describing active filter
   */
  getActiveFilterText(guildId) {
    const activeFilter = this.activeFilters.get(guildId);
    
    if (!activeFilter) {
      return 'No filter currently active.';
    }
    
    return `**${activeFilter.name}**: ${activeFilter.config.description}`;
  }
}

export default new FilterCommand();
