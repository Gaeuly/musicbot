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
import { embedManager } from '../../managers/EmbedManager.js';
import { db } from '../../database/DatabaseManager.js';

class SpotifyUnlinkCommand extends Command {
  constructor() {
    super({
      name: 'spotify-unlink',
      description: 'Unlink your Spotify profile from the bot',
      usage: 'spotify unlink',
      aliases: ['spotify disconnect'],
      category: 'spotify',
      cooldown: 5
    });
  }

  async execute({ message }) {
    const { author } = message;

    // Check if the user has a linked profile
    const profile = db.spotify.getProfile(author.id);

    if (!profile) {
      const embed = embedManager.error(
        'Not Linked',
        'You do not have a Spotify profile linked. Use `spotify login <url>` to link your profile.'
      );
      return message.reply({ embeds: [embed] });
    }

    try {
      // Unlink the profile
      db.spotify.unlinkProfile(author.id);

      // Create success embed with the unlinked profile info
      const successEmbed = embedManager.success(
        'Spotify Profile Unlinked',
        `Successfully unlinked your Spotify profile: **${profile.username || 'Unknown'}**`
      );

      // Add some extra info
      successEmbed.setDescription(`Your Spotify profile (${profile.profile_url}) has been unlinked from the bot. Your playlists will no longer be accessible.`);

      return message.reply({ embeds: [successEmbed] });
    } catch (error) {
      console.error('Error unlinking Spotify profile:', error);

      const errorEmbed = embedManager.error(
        'Error',
        'An error occurred while unlinking your Spotify profile. Please try again later.'
      );
      return message.reply({ embeds: [errorEmbed] });
    }
  }
}

export default new SpotifyUnlinkCommand();
