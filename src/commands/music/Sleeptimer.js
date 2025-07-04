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
 * Sleep command to stop playback after a set time
 */
class SleepCommand extends Command {
  constructor() {
    super({
      name: 'sleep',
      description: 'Stop playback after a given time (e.g., 1h 30m, 45s)',
      usage: 'sleep <time>',
      aliases: ['timer', 'stopafter'],
      category: 'music',
      cooldown: 2,
      sameVoiceRequired: true,
      voiceRequired: true,
      playerRequired: true,
          guildPrem:true,
    });
  }

  /**
   * Parse time input like "1h 30m 10s" to milliseconds
   */
  parseTime(timeStr) {
    const timePattern = /(\d+)(h|m|s)/g;
    let match;
    let totalMs = 0;

    while ((match = timePattern.exec(timeStr)) !== null) {
      const value = parseInt(match[1]);
      const unit = match[2];
      if (unit === 'h') totalMs += value * 60 * 60 * 1000;
      else if (unit === 'm') totalMs += value * 60 * 1000;
      else if (unit === 's') totalMs += value * 1000;
    }

    return totalMs;
  }

  /**
   * Execute the sleep command
   */
  async execute({ message, args, musicManager }) {
    const { guild } = message;

    const timeStr = args.join('');
    const ms = this.parseTime(timeStr);

    if (!ms || ms <= 0) {
      const error = embedManager.error('Invalid Time', 'Please provide a valid time like `1h`, `30m`, `45s`, or combinations.');
      return message.reply({ embeds: [error] });
    }
    
    let player = musicManager.getPlayer(guild.id);

    const reply = embedManager.success(
      '🌛 Sleep Timer Set',
      `Music will stop after **${timeStr.replace(/([a-z])/gi, '$1 ')}**, Sleep well Senpai`
    );
    await message.reply({ embeds: [reply] });

    setTimeout(() => {
      if (!player) return;

      const playerManager = new PlayerManager(player);
      playerManager.stop();

      const stopped = embedManager.success('🌛 Sleep Timer', 'Timer expired. Playback stopped and queue cleared.');
      message.channel.send({ embeds: [stopped] }).catch(() => {});
    }, ms);
  }
}

export default new SleepCommand();

// coded by bre4d777
// with little help of prayag.exe
