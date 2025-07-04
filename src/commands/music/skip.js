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

/**
 * Skip command for skipping the current song
 */
class SkipCommand extends Command {
  constructor() {
    super({
      name: 'skip',
      description: 'Skip the current playing song',
      usage: 'skip [position]',
      aliases: ['s', 'next'],
      category: 'music',
      cooldown: 2,
      sameVoiceRequired: true,
      voiceRequired: true,
      playerRequired: true,
      playingRequired: true
    });
  }

  /**
   * Execute the skip command
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

      // Get current track info before skipping
      const currentTrack = playerManager.queue.current;

      if (!currentTrack) {
        const reply = embedManager.error(
          'Nothing Playing',
          'There is nothing playing to skip.'
        );
        return message.reply({ embeds: [reply] });
      }

      // Check if a position was specified
      const position = args[0] ? parseInt(args[0]) : null;

      if (position && !isNaN(position) && position > 1) {
        // Skip to a specific position in the queue
        if (position > playerManager.queue.size) {
          const reply = embedManager.error(
            'Invalid Position',
            `The queue only has ${playerManager.queue.size} tracks.`
          );
          return message.reply({ embeds: [reply] });
        }

        // Skip to the position
        const success = playerManager.skipTo(position);

        if (!success) {
          const reply = embedManager.error(
            'Failed to Skip',
            'Failed to skip to that position.'
          );
          return message.reply({ embeds: [reply] });
        }

        const reply = embedManager.success(
          'Skipped to Position',
          `Skipped to position ${position} in the queue.`
        );
        return message.reply({ embeds: [reply] });
      } else {
        // Skip the current track
        const trackTitle = currentTrack.title;

        playerManager.skip();

        const reply = embedManager.success(
          'Skipped',
          `Skipped [${trackTitle}](${currentTrack.uri}).`
        );
        return message.reply({ embeds: [reply] });
      }
    } catch (error) {
      console.error('Skip command error:', error);
      const reply = embedManager.error(
        'Error',
        'An error occurred while trying to skip the track.'
      );
      return message.reply({ embeds: [reply] });
    }
  }
}

export default new SkipCommand();

// coded by bre4d777
// with little help of prayag.exe
