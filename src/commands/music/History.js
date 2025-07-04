/**
 * Muffin STUDIO - Bre4d777 & prayag 
 * https://discord.gg/TRPqseUq32
 * give credits or ill touch you in your dreams
 */

import { Command } from '../../structures/Command.js';
import {
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  MessageFlags,
  ComponentType,
  SeparatorSpacingSize
} from 'discord.js';
import { db } from '../../database/DatabaseManager.js';
import { logger } from '../../utils/logger.js';
import { PlayerManager } from '../../managers/PlayerManager.js';
import { SearchManager } from '../../managers/SearchManager.js';

class HistoryCommand extends Command {
  constructor() {
    super({
      name: 'history',
      description: 'View your listening history with options to add songs to queue',
      usage: 'history',
      aliases: [ 'recent'],
      category: 'music',
      cooldown: 5,
      voiceRequired: false,
      playerRequired: false,
      anyPrem: true,
    });
  }

  async execute({ message, args, client, musicManager }) {
    const { guild, author } = message;
    const userId = author.id;

    try {
      const pageSize = 10;
      const history = db.user.getHistory(userId, pageSize, 0);

      if (!history || history.length === 0) {
        const noHistoryContainer = new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('❌ **No History Found**')
          )
          .addSeparatorComponents(
            new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
          )
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('You have no listening history yet. Start playing some music!')
          );
        return message.reply({ components: [noHistoryContainer], flags: MessageFlags.IsComponentsV2 });
      }

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('history_select')
        .setPlaceholder('Select tracks to add to queue')
        .setMinValues(1)
        .setMaxValues(history.length);

      history.forEach((track, index) => {
        selectMenu.addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel(track.title.length > 80 ? track.title.substring(0, 77) + '...' : track.title)
            .setDescription(track.author.length > 90 ? track.author.substring(0, 87) + '...' : track.author)
            .setValue(`history:${index}:${track.uri}`)
        );
      });

      const selectRow = new ActionRowBuilder().addComponents(selectMenu);

      const historyContainer = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('🕒 **Your Listening History**')
        )
        .addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('Select songs below to add them to the queue.')
        )
        .addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );

      history.forEach((track, index) => {
        // Condensing track information into a single TextDisplayBuilder component
        historyContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`**${index + 1}.** ${track.title}\n*${track.author}* (${formatDuration(track.duration)})`)
        );
        
      });

      historyContainer
        .addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`Displaying ${history.length} most recent tracks.`)
        )
        .addActionRowComponents(selectRow);

      const reply = await message.reply({
        components: [historyContainer],
        flags: MessageFlags.IsComponentsV2
      });

      const filter = i =>
        (i.customId === 'history_select' && i.user.id === author.id);

      const collector = reply.createMessageComponentCollector({
        filter,
        time: 120000
      });

      collector.on('collect', async interaction => {
        if (interaction.customId === 'history_select') {
          await handleHistorySelect(interaction, client, history);
        }
      });

      collector.on('end', async () => {
        selectRow.components.forEach(component => component.setDisabled(true));
        historyContainer.removeActionRowComponents();
        historyContainer.addActionRowComponents(selectRow);

        try {
          await reply.edit({ components: [historyContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        } catch (error) {
          logger.error('HistoryCommand', 'Failed to disable components on end', error);
        }
      });

    } catch (error) {
      logger.error('HistoryCommand', 'Error displaying history', error);
      const errorContainer = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('❌ **Error**')
        )
        .addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('An error occurred while retrieving your listening history.')
        );
      return message.reply({ components: [errorContainer], flags: MessageFlags.IsComponentsV2 });
    }
  }
}

async function handleHistorySelect(interaction, client, history) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const values = interaction.values;
    const guildId = interaction.guild?.id;

    if (!values || values.length === 0) {
      return interaction.editReply({
        content: '❌ No tracks selected'
      });
    }

    const member = interaction.guild.members.cache.get(interaction.user.id);
    const voiceChannelId = member?.voice?.channelId;

    if (!voiceChannelId) {
      return interaction.editReply({
        content: '❌ You need to be in a voice channel to add tracks to the queue'
      });
    }

    let player = client.music.getPlayer(guildId);
    let playerManager;

    if (!player) {
      try {
        player = client.music.createPlayer({
          guildId: guildId,
          textChannelId: interaction.channelId,
          voiceChannelId: voiceChannelId
        });

        if (!player) {
          return interaction.editReply({
            content: '❌ Failed to create a music player. Please try again later.'
          });
        }

        playerManager = new PlayerManager(player);
      } catch (createError) {
        logger.error('HistoryCommand', 'Failed to create player', createError);
        return interaction.editReply({
          content: '❌ Failed to create a music player. Please try again later.'
        });
      }
    } else {
      playerManager = new PlayerManager(player);
    }

    const successTracks = [];
    const failedTracks = [];
    const searchManager = new SearchManager(client.music);

    for (const value of values) {
      const parts = value.split(':');
      const uri = parts.slice(2).join(':');

      if (!uri) continue;

      try {
        const searchResult = await searchManager.search(uri, {
          requester: interaction.user
        });

        if (searchResult && searchResult.tracks && searchResult.tracks.length > 0) {
          const track = searchResult.tracks[0];
          playerManager.queue.add(track);
          successTracks.push(track.title);
        } else {
          failedTracks.push(uri);
        }
      } catch (error) {
        logger.error('HistoryCommand', `Failed to search or add track: ${uri}`, error);
        failedTracks.push(uri);
      }
    }

    if (player && !player.playing && !player.paused && successTracks.length > 0) {
      try {
        await playerManager.play();
      } catch (playError) {
        logger.error('HistoryCommand', 'Error starting playback after adding tracks', playError);
      }
    }

    if (successTracks.length > 0) {
      let responseText = `✅ Added ${successTracks.length} track(s) to the queue.`;
      if (failedTracks.length > 0) {
        responseText += `\n❌ Failed to add ${failedTracks.length} track(s).`;
      }
      await interaction.editReply({ content: responseText });
    } else if (failedTracks.length > 0) {
      await interaction.editReply({ content: `❌ Failed to add any tracks to the queue.` });
    } else {
      await interaction.editReply({ content: `❓ No tracks were processed.` });
    }
  } catch (error) {
    logger.error('HistoryCommand', 'Error handling select menu interaction', error);

    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ An error occurred while processing your selection.',
          ephemeral: true
        });
      } else if (interaction.deferred) {
        await interaction.editReply({
          content: '❌ An error occurred while processing your selection.'
        });
      }
    } catch (replyError) {
      logger.error('HistoryCommand', 'Failed to send error reply', replyError);
    }
  }
}

function formatDuration(duration) {
  const seconds = Math.floor((duration / 1000) % 60);
  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  const hours = Math.floor(duration / (1000 * 60 * 60));

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

export default new HistoryCommand();