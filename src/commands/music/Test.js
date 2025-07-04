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
import { EmbedBuilder } from 'discord.js';
import axios from 'axios';

class LiveLyricsCommand extends Command {
  constructor() {
    super({
      name: 'livelyrics',
      description: 'Fetch and display live synced lyrics using lrclib.net',
      usage: 'livelyrics [song name] [artist]',
      aliases: ['llive', 'll'],
      category: 'music',
      cooldown: 5,
      anyprem:true,
      playerRequired: true,
      playingRequired: true
    });
  }

  // Sanitize input
  sanitizeInput(str) {
    return str
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, ' ')
      .toLowerCase()
      .trim();
  }

  // Parse timestamp MM:SS.MS to seconds
  parseTimestamp(timestamp) {
    const match = timestamp.match(/(\d+):(\d{2})\.(\d+)/);
    if (!match) return 0;
    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    const milliseconds = parseInt(match[3], 10) / Math.pow(10, match[3].length); // Dynamic millisecond conversion
    return minutes * 60 + seconds + milliseconds;
  }

  // Search for lyrics
  async searchLyrics(query) {
    try {
      console.log('Searching with query:', query);
      const res = await axios.get('https://lrclib.net/api/search', {
        params: { q: query },
        timeout: 5000
      }).catch(err => {
        if (err.response?.status === 404) return { data: [] };
        throw err;
      });

      console.log('Search API response:', JSON.stringify(res.data, null, 2));
      const syncedResult = res.data.find(item => item.syncedLyrics);
      if (syncedResult) return { data: syncedResult, source: 'Synced Lyrics' };
      return { data: null, source: null };
    } catch (err) {
      console.error('Search failed:', err.message);
      return { data: null, source: null };
    }
  }

  // Display live lyrics synced with player
  async displayLiveLyrics(message, lyricsData, player, songName, artistName) {
    console.log('Synced Lyrics:', lyricsData.syncedLyrics); // Log for debugging
    const lines = lyricsData.syncedLyrics
      .split('\n')
      .map(line => {
        const match = line.match(/(\d+:\d{2}\.\d+)\s*(.*)/); // Match MM:SS.MS
        if (match) {
          return { time: this.parseTimestamp(match[1]), text: match[2].trim() };
        }
        return null;
      })
      .filter(line => line && line.text);

    if (!lines.length) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('No Synced Lyrics')
            .setDescription('No valid synced lyrics found.')
        ]
      });
    }

    const embed = new EmbedBuilder()
      .setColor('Red')
      .setTitle(`Live Lyrics: ${songName}`)
      .setFooter({ text: 'Make take some time to update' });

    if (artistName) {
      embed.addFields({ name: 'Artist', value: artistName, inline: true });
    }

    const liveMessage = await message.reply({
      embeds: [embed.setDescription('Starting live lyrics...')]
    });

    let currentIndex = 0;
    const updateInterval = 500; // Update every 500ms
    let lastTime = -1;
    let timeStuckCounter = 0;
    const maxStuckUpdates = 10;

    const updateLyrics = async () => {
      if (!player || !player.playing || !player.queue.current) {
        await liveMessage.edit({
          embeds: [
            embed
              .setColor('Red')
              .setDescription('Playback stopped or no song playing.')
          ]
        });
        return;
      }

      const currentTime = (typeof player.position === 'number' ? player.position / 1000 : 0); // Convert milliseconds to seconds
      console.log(`Current time: ${currentTime}s, Current index: ${currentIndex}, Total lines: ${lines.length}`);

      if (lastTime === currentTime) {
        timeStuckCounter++;
        if (timeStuckCounter >= maxStuckUpdates) {
          await liveMessage.edit({
            embeds: [
              embed
                .setColor('Red')
                .setDescription('Player time isn’t advancing. Playback might be paused or stuck.')
            ]
          });
          return;
        }
      } else {
        timeStuckCounter = 0;
      }
      lastTime = currentTime;

      while (currentIndex < lines.length && lines[currentIndex].time <= currentTime) {
        currentIndex++;
      }

      const currentLine = lines[currentIndex - 1] || { text: 'Waiting for next lyric...' };
      const nextLine = lines[currentIndex] || { text: '' };

      const description = [
        `**${currentLine.text}**`,
        nextLine.text ? `**${nextLine.text}**` : '🎵'
      ].filter(Boolean).map(str => str.replace(/\]/g, '')).join('\n');

      try {
        await liveMessage.edit({
          embeds: [embed.setDescription(description)]
        });
      } catch (err) {
        console.error('Failed to edit live lyrics message:', err.message);
        return;
      }

      if (currentIndex < lines.length && player.playing) {
        setTimeout(updateLyrics, updateInterval);
      } else {
        await liveMessage.edit({
          embeds: [embed.setDescription('Song ended or playback stopped.')]
        });
      }
    };

    updateLyrics();
  }

  async execute({ message, args, client, musicManager }) {
    const { guild } = message;
    const player = musicManager.getPlayer(guild.id);

    if (!player || !player.playing || !player.queue.current) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('No Music Playing')
            .setDescription('Play a song first to use live lyrics.')
        ]
      });
    }

    let songName = '';
    let artistName = '';

    if (args.length > 0) {
      const full = args.join(' ');
      const match = full.match(/(.+)\s+-\s+(.+)/);
      if (match) {
        artistName = this.sanitizeInput(match[1]);
        songName = this.sanitizeInput(match[2]);
      } else {
        songName = this.sanitizeInput(full);
      }
    } else {
      const track = player.queue.current;
      songName = this.sanitizeInput(track.title);
      artistName = this.sanitizeInput(track.author || '');
    }

    if (!songName) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('Invalid Input')
            .setDescription('Song name cannot be empty.')
        ]
      });
    }

    const loading = await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('Yellow')
          .setDescription(`<a:byte_loading:1370748439918280864> Fetching lyrics for **${artistName || 'Unknown Artist'} - ${songName}**...`)
      ]
    });

    try {
      const query = `${songName}${artistName ? ` ${artistName}` : ''}`;
      const { data, source } = await this.searchLyrics(query);

      if (!data || source !== 'Synced Lyrics') {
        return loading.edit({
          embeds: [
            new EmbedBuilder()
              .setColor('Red')
              .setTitle('No Synced Lyrics Found')
              .setDescription(`No synced lyrics available for **${artistName || 'Unknown Artist'} - ${songName}**. Try another song.`)
          ]
        });
      }

      await loading.delete();
      await this.displayLiveLyrics(message, data, player, data.trackName || songName, data.artistName || artistName);
    } catch (err) {
      console.error(`Lyrics fetch error for ${songName} by ${artistName}:`, {
        message: err.message,
        stack: err.stack
      });
      await loading.edit({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('Error')
            .setDescription('Failed to fetch lyrics. The API might be down or the song name is incorrect.')
        ]
      });
    }
  }
}

export default new LiveLyricsCommand();