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
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  ComponentType
} from 'discord.js';
import { Command } from '../../structures/Command.js';
import { themeManager } from '../../managers/ThemeManager.js';
import { logger } from '../../utils/logger.js';

class QueueCommand extends Command {
  constructor() {
    super({
      name: 'queue',
      description: 'Display the current music queue',
      aliases: ['q', 'list'],
      category: 'music',
      cooldown: 3,
      playerRequired: true
    });
  }
  
  async execute({ message, musicManager }) {
    const { guild, author } = message;
    const player = musicManager.getPlayer(guild.id);

    if (!player || (!player.queue.current && !player.queue.length)) {
      return message.reply({
        content: '❌ The music queue is empty. Add some songs!'
      });
    }

    const current = player.queue.current;
    const position = player.position || 0;
    // const duration = current?.length || 0; // Duration is now part of current object in card
    const upcomingTracks = player.queue.slice(); // Full list of upcoming tracks

    const QueueCardClass = await themeManager.getQueueCardClass(guild.id);
    const queueCard = new QueueCardClass();

    // --- Determine items per page based on card class static properties ---
    const itemsPerPageFirstDefault = 5; // Fallback for default theme page 1
    const itemsPerPageOtherDefault = 8; // Fallback for default theme other pages
    const itemsPerPageFirstPixel = 8;   // Fallback for pixel theme page 1
    const itemsPerPageOtherPixel = 11;  // Fallback for pixel theme other pages

    let itemsFirstPage = QueueCardClass.ITEMS_PER_PAGE_FIRST;
    let itemsOtherPages = QueueCardClass.ITEMS_PER_PAGE_OTHER;

    // Apply fallbacks if static properties are not on the class
    if (typeof itemsFirstPage !== 'number') {
        // Crude check: if class name contains "pixel", assume pixel fallbacks
        itemsFirstPage = QueueCardClass.name.toLowerCase().includes('pixel') ? itemsPerPageFirstPixel : itemsPerPageFirstDefault;
    }
    if (typeof itemsOtherPages !== 'number') {
        itemsOtherPages = QueueCardClass.name.toLowerCase().includes('pixel') ? itemsPerPageOtherPixel : itemsPerPageOtherDefault;
    }
    // If there's no "current" track, the first page behaves like an "other" page in terms of item count
    if (!current) {
        itemsFirstPage = itemsOtherPages;
    }
    // --- End items per page determination ---

    // --- Calculate totalPages correctly ---
    let totalPages;
    if (upcomingTracks.length === 0) {
        totalPages = 1;
    } else if (upcomingTracks.length <= itemsFirstPage) {
        totalPages = 1;
    } else {
        const remainingTracksAfterFirstPage = upcomingTracks.length - itemsFirstPage;
        const numOtherPages = Math.ceil(remainingTracksAfterFirstPage / itemsOtherPages);
        totalPages = 1 + numOtherPages;
    }
    totalPages = Math.max(1, totalPages); // Ensure at least 1 page
    // --- End totalPages calculation ---

    let page = 1;

    try {
        const generateAndReply = async (currentPage) => {
            let itemsForThisPage;
            if (currentPage === 1) {
                itemsForThisPage = itemsFirstPage;
            } else {
                itemsForThisPage = itemsOtherPages;
            }
            
            // The card expects `itemsPerPage` to be the count for *this specific page*
            // The card's internal slicing logic uses this.
            const imageBuffer = await queueCard.generateQueueCard({
              current,
              position,
              // duration: current?.length || 0, // Pass duration if needed, or card uses current.length
              tracks: upcomingTracks, // Pass the full upcoming tracks list
              page: currentPage,
              totalPages,
              itemsPerPage: itemsForThisPage, // Tell the card how many to display from upcomingTracks for this page
              guildName: guild.name,
              guildIcon: guild.iconURL({ extension: 'png', size: 128 }),
              player // Pass player object if card needs more (e.g., loop status)
            });

            const attachment = new AttachmentBuilder(imageBuffer, { name: 'queue.png' });
            return { files: [attachment] };
        };

        const getButtons = (currentPage) =>
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('prev_queue_page')
              .setLabel('◀ Previous')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(currentPage === 1),
            new ButtonBuilder()
              .setCustomId('next_queue_page')
              .setLabel('Next ▶')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(currentPage === totalPages || totalPages <= 1)
          );

        const replyOptions = await generateAndReply(page);
        const msg = await message.reply({
          ...replyOptions,
          components: totalPages > 1 ? [getButtons(page)] : []
        });

        if (totalPages <= 1) return;

        const collector = msg.createMessageComponentCollector({
          componentType: ComponentType.Button,
          time: 120000 // Increased time
        });

        collector.on('collect', async (interaction) => {
          if (interaction.user.id !== author.id) {
            return interaction.reply({
              content: '❌ You did not request this command.',
              ephemeral: true
            });
          }
          
          const previousPage = page;
          if (interaction.customId === 'prev_queue_page' && page > 1) page--;
          if (interaction.customId === 'next_queue_page' && page < totalPages) page++;
          
          if (page === previousPage) { // No change, defer and do nothing
            await interaction.deferUpdate();
            return;
          }

          await interaction.deferUpdate();
          const newReplyOptions = await generateAndReply(page);
          await interaction.editReply({
            ...newReplyOptions,
            components: [getButtons(page)]
          });
        });

        collector.on('end', (_, reason) => {
          if (reason !== 'messageDelete' && !msg.deleted) { // Check if message still exists
            msg.edit({ components: [] }).catch(err => {
                if (err.code !== 10008) { // Ignore "Unknown Message" error
                   logger.warn("QueueCommand", `Failed to remove components on end: ${err.message}`);
                }
            });
          }
        });
    } catch(error) {
        logger.error("QueueCommand", "Error generating or sending queue card:", error);
        message.reply({ content: "Sorry, I couldn't display the queue right now."});
    }
  }
}

export default new QueueCommand();
