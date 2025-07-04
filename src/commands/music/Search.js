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
import { SearchManager } from '../../managers/SearchManager.js';
import { embedManager } from '../../managers/EmbedManager.js';
import { 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  ComponentType, 
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import { themeManager } from '../../managers/ThemeManager.js'; // Import ThemeManager
import { logger } from '../../utils/logger.js';

class SearchCommand extends Command {
  constructor() {
    super({
      name: 'search',
      description: 'Search for a track on YouTube, Spotify, or SoundCloud.',
      usage: 'search <song name>',
      aliases: ['find'],
      category: 'music',
      cooldown: 2,
      voiceRequired: true,
      examples: ['search blinding lights', 'search romantic songs --platform spotify']
    });
  }
  
  async execute({ message, args, client, musicManager }) {
    const { channel, guild, author } = message;

    if (!args.length) {  
      const reply = embedManager.error('Invalid Usage', `Please provide a song to search!\n\nUsage: \`${this.usage}\``);  
      return message.reply({ embeds: [reply] });  
    }  

    let platform = 'spotify'; 
    let queryArgs = [];  

    for (let i = 0; i < args.length; i++) {  
      if ((args[i] === '--platform' || args[i] === '--pl') && i + 1 < args.length) {  
        const requestedPlatform = args[i + 1].toLowerCase();  
        const validPlatforms = ['youtube', 'yt', 'spotify', 'sp', 'soundcloud', 'sc', 'deezer', 'dz'];  
        if (validPlatforms.includes(requestedPlatform)) {  
          if (requestedPlatform === 'yt') platform = 'youtube';
          else if (requestedPlatform === 'sp') platform = 'spotify';
          else if (requestedPlatform === 'sc') platform = 'soundcloud';
          else if (requestedPlatform === 'dz') platform = 'deezer';
          else platform = requestedPlatform;
        }  
        i++; 
      } else {  
        queryArgs.push(args[i]);  
      }  
    }  

    const query = queryArgs.join(' ');  

    if (!query.length) {  
      const reply = embedManager.error('Invalid Usage', `Please provide a song to search!\n\nUsage: \`${this.usage}\``);  
      return message.reply({ embeds: [reply] });  
    }  

    const searchManager = new SearchManager(musicManager);  
    const searchingEmbed = embedManager.create({  
      color: embedManager.colors.default,    
      description: `<a:byte_loading:1370748439918280864> Searching for \`${query}\` on ${platform.charAt(0).toUpperCase() + platform.slice(1)}`,  
      timestamp: true  
    });  
    const searchingMsg = await message.reply({ embeds: [searchingEmbed] });  

    try {  
      const result = await searchManager.search(query, { platform, requester: message.author, limit: 25 }); // Fetch up to 25 for pagination

      if (!result || !result.tracks.length) {  
        const reply = embedManager.error('No Results Found', `Could not find any results for: \`${query}\` on ${platform.charAt(0).toUpperCase() + platform.slice(1)}`);  
        return searchingMsg.edit({ embeds: [reply], components: [] });  
      }

      const allTracks = result.tracks.slice(0, 25); // Still limit overall to 25 for now
      
      const SearchCardClass = await themeManager.getSearchCardClass(guild.id); 
      const searchCard = new SearchCardClass(); 

      // VVVVVV MODIFIED SECTION VVVVVV
      const itemsPerPageOnCard = SearchCardClass.ITEMS_PER_PAGE || 5; // Get from card class, fallback to 5
      const itemsPerPageForMenu = 10; // Select menu can still show up to 10 from the current *set* of tracks for the page.
      // ^^^^^^ MODIFIED SECTION ^^^^^^
      
      const totalPages = Math.ceil(allTracks.length / itemsPerPageOnCard);
      let currentPage = 1;
      

      const displayPage = async (page) => {
        const startIdx = (page - 1) * itemsPerPageOnCard;
        const tracksForCard = allTracks.slice(startIdx, startIdx + itemsPerPageOnCard);
        
        // VVVVVV MODIFIED VVVVVV
        // For the menu, we want to offer selection from the tracks that *could* be on the card,
        // but the menu itself can handle up to itemsPerPageForMenu (e.g. 10) options from that page's data.
        // If itemsPerPageOnCard is 10, tracksForMenu will be the same as tracksForCard in this logic.
        // If itemsPerPageOnCard is 5, tracksForMenu will still show up to 10 *overall* if available from allTracks.
        // Let's adjust tracksForMenu to be based on itemsPerPageOnCard as well, but capped at 10 for the menu component limit.
        const menuDisplayCount = Math.min(itemsPerPageOnCard, itemsPerPageForMenu);
        const tracksForMenu = allTracks.slice(startIdx, startIdx + menuDisplayCount);
        // ^^^^^^ MODIFIED ^^^^^^
        
        const options = tracksForMenu.map((track, i) => ({  
          label: this.truncateTextForMenu(track.title, 100),  
          description: this.truncateTextForMenu(track.author, 100),  
          value: (startIdx + i).toString() // Value still refers to index in allTracks
        }));

        const selectMenu = new StringSelectMenuBuilder()  
          .setCustomId('select_search_tracks')  
          .setPlaceholder(`Choose tracks (1-${menuDisplayCount} from this page)`)
          .setMinValues(1)  
          .setMaxValues(Math.min(options.length, menuDisplayCount)) // Max values also respects menuDisplayCount
          .addOptions(options.slice(0, menuDisplayCount)); // Slice to menuDisplayCount

        const actionRow = new ActionRowBuilder().addComponents(selectMenu);
        
        const cardImageBuffer = await searchCard.generateSearchCard({
            query, platform, tracks: tracksForCard, page, totalPages,
            guildName: guild.name, guildIcon: guild.iconURL({ extension: 'png', size: 128 }), requester: author
        });
        const attachment = new AttachmentBuilder(cardImageBuffer, { name: 'search.png' });

        const buttonsRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('prev_search_page').setLabel('◀ Previous').setStyle(ButtonStyle.Primary).setDisabled(page === 1),
          new ButtonBuilder().setCustomId('next_search_page').setLabel('Next ▶').setStyle(ButtonStyle.Primary).setDisabled(page === totalPages || totalPages <= 1)
        );
        
        const components = [];
        if (options.length > 0) components.push(actionRow);
        if (totalPages > 1) components.push(buttonsRow);

        return searchingMsg.edit({ 
          content: options.length === 0 && page > 1 ? 'No more results on this page.' : null,
          embeds: [], files: [attachment], components: components
        });
      };
      
      await displayPage(currentPage);

      const selectCollector = searchingMsg.createMessageComponentCollector({  
        componentType: ComponentType.StringSelectMenu, time: 60000,
        filter: interaction => interaction.user.id === author.id && interaction.customId === 'select_search_tracks'  
      });
      
      const buttonCollector = searchingMsg.createMessageComponentCollector({
        componentType: ComponentType.Button, time: 60000,
        filter: interaction => interaction.user.id === author.id && (interaction.customId === 'prev_search_page' || interaction.customId === 'next_search_page')
      });

      selectCollector.on('collect', async interaction => {  
        await interaction.deferUpdate();  
        const indexes = interaction.values.map(v => parseInt(v));  
        const toAdd = indexes.map(i => allTracks[i]).filter(Boolean);

        if (toAdd.length === 0) return;

        const player = await musicManager.createPlayer({ guildId: guild.id, voiceChannelId: message.member.voice.channelId, textChannelId: channel.id, selfDeaf: true });
        let firstTrackPlayed = false;
        for (const track of toAdd) {  
          if (!player.playing && !player.paused && player.queue.size === 0 && !firstTrackPlayed) {  
            player.queue.add(track); player.play(); firstTrackPlayed = true;  
          } else { player.queue.add(track); }  
        }
        await message.reply({ embeds: [embedManager.success('Queued Songs', `Queued ${toAdd.length} song${toAdd.length > 1 ? 's' : ''}:\n${toAdd.map(t => `**${this.truncateTextForMenu(t.title, 50)}** - ${this.truncateTextForMenu(t.author, 40)}`).join('\n')}`)] }).catch(e => logger.error("SearchCommand", "Failed to send queue confirmation:", e));
        selectCollector.stop("tracksSelected"); buttonCollector.stop("tracksSelected");
      });
      
      buttonCollector.on('collect', async interaction => {
        if (interaction.customId === 'prev_search_page' && currentPage > 1) currentPage--;
        else if (interaction.customId === 'next_search_page' && currentPage < totalPages) currentPage++;
        else { await interaction.deferUpdate(); return; }
        await interaction.deferUpdate(); await displayPage(currentPage);
      });

      const onEnd = (reason) => {
        if (reason !== "tracksSelected" && !searchingMsg.deleted) {
          searchingMsg.edit({ components: [] }).catch(err => logger.warn("SearchCommand", `Failed to remove components on end: ${err.message}`));
        }
      };
      selectCollector.on('end', (_, reason) => { onEnd(reason); if (!buttonCollector.ended) buttonCollector.stop(reason); });
      buttonCollector.on('end', (_, reason) => { onEnd(reason); if (!selectCollector.ended) selectCollector.stop(reason); });

    } catch (err) {  
      logger.error("SearchCommand", "Error in search command:", err);  
      const errorEmbed = embedManager.error('Error', 'Failed to perform search. Please try again.');  
      if (!searchingMsg.deleted) await searchingMsg.edit({ embeds: [errorEmbed], components: [] });  
    }
  }
  
  truncateTextForMenu(text = '', maxLength) {
    if (!text) return ''; text = String(text);
    return text.length <= maxLength ? text : text.substring(0, maxLength - 3) + '...';
  }
}

export default new SearchCommand();
