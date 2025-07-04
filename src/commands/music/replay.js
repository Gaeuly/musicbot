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
 * Replay command for replaying the current track
 */
class ReplayCommand extends Command {
  constructor() {
    super({
      name: 'replay',
      description: 'Replays the current playing track',
      usage: 'replay',
      aliases: ['firse'],
      category: 'music',
      cooldown: 3,
      sameVoiceRequired: true,
      voiceRequired: true,
      playerRequired: true,
      playingRequired: true
    });
  }

  /**
   * Execute the replay command
   * @param {object} options - Command options
   * @returns {Promise<void>}
   */
  async execute({ message, client, musicManager }) {
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

      let position;
      let args = '0:00'
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

      // Seek to the position
      const success = playerManager.seek(position);

      if (!success) {
        const reply = embedManager.error(
          'Failed to Replay',
          'Failed to replay the song'
        );
        return message.reply({ embeds: [reply] });
      }

      const reply = embedManager.success(
        'Replayed',
        `Started playing [${currentTrack.title}](${currentTrack.uri}) all over again.`
      );

      return message.reply({ embeds: [reply] });
    } catch (error) {
      console.error('Replay command error:', error);
      const reply = embedManager.error(
        'Error',
        'An error occurred while trying to replay'
      );
      return message.reply({ embeds: [reply] });
    }
  }
}

export default new ReplayCommand();

// coded by bre4d777
// with little help of prayag.exe
