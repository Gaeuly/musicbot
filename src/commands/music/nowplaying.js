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
import { AttachmentBuilder } from 'discord.js';
import { themeManager } from '../../managers/ThemeManager.js'; // Added
import { db } from '../../database/DatabaseManager.js';
import { logger } from '../../utils/logger.js'; // Added

/**
 * NowPlaying command for showing current track information
 */
class NowPlayingCommand extends Command {
  constructor() {
    super({
      name: 'nowplaying',
      description: 'Show information about the currently playing track',
      usage: 'nowplaying',
      aliases: ['np', 'current'],
      category: 'music',
      cooldown: 3,
      playerRequired: true,
      playingRequired: true
    });
  }

  /**
   * Execute the nowplaying command
   * @param {object} options - Command options
   * @returns {Promise<void>}
   */
  async execute({ message, client, musicManager }) {
    const { guild } = message;

    try {
      const player = musicManager.getPlayer(guild.id);
      const playerManager = new PlayerManager(player); // Using PlayerManager as in original
      const currentTrack = playerManager.queue.current;

      if (!currentTrack) {
        const reply = embedManager.error(
          'Nothing Playing',
          'There is nothing currently playing.'
        );
        return message.reply({ embeds: [reply] });
      }
      
      let isLiked = false;
      if (currentTrack.requester && currentTrack.requester.id && currentTrack.uri) {
        try {
            isLiked = db.user.isTrackLiked(currentTrack.requester.id, currentTrack.uri);
        } catch (dbError) {
            logger.error('NowPlayingCommand', `DB error checking if track is liked for user ${currentTrack.requester.id}: ${dbError.message}`);
            // Continue without like status if DB fails, or handle as critical error
        }
      }

      // Get the appropriate MusicCard class based on guild's theme
      const MusicCardClass = await themeManager.getMusicCardClass(guild.id);
      const musicCard = new MusicCardClass(); // Instantiate the chosen card class
      
      const imageBuffer = await musicCard.generateNowPlayingCard({
        track: currentTrack,
        position: player.position || 0,
        isLiked: isLiked,
        guildName: guild.name,
        guildIcon: guild.iconURL({ extension: 'png', size: 128 }),
        player: player 
      });

      const attachment = new AttachmentBuilder(imageBuffer, { name: 'nowplaying.png' });
      
      return message.reply({ files: [attachment] });
    } catch (error) {
      logger.error('NowPlayingCommand', 'Error executing nowplaying command:', error);
      const reply = embedManager.error(
        'Error',
        'An error occurred while trying to get the current track information.'
      );
      return message.reply({ embeds: [reply] });
    }
  }
}

export default new NowPlayingCommand();
