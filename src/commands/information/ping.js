/**
 * Muffin STUDIO - Bre4d777 & prayag 
 * https://discord.gg/TRPqseUq32
 * give credits or ill touch you in your dreams
 */

import { Command } from '../../structures/Command.js';
import { Pong } from '../../database/pong.js';
import {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  MessageFlags,
  SeparatorSpacingSize,
  ButtonStyle,
} from 'discord.js';

class PingCommand extends Command {
  constructor() {
    super({
      name: 'ping',
      description: 'Check bot latency',
      usage: 'ping',
      aliases: ['latency', 'pong'],
      category: 'information',
      cooldown: 2,
    });
    this.pongDb = new Pong();
  }

  buildContainer(username, content) {
    return new ContainerBuilder()
      .setAccentColor(16744448)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**${username}**`)
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(content)
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addActionRowComponents(row =>
        row.setComponents(
          new ButtonBuilder()
            .setCustomId('show_ping')
            .setLabel('Show Ping')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('refresh_ping')
            .setLabel('Refresh Ping')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('close')
            .setLabel('Close')
            .setStyle(ButtonStyle.Danger),
        )
      );
  }

  getLatencyIndicator(ms) {
    if (ms < 50) return 'Excellent';
    if (ms < 100) return 'Good';
    if (ms < 200) return 'Fair';
    if (ms < 500) return 'Poor';
    return 'Very Poor';
  }

  async measureLatencies(client) {
    const messageStart = performance.now();
    const apiLatency = Math.round(client.ws.ping);
    
    const dbPing = await this.pongDb.measureDatabasePing();
    const messageLatency = performance.now() - messageStart;

    return {
      message: parseFloat(messageLatency.toFixed(2)),
      api: apiLatency,
      database: parseFloat(dbPing.avg.toFixed(2))
    };
  }

  async execute({ message, client }) {
    try {
        const latencies = await this.measureLatencies(client);
      
      await this.pongDb.logPing(
        message.guild?.id,
        message.author.id,
        message.channel.id,
        latencies.message,
        latencies.api,
        latencies.database
      );
        
      const container = this.buildContainer(client.user.username, `**Current Ping Results:**\nMessage: **${latencies.message}ms** (${this.getLatencyIndicator(latencies.message)})\nAPI: **${latencies.api}ms** (${this.getLatencyIndicator(latencies.api)})\nDatabase: **${latencies.database}ms** (${this.getLatencyIndicator(latencies.database)})`);
      
      const sent = await message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });


      const collector = sent.createMessageComponentCollector({ time: 60000 });

      collector.on('collect', async interaction => {
        if (interaction.user.id !== message.author.id) {
          return interaction.reply({ 
            content: 'This is not your command!', 
            ephemeral: true 
          });
        }

        if (interaction.customId === 'show_ping') {
          const stats = await this.pongDb.getAverageLatencies(message.guild?.id, 1);
          
          await interaction.reply({ 
            content: `**Detailed Latency Information:**\nMessage: **${latencies.message}ms** (${this.getLatencyIndicator(latencies.message)})\nAPI: **${latencies.api}ms** (${this.getLatencyIndicator(latencies.api)})\nDatabase: **${latencies.database}ms** (${this.getLatencyIndicator(latencies.database)})\n\n**Recent Averages (1hr):**\nAvg Message: **${stats.avg_message}ms**\nAvg API: **${stats.avg_api}ms**\nAvg Database: **${stats.avg_database}ms**\nPings Recorded: **${stats.total_pings}**`, 
            ephemeral: true 
          });
        } 
        
        else if (interaction.customId === 'refresh_ping') {
          const newLatencies = await this.measureLatencies(client);
          
          await this.pongDb.logPing(
            message.guild?.id,
            message.author.id,
            message.channel.id,
            newLatencies.message,
            newLatencies.api,
            newLatencies.database
          );
          
          const updatedContainer = this.buildContainer(
            client.user.username,
            `**Current Ping Results:**\nMessage: **${newLatencies.message}ms** (${this.getLatencyIndicator(newLatencies.message)})\nAPI: **${newLatencies.api}ms** (${this.getLatencyIndicator(newLatencies.api)})\nDatabase: **${newLatencies.database}ms** (${this.getLatencyIndicator(newLatencies.database)})`
          );
          
          await interaction.update({ components: [updatedContainer] });
        } 
        
        else if (interaction.customId === 'close') {
          await interaction.update({ components: [] });
          collector.stop();
        }
      });

      collector.on('end', () => {
        sent.edit({ components: [] }).catch(() => {});
      });

    } catch (error) {
      console.error('PingCommand Error:', error);
      
      const fallbackLatencies = await this.measureLatencies(client);
      const fallbackContent = `**Pong!**\nMessage: **${fallbackLatencies.message}ms**\nAPI: **${fallbackLatencies.api}ms**\nDatabase: **${fallbackLatencies.database}ms**`;
      
      if (message.replied) {
        await message.followUp({ content: fallbackContent });
      } else {
        await message.reply({ content: fallbackContent });
      }
    }
  }
}

export default new PingCommand();