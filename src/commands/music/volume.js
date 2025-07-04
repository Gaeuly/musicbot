/**
 * Muffin STUDIO - Bre4d777 & prayag 
 * https://discord.gg/TRPqseUq32
 * give credits or ill touch you in your dreams
 */

import { Command } from '../../structures/Command.js';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  MessageFlags,
  SeparatorSpacingSize
} from 'discord.js';
import { PlayerManager } from '../../managers/PlayerManager.js';
import { db } from '../../database/DatabaseManager.js';
import { logger } from '../../utils/logger.js';

class VolumeCommand extends Command {
  constructor() {
    super({
      name: 'volume',
      description: 'Adjust or display the playback volume',
      usage: 'volume [0-100]',
      aliases: ['vol', 'v'],
      category: 'music',
      cooldown: 2,
      sameVoiceRequired: true,
      voiceRequired: true,
      playerRequired: true
    });
  }

  async execute({ message, args, client, musicManager }) {
    const { guild } = message;
    const player = musicManager.getPlayer(guild.id);
    const playerManager = new PlayerManager(player);

    if (!args.length) {
      const currentVolume = player.volume;
      const volBar = this.createVolumeBar(currentVolume);
      const soundLevelText = this.getSoundLevelText(currentVolume);

      const volumeControlContainer = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('🔊 **Volume Control**')
        )
        .addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`Current volume: **${currentVolume}%**`),
          new TextDisplayBuilder().setContent(volBar),
          new TextDisplayBuilder().setContent(`Sound level: ${soundLevelText}`)
        )
        .addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('• 0-30%: Quiet'),
          new TextDisplayBuilder().setContent('• 30-70%: Normal'),
          new TextDisplayBuilder().setContent('• 70-100%: Loud'),
          new TextDisplayBuilder().setContent('\n`volume <0-100>` to set a specific volume')
        );

      const buttonsRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('vol_minus').setLabel('-10%').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('vol_plus').setLabel('+10%').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('vol_min').setLabel('Min (10%)').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('vol_max').setLabel('Max (100%)').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('vol_toggle_mute').setLabel(currentVolume > 0 ? 'Mute' : 'Unmute').setStyle(ButtonStyle.Danger)
      );

      volumeControlContainer.addActionRowComponents(buttonsRow);

      const reply = await message.reply({ components: [volumeControlContainer], flags: MessageFlags.IsComponentsV2 });

      const collector = reply.createMessageComponentCollector({ time: 60_000, componentType: ComponentType.Button });

      collector.on('collect', async (interaction) => {
        if (interaction.user.id !== message.author.id) {
          await interaction.reply({ content: 'Only the command user can adjust the volume.', ephemeral: true });
          return;
        }

        let newVolume = player.volume;
        switch (interaction.customId) {
          case 'vol_minus':
            newVolume = Math.max(0, player.volume - 10);
            break;
          case 'vol_plus':
            newVolume = Math.min(100, player.volume + 10);
            break;
          case 'vol_min':
            newVolume = 10;
            break;
          case 'vol_max':
            newVolume = 100;
            break;
          case 'vol_toggle_mute':
            newVolume = player.volume === 0 ? 50 : 0;
            break;
        }

        playerManager.setVolume(newVolume);
        await db.guild.setVolume(guild.id, newVolume);

        const updatedVolBar = this.createVolumeBar(newVolume);
        const updatedSoundLevelText = this.getSoundLevelText(newVolume);

        const updatedContainer = new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('🔊 **Volume Control**')
          )
          .addSeparatorComponents(
            new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
          )
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`Volume updated: **${newVolume}%**`),
            new TextDisplayBuilder().setContent(updatedVolBar),
            new TextDisplayBuilder().setContent(`Sound level: ${updatedSoundLevelText}`)
          )
          .addSeparatorComponents(
            new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
          )
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('• 0-30%: Quiet'),
            new TextDisplayBuilder().setContent('• 30-70%: Normal'),
            new TextDisplayBuilder().setContent('• 70-100%: Loud'),
            new TextDisplayBuilder().setContent('\n`volume <0-100>` to set a specific volume')
          );

        buttonsRow.components[4].setLabel(newVolume > 0 ? 'Mute' : 'Unmute');
        updatedContainer.addActionRowComponents(buttonsRow);

        await interaction.update({ components: [updatedContainer], flags: MessageFlags.IsComponentsV2 });
      });

      collector.on('end', async () => {
        buttonsRow.components.forEach(btn => btn.setDisabled(true));
        try {
          // Re-create the container to update it with disabled buttons
          const finalContainer = new ContainerBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent('🔊 **Volume Control (Session Ended)**') // Indicate session ended
            )
            .addSeparatorComponents(
              new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
            )
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`Final volume: **${player.volume}%**`),
              new TextDisplayBuilder().setContent(this.createVolumeBar(player.volume)),
              new TextDisplayBuilder().setContent(`Sound level: ${this.getSoundLevelText(player.volume)}`)
            )
            .addSeparatorComponents(
              new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
            )
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent('• 0-30%: Quiet'),
              new TextDisplayBuilder().setContent('• 30-70%: Normal'),
              new TextDisplayBuilder().setContent('• 70-100%: Loud'),
              new TextDisplayBuilder().setContent('\n`volume <0-100>` to set a specific volume')
            );
          finalContainer.addActionRowComponents(buttonsRow); // Add disabled buttons
          await reply.edit({ components: [finalContainer], flags: MessageFlags.IsComponentsV2 });
        } catch (error) {
          logger.error('VolumeCommand', 'Failed to disable buttons or edit message:', error);
        }
      });
      return;
    }

    const volume = parseInt(args[0], 10);
    if (isNaN(volume) || volume < 0 || volume > 100) {
      return this.sendComponentError(
        message,
        'Invalid Volume',
        `Please provide a valid number between 0 to 100.\n\nUsage: \`${this.usage}\``
      );
    }

    const newVolume = playerManager.setVolume(volume);
    await db.guild.setVolume(guild.id, newVolume);

    const volBar = this.createVolumeBar(newVolume);
    const soundLevelText = this.getSoundLevelText(newVolume);

    const successContainer = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('✅ **Volume Adjusted**')
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`Volume set to **${newVolume}%**`),
        new TextDisplayBuilder().setContent(volBar),
        new TextDisplayBuilder().setContent(`Sound level: ${soundLevelText}`)
      );

    return message.reply({ components: [successContainer], flags: MessageFlags.IsComponentsV2 });
  }

  createVolumeBar(volume) {
    const totalBars = 20;
    const filledBlocks = Math.round((volume / 100) * totalBars);
    const emptyBlocks = totalBars - filledBlocks;
    return `\`[${'█'.repeat(filledBlocks)}${'─'.repeat(emptyBlocks)}]\``;
  }

  getSoundLevelText(volume) {
    if (volume === 0) return 'Muted';
    if (volume <= 30) return 'Quiet';
    if (volume <= 70) return 'Normal';
    return 'Loud';
  }

  sendComponentError(message, title, description) {
    const errorContainer = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`❌ **${title}**`)
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(description)
      );
    return message.reply({ components: [errorContainer], flags: MessageFlags.IsComponentsV2 });
  }
}

export default new VolumeCommand();