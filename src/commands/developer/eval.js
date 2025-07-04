/**
 * Muffin STUDIO - Bre4d777 & prayag 
 * https://discord.gg/TRPqseUq32
 * give credits or ill touch you in your dreams
 */

import { Command } from '../../structures/Command.js';
import { PlayerManager } from '../../managers/PlayerManager.js';
import { config } from '../../config/config.js';

import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  codeBlock,
  ComponentType
} from 'discord.js';
import util from 'util';

class EvalCommand extends Command {
  constructor() {
    super({
      name: 'eval',
      description: 'Evaluates JavaScript code.',
      usage: 'eval <code>',
      aliases: ['e'],
      category: 'developer',
      ownerOnly: true
    });
  }

  async execute({ client, message, args, musicManager }) {
    const { guild } = message;
    const code = args.join(' ');
    if (!code) return message.reply('❌ Provide code to evaluate.');
      
    const player = musicManager.getPlayer(guild.id);
    const playerManager = new PlayerManager(player);

    let output;
    try {
      let evaled = await eval(code);
      if (typeof evaled !== 'string') evaled = util.inspect(evaled, { depth: 1 });
      output = this.clean(evaled);
    } catch (err) {
      output = `❌ Error:\n${this.clean(err.message)}`;
    }

    const chunks = this.chunkString(output, 1000); // Discord allows ~2000 chars max, leave room for embed formatting
    let page = 0;

    const embed = () =>
      new EmbedBuilder()
        .setColor('#3498db')
        .setTitle('🧠 Eval Result')
        .setDescription(codeBlock('js', chunks[page] || 'No output.'))
        .setFooter({ text: `Page ${page + 1} of ${chunks.length}` })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('prev').setLabel('⬅️').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('next').setLabel('➡️').setStyle(ButtonStyle.Secondary)
    );

    const msg = await message.channel.send({
      embeds: [embed()],
      components: chunks.length > 1 ? [row] : []
    });

    if (chunks.length <= 1) return;

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60_000,
      filter: (i) => i.user.id === message.author.id
    });

    collector.on('collect', async (i) => {
      await i.deferUpdate();
      if (i.customId === 'prev') page = page > 0 ? --page : chunks.length - 1;
      if (i.customId === 'next') page = page + 1 < chunks.length ? ++page : 0;

      await msg.edit({ embeds: [embed()] });
    });

    collector.on('end', () => {
      msg.edit({ components: [] }).catch(() => {});
    });
  }

  clean(text) {
    return typeof text === 'string'
      ? text
          .replace(/`/g, '`\u200b')
          .replace(/@/g, '@\u200b')
          .replaceAll(config.token, '[REDACTED]')
      : text;
  }

  chunkString(str, size) {
    const chunks = [];
    for (let i = 0; i < str.length; i += size) {
      chunks.push(str.slice(i, i + size));
    }
    return chunks;
  }
}

export default new EvalCommand();