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
import {
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ComponentType
} from 'discord.js';

/**
 * Join command for joining the voice channel
 */
class JoinCommand extends Command {
  constructor() {
    super({
      name: 'join',
      description: 'Join your voice channel',
      usage: 'join',
      aliases: ['j'],
      category: 'music',
      cooldown: 2,
      sameVoiceRequired: false,
      voiceRequired: true,
      playerRequired: false,
      playingRequired: false
    });
  }

  /**
   * Execute the join command
   * @param {object} options - Command options
   * @returns {Promise<void>}
   */
  async execute({ message, client, musicManager }) {
    const { guild, member, channel } = message;
    const voiceChannel = member.voice.channel;

    const joining = embedManager.create({
      color: embedManager.colors.default,
      title: '🔉 Joining....',
      description: `Joining your voice channel ${voiceChannel}`,
      footer: { text: 'This may take a moment.' },
      timestamp: true
    });

    const join = await message.reply({ embeds: [joining] });

    if (!voiceChannel) {
      const reply = embedManager.error(
        'Error',
        'Please join a voice channel before using this command'
      );
      return join.edit({ embeds: [reply] });
    }

    let player = musicManager.getPlayer(guild.id);

    // If player exists and not in user's VC, or not playing
    if (player && !player.playing && (player.voiceChannel !== voiceChannel.id)) {
      const moveButton = new ButtonBuilder()
        .setCustomId('move_bot')
        .setLabel('Move Here')
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder().addComponents(moveButton);

      const reply = embedManager.error(
        'Already Connected',
        `I'm already in a voice channel.\n${
          !player.playing ? `Nothing is playing currently.` : ''
        }\nDo you want me to move to **${voiceChannel.name}**?`
      );

      const msg = await join.edit({ embeds: [reply], components: [row] });

      const filter = (i) =>
        i.customId === 'move_bot' && i.user.id === message.author.id;

      const collector = msg.createMessageComponentCollector({
        filter,
        componentType: ComponentType.Button,
        time: 15000
      });

      collector.on('collect', async (interaction) => {
        await interaction.deferUpdate();
        try {
          await player.setVoiceChannel(voiceChannel.id); // assumes setVoiceChannel exists
          const moved = embedManager.create({
            color: embedManager.colors.default,
            title: 'Moved!',
            description: `Moved to your voice channel ${voiceChannel}`,
            footer: { text: `Requested by ${message.author.username}` },
            timestamp: true
          });
          await msg.edit({ embeds: [moved], components: [] });
        } catch (e) {
          const fail = embedManager.error('Error', 'Failed to move to your voice channel.');
          await msg.edit({ embeds: [fail], components: [] });
        }
      });

      collector.on('end', async (_, reason) => {
        if (reason === 'time') {
          await msg.edit({ components: [] });
        }
      });

      return;
    }

    // If player already exists and in the same VC
    if (player) {
      const voice = embedManager.error(
        'Error',
        'Player already exists in your voice channel.'
      );
      return join.edit({ embeds: [voice] });
    }

    try {
      player = musicManager.createPlayer({
        guildId: guild.id,
        textChannel: channel,
        voiceChannel
      });

      if (!player) {
        logger.error('JoinCommand', 'Player creation failed, got null from MusicManager');
        const reply = embedManager.error(
          'Error',
          'Failed to create a music player. Please try again later.'
        );
        return join.edit({ embeds: [reply] });
      }

      const joined = embedManager.create({
        color: embedManager.colors.default,
        title: '<:byte_tick:1371361305520242698> Joined',
        description: `Joined your voice channel ${voiceChannel}`,
        footer: { text: `Requested by ${message.author.username}` },
        timestamp: true
      });

      return join.edit({ embeds: [joined] });

    } catch (error) {
      const reply = embedManager.error(
        'Error',
        'Something went wrong while trying to join.'
      );
      return join.edit({ embeds: [reply] });
    }
  }
}

export default new JoinCommand();

// coded by bre4d777
// with little help of prayag.exe
