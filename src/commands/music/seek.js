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
import { embedManager } from '../../managers/EmbedManager.js';
import { formatDuration, parseTimeString } from '../../utils/formatters.js';

/**
 * Seek command for jumping to a position in the current track
 */
class SeekCommand extends Command {
  constructor() {
    super({
      name: 'seek',
      description: 'Seek to a position in the current track',
      usage: 'seek <position>',
      aliases: ['jump'],
      category: 'music',
      cooldown: 3,
      sameVoiceRequired: true,
      voiceRequired: true,
      playerRequired: true,
      playingRequired: true
    });
  }

  /**
   * Execute the seek command
   * @param {object} options - Command options
   * @returns {Promise<void>}
   */
  async execute({ message, args, client, musicManager }) {
    const { guild } = message;

    try {
      // Get the player
      const player = musicManager.getPlayer(guild.id);

      // Create player manager
      const playerManager = new PlayerManager(player);

      // Get the current track
      const currentTrack = playerManager.queue.current;

      if (!currentTrack) {
        const reply = embedManager.error(
          'Nothing Playing',
          'There is nothing currently playing.'
        );
        return message.reply({ embeds: [reply] });
      }

      // Check if the argument was provided
      if (!args.length) {
        const reply = embedManager.error(
          'Invalid Usage',
          `Please provide a position to seek to.\n\nUsage: \`${this.usage}\`\nExample: \`${this.name} 1:30\` or \`${this.name} 90s\``
        );
        return message.reply({ embeds: [reply] });
      }

      let position;

      // Try to parse the position from a time string (like 1:30 or 90s)
      if (args[0].includes(':')) {
        // Format is MM:SS or HH:MM:SS
        const parts = args[0].split(':');

        if (parts.length === 2) {
          // MM:SS format
          const minutes = parseInt(parts[0], 10);
          const seconds = parseInt(parts[1], 10);

          if (!isNaN(minutes) && !isNaN(seconds)) {
            position = (minutes * 60 + seconds) * 1000;
          }
        } else if (parts.length === 3) {
          // HH:MM:SS format
          const hours = parseInt(parts[0], 10);
          const minutes = parseInt(parts[1], 10);
          const seconds = parseInt(parts[2], 10);

          if (!isNaN(hours) && !isNaN(minutes) && !isNaN(seconds)) {
            position = (hours * 3600 + minutes * 60 + seconds) * 1000;
          }
        }
      } else {
        // Try to parse as time string (like 90s, 5m, etc.)
        position = parseTimeString(args[0]);

        // If that fails, try to parse as seconds
        if (!position) {
          const seconds = parseInt(args[0], 10);
          if (!isNaN(seconds)) {
            position = seconds * 1000;
          }
        }
      }

      // Check if the position is valid
      if (!position || position < 0) {
        const reply = embedManager.error(
          'Invalid Position',
          `Please provide a valid position.\n\nUsage: \`${this.usage}\`\nExample: \`${this.name} 1:30\` or \`${this.name} 90s\``
        );
        return message.reply({ embeds: [reply] });
      }

      // Check if the position is within the track length
      if (position > currentTrack.length) {
        const reply = embedManager.error(
          'Position Out of Range',
          `The position must be within the track length (${formatDuration(currentTrack.length)}).`
        );
        return message.reply({ embeds: [reply] });
      }

      // Seek to the position
      const success = playerManager.seek(position);

      if (!success) {
        const reply = embedManager.error(
          'Failed to Seek',
          'Failed to seek to the specified position.'
        );
        return message.reply({ embeds: [reply] });
      }

      const reply = embedManager.success(
        'Position Changed',
        `⏩ Seeked to **${formatDuration(position)}** in [${currentTrack.title}](${currentTrack.uri}).`
      );

      return message.reply({ embeds: [reply] });
    } catch (error) {
      console.error('Seek command error:', error);
      const reply = embedManager.error(
        'Error',
        'An error occurred while trying to seek to the specified position.'
      );
      return message.reply({ embeds: [reply] });
    }
  }
}

export default new SeekCommand();

// coded by bre4d777
// with little help of prayag.exe
