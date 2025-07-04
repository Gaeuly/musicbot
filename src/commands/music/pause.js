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
 * Pause command for pausing playback
 */
class PauseCommand extends Command {
  constructor() {
    super({
      name: 'pause',
      description: 'Pause the current playing track',
      usage: 'pause',
      aliases: [],
      category: 'music',
      cooldown: 2,
      sameVoiceRequired: true,
      voiceRequired: true,
      playerRequired: true,
      playingRequired: true
    });
  }

  /**
   * Execute the pause command
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

      // Check if already paused
      if (player.paused) {
        const reply = embedManager.warning(
          'Already Paused',
          'Playback is already paused. Use the `resume` command to resume playback.'
        );
        return message.reply({ embeds: [reply] });
      }

      // Pause playback
      const success = playerManager.pause();

      if (!success) {
        const reply = embedManager.error(
          'Failed to Pause',
          'Failed to pause playback.'
        );
        return message.reply({ embeds: [reply] });
      }
      
      const status = `<:paused:1371409469711581328> Paused **${player.queue.current.title}** by ${player.queue.current.author}`;
      await axios.put(
        `https://discord.com/api/v10/channels/${player.voiceId}/voice-status`,
        { status },
        { headers: { Authorization: `Bot ${client.token}` } }
      );
      const reply = embedManager.success(
        'Paused',
        'Playback has been paused.'
      );
      return message.reply({ embeds: [reply] });
    } catch (error) {
      console.error('Pause command error:', error);
      const reply = embedManager.error(
        'Error',
        'An error occurred while trying to pause playback.'
      );
      return message.reply({ embeds: [reply] });
    }
  }
}

export default new PauseCommand();

// coded by bre4d777
// with little help of prayag.exe
