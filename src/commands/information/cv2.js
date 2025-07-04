/**
 * Muffin STUDIO - Bre4d777 & prayag 
 * https://discord.gg/TRPqseUq32
 * give credits or ill touch you in your dreams
 */

import { Command } from '../../structures/Command.js';
import {
  ContainerBuilder,
  TextDisplayBuilder,
  SectionBuilder,
  SeparatorBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  FileBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  SelectMenuBuilder,
  ThumbnailBuilder,
  MessageFlags,
  SeparatorSpacingSize,
  ButtonStyle,
  SelectMenuOptionBuilder,
} from 'discord.js';

class CV2Command extends Command {
  constructor() {
    super({
      name: 'cv2',
      description: 'Showcase all Components v2 features',
      usage: 'cv2',
      aliases: ['componentsv2', 'showcase'],
      category: 'examples',
      cooldown: 5,
    });
    
    this.userStates = new Map();
    this.demoData = {
      products: [
        { id: 1, name: 'Premium Bot', price: '$19.99', rating: 4.8 },
        { id: 2, name: 'Moderation Tools', price: '$12.99', rating: 4.6 },
        { id: 3, name: 'Music Player', price: '$15.99', rating: 4.9 },
      ],
      stats: {
        users: 15420,
        servers: 892,
        commands: 47,
        uptime: '99.8%'
      },
      features: [
        'Advanced moderation system',
        'Custom command builder',
        'Multi-language support',
        'Real-time analytics',
        'Premium support'
      ]
    };
  }

  // region State Management
  _getUserState(userId) {
    if (!this.userStates.has(userId)) {
      this.userStates.set(userId, { 
        interactions: [], 
        startTime: Date.now() 
      });
    }
    return this.userStates.get(userId);
  }

  _logInteraction(userId, action, details) {
    const userState = this._getUserState(userId);
    userState.interactions.push({
      action,
      details,
      timestamp: Date.now()
    });
    if (userState.interactions.length > 50) {
      userState.interactions.shift();
    }
  }

  _resetUserState(userId) {
    this.userStates.set(userId, { interactions: [], startTime: Date.now() });
    this._logInteraction(userId, 'Demo Reset', 'Cleared interaction history');
  }
  // endregion

  // region Component Builders
  _createSeparator(spacing = SeparatorSpacingSize.Small, divider = false) {
    return new SeparatorBuilder().setSpacing(spacing).setDivider(divider);
  }
  // endregion

  // region View Builders
  buildMainContainer(username) {
    const container = new ContainerBuilder()
      .setAccentColor(this.getRandomColor());

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# 🚀 Components v2 Showcase\n*Demonstrating every single feature available*\n\nWelcome **${username}**!`)
    );
    container.addSeparatorComponents(this._createSeparator(SeparatorSpacingSize.Large, true));

    container.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('## 📊 Live Statistics'),
          new TextDisplayBuilder().setContent(`**Active Users**: ${this.demoData.stats.users.toLocaleString()}\n**Servers**: ${this.demoData.stats.servers}\n**Commands**: ${this.demoData.stats.commands}\n**Uptime**: ${this.demoData.stats.uptime}`)
        )
        .setButtonAccessory(new ButtonBuilder().setCustomId('main_refresh_stats').setLabel('Refresh Stats').setStyle(ButtonStyle.Primary))
    );
    
    container.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('## 🎯 Key Features'),
          new TextDisplayBuilder().setContent(this.demoData.features.map(f => `✅ ${f}`).join('\n'))
        )
        .setThumbnailAccessory(new ThumbnailBuilder().setURL('https://cdn.discordapp.com/attachments/123/456/example.png'))
    );

    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL('https://picsum.photos/400/300?random=1').setDescription('Dashboard Preview'),
        new MediaGalleryItemBuilder().setURL('https://picsum.photos/400/300?random=2').setDescription('Mobile Interface'),
        new MediaGalleryItemBuilder().setURL('https://picsum.photos/400/300?random=3').setDescription('Analytics Panel')
      )
    );
    container.addSeparatorComponents(this._createSeparator(SeparatorSpacingSize.Large, true));

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## 🛍️ Featured Products'));
    this.demoData.products.slice(0, 2).forEach((product, index) => {
      container.addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`**${product.name}**`),
            new TextDisplayBuilder().setContent(`Price: **${product.price}**\nRating: ⭐ ${product.rating}/5.0`)
          )
          .setButtonAccessory(new ButtonBuilder().setCustomId(`main_view_product_${product.id}`).setLabel('View Details').setStyle(ButtonStyle.Secondary))
      );
      if (index < 1) {
        container.addSeparatorComponents(this._createSeparator());
      }
    });
    container.addSeparatorComponents(this._createSeparator(SeparatorSpacingSize.Large, true));

    container.addFileComponents(new FileBuilder().setURL('attachment://demo-file.txt'));

    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('demo_primary').setLabel('Primary Action').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('demo_success').setLabel('Success').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('demo_danger').setLabel('Danger').setStyle(ButtonStyle.Danger)
      )
    );
    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new SelectMenuBuilder().setCustomId('main_select_menu').setPlaceholder('Choose a demo option...').addOptions(
          new SelectMenuOptionBuilder().setLabel('Toggle Spoiler Mode').setValue('spoiler').setDescription('Hide/show content with spoilers'),
          new SelectMenuOptionBuilder().setLabel('Regenerate Content').setValue('regenerate').setDescription('Create new random content')
        )
      )
    );
    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('main_reset_demo').setLabel('Reset Demo').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('main_export_data').setLabel('Export Data').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('main_close_demo').setLabel('Close').setStyle(ButtonStyle.Danger)
      )
    );
    return container;
  }

  buildProductDetailContainer(productId) {
    const product = this.demoData.products.find(p => p.id === productId);
    if (!product) return this.buildErrorContainer('Product not found.');

    const container = new ContainerBuilder().setAccentColor(0x57F287);
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${product.name}\n*Detailed product information*`));
    container.addSeparatorComponents(this._createSeparator(SeparatorSpacingSize.Small, true));

    container.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('## Product Details'),
          new TextDisplayBuilder().setContent(`**Price**: ${product.price}\n**Rating**: ⭐ ${product.rating}/5.0\n**Category**: Premium Tools`),
          new TextDisplayBuilder().setContent(`**Status**: Available\n**Last Updated**: Today\n**Downloads**: ${Math.floor(Math.random() * 10000).toLocaleString()}`)
        )
        .setButtonAccessory(new ButtonBuilder().setCustomId(`product_purchase_${productId}`).setLabel('Purchase Now').setStyle(ButtonStyle.Success))
    );
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(`https://picsum.photos/500/400?random=${productId}0`).setDescription(`${product.name} - Main View`),
        new MediaGalleryItemBuilder().setURL(`https://picsum.photos/500/400?random=${productId}1`).setDescription('Configuration Panel'),
        new MediaGalleryItemBuilder().setURL(`https://picsum.photos/500/400?random=${productId}2`).setDescription('Feature Overview')
      )
    );
    container.addSeparatorComponents(this._createSeparator(SeparatorSpacingSize.Large, true));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## 📋 Features Included\n✅ Full access to all commands\n✅ Priority customer support\n✅ Regular updates and patches\n✅ Community access\n✅ Custom configuration options'));
    
    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('nav_back_to_main').setLabel('← Back to Main').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`product_favorite_${productId}`).setLabel('Add to Favorites').setStyle(ButtonStyle.Primary)
      )
    );
    return container;
  }

  buildInteractionLogContainer(userId) {
    const userState = this._getUserState(userId);
    const container = new ContainerBuilder().setAccentColor(0x9B59B6);

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent('# 📊 Interaction Log\n*Your activity during this demo session*'));
    container.addSeparatorComponents(this._createSeparator(SeparatorSpacingSize.Small, true));
    
    const duration = Date.now() - userState.startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);

    const actionCounts = userState.interactions.reduce((acc, { action }) => {
      acc[action] = (acc[action] || 0) + 1;
      return acc;
    }, {});
    const mostUsed = Object.keys(actionCounts).reduce((a, b) => actionCounts[a] > actionCounts[b] ? a : b, 'None');

    container.addSectionComponents(
      new SectionBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent('## Session Statistics'),
        new TextDisplayBuilder().setContent(`**Session Started**: <t:${Math.floor(userState.startTime / 1000)}:R>\n**Total Interactions**: ${userState.interactions.length}`),
        new TextDisplayBuilder().setContent(`**Most Used**: ${mostUsed}\n**Session Duration**: ${minutes}m ${seconds}s`)
      )
    );

    if (userState.interactions.length > 0) {
      container.addSeparatorComponents(this._createSeparator());
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## Recent Interactions'));
      userState.interactions.slice(-5).reverse().forEach(interaction => {
        container.addSectionComponents(
          new SectionBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`**${interaction.action}**`),
            new TextDisplayBuilder().setContent(`<t:${Math.floor(interaction.timestamp / 1000)}:t> - ${interaction.details}`)
          )
        );
      });
    } else {
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent('\n*No interactions recorded yet. Start clicking buttons to see your activity!*'));
    }

    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('log_clear').setLabel('Clear Log').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('nav_back_to_main').setLabel('← Back to Main').setStyle(ButtonStyle.Secondary)
      )
    );
    return container;
  }
  
  buildSpoilerContainer() {
      return new ContainerBuilder().setAccentColor(0x747F8D).setSpoiler(true)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent('# 🙈 Spoiler Mode Demo\n*This entire container is now hidden behind a spoiler*'))
        .addSeparatorComponents(this._createSeparator(SeparatorSpacingSize.Small, true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent('This is hidden content that users need to click to see.\n\nSpoiler containers are perfect for:\n• Sensitive information\n• Plot spoilers\n• Hidden rewards'))
        .addActionRowComponents(new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('nav_back_to_main').setLabel('← Back to Main').setStyle(ButtonStyle.Secondary)));
  }

  buildErrorContainer(error) {
    return new ContainerBuilder().setAccentColor(0xED4245)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ❌ An Error Occurred\n${error}`));
  }

  getRandomColor() {
    const colors = [0x5865F2, 0x57F287, 0xFEE75C, 0xED4245, 0xEB459E, 0x9B59B6];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  createDemoFile() {
    return Buffer.from(`Components v2 Demo File - Generated: ${new Date().toISOString()}`, 'utf8');
  }
  // endregion

  async execute({ message }) {
    this._getUserState(message.author.id);
    this._logInteraction(message.author.id, 'Command Executed', 'Started CV2 showcase demo');

    const container = this.buildMainContainer(message.author.username);
    const demoFile = this.createDemoFile();
    
    const sent = await message.reply({
      components: [container],
      files: [{ attachment: demoFile, name: 'demo-file.txt' }],
      flags: MessageFlags.IsComponentsV2,
    });

    const collector = sent.createMessageComponentCollector({ time: 300000 });

    collector.on('collect', async interaction => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({ content: 'This demo is private to the user who started it!', ephemeral: true });
      }
      
      try {
        await interaction.deferUpdate();
        const userId = interaction.user.id;
        const customId = interaction.customId;

        let responseContainer;
        
        // Navigation
        if (customId === 'nav_back_to_main') {
            this._logInteraction(userId, 'Navigation', 'Returned to main showcase');
            responseContainer = this.buildMainContainer(interaction.user.username);
        }
        
        // Main View Interactions
        else if (customId.startsWith('main_')) {
            const action = customId.replace('main_', '');
            if (action === 'refresh_stats') {
                this.demoData.stats.users += Math.floor(Math.random() * 100);
                this.demoData.stats.servers += Math.floor(Math.random() * 5);
                this._logInteraction(userId, 'Stats Refreshed', 'Updated live statistics');
                responseContainer = this.buildMainContainer(interaction.user.username);
            } else if (action.startsWith('view_product_')) {
                const productId = parseInt(action.replace('view_product_', ''));
                this._logInteraction(userId, 'Product Viewed', `Viewed product ${productId}`);
                responseContainer = this.buildProductDetailContainer(productId);
            } else if (action === 'reset_demo') {
                this._resetUserState(userId);
                responseContainer = this.buildMainContainer(interaction.user.username);
            } else if (action === 'close_demo') {
                this._logInteraction(userId, 'Demo Closed', 'Manually closed the demo');
                collector.stop();
                return;
            } else if (action === 'export_data') {
                this._logInteraction(userId, 'Data Exported', 'Exported session data');
                const userState = this._getUserState(userId);
                const exportFile = Buffer.from(JSON.stringify({ userState, demoData: this.demoData.stats }, null, 2));
                await interaction.followUp({ content: 'Your session data has been exported!', files: [{ attachment: exportFile, name: 'cv2-export.json'}], ephemeral: true });
                return;
            } else if (action === 'select_menu') {
                const value = interaction.values[0];
                if (value === 'spoiler') {
                    this._logInteraction(userId, 'Spoiler Toggled', 'Viewed spoiler mode');
                    responseContainer = this.buildSpoilerContainer();
                } else if (value === 'regenerate') {
                    this.demoData.stats.users = Math.floor(Math.random() * 50000) + 10000;
                    this.demoData.stats.servers = Math.floor(Math.random() * 2000) + 500;
                    this._logInteraction(userId, 'Content Regenerated', 'Generated new random content');
                    responseContainer = this.buildMainContainer(interaction.user.username);
                }
            }
        }

        // Product View Interactions
        else if (customId.startsWith('product_')) {
            const [_, action, productIdStr] = customId.split('_');
            const productId = parseInt(productIdStr);
            const product = this.demoData.products.find(p => p.id === productId);

            if (action === 'purchase') {
                this._logInteraction(userId, 'Purchase Attempted', `Product: ${product?.name || 'N/A'}`);
                await interaction.followUp({ content: `This is a demo! You would be purchasing **${product.name}**.`, ephemeral: true });
            } else if (action === 'favorite') {
                this._logInteraction(userId, 'Favorite Added', `Product: ${product?.name || 'N/A'}`);
                await interaction.followUp({ content: `⭐ Added **${product.name}** to your favorites! (Demo)`, ephemeral: true });
            }
            return; 
        }

        // Log View Interactions
        else if (customId.startsWith('log_')) {
            const action = customId.replace('log_', '');
            if(action === 'clear') {
                this._resetUserState(userId);
                this._logInteraction(userId, 'Log Cleared', 'Manually cleared log');
                responseContainer = this.buildInteractionLogContainer(userId);
            }
        }
        
        // Demo Button Interactions
        else if (customId.startsWith('demo_')) {
            const style = customId.replace('demo_', '').toUpperCase();
            this._logInteraction(userId, 'Button Clicked', `${style} style button`);
            await interaction.followUp({ content: `You clicked the **${style}** button!`, ephemeral: true });
            return;
        }

        if(responseContainer) {
            await interaction.editReply({ components: [responseContainer], flags: MessageFlags.IsComponentsV2 });
        }

      } catch (error) {
        console.error('CV2 Interaction Error:', error);
        await interaction.followUp({ content: 'An error occurred while processing your request.', ephemeral: true });
      }
    });

    collector.on('end', async () => {
      const expiredContainer = new ContainerBuilder().setAccentColor(0x747F8D)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent('# 🚀 Components v2 Showcase\n*This demo has expired or was closed.*\n\nRun the command again to start a new demonstration.'));
      
      try {
        await sent.edit({ components: [expiredContainer], files: [], flags: MessageFlags.IsComponentsV2 });
      } catch (e) {
        // Ignore errors for messages that may have been deleted.
      }
    });
  }
}

export default new CV2Command();