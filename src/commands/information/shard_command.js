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
import { logger } from '../../utils/logger.js';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  StringSelectMenuBuilder
} from 'discord.js';

class ShardCommand extends Command {
  constructor() {
    super({
      name: 'shard',
      description: 'Displays detailed information about all bot shards',
      usage: 'shard [shard_id]',
      aliases: ['shards', 'shardinfo', 'shardstats'],
      category: 'information',
      cooldown: 5
    });
  }

  async execute({ message, args, client }) {
    try {
      const shards = client.ws.shards;
      const totalShards = shards.size;
      
      if (totalShards === 0) {
        const errorEmbed = embedManager.error('No Shards', 'No shards are currently available.');
        return message.reply({ embeds: [errorEmbed] });
      }

      // Parse shard ID from args if provided
      const requestedShardId = args[0] ? parseInt(args[0]) : null;
      
      if (requestedShardId !== null && (requestedShardId < 0 || requestedShardId >= totalShards)) {
        const errorEmbed = embedManager.error('Invalid Shard', `Shard ID must be between 0 and ${totalShards - 1}.`);
        return message.reply({ embeds: [errorEmbed] });
      }

      const getShardStatus = (status) => {
        const statusMap = {
          0: { text: '🟢 Ready', color: '#00ff00' },
          1: { text: '🟡 Connecting', color: '#ffff00' },
          2: { text: '🔄 Reconnecting', color: '#ff8000' },
          3: { text: '🔴 Idle', color: '#808080' },
          4: { text: '🔴 Nearly', color: '#ff0000' },
          5: { text: '🔴 Disconnected', color: '#ff0000' },
          6: { text: '🔄 Waiting for Guilds', color: '#ff8000' },
          7: { text: '🔴 Identifying', color: '#ff8000' },
          8: { text: '🔴 Resuming', color: '#ff8000' }
        };
        return statusMap[status] || { text: '❓ Unknown', color: '#808080' };
      };

      const formatUptime = (ms) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
        if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
      };

      const formatNumber = (num) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
      };

      const generateOverviewEmbed = () => {
        const shardArray = Array.from(shards.values());
        const readyShards = shardArray.filter(s => s.status === 0).length;
        const totalGuilds = client.guilds.cache.size;
        const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        const avgPing = Math.round(shardArray.reduce((acc, shard) => acc + (shard.ping || 0), 0) / totalShards);
        
        // Calculate shard distribution
        const shardGuilds = {};
        const shardUsers = {};
        client.guilds.cache.forEach(guild => {
          const shardId = guild.shardId;
          shardGuilds[shardId] = (shardGuilds[shardId] || 0) + 1;
          shardUsers[shardId] = (shardUsers[shardId] || 0) + guild.memberCount;
        });

        const healthPercentage = Math.round((readyShards / totalShards) * 100);
        const healthColor = healthPercentage >= 90 ? '#00ff00' : healthPercentage >= 70 ? '#ffff00' : '#ff0000';

        let shardsList = '';
        shardArray.forEach((shard, index) => {
          const status = getShardStatus(shard.status);
          const guilds = shardGuilds[shard.id] || 0;
          const users = shardUsers[shard.id] || 0;
          const ping = shard.ping || 0;
          
          shardsList += `**Shard ${shard.id}** ${status.text} | ` +
                       `**${formatNumber(guilds)}** guilds | ` +
                       `**${formatNumber(users)}** users | ` +
                       `**${ping}ms**\n`;
        });

        return embedManager.create({
          title: '🔰 Shard Information Overview',
          description: [
            `**📊 General Statistics**`,
            `• Total Shards: **${totalShards}**`,
            `• Ready Shards: **${readyShards}/${totalShards}** (${healthPercentage}%)`,
            `• Total Guilds: **${formatNumber(totalGuilds)}**`,
            `• Total Users: **${formatNumber(totalUsers)}**`,
            `• Average Ping: **${avgPing}ms**`,
            `• Health Status: ${healthPercentage >= 90 ? '🟢 Excellent' : healthPercentage >= 70 ? '🟡 Good' : '🔴 Poor'}`,
            ``,
            `**🌐 Shard Details**`,
            shardsList
          ].join('\n'),
          color: healthColor,
          timestamp: true,
          footer: {
            text: `Use buttons below to view detailed information • Cluster: ${client.cluster?.info?.CLUSTER || 'Unknown'}`
          }
        });
      };

      const generateDetailedEmbed = (shardId) => {
        const shard = shards.get(shardId);
        if (!shard) {
          return embedManager.error('Shard Not Found', `Shard ${shardId} does not exist.`);
        }

        const status = getShardStatus(shard.status);
        const guilds = client.guilds.cache.filter(g => g.shardId === shardId);
        const totalUsers = guilds.reduce((acc, guild) => acc + guild.memberCount, 0);
        const textChannels = client.channels.cache.filter(c => c.type === 0 && guilds.has(c.guild?.id)).size;
        const voiceChannels = client.channels.cache.filter(c => c.type === 2 && guilds.has(c.guild?.id)).size;
        
        // Calculate shard uptime (approximation based on ready timestamp)
        const uptimeMs = shard.connectedAt ? Date.now() - shard.connectedAt : 0;
        
        // Get the largest guilds on this shard
        const topGuilds = guilds
          .sort((a, b) => b.memberCount - a.memberCount)
          .first(5);

        let topGuildsList = '';
        topGuilds.forEach((guild, index) => {
          topGuildsList += `${index + 1}. **${guild.name}** - ${formatNumber(guild.memberCount)} members\n`;
        });

        return embedManager.create({
          title: `🔰 Shard ${shardId} - Detailed Information`,
          description: [
            `**📊 Shard Status**`,
            `• Status: ${status.text}`,
            `• Ping: **${shard.ping || 0}ms**`,
            `• Sequence: **${shard.sequence || 'N/A'}**`,
            `• Session ID: **${shard.sessionId ? shard.sessionId.substring(0, 8) + '...' : 'N/A'}**`,
            shard.lastPingTimestamp ? `• Last Ping: <t:${Math.floor(shard.lastPingTimestamp / 1000)}:R>` : '',
            uptimeMs > 0 ? `• Uptime: **${formatUptime(uptimeMs)}**` : '',
            ``,
            `**📈 Statistics**`,
            `• Guilds: **${guilds.size}**`,
            `• Total Users: **${formatNumber(totalUsers)}**`,
            `• Text Channels: **${textChannels}**`,
            `• Voice Channels: **${voiceChannels}**`,
            `• Total Channels: **${textChannels + voiceChannels}**`,
            ``,
            `**🏆 Top Guilds**`,
            topGuildsList || 'No guilds on this shard'
          ].filter(line => line !== '').join('\n'),
          color: status.color,
          timestamp: true,
          footer: {
            text: `Shard ${shardId}/${totalShards - 1} • Click buttons to navigate`
          }
        });
      };

      const buildButtons = (currentMode, currentShardId = 0) => {
        const mainButtons = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('overview')
            .setLabel('Overview')
            .setEmoji('📊')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentMode === 'overview'),

          new ButtonBuilder()
            .setCustomId('detailed')
            .setLabel('Detailed View')
            .setEmoji('🔍')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentMode === 'detailed'),

          new ButtonBuilder()
            .setCustomId('refresh')
            .setLabel('Refresh')
            .setEmoji('🔄')
            .setStyle(ButtonStyle.Success)
        );

        const components = [mainButtons];

        // Add navigation buttons for detailed view
        if (currentMode === 'detailed') {
          const navButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('prev_shard')
              .setLabel('Previous Shard')
              .setEmoji('⬅️')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(currentShardId === 0),

            new ButtonBuilder()
              .setCustomId('next_shard')
              .setLabel('Next Shard')
              .setEmoji('➡️')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(currentShardId >= totalShards - 1),

            new ButtonBuilder()
              .setCustomId('jump_shard')
              .setLabel('Jump to Shard')
              .setEmoji('🎯')
              .setStyle(ButtonStyle.Secondary)
          );
          components.push(navButtons);
        }

        return components;
      };

      // Determine initial mode and shard
      let currentMode = requestedShardId !== null ? 'detailed' : 'overview';
      let currentShardId = requestedShardId || 0;

      const initialEmbed = currentMode === 'overview' 
        ? generateOverviewEmbed() 
        : generateDetailedEmbed(currentShardId);
      const initialButtons = buildButtons(currentMode, currentShardId);

      const sent = await message.reply({
        embeds: [initialEmbed],
        components: initialButtons
      });

      const collector = sent.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 300_000 // 5 minutes
      });

      collector.on('collect', async (interaction) => {
        if (interaction.user.id !== message.author.id) {
          return interaction.reply({
            content: 'Only the command author can use these buttons.',
            ephemeral: true
          });
        }

        const buttonId = interaction.customId;

        try {
          if (buttonId === 'overview') {
            currentMode = 'overview';
          } else if (buttonId === 'detailed') {
            currentMode = 'detailed';
          } else if (buttonId === 'prev_shard' && currentShardId > 0) {
            currentShardId--;
          } else if (buttonId === 'next_shard' && currentShardId < totalShards - 1) {
            currentShardId++;
          } else if (buttonId === 'jump_shard') {
            // Create a select menu for jumping to specific shard
            const options = [];
            for (let i = 0; i < Math.min(totalShards, 25); i++) {
              const shard = shards.get(i);
              const status = getShardStatus(shard?.status || 5);
              options.push({
                label: `Shard ${i}`,
                value: i.toString(),
                description: `${status.text.replace(/[🟢🟡🔄🔴❓]/g, '').trim()} - ${shard?.ping || 0}ms`,
                emoji: status.text.match(/[🟢🟡🔄🔴❓]/)?.[0]
              });
            }

            const selectMenu = new StringSelectMenuBuilder()
              .setCustomId('select_shard')
              .setPlaceholder('Select a shard to view')
              .addOptions(options);

            const selectRow = new ActionRowBuilder().addComponents(selectMenu);

            return interaction.reply({
              content: 'Select a shard to jump to:',
              components: [selectRow],
              ephemeral: true
            });
          } else if (buttonId === 'refresh') {
            // Just refresh the current view
          }

          const embed = currentMode === 'overview' 
            ? generateOverviewEmbed() 
            : generateDetailedEmbed(currentShardId);
          const buttons = buildButtons(currentMode, currentShardId);

          await interaction.update({
            embeds: [embed],
            components: buttons
          });
        } catch (error) {
          logger.error('ShardCommand', 'Error handling button interaction', error);
          await interaction.reply({
            content: 'An error occurred while updating the shard information.',
            ephemeral: true
          });
        }
      });

      // Handle select menu interactions
      const selectCollector = sent.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 300_000
      });

      selectCollector.on('collect', async (interaction) => {
        if (interaction.user.id !== message.author.id) {
          return interaction.reply({
            content: 'Only the command author can use this menu.',
            ephemeral: true
          });
        }

        if (interaction.customId === 'select_shard') {
          currentShardId = parseInt(interaction.values[0]);
          currentMode = 'detailed';

          const embed = generateDetailedEmbed(currentShardId);
          const buttons = buildButtons(currentMode, currentShardId);

          await interaction.update({
            embeds: [embed],
            components: buttons
          });
        }
      });

      collector.on('end', () => {
        const disabledButtons = initialButtons.map(row => {
          return new ActionRowBuilder().addComponents(
            row.components.map(btn => 
              ButtonBuilder.from(btn).setDisabled(true)
            )
          );
        });
        
        sent.edit({ components: disabledButtons }).catch(() => {});
      });

    } catch (error) {
      logger.error('ShardCommand', 'Error executing shard command', error);
      const errorEmbed = embedManager.error('Error', 'Unable to display shard information.');
      message.reply({ embeds: [errorEmbed] });
    }
  }
}

export default new ShardCommand();

// Not even this is safe from
// coded by bre4d