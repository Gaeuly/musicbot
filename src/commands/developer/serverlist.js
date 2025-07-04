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
import {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  codeBlock,
  PermissionsBitField,
  ChannelType
} from 'discord.js';
import { Command } from '../../structures/Command.js';

const PER_PAGE = 10;
const COLLECTOR_TIMEOUT = 300000; // 5 minutes

const CUSTOM_IDS = {
  SORT_MENU: 'sort-menu',
  SERVER_SELECT_MENU: 'server-select',
  INVITE_SELECT_MENU: 'invite-select',
  FIRST_BUTTON: 'first',
  PREV_BUTTON: 'prev',
  NEXT_BUTTON: 'next',
  LAST_BUTTON: 'last',
  LEAVE_SELECTED_BUTTON: 'leave-selected',
  CONFIRM_LEAVE_BUTTON: 'confirm-leave',
  CANCEL_LEAVE_BUTTON: 'cancel-leave',
};

class ServersCommand extends Command {
  constructor() {
    super({
      name: 'servers',
      description: 'Lists all servers the bot is in with management options.',
      usage: 'servers',
      aliases: ['serverlist', 'guilds'],
      category: 'owner',
      ownerOnly: true
    });
  }

  _getSortLabel(sort) {
    switch (sort) {
      case 'members': return 'Member Count ↓';
      case 'members-asc': return 'Member Count ↑';
      case 'name': return 'Name (A-Z)';
      case 'name-desc': return 'Name (Z-A)';
      case 'created': return 'Newest First';
      case 'created-asc': return 'Oldest First';
      default: return 'Member Count';
    }
  }

  _sortGuilds(guilds, sortType) {
    const sorted = [...guilds];
    switch (sortType) {
      case 'members':
        sorted.sort((a, b) => b.memberCount - a.memberCount);
        break;
      case 'members-asc':
        sorted.sort((a, b) => a.memberCount - b.memberCount);
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'created':
        sorted.sort((a, b) => b.createdTimestamp - a.createdTimestamp);
        break;
      case 'created-asc':
        sorted.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
        break;
    }
    return sorted;
  }

  _paginateGuilds(guilds, perPage) {
    const pages = [];
    if (!guilds || guilds.length === 0) {
      return [[]]; 
    }
    for (let i = 0; i < guilds.length; i += perPage) {
      pages.push(guilds.slice(i, i + perPage));
    }
    return pages.length > 0 ? pages : [[]];
  }
  
  _generateEmbed(totalGuildsCount, guildsOnPage, currentPageNum, totalPages, currentSort, clientUsername) {
    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle('🖥️ Server List')
      .setFooter({ text: `Use the buttons to navigate • ${clientUsername}` })
      .setTimestamp();

    let description = `Currently in **${totalGuildsCount}** servers | Page ${currentPageNum + 1}/${totalPages || 1} | Sort: ${this._getSortLabel(currentSort)}`;
    embed.setDescription(description);

    if (totalGuildsCount === 0) {
        embed.setDescription(`Not in any servers. | Sort: ${this._getSortLabel(currentSort)}`);
    } else if (!guildsOnPage || guildsOnPage.length === 0) {
        embed.setDescription(`${description}\n\nNo servers to display on this page.`);
    }

    if (guildsOnPage && guildsOnPage.length > 0) {
      guildsOnPage.forEach((g, i) => {
        const index = currentPageNum * PER_PAGE + i + 1;
        const totalMembers = g.memberCount || 0;
        const botCount = g.members.cache.filter(m => m.user.bot).size;
        const humanCount = totalMembers - botCount;

        embed.addFields({
          name: `${index}. ${g.name.substring(0, 250)}`,
          value: [
            `**ID:** \`${g.id}\``,
            `**Owner:** <@${g.ownerId}> (ID: \`${g.ownerId}\`)`,
            `**Members:** ${totalMembers} (👤 ${humanCount} | 🤖 ${botCount})`,
            `**Created:** <t:${Math.floor(g.createdTimestamp / 1000)}:R>`
          ].join('\n')
        });
      });
    }
    
    return embed;
  }

  _generateSortMenu(currentSort) {
    const sortMenu = new StringSelectMenuBuilder()
      .setCustomId(CUSTOM_IDS.SORT_MENU)
      .setPlaceholder('Sort servers by...')
      .addOptions([
        { label: 'Member Count (High to Low)', value: 'members', emoji: '👥', default: currentSort === 'members' },
        { label: 'Member Count (Low to High)', value: 'members-asc', emoji: '👤', default: currentSort === 'members-asc' },
        { label: 'Name (A-Z)', value: 'name', emoji: '🔤', default: currentSort === 'name' },
        { label: 'Name (Z-A)', value: 'name-desc', emoji: '🔡', default: currentSort === 'name-desc' },
        { label: 'Newest First', value: 'created', emoji: '📆', default: currentSort === 'created' },
        { label: 'Oldest First', value: 'created-asc', emoji: '🗓️', default: currentSort === 'created-asc' }
      ]);
    return new ActionRowBuilder().addComponents(sortMenu);
  }

  _generateServerSelectMenu(serversOnPage) {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(CUSTOM_IDS.SERVER_SELECT_MENU)
      .setPlaceholder('Select servers to leave...')
      .setMinValues(1)
      .setMaxValues(Math.max(1, serversOnPage.length)); 
    
    serversOnPage.forEach((g) => {
      selectMenu.addOptions({
        label: g.name.substring(0, 100),
        description: `ID: ${g.id} | ${g.memberCount} members`.substring(0,100),
        value: g.id,
        emoji: '🖥️'
      });
    });
    return new ActionRowBuilder().addComponents(selectMenu);
  }

  _generateInviteMenu(serversOnPage) {
    const inviteMenu = new StringSelectMenuBuilder()
      .setCustomId(CUSTOM_IDS.INVITE_SELECT_MENU)
      .setPlaceholder('Generate invite for a server...')
      .setMinValues(1)
      .setMaxValues(1);
      
    serversOnPage.forEach((g) => {
      inviteMenu.addOptions({
        label: g.name.substring(0,100),
        description: `Generate invite link for this server`.substring(0,100),
        value: g.id,
        emoji: '📨'
      });
    });
    return new ActionRowBuilder().addComponents(inviteMenu);
  }

  _generateNavigationButtons(page, totalPages) {
    const isSinglePageOrNoPages = totalPages <= 1;
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(CUSTOM_IDS.FIRST_BUTTON).setLabel('⏮️ First').setStyle(ButtonStyle.Secondary).setDisabled(page === 0 || isSinglePageOrNoPages),
      new ButtonBuilder().setCustomId(CUSTOM_IDS.PREV_BUTTON).setLabel('◀️ Previous').setStyle(ButtonStyle.Primary).setDisabled(page === 0 || isSinglePageOrNoPages),
      new ButtonBuilder().setCustomId(CUSTOM_IDS.NEXT_BUTTON).setLabel('Next ▶️').setStyle(ButtonStyle.Primary).setDisabled(page >= totalPages - 1 || isSinglePageOrNoPages),
      new ButtonBuilder().setCustomId(CUSTOM_IDS.LAST_BUTTON).setLabel('Last ⏭️').setStyle(ButtonStyle.Secondary).setDisabled(page >= totalPages - 1 || isSinglePageOrNoPages),
      new ButtonBuilder().setCustomId(CUSTOM_IDS.LEAVE_SELECTED_BUTTON).setLabel('Leave Selected').setStyle(ButtonStyle.Danger).setDisabled(totalPages === 0)
    );
  }

  _generateConfirmLeaveButtons() {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(CUSTOM_IDS.CONFIRM_LEAVE_BUTTON).setLabel('✅ Confirm Leave').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(CUSTOM_IDS.CANCEL_LEAVE_BUTTON).setLabel('❌ Cancel').setStyle(ButtonStyle.Secondary)
    );
  }

  async _handleInviteGeneration(interaction, client, author) {
    const selectedGuildId = interaction.values[0];
    const selectedGuild = client.guilds.cache.get(selectedGuildId);

    if (!selectedGuild) {
      await interaction.followUp({ content: '❌ Could not find the selected server.' });
      return;
    }

    try {
      const guildChannel = selectedGuild.channels.cache
        .filter(ch => 
          ch.type === ChannelType.GuildText &&
          ch.permissionsFor(selectedGuild.members.me).has(PermissionsBitField.Flags.CreateInstantInvite)
        )
        .sort((a,b) => a.position - b.position)
        .first();
        
      if (!guildChannel) {
        await interaction.followUp({ content: '❌ I don\'t have permission to create invites in any suitable text channel in this server.' });
        return;
      }
      
      const invite = await guildChannel.createInvite({
        maxAge: 86400, 
        maxUses: 1,
        unique: true,
        reason: `Invite requested by bot owner ${author.tag} (${author.id})`
      });
      
      const inviteEmbed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle('📨 Server Invite Generated')
        .setDescription(`Invite for **${selectedGuild.name}** has been created.`)
        .addFields(
          { name: 'Invite URL', value: `https://discord.gg/${invite.code}` },
          { name: 'Channel', value: `${guildChannel.toString()}` },
          { name: 'Expires', value: 'After 24 hours or 1 use' }
        );
      
      await interaction.followUp({ embeds: [inviteEmbed] });
    } catch (error) {
      console.error(`Error creating invite for guild ${selectedGuildId}:`, error);
      await interaction.followUp({ content: `❌ Failed to create invite: ${error.message}` });
    }
  }
  
  async _handleLeaveConfirmation(interaction, client, serverIdsToLeave, onAfterLeaveCallback) {
    const serversToLeaveDetails = serverIdsToLeave.map(id => {
      const server = client.guilds.cache.get(id);
      return server ? `${server.name.substring(0,50)} (${id})` : `Unknown Server (${id})`;
    });

    const confirmEmbed = new EmbedBuilder()
      .setColor('#e74c3c')
      .setTitle('⚠️ Confirm Server Leave')
      .setDescription(`Are you sure you want to leave the following ${serversToLeaveDetails.length} server(s)?\n\n${codeBlock(serversToLeaveDetails.join('\n').substring(0, 4000))}`)
      .setFooter({ text: 'This action cannot be undone!' });

    const confirmationMessage = await interaction.followUp({
      embeds: [confirmEmbed],
      components: [this._generateConfirmLeaveButtons()],
      fetchReply: true
    });

    try {
      const confirmationInteraction = await confirmationMessage.awaitMessageComponent({
        filter: i => i.user.id === interaction.user.id && (i.customId === CUSTOM_IDS.CONFIRM_LEAVE_BUTTON || i.customId === CUSTOM_IDS.CANCEL_LEAVE_BUTTON),
        componentType: ComponentType.Button,
        time: 60000 
      });

      await confirmationInteraction.deferUpdate();

      if (confirmationInteraction.customId === CUSTOM_IDS.CONFIRM_LEAVE_BUTTON) {
        const leaveResults = [];
        for (const id of serverIdsToLeave) {
          const server = client.guilds.cache.get(id);
          if (server) {
            try {
              await server.leave();
              leaveResults.push(`✅ Left: ${server.name}`);
            } catch (err) {
              console.error(`Failed to leave guild ${server.id}:`, err);
              leaveResults.push(`❌ Failed to leave ${server.name}: ${err.message}`);
            }
          } else {
            leaveResults.push(`❓ Server ID ${id} not found or already left.`);
          }
        }
        await confirmationMessage.edit({
          content: `Leave operation results:\n${codeBlock(leaveResults.join('\n').substring(0,1950))}`,
          embeds: [],
          components: []
        });
        if (onAfterLeaveCallback) await onAfterLeaveCallback();
      } else if (confirmationInteraction.customId === CUSTOM_IDS.CANCEL_LEAVE_BUTTON) {
        await confirmationMessage.edit({
          content: '🛑 Leave operation cancelled.',
          embeds: [],
          components: []
        });
      }
    } catch (error) { 
      console.error('Error during leave confirmation:', error);
      await confirmationMessage.edit({
        content: '⌛ Confirmation timed out or an error occurred. Leave operation cancelled.',
        embeds: [],
        components: []
      }).catch(() => null); 
    }
  }

  async execute({ message, client }) {
    const { channel, author } = message;

    try {
      let allClientGuilds = [...client.guilds.cache.values()];
      
      let currentSort = 'members';
      let currentPage = 0;
      let selectedServerIdsForLeave = [];

      const getSortedAndPaginatedGuilds = () => {
        const sorted = this._sortGuilds(allClientGuilds, currentSort);
        return this._paginateGuilds(sorted, PER_PAGE);
      };

      let pages = getSortedAndPaginatedGuilds();
      
      if (allClientGuilds.length === 0) {
         pages = [[]];
      }

      const updateMessage = async (msgToUpdate, newPage = currentPage) => {
        currentPage = Math.max(0, Math.min(newPage, pages.length - 1));
        if (pages.length === 0 || pages[0].length === 0 && allClientGuilds.length === 0) { // Handle case where all servers are left
            currentPage = 0;
        }


        const guildsOnThisPage = (pages.length > 0 && pages[currentPage]) ? pages[currentPage] : [];
        const embed = this._generateEmbed(allClientGuilds.length, guildsOnThisPage, currentPage, pages.length, currentSort, client.user.username);
        
        const components = [];
        components.push(this._generateSortMenu(currentSort));
        
        if (allClientGuilds.length > 0 && guildsOnThisPage.length > 0) {
          components.push(this._generateServerSelectMenu(guildsOnThisPage));
          components.push(this._generateInviteMenu(guildsOnThisPage));
        }
        components.push(this._generateNavigationButtons(currentPage, pages.length));
        
        await msgToUpdate.edit({ embeds: [embed], components });
      };
      
      if (allClientGuilds.length === 0) {
        return message.reply('I am not in any servers.');
      }

      const initialGuildsOnPage = (pages.length > 0 && pages[currentPage]) ? pages[currentPage] : [];
      const initialEmbed = this._generateEmbed(allClientGuilds.length, initialGuildsOnPage, currentPage, pages.length, currentSort, client.user.username);
      const initialComponents = [];
      initialComponents.push(this._generateSortMenu(currentSort));
      if (allClientGuilds.length > 0 && initialGuildsOnPage.length > 0) {
          initialComponents.push(this._generateServerSelectMenu(initialGuildsOnPage));
          initialComponents.push(this._generateInviteMenu(initialGuildsOnPage));
      }
      initialComponents.push(this._generateNavigationButtons(currentPage, pages.length));

      const mainMessage = await channel.send({
        embeds: [initialEmbed],
        components: initialComponents
      });

      const collector = mainMessage.createMessageComponentCollector({
        filter: i => i.user.id === author.id,
        time: COLLECTOR_TIMEOUT
      });

      collector.on('collect', async (interaction) => {
        try {
            await interaction.deferUpdate();

            if (interaction.isStringSelectMenu()) {
                if (interaction.customId === CUSTOM_IDS.SORT_MENU) {
                    currentSort = interaction.values[0];
                    pages = getSortedAndPaginatedGuilds();
                    await updateMessage(mainMessage, 0);
                } else if (interaction.customId === CUSTOM_IDS.INVITE_SELECT_MENU) {
                    await this._handleInviteGeneration(interaction, client, author);
                } else if (interaction.customId === CUSTOM_IDS.SERVER_SELECT_MENU) {
                    selectedServerIdsForLeave = interaction.values;
                    await interaction.followUp({ content: `Selected ${selectedServerIdsForLeave.length} server(s). Click "Leave Selected" to proceed.` });
                }
            } else if (interaction.isButton()) {
                switch (interaction.customId) {
                case CUSTOM_IDS.FIRST_BUTTON:
                    await updateMessage(mainMessage, 0);
                    break;
                case CUSTOM_IDS.PREV_BUTTON:
                    await updateMessage(mainMessage, currentPage - 1);
                    break;
                case CUSTOM_IDS.NEXT_BUTTON:
                    await updateMessage(mainMessage, currentPage + 1);
                    break;
                case CUSTOM_IDS.LAST_BUTTON:
                    await updateMessage(mainMessage, pages.length - 1);
                    break;
                case CUSTOM_IDS.LEAVE_SELECTED_BUTTON:
                    if (selectedServerIdsForLeave.length === 0) {
                        await interaction.followUp({ content: 'You need to select at least one server first!' });
                        return;
                    }
                    await this._handleLeaveConfirmation(interaction, client, selectedServerIdsForLeave, async () => {
                        allClientGuilds = [...client.guilds.cache.values()];
                        selectedServerIdsForLeave = []; 

                        if (allClientGuilds.length === 0) {
                            await mainMessage.edit({ 
                                content: 'I am no longer in any servers.', 
                                embeds: [], 
                                components: [] 
                            }).catch(() => null);
                            collector.stop("no_servers_left");
                            return;
                        }
                        
                        pages = getSortedAndPaginatedGuilds();
                        let newCurrentPage = currentPage;
                        if (newCurrentPage >= pages.length) { // If current page is now out of bounds
                            newCurrentPage = Math.max(0, pages.length - 1);
                        }
                        if (pages.length === 1 && pages[0].length === 0) { // If all servers were on the last page and now it's empty
                           // This case means allClientGuilds is also 0, handled above.
                           // Or, means pages is [[]] but allClientGuilds > 0 (error in logic)
                           // Let's be safe: if pages becomes [[]], it means no guilds to show.
                           if (allClientGuilds.length > 0) pages = getSortedAndPaginatedGuilds(); // re-calc if somehow out of sync
                        }
                        await updateMessage(mainMessage, newCurrentPage);
                    });
                    break;
                }
            }
        } catch (error) {
            console.error('Error processing interaction in servers command:', error);
            if (!interaction.replied && !interaction.deferred) {
                 await interaction.reply({ content: 'An error occurred while processing your action.', ephemeral: true }).catch(() => null);
            } else {
                 await interaction.followUp({ content: 'An error occurred while processing your action.', ephemeral: true }).catch(() => null);
            }
        }
      });

      collector.on('end', (collected, reason) => {
        if (reason === "no_servers_left") return; 
        if (mainMessage.editable) {
          mainMessage.edit({ content: 'This menu has expired.', components: [] }).catch(() => null);
        }
      });
    } catch (error) {
      console.error('Error in servers command execute:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('Command Error')
        .setDescription(`An error occurred while executing the command:\n${codeBlock(error.message)}`);
      message.channel.send({ embeds: [errorEmbed] });
    }
  }
}

export default new ServersCommand();
