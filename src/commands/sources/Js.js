/**
 * Muffin STUDIO - Bre4d777 & prayag 
 * https://discord.gg/TRPqseUq32
 * give credits or ill touch you in your dreams
 */

import { Command } from '../../structures/Command.js';
import { PlayerManager } from '../../managers/PlayerManager.js';
import { SearchManager } from '../../managers/SearchManager.js';
import { logger } from '../../utils/logger.js';
import { embedManager } from '../../managers/EmbedManager.js'; // Make sure embedManager is imported
import { ArgumentType } from '../../structures/ArgumentTypes.js';

class JioSaavnCommand extends Command {
  constructor() {
    super({
      name: 'jiosaavn',
      description: 'Play music from JioSaavn.',
      usage: 'jiosaavn <song name or URL>',
      aliases: ['js', 'saavn'],
      category: 'music',
      cooldown: 2,
      voiceRequired: true,
      sameVoiceRequired: true,
      messageArgs: [
        {
          name: 'query',
          description: 'The song name, album, or URL from JioSaavn',
          type: ArgumentType.STRING,
          required: true,
        },
      ],
      examples: [
        'jiosaavn hindi latest hits',
        'jiosaavn https://www.jiosaavn.com/song/song-name/abcdefgh',
      ]
    });
  }

  async execute({ message, options, musicManager }) {
    const { channel, member, guild } = message;
    const query = options.getString('query', true);
    let searchingMsg = null;

    try {
      const voiceChannel = member.voice.channel;
      const permissions = voiceChannel.permissionsFor(guild.members.me);
      if (!permissions.has('Connect') || !permissions.has('Speak')) {
        const reply = embedManager.error(
          'Insufficient Permissions', 
          'I need permissions to join and speak in your voice channel!'
        );
        return message.reply({ embeds: [reply] });
      }

      const searchingEmbed = embedManager.create({
        description: `<a:byte_loading:1370748439918280864> Searching for \`${query}\` on JioSaavn...`,
        color: embedManager.colors.default
      });
      searchingMsg = await message.reply({ embeds: [searchingEmbed] });

      const searchManager = new SearchManager(musicManager);
      let player = musicManager.getPlayer(guild.id);
      
      if (!player) {
          player = musicManager.createPlayer({ guildId: guild.id, textChannel: channel.id, voiceChannel: voiceChannel.id });
      }
      
      const isPlayerPlaying = player.playing || (!player.paused && player.queue.current);

      const playerManager = new PlayerManager(player);
      const result = await searchManager.search(query, {
        platform: 'jiosaavn',
        requester: message.author,
      });

      if (!result || !result.tracks || !result.tracks.length) {
        const reply = embedManager.error(
          'No Results', 
          `No results found for: \`${query}\` on JioSaavn.`
        );
        return searchingMsg.edit({ embeds: [reply] });
      }

      const isPlaylist = result.type === "PLAYLIST" || result.type === "ALBUM";
      playerManager.queue.add(result.tracks);

      if (!isPlayerPlaying) {
          if (!player.playing && !player.paused) await playerManager.play();
      }

      let reply;
      if (isPlaylist) {
          reply = embedManager.success(
              'Playlist Queued',
              `Added **${result.tracks.length}** tracks from **${result.playlistName}** to the queue.`
          );
      } else {
          const track = result.tracks[0];
          if (isPlayerPlaying) {
              reply = embedManager.success(
                  'Track Queued',
                  `Added [${track.title}](${track.uri}) to the queue.`
              );
          } else {
              reply = embedManager.create({
                  title: 'Now Playing',
                  description: `Playing [${track.title}](${track.uri}) from JioSaavn.`,
                  color: embedManager.colors.success
              });
          }
      }
      return searchingMsg.edit({ embeds: [reply] });

    } catch (error) {
      logger.error(`${this.name}Command`, 'Command execution error:', error);
      const reply = embedManager.error(
        'Error', 
        `An error occurred while trying to play from JioSaavn.`
      );
      if (searchingMsg) {
        return searchingMsg.edit({ embeds: [reply] });
      }
      return message.reply({ embeds: [reply] });
    }
  }
}
export default new JioSaavnCommand();