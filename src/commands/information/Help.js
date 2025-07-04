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
import { 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ComponentType,
  AttachmentBuilder
} from 'discord.js';
import { logger } from '../../utils/logger.js';
import { themeManager } from '../../managers/ThemeManager.js';

const ITEMS_PER_PAGE = 24;
const TIMEOUT = 180000;

class HelpCommand extends Command {
  constructor() {
    super({
      name: 'help',
      description: 'Display help information about ByteCord commands',
      usage: 'help [command_name] [--msgspeed]',
      aliases: ['h', 'commands'],
      category: 'information',
      cooldown: 3,
      examples: ['help', 'help play', 'help queue', 'help --msgspeed']
    });
    
    this.collectors = new Map();
    this.cache = {
      categoryOptions: new Map(),
      filteredCommands: new Map(),
      components: new Map()
    };
  }

  async execute({ message, args, client, prefix }) {
    const timer = Timer.create();
    const showSpeed = args.includes('--msgspeed');
    const cleanArgs = args.filter(arg => arg !== '--msgspeed');
    
    try {
      timer.mark('start');
      
      const { commands, categories } = client.commandHandler;
      timer.mark('get-handlers');
      
      const HelpCanvasClass = await themeManager.getHelpCanvasClass(message.guild.id);
      timer.mark('theme-load');
      
      const canvasManager = new HelpCanvasClass();
      timer.mark('canvas-init');

      if (cleanArgs.length > 0) {
        return this.handleCommandHelp(message, cleanArgs[0].toLowerCase(), commands, prefix, client, canvasManager, timer, showSpeed);
      }

      const [homePageBuffer, mainRow] = await Promise.all([
        canvasManager.generateHomePage(client, prefix, categories),
        Promise.resolve(this.getMainSelectMenu(categories))
      ]);
      timer.mark('home-generation');

      const homeAttachment = new AttachmentBuilder(homePageBuffer, { name: 'help-home.png' });
      timer.mark('attachment-create');

      const helpMessage = await message.reply({
        content: showSpeed ? timer.getReport() : undefined,
        files: [homeAttachment],
        components: [mainRow]
      });
      timer.mark('message-send');

      this.setupCollectors(helpMessage, message.author.id, client, prefix, categories, commands, canvasManager, showSpeed);
      timer.mark('collectors-setup');

      if (showSpeed) {
        setTimeout(() => {
          helpMessage.edit({
            content: timer.getReport(),
            files: [homeAttachment],
            components: [mainRow]
          }).catch(() => {});
        }, 100);
      }

    } catch (error) {
      logger.error('HelpCommand', 'Error executing help command:', error);
      message.reply({ content: 'An error occurred while displaying the help menu.' });
    }
  }

  async handleCommandHelp(message, commandName, commands, prefix, client, canvasManager, timer, showSpeed) {
    const command = commands.get(commandName) || [...commands.values()].find(cmd => cmd.aliases?.includes(commandName));
    timer.mark('command-lookup');

    if (!command) {
      return message.reply({ content: `Command \`${commandName}\` not found. Use \`${prefix}help\` to see all commands.` });
    }

    const [commandPageBuffer, backButton] = await Promise.all([
      canvasManager.generateCommandPage(command, prefix, client),
      Promise.resolve(this.getBackButton())
    ]);
    timer.mark('command-page-gen');
    
    const commandAttachment = new AttachmentBuilder(commandPageBuffer, { name: `cmd-${command.name}.png` });
    timer.mark('cmd-attachment-create');

    const helpMessage = await message.reply({ 
      content: showSpeed ? timer.getReport() : undefined,
      files: [commandAttachment], 
      components: [new ActionRowBuilder().addComponents(backButton)] 
    });
    timer.mark('cmd-message-send');
    
    this.setupCollectors(helpMessage, message.author.id, client, prefix, client.commandHandler.categories, commands, canvasManager, showSpeed);
    timer.mark('cmd-collectors-setup');

    if (showSpeed) {
      setTimeout(() => {
        helpMessage.edit({
          content: timer.getReport(),
          files: [commandAttachment],
          components: [new ActionRowBuilder().addComponents(backButton)]
        }).catch(() => {});
      }, 100);
    }
  }

  stopCollectors(messageId) {
    const collectors = this.collectors.get(messageId);
    if (collectors) {
      collectors.forEach(c => c.stop('override'));
      this.collectors.delete(messageId);
    }
  }
  
  setupCollectors(helpMessage, authorId, client, prefix, categories, commands, canvasManager, showSpeed) {
    this.stopCollectors(helpMessage.id);

    const selectCollector = helpMessage.createMessageComponentCollector({ 
      componentType: ComponentType.StringSelectMenu, 
      time: TIMEOUT 
    });
    const buttonCollector = helpMessage.createMessageComponentCollector({ 
      componentType: ComponentType.Button, 
      time: TIMEOUT 
    });
    
    this.collectors.set(helpMessage.id, [selectCollector, buttonCollector]);
    
    selectCollector.on('collect', async (interaction) => {
      if (interaction.user.id !== authorId) {
        return interaction.reply({ content: 'This menu is only for the command user.', ephemeral: true });
      }
      
      const timer = Timer.create();
      timer.mark('interaction-start');
      
      await interaction.deferUpdate();
      timer.mark('defer-update');
      
      this.resetTimers(selectCollector, buttonCollector);
      timer.mark('reset-timers');
      
      const selectedCategory = interaction.values[0];
      timer.mark('get-selection');
      
      if (selectedCategory === 'home') {
        const [homePageBuffer, components] = await Promise.all([
          canvasManager.generateHomePage(client, prefix, categories),
          Promise.resolve([this.getMainSelectMenu(categories)])
        ]);
        timer.mark('home-regen');
        
        const homeAttachment = new AttachmentBuilder(homePageBuffer, { name: 'help-home.png' });
        timer.mark('home-attachment');
        
        await interaction.editReply({ 
          content: showSpeed ? timer.getReport() : undefined,
          files: [homeAttachment], 
          components 
        });
        timer.mark('home-edit-reply');
        
        this.setupCollectors(helpMessage, authorId, client, prefix, categories, commands, canvasManager, showSpeed);
        timer.mark('home-setup-collectors');
        return;
      }
      
      const categoryCommands = categories.get(selectedCategory) || [];
      timer.mark('get-category-commands');
      
      const [categoryPageBuffer, components] = await Promise.all([
        canvasManager.generateCategoryPage(selectedCategory, categoryCommands, prefix, client, 1, ITEMS_PER_PAGE),
        Promise.resolve(this.getCategoryComponents(selectedCategory, categoryCommands, categories))
      ]);
      timer.mark('category-page-gen');
      
      const categoryAttachment = new AttachmentBuilder(categoryPageBuffer, { name: `cat-${selectedCategory}-p1.png` });
      timer.mark('category-attachment');
      
      await interaction.editReply({ 
        content: showSpeed ? timer.getReport() : undefined,
        files: [categoryAttachment], 
        components 
      });
      timer.mark('category-edit-reply');
      
      this.setupCollectors(helpMessage, authorId, client, prefix, categories, commands, canvasManager, showSpeed);
      timer.mark('category-setup-collectors');
    });
    
    buttonCollector.on('collect', async (interaction) => {
      if (interaction.user.id !== authorId) {
        return interaction.reply({ content: 'This button is only for the command user.', ephemeral: true });
      }
      
      const timer = Timer.create();
      timer.mark('button-start');
      
      await interaction.deferUpdate();
      timer.mark('button-defer');
      
      this.resetTimers(selectCollector, buttonCollector);
      timer.mark('button-reset-timers');
      
      const [action, ...params] = interaction.customId.split('_');
      timer.mark('parse-action');

      switch (interaction.customId) {
        case 'help_cmd_back_home':
        case 'back_to_home_btn':
          await this.handleHomeNavigation(interaction, canvasManager, client, prefix, categories, helpMessage, authorId, commands, timer, showSpeed);
          break;
          
        case 'search_command_btn':
          await this.handleSearchCommand(interaction, helpMessage, authorId, client, prefix, categories, commands, canvasManager, timer, showSpeed);
          break;
          
        default:
          if (action === 'catpage') {
            await this.handleCategoryPagination(interaction, params, categories, canvasManager, prefix, client, helpMessage, authorId, commands, timer, showSpeed);
          } else if (action === 'searchpage') {
            await this.handleSearchPagination(interaction, params, commands, canvasManager, prefix, client, helpMessage, authorId, categories, timer, showSpeed);
          }
      }
    });

    this.setupCollectorCleanup(selectCollector, buttonCollector, helpMessage);
  }

  async handleHomeNavigation(interaction, canvasManager, client, prefix, categories, helpMessage, authorId, commands, timer, showSpeed) {
    const [homePageBuffer, components] = await Promise.all([
      canvasManager.generateHomePage(client, prefix, categories),
      Promise.resolve([this.getMainSelectMenu(categories)])
    ]);
    timer.mark('home-nav-gen');
    
    const homeAttachment = new AttachmentBuilder(homePageBuffer, { name: 'help-home.png' });
    timer.mark('home-nav-attachment');
    
    await interaction.editReply({ 
      content: showSpeed ? timer.getReport() : undefined,
      files: [homeAttachment], 
      components 
    });
    timer.mark('home-nav-edit');
    
    this.setupCollectors(helpMessage, authorId, client, prefix, categories, commands, canvasManager, showSpeed);
    timer.mark('home-nav-collectors');
  }

  async handleCategoryPagination(interaction, params, categories, canvasManager, prefix, client, helpMessage, authorId, commands, timer, showSpeed) {
    const [categoryName, pageStr] = params;
    const page = parseInt(pageStr, 10);
    timer.mark('parse-cat-params');
    
    const categoryCommands = categories.get(categoryName) || [];
    timer.mark('get-cat-commands');
    
    const [categoryPageBuffer, components] = await Promise.all([
      canvasManager.generateCategoryPage(categoryName, categoryCommands, prefix, client, page, ITEMS_PER_PAGE),
      Promise.resolve(this.getCategoryComponents(categoryName, categoryCommands, categories, page))
    ]);
    timer.mark('cat-page-gen');
    
    const categoryAttachment = new AttachmentBuilder(categoryPageBuffer, { name: `cat-${categoryName}-p${page}.png` });
    timer.mark('cat-page-attachment');
    
    await interaction.editReply({ 
      content: showSpeed ? timer.getReport() : undefined,
      files: [categoryAttachment], 
      components 
    });
    timer.mark('cat-page-edit');
    
    this.setupCollectors(helpMessage, authorId, client, prefix, categories, commands, canvasManager, showSpeed);
    timer.mark('cat-page-collectors');
  }

  async handleSearchPagination(interaction, params, commands, canvasManager, prefix, client, helpMessage, authorId, categories, timer, showSpeed) {
    const [encodedSearchTerm, pageStr] = params;
    const searchTerm = decodeURIComponent(encodedSearchTerm);
    const page = parseInt(pageStr, 10);
    timer.mark('parse-search-params');
    
    const filteredCommands = this.getFilteredCommands(commands, searchTerm);
    timer.mark('filter-search-commands');
    
    const [searchPageBuffer, components] = await Promise.all([
      canvasManager.generateSearchResultsPage(searchTerm, filteredCommands, prefix, client, page, ITEMS_PER_PAGE),
      Promise.resolve([this.getSearchPaginationRow(searchTerm, page, Math.ceil(filteredCommands.length / ITEMS_PER_PAGE))])
    ]);
    timer.mark('search-page-gen');
    
    const searchAttachment = new AttachmentBuilder(searchPageBuffer, { name: `search-${searchTerm}-p${page}.png` });
    timer.mark('search-attachment');
    
    await interaction.editReply({ 
      content: showSpeed ? timer.getReport() : undefined,
      files: [searchAttachment], 
      components 
    });
    timer.mark('search-edit');
    
    this.setupCollectors(helpMessage, authorId, client, prefix, categories, commands, canvasManager, showSpeed);
    timer.mark('search-collectors');
  }

  async handleSearchCommand(interaction, helpMessage, authorId, client, prefix, categories, commands, canvasManager, timer, showSpeed) {
    await interaction.followUp({ content: 'Type your search query in chat. You have 30 seconds.', ephemeral: true });
    timer.mark('search-prompt');
    
    const filter = (msg) => msg.author.id === interaction.user.id && msg.channel.id === interaction.channel.id;
    timer.mark('search-filter');
    
    try {
      const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });
      timer.mark('search-collect');
      
      const searchTerm = collected.first().content.toLowerCase();
      timer.mark('search-parse');
      
      await collected.first().delete().catch(() => {});
      timer.mark('search-delete-msg');
      
      const filteredCommands = this.getFilteredCommands(commands, searchTerm);
      timer.mark('search-filter-commands');

      if (filteredCommands.length === 0) {
        await interaction.editReply({ 
          content: `No commands found for "${searchTerm}". ${showSpeed ? timer.getReport() : ''}`,
          files: helpMessage.attachments.size > 0 ? [helpMessage.attachments.first()] : [],
          components: helpMessage.components 
        });
        timer.mark('search-no-results');
        return;
      }
      
      const [searchPageBuffer, components] = await Promise.all([
        canvasManager.generateSearchResultsPage(searchTerm, filteredCommands, prefix, client, 1, ITEMS_PER_PAGE),
        Promise.resolve([this.getSearchPaginationRow(searchTerm, 1, Math.ceil(filteredCommands.length / ITEMS_PER_PAGE))])
      ]);
      timer.mark('search-results-gen');
      
      const searchAttachment = new AttachmentBuilder(searchPageBuffer, { name: `search-${searchTerm}-p1.png` });
      timer.mark('search-results-attachment');
      
      await interaction.editReply({ 
        content: showSpeed ? timer.getReport() : undefined,
        files: [searchAttachment], 
        components 
      });
      timer.mark('search-results-edit');
      
      this.setupCollectors(helpMessage, authorId, client, prefix, categories, commands, canvasManager, showSpeed);
      timer.mark('search-results-collectors');
      
    } catch (e) {
      interaction.followUp({ 
        content: `Search timed out. ${showSpeed ? timer.getReport() : ''}`, 
        ephemeral: true 
      });
      timer.mark('search-timeout');
    }
  }

  setupCollectorCleanup(selectCollector, buttonCollector, helpMessage) {
    const handleEnd = (reason) => {
      if (reason === 'override') return;
      
      if (this.collectors.has(helpMessage.id)) {
        this.collectors.get(helpMessage.id).forEach(c => {
          if (!c.ended) c.stop('final_cleanup');
        });
        this.collectors.delete(helpMessage.id);
      }
      
      if (reason === 'time' && !helpMessage.deleted) {
        helpMessage.edit({ 
          content: 'This help menu has timed out. Run the command again if needed.', 
          components: [] 
        }).catch(err => logger.warn('HelpCommand', 'Failed to edit message on timeout:', err.message));
      }
    };
    
    selectCollector.on('end', (_, reason) => handleEnd(reason));
    buttonCollector.on('end', (_, reason) => handleEnd(reason));
  }

  resetTimers(...collectors) {
    collectors.forEach(collector => collector.resetTimer());
  }

  getFilteredCommands(commands, searchTerm) {
    const cacheKey = `${searchTerm}-${commands.size}`;
    if (this.cache.filteredCommands.has(cacheKey)) {
      return this.cache.filteredCommands.get(cacheKey);
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = [...commands.values()].filter(cmd => 
      cmd.name.toLowerCase().includes(term) || 
      cmd.aliases?.some(alias => alias.toLowerCase().includes(term))
    );
    
    this.cache.filteredCommands.set(cacheKey, filtered);
    return filtered;
  }

  getCategoryOptions(categories) {
    const cacheKey = [...categories.keys()].sort().join(',');
    if (this.cache.categoryOptions.has(cacheKey)) {
      return this.cache.categoryOptions.get(cacheKey);
    }
    
    const options = [
      { label: 'Home', description: 'Return to the main help menu', value: 'home' },
      ...[...categories.keys()]
        .filter(cat => !['developer', 'owner'].includes(cat.toLowerCase()))
        .sort()
        .map(cat => ({
          label: this.formatCategoryName(cat),
          description: `View ${this.formatCategoryName(cat)} commands`,
          value: cat
        }))
    ];
    
    this.cache.categoryOptions.set(cacheKey, options);
    return options;
  }

  getMainSelectMenu(categories) {
    const cacheKey = `main-${[...categories.keys()].sort().join(',')}`;
    if (this.cache.components.has(cacheKey)) {
      return this.cache.components.get(cacheKey);
    }
    
    const component = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('help_category_select_menu_main')
        .setPlaceholder('Select a category...')
        .setOptions(this.getCategoryOptions(categories))
    );
    
    this.cache.components.set(cacheKey, component);
    return component;
  }

  getCategoryComponents(categoryName, categoryCommands, categories, page = 1) {
    const totalPages = Math.ceil(categoryCommands.length / ITEMS_PER_PAGE);
    const cacheKey = `cat-${categoryName}-${page}-${totalPages}`;
    
    if (this.cache.components.has(cacheKey)) {
      return this.cache.components.get(cacheKey);
    }
    
    const components = [this.getMainSelectMenu(categories)];
    if (categoryCommands.length > 0) {
      components.push(this.getCategoryPaginationRow(categoryName, page, totalPages));
    }
    
    this.cache.components.set(cacheKey, components);
    return components;
  }

  getCategoryPaginationRow(categoryName, currentPage, totalPages) {
    const cacheKey = `catpag-${categoryName}-${currentPage}-${totalPages}`;
    if (this.cache.components.has(cacheKey)) {
      return this.cache.components.get(cacheKey);
    }
    
    const component = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`catpage_${categoryName}_${currentPage - 1}`)
        .setEmoji('◀️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === 1),
      new ButtonBuilder()
        .setCustomId('search_command_btn')
        .setLabel('Search')
        .setEmoji('🔍')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('back_to_home_btn')
        .setLabel('Home')
        .setEmoji('🏠')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`catpage_${categoryName}_${currentPage + 1}`)
        .setEmoji('▶️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === totalPages || totalPages <= 1)
    );
    
    this.cache.components.set(cacheKey, component);
    return component;
  }

  getSearchPaginationRow(searchTerm, currentPage, totalPages) {
    const cacheKey = `searchpag-${searchTerm}-${currentPage}-${totalPages}`;
    if (this.cache.components.has(cacheKey)) {
      return this.cache.components.get(cacheKey);
    }
    
    const component = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`searchpage_${encodeURIComponent(searchTerm)}_${currentPage - 1}`)
        .setEmoji('◀️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === 1),
      new ButtonBuilder()
        .setCustomId('back_to_home_btn')
        .setLabel('Home')
        .setEmoji('🏠')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`searchpage_${encodeURIComponent(searchTerm)}_${currentPage + 1}`)
        .setEmoji('▶️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === totalPages || totalPages <= 1)
    );
    
    this.cache.components.set(cacheKey, component);
    return component;
  }

  getBackButton() {
    const cacheKey = 'back-button';
    if (this.cache.components.has(cacheKey)) {
      return this.cache.components.get(cacheKey);
    }
    
    const button = new ButtonBuilder()
      .setCustomId('help_cmd_back_home')
      .setLabel('Back to Home')
      .setStyle(ButtonStyle.Secondary);
    
    this.cache.components.set(cacheKey, button);
    return button;
  }

  formatCategoryName(category) {
    return category ? category.charAt(0).toUpperCase() + category.slice(1).toLowerCase() : 'Unknown';
  }
}

class Timer {
  constructor() {
    this.marks = new Map();
    this.start = performance.now();
  }

  static create() {
    return new Timer();
  }

  mark(step) {
    this.marks.set(step, performance.now() - this.start);
  }

  getReport() {
    const steps = [...this.marks.entries()];
    let report = `⚡ **Speed Report** (${steps.length} steps)\n\`\`\`diff\n`;
    
    let lastTime = 0;
    for (const [step, time] of steps) {
      const stepTime = time - lastTime;
      const prefix = stepTime > 100 ? '- ' : stepTime > 50 ? '  ' : '+ ';
      report += `${prefix}${step.padEnd(20)}: ${stepTime.toFixed(1)}ms (${time.toFixed(1)}ms)\n`;
      lastTime = time;
    }
    
    const total = steps[steps.length - 1]?.[1] || 0;
    report += `${'-'.repeat(35)}\n`;
    report += `+ TOTAL: ${total.toFixed(1)}ms\n\`\`\``;
    
    return report;
  }
}

export default new HelpCommand();