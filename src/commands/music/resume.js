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
import axios from 'axios';

/**
 * Resume command for resuming playback
 */
class ResumeCommand extends Command {
  constructor() {
    super({
      name: 'resume',
      description: 'Resume the current paused track',
      usage: 'resume',
      aliases: ['unpause', 'continue'],
      category: 'music',
      cooldown: 2,
      sameVoiceRequired: true,
      voiceRequired: true,
      playerRequired: true
    });
  }

  /**
   * Execute the resume command
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

      // Check if already playing
      if (!player.paused) {
        const reply = embedManager.warning(
          'Already Playing',
          'Playback is already active.'
        );
        return message.reply({ embeds: [reply] });
      }

      // Resume playback
      const success = playerManager.resume();

      if (!success) {
        const reply = embedManager.error(
          'Failed to Resume',
          'Failed to resume playback.'
        );
        return message.reply({ embeds: [reply] });
      }
        
      const status = `<a:playing:1371395521058701386> Playing **${player.queue.current.title}** by ${player.queue.current.author}`;
      await axios.put(
        `https://discord.com/api/v10/channels/${player.voiceId}/voice-status`,
        { status },
        { headers: { Authorization: `Bot ${client.token}` } }
      );
      const reply = embedManager.success(
        'Resumed',
        'Playback has been resumed.'
      );
      return message.reply({ embeds: [reply] });
    } catch (error) {
      console.error('Resume command error:', error);
      const reply = embedManager.error(
        'Error',
        'An error occurred while trying to resume playback.'
      );
      return message.reply({ embeds: [reply] });
    }
  }
}

export default new ResumeCommand();

// coded by bre4d777
// with little help of prayag.exe
