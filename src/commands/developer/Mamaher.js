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
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { db } from '../../database/DatabaseManager.js';
import { embedManager } from '../../managers/EmbedManager.js';

class ManagementCommand extends Command {
  constructor() {
    super({
      name: 'management',
      description: 'Manage bot managers (add/remove/list)',
      usage: 'management <add|remove|list> [user] [reason]',
      aliases: ['manage', 'manager'],
      category: 'owner',
      ownerOnly: true,
      management: false,
      examples: [
        'management add @user For helping with moderation',
        'management remove @user',
        'management list'
      ]
    });
  }

  async execute({ message, args, client }) {
    if (!args.length) {
      return this.showHelp(message);
    }

    const action = args[0].toLowerCase();

    switch (action) {
      case 'add':
        return this.addManager(message, args, client);
      case 'remove':
        return this.removeManager(message, args, client);
      case 'list':
        return this.listManagers(message, client);
      default:
        return this.showHelp(message);
    }
  }

  async showHelp(message) {
    const embed = embedManager.create({
      color: embedManager.colors.primary,
      title: '🛠️ Management Command Help',
      description: 'Manage bot managers with the following subcommands:',
      fields: [
        {
          name: '📝 Add Manager',
          value: '`management add <@user|userID> [reason]`\nGrants management permissions to a user',
          inline: false
        },
        {
          name: '🗑️ Remove Manager',
          value: '`management remove <@user|userID>`\nRemoves management permissions from a user',
          inline: false
        },
        {
          name: '📋 List Managers',
          value: '`management list`\nShows all current managers',
          inline: false
        }
      ],
      footer: { text: 'Management permissions are permanent until removed' }
    });

    return message.reply({ embeds: [embed] });
  }

  async addManager(message, args, client) {
    if (args.length < 2) {
      const embed = embedManager.create({
        color: embedManager.colors.error,
        title: '❌ Invalid Usage',
        description: 'Please provide a user to add as manager.\n\n**Usage:** `management add <@user|userID> [reason]`'
      });
      return message.reply({ embeds: [embed] });
    }

    // Parse user ID
    const userArg = args[1];
    let userId = userArg.replace(/[<@!>]/g, ''); // Remove mention characters
    
    // Validate user ID
    if (!/^\d{17,19}$/.test(userId)) {
      const embed = embedManager.create({
        color: embedManager.colors.error,
        title: '❌ Invalid User',
        description: 'Please provide a valid user mention or user ID.'
      });
      return message.reply({ embeds: [embed] });
    }

    // Get reason (optional)
    const reason = args.slice(2).join(' ') || 'No reason provided';

    try {
      // Fetch user to validate they exist
      const user = await client.users.fetch(userId).catch(() => null);
      if (!user) {
        const embed = embedManager.create({
          color: embedManager.colors.error,
          title: '❌ User Not Found',
          description: 'Could not find a user with that ID. Please check and try again.'
        });
        return message.reply({ embeds: [embed] });
      }

      // Check if user is already a manager
      if (db.isManager(userId)) {
        const embed = embedManager.create({
          color: embedManager.colors.warning,
          title: '⚠️ Already Manager',
          description: `**${user.username}** is already a manager!`
        });
        return message.reply({ embeds: [embed] });
      }

      // Add manager to database
      db.addManager(userId, message.author.id, reason);

      const embed = embedManager.create({
        color: embedManager.colors.success,
        title: '✅ Manager Added',
        description: `Successfully added **${user.username}** as a manager!`,
        fields: [
          {
            name: '👤 User',
            value: `${user.username} (${user.id})`,
            inline: true
          },
          {
            name: '📝 Reason',
            value: reason,
            inline: true
          },
          {
            name: '🕒 Added At',
            value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
            inline: true
          }
        ],

        footer: { text: `Added by ${message.author.username}` }
      });

      return message.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Error adding manager:', error);
      const embed = embedManager.create({
        color: embedManager.colors.error,
        title: '❌ Error',
        description: 'An error occurred while adding the manager. Please try again.'
      });
      return message.reply({ embeds: [embed] });
    }
  }

  async removeManager(message, args, client) {
    if (args.length < 2) {
      const embed = embedManager.create({
        color: embedManager.colors.error,
        title: '❌ Invalid Usage',
        description: 'Please provide a user to remove from managers.\n\n**Usage:** `management remove <@user|userID>`'
      });
      return message.reply({ embeds: [embed] });
    }

    // Parse user ID
    const userArg = args[1];
    let userId = userArg.replace(/[<@!>]/g, ''); // Remove mention characters
    
    // Validate user ID
    if (!/^\d{17,19}$/.test(userId)) {
      const embed = embedManager.create({
        color: embedManager.colors.error,
        title: '❌ Invalid User',
        description: 'Please provide a valid user mention or user ID.'
      });
      return message.reply({ embeds: [embed] });
    }

    try {
      // Check if user is a manager
      if (!db.isManager(userId)) {
        const embed = embedManager.create({
          color: embedManager.colors.warning,
          title: '⚠️ Not a Manager',
          description: 'This user is not currently a manager!'
        });
        return message.reply({ embeds: [embed] });
      }

      // Fetch user info for display
      const user = await client.users.fetch(userId).catch(() => null);
      const userName = user ? user.username : `User ${userId}`;

      // Remove manager from database
      db.removeManager(userId);

      const embed = embedManager.create({
        color: embedManager.colors.success,
        title: '✅ Manager Removed',
        description: `Successfully removed **${userName}** from managers!`,
        fields: [
          {
            name: '👤 User',
            value: `${userName} (${userId})`,
            inline: true
          },
          {
            name: '🕒 Removed At',
            value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
            inline: true
          }
        ],
    
        footer: { text: `Removed by ${message.author.username}` }
      });

      return message.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Error removing manager:', error);
      const embed = embedManager.create({
        color: embedManager.colors.error,
        title: '❌ Error',
        description: 'An error occurred while removing the manager. Please try again.'
      });
      return message.reply({ embeds: [embed] });
    }
  }

  async listManagers(message, client) {
    try {
      const managers = db.getAllManagers();
      const stats = db.getManagerStats();

      if (!managers || managers.length === 0) {
        const embed = embedManager.create({
          color: embedManager.colors.warning,
          title: '📋 Managers List',
          description: 'No managers found.',
          footer: { text: 'Use "management add" to add managers' }
        });
        return message.reply({ embeds: [embed] });
      }

      // Create manager list with pagination if needed
      const managersPerPage = 10;
      const totalPages = Math.ceil(managers.length / managersPerPage);
      let currentPage = 0;

      const generateEmbed = async (page) => {
        const start = page * managersPerPage;
        const end = start + managersPerPage;
        const pageManagers = managers.slice(start, end);

        const managerList = [];
        
        for (const manager of pageManagers) {
          try {
            const user = await client.users.fetch(manager.userId).catch(() => null);
            const userName = manager.userId
            const addedBy = await client.users.fetch(manager.addedBy).catch(() => null);
            const addedByName = addedBy ? addedBy.username : 'Unknown';
            
            managerList.push(
              `**${userName}** (${manager.userId})\n` +
              `├ **Reason:** ${manager.reason}\n` +
              `├ **Added by:** ${addedByName}\n` +
              `└ **Added:** <t:${Math.floor(new Date(manager.createdAt).getTime() / 1000)}:R>`
            );
          } catch (error) {
            managerList.push(`**Unknown User** (${manager.userId})\n└ **Error loading data**`);
          }
        }

        return embedManager.create({
          color: embedManager.colors.primary,
          title: '📋 Bot Managers',
          description: managerList.join('\n\n'),
          fields: [
            {
              name: '📊 Statistics',
              value: `**Total Managers:** ${stats.totalManagers || managers.length}\n**Active:** ${managers.length}`,
              inline: true
            }
          ],
          footer: { 
            text: totalPages > 1 ? `Page ${page + 1} of ${totalPages} • ${managers.length} total managers` : `${managers.length} total managers`
          }
        });
      };

      const embed = await generateEmbed(currentPage);

      if (totalPages <= 1) {
        return message.reply({ embeds: [embed] });
      }

      // Create navigation buttons for pagination
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('prev_page')
            .setLabel('◀️ Previous')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage === 0),
          new ButtonBuilder()
            .setCustomId('next_page')
            .setLabel('Next ▶️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage === totalPages - 1)
        );

      const reply = await message.reply({ embeds: [embed], components: [row] });

      // Handle button interactions
      const collector = reply.createMessageComponentCollector({
        time: 300000 // 5 minutes
      });

      collector.on('collect', async (interaction) => {
        if (interaction.user.id !== message.author.id) {
          return interaction.reply({ content: 'Only the command user can navigate pages.', ephemeral: true });
        }

        if (interaction.customId === 'prev_page') {
          currentPage = Math.max(0, currentPage - 1);
        } else if (interaction.customId === 'next_page') {
          currentPage = Math.min(totalPages - 1, currentPage + 1);
        }

        const newEmbed = await generateEmbed(currentPage);
        const newRow = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('prev_page')
              .setLabel('◀️ Previous')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(currentPage === 0),
            new ButtonBuilder()
              .setCustomId('next_page')
              .setLabel('Next ▶️')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(currentPage === totalPages - 1)
          );

        await interaction.update({ embeds: [newEmbed], components: [newRow] });
      });

      collector.on('end', () => {
        // Disable buttons after collector ends
        const disabledRow = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('prev_page')
              .setLabel('◀️ Previous')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId('next_page')
              .setLabel('Next ▶️')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true)
          );

        reply.edit({ components: [disabledRow] }).catch(() => {});
      });

    } catch (error) {
      console.error('Error listing managers:', error);
      const embed = embedManager.create({
        color: embedManager.colors.error,
        title: '❌ Error',
        description: 'An error occurred while fetching the managers list. Please try again.'
      });
      return message.reply({ embeds: [embed] });
    }
  }
}

export default new ManagementCommand()