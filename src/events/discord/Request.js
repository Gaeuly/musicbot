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
import { logger } from '../../utils/logger.js';
import { embedManager } from '../../managers/EmbedManager.js';
import { SearchManager } from '../../managers/SearchManager.js';
import { PlayerManager } from '../../managers/PlayerManager.js';
import { Guild } from '../../database/Guild.js';

const guildDB = new Guild();
const cleanupDelay = 3000;

export default {
  name: 'messageCreate',
  async execute(message) {
    const { client, guild, channel, author, content } = message;
    
    if (!guild || author.bot || !content.trim()) return;

    const requestChannelId = guildDB.getRequestChannel(guild.id);
    if (!requestChannelId || channel.id !== requestChannelId) return;

    const voiceChannel = message.member?.voice?.channel;
    if (!voiceChannel) {
      const errorEmbed = embedManager.error(
        'Voice Channel Required',
        'You need to join a voice channel to request songs!'
      );
      const reply = await message.reply({ embeds: [errorEmbed] });
      setTimeout(() => {
        message.delete().catch(() => {});
        reply.delete().catch(() => {});
      }, cleanupDelay);
      return;
    }

    const loadingEmbed = embedManager.create({
      color: embedManager.colors.default,
      title: '🔍 Searching...',
      description: `Searching for: **${content}**`,
      timestamp: true
    });
    
    const loadingMsg = await message.reply({ embeds: [loadingEmbed] });

    try {
      let player = client.music.getPlayer(guild.id);
      
      if (!player) {
        const permissions = voiceChannel.permissionsFor(guild.members.me);
        if (!permissions.has('Connect') || !permissions.has('Speak')) {
          const noPermsEmbed = embedManager.error(
            'Insufficient Permissions',
            'I need permissions to join and speak in your voice channel!'
          );
          await loadingMsg.edit({ embeds: [noPermsEmbed] });
          setTimeout(() => {
            message.delete().catch(() => {});
            loadingMsg.delete().catch(() => {});
          }, cleanupDelay);
          return;
        }
        
        player = await client.music.createPlayer({
          guildId: guild.id,
          textChannel: channel,
          voiceChannel: voiceChannel,
          selfDeaf: true,
          selfMute: false
        });
        
        if (!player) {
          const createFailedEmbed = embedManager.error(
            'Player Creation Failed',
            'Failed to create a player. Please try again later.'
          );
          await loadingMsg.edit({ embeds: [createFailedEmbed] });
          setTimeout(() => {
            message.delete().catch(() => {});
            loadingMsg.delete().catch(() => {});
          }, cleanupDelay);
          return;
        }
      }

      const searchManager = new SearchManager(client.music);
      const playerManager = new PlayerManager(player);
      
      const requester = {
        id: author.id,
        username: author.username,
        avatar: author.displayAvatarURL({ dynamic: true })
      };

      const searchResult = await searchManager.search(content, {
        requester: requester,
        limit: 1
      });

      if (!searchResult || !searchResult.tracks || searchResult.tracks.length === 0) {
        const noResultsEmbed = embedManager.error(
          'No Results',
          `No tracks found for: **${content}**`
        );
        await loadingMsg.edit({ embeds: [noResultsEmbed] });
        setTimeout(() => {
          message.delete().catch(() => {});
          loadingMsg.delete().catch(() => {});
        }, cleanupDelay);
        return;
      }

      const track = searchResult.tracks[0];
      const wasEmpty = playerManager.queue.size === 0 && !player.current;

      if (wasEmpty) {
        await player.play(track);
        const playingEmbed = embedManager.create({
          color: embedManager.colors.success,
          title: '🎵 Now Playing',
          description: `[${track.title}](${track.uri})\n**Artist:** ${track.author}\n**Duration:** ${track.isStream ? 'Live Stream' : track.duration}`,
         // thumbnail: { url: track.thumbnail },
          footer: { text: `Requested by ${requester.username}`, iconURL: requester.avatar },
          timestamp: true
        });
        await loadingMsg.edit({ embeds: [playingEmbed] });
      } else {
        playerManager.queue.add(track);
        const queuedEmbed = embedManager.create({
          color: embedManager.colors.info,
          title: '📋 Added to Queue',
          description: `[${track.title}](${track.uri})\n**Artist:** ${track.author}\n**Duration:** ${track.isStream ? 'Live Stream' : track.duration}\n**Position:** ${playerManager.queue.size}`,
         // thumbnail: { url: track.thumbnail },
          footer: { text: `Requested by ${requester.username}`, iconURL: requester.avatar },
          timestamp: true
        });
        await loadingMsg.edit({ embeds: [queuedEmbed] });
      }

      setTimeout(() => {
        message.delete().catch(() => {});
        loadingMsg.delete().catch(() => {});
      }, cleanupDelay);

    } catch (error) {
      logger.error('MessageCreate', 'Error processing request', error);
      
      const errorEmbed = embedManager.error(
        'Error',
        'An error occurred while processing your request. Please try again later.'
      );
      await loadingMsg.edit({ embeds: [errorEmbed] });
      setTimeout(() => {
        message.delete().catch(() => {});
        loadingMsg.delete().catch(() => {});
      }, cleanupDelay);
    }
  }
};