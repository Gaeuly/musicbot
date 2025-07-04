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
import { EmbedBuilder } from 'discord.js';
import { formatDuration, truncate } from '../utils/formatters.js';

/**
 * EmbedManager - Standardized embed generation
 */
export class EmbedManager {
  /**
   * Create a new EmbedManager instance
   */
  constructor() {
    // Default colors
    this.colors = {
       default: '#ff6347',  // Orange-red
       success: 0xff8c66,  // Light orange-red
       warning: 0xf39c12,  // Bright orange (retained as it fits)
       error: 0xe74c3c,    // Red (retained as it fits)
       queue: 0xff6b6b,    // Coral red
       info: 0xffa07a,     // Salmon
       byte: 0xf96932    // Tomato red// secret
    };
  }

  /**
   * Create a default embed
   * @param {object} options - Embed options
   * @returns {EmbedBuilder} - Discord.js embed builder
   */
  create(options = {}) {
    const {
      color = this.colors.default,
      title,
      description,
      thumbnail,
      fields = [],
      footer,
      timestamp = false,
      author,
      image,
      url
    } = options;

    const embed = new EmbedBuilder()
      .setColor(color);

    if (title) embed.setTitle(title);
    if (description) embed.setDescription(description);
    if (thumbnail) embed.setThumbnail(thumbnail);
    if (fields.length > 0) embed.addFields(fields);
    if (footer) embed.setFooter(footer);
    if (timestamp) embed.setTimestamp();
    if (author) embed.setAuthor(author);
    if (image) embed.setImage(image);
    if (url) embed.setURL(url);

    return embed;
  }

  /**
   * Create a success embed
   * @param {string} title - Embed title
   * @param {string} description - Embed description
   * @returns {EmbedBuilder} - Discord.js embed builder
   */
  success(title, description) {
    return this.create({
      color: this.colors.success,
      title,
      description,
      timestamp: true
    });
  }
    custom(title, description) {

    return this.create({

      color: this.colors.success,

      title,

      description,

      timestamp: true

    });

  }
    info(title, description) {

    return this.create({

      color: this.colors.success,

      title,

      description,

      timestamp: true

    });

  }

  /**
   * Create an error embed
   * @param {string} title - Embed title
   * @param {string} description - Embed description
   * @returns {EmbedBuilder} - Discord.js embed builder
   */
  error(title, description) {
    return this.create({
      color: this.colors.error,
      title,
      description,
      timestamp: true
    });
  }

  /**
   * Create a warning embed
   * @param {string} title - Embed title
   * @param {string} description - Embed description
   * @returns {EmbedBuilder} - Discord.js embed builder
   */
  warning(title, description) {
    return this.create({
      color: this.colors.warning,
      title,
      description,
      timestamp: true
    });
  }

  /**
   * Create a now playing embed
   * @param {object} track - The current track
   * @param {object} player - The player
   * @returns {EmbedBuilder} - Discord.js embed builder
   */
  nowPlaying(track, player) {
    if (!track) {
      return this.create({
        color: this.colors.info,
        title: 'No Track Playing',
        description: 'Nothing is currently playing.',
        timestamp: true
      });
    }

    const progress = player?.position || 0;
    const duration = track.length;

    // Create progress bar
    const progressBar = this.createProgressBar(progress, duration);

    return this.create({
      color: this.colors.default,
      title: 'Now Playing',
      description: `[${truncate(track.title, 50)}](${track.uri})`,
      thumbnail: track.thumbnail,
      fields: [
        { name: 'Artist', value: track.author, inline: true },
        { name: 'Duration', value: formatDuration(duration), inline: true },
        { name: 'Requested By', value: track.requester ? `<@${track.requester.id}>` : 'Unknown', inline: true },
        { name: 'Progress', value: `${progressBar}\n${formatDuration(progress)} / ${formatDuration(duration)}`, inline: false }
      ],
      timestamp: true
    });
  }

  /**
   * Create a queue embed
   * @param {object} queueInfo - The formatted queue info
   * @returns {EmbedBuilder} - Discord.js embed builder
   */
  queue(queueInfo) {
    const { current, tracks, currentPage, totalPages, totalTracks, totalDuration } = queueInfo;

    const embed = this.create({
      color: this.colors.queue,
      title: `Music Queue (${totalTracks} tracks)`,
      description: current ? current : 'No track currently playing.',
      fields: [
        { name: 'Up Next', value: tracks, inline: false },
        { name: 'Total Duration', value: totalDuration, inline: true },
        { name: 'Page', value: `${currentPage}/${totalPages}`, inline: true }
      ],
      footer: { text: 'Use the buttons below to navigate the queue.' },
      timestamp: true
    });

    return embed;
  }

  /**
   * Create a search results embed
   * @param {object} results - The search results
   * @param {string} query - The search query
   * @returns {EmbedBuilder} - Discord.js embed builder
   */
  searchResults(results, query) {
    if (!results || !results.tracks || results.tracks.length === 0) {
      return this.error('No Results', `No results found for query: ${query}`);
    }

    // Format tracks
    const tracks = results.tracks.slice(0, 10).map((track, index) => {
      const duration = formatDuration(track.length);
      const title = truncate(track.title, 45);
      const author = truncate(track.author, 20);

      return `**${index + 1}.** [${title}](${track.uri}) by **${author}** (${duration})`;
    }).join('\n');

    return this.create({
      color: this.colors.info,
      title: `Search Results for: ${query}`,
      description: tracks,
      footer: { text: 'Select a track by responding with its number, or type "cancel" to cancel.' },
      timestamp: true
    });
  }

  /**
   * Create a help embed for a command
   * @param {object} command - The command object
   * @param {string} prefix - The command prefix
   * @returns {EmbedBuilder} - Discord.js embed builder
   */
  commandHelp(command, prefix) {
    return this.create({
      color: this.colors.info,
      title: `Command: ${command.name}`,
      description: command.description,
      fields: [
        { name: 'Usage', value: `${prefix}${command.usage || command.name}`, inline: false },
        { name: 'Aliases', value: command.aliases?.length ? command.aliases.join(', ') : 'None', inline: true },
        { name: 'Cooldown', value: command.cooldown ? `${command.cooldown} seconds` : '3 seconds', inline: true },
        { name: 'Owner Only', value: command.ownerOnly ? 'Yes' : 'No', inline: true }
      ],
      timestamp: true
    });
  }
    
   // little secret
   prefix(title, description) {
    return this.create({
      color: this.colors.info,
      title,
      description,
      image: `https://cdn.discordapp.com/attachments/1300708520106393677/1339112129457946705/Blurrr_1699944980275-ezgif.com-video-to-gif-converter.gif?ex=683de51b&is=683c939b&hm=40af71bf9eeef316947251c18a1608d811747e4675b4d4ae4f989fda8f7dc3d4&`,
      footer: { text: 'Made with 🧡 by Team Avon' }
    });
  }

  /**
   * Create a help embed for all commands
   * @param {object} categories - The command categories
   * @param {string} prefix - The command prefix
   * @returns {EmbedBuilder} - Discord.js embed builder
   */
  commandList(categories, prefix) {
    const fields = Object.entries(categories).map(([category, commands]) => {
      const commandList = commands.map(cmd => `\`${cmd.name}\``).join(', ');
      return { name: category, value: commandList, inline: false };
    });

    return this.create({
      color: this.colors.info,
      title: 'Bot Commands',
      description: `Use \`${prefix}help <command>\` to get detailed information about a command.`,
      fields,
      timestamp: true,
      footer: { text: 'Music Bot' }
    });
  }

  /**
   * Create a progress bar
   * @param {number} current - Current position
   * @param {number} total - Total length
   * @param {number} size - Size of the bar (default: 15)
   * @returns {string} - Progress bar string
   */
  createProgressBar(current, total, size = 15) {
    if (!current || !total || isNaN(current) || isNaN(total)) {
      return '▬'.repeat(size);
    }

    const percentage = Math.min(Math.max(current / total, 0), 1);
    const progress = Math.round(size * percentage);
    const emptyProgress = size - progress;

    const progressText = '▬'.repeat(progress);
    const emptyProgressText = '▬'.repeat(emptyProgress);
    const percentageText = Math.round(percentage * 100);

    return `${progressText}🔘${emptyProgressText} (${percentageText}%)`;
  }
}

// Export a singleton instance
export const embedManager = new EmbedManager();

// A little easter egg
// coded by bre4d in the dark corners of the code
