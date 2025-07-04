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
import { EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { db } from '../../database/DatabaseManager.js';
import { logger } from '../../utils/logger.js';
import { PlayerManager } from '../../managers/PlayerManager.js';
import { SearchManager } from '../../managers/SearchManager.js';

/**
 * Likes command for viewing and managing user's liked songs
 */
class LikesCommand extends Command {
  constructor() {
    super({
      name: 'likes',
      description: 'View and manage your liked songs with options to play or remove them',
      usage: 'likes [page]',
      aliases: ['liked', 'favorites', 'favs'],
      category: 'music',
      cooldown: 5,
      voiceRequired: false,
      playerRequired: false
    });
  }

  /**
   * Execute the likes command
   * @param {object} options - Command options
   * @returns {Promise<void>}
   */
  async execute({ message, args, client, musicManager }) {
    const { guild, author } = message;
    const userId = author.id;

    try {
      // Parse page number
      let page = 0;
      if (args[0] && !isNaN(parseInt(args[0]))) {
        page = Math.max(0, parseInt(args[0]) - 1); // Convert from 1-based to 0-based
      }

      const pageSize = 10;

      // Get user likes from database
      const likes = db.user.getLikedSongs(userId, pageSize, page * pageSize);
      const totalLikes = db.user.countLikedSongs(userId);
      const totalPages = Math.ceil(totalLikes / pageSize);

      if (!likes || likes.length === 0) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('#e74c3c')
              .setTitle('❤️ No Liked Songs')
              .setDescription('You haven\'t liked any songs yet.\n\nUse the ❤️ button on the player or the `like` command to add songs to your favorites.')
              .setFooter({ text: 'Tip: Like a song by reacting with ❤️ to any playing track!' })
          ]
        });
      }

      // Generate components and embed
      const { actionRows, likesEmbed } = await this.generateLikesComponents(likes, userId, page, pageSize, totalPages, totalLikes);

      // Send the message
      const reply = await message.reply({
        embeds: [likesEmbed],
        components: actionRows
      });

      // Create collector for button and select menu interactions
      const filter = i => i.user.id === author.id && 
        (i.customId.startsWith('likes_') || i.customId === 'add_to_queue' || i.customId === 'remove_from_likes' || i.customId === 'clear_likes');

      const collector = reply.createMessageComponentCollector({
        filter,
        time: 180000 // 3 minutes
      });

      collector.on('collect', async interaction => {
        // Handle pagination buttons
        if (interaction.customId === 'likes_prev') {
          page = Math.max(0, page - 1);
          await this.updateLikesEmbed(interaction, userId, page, pageSize, totalPages);
        }
        else if (interaction.customId === 'likes_next') {
          page = Math.min(totalPages - 1, page + 1);
          await this.updateLikesEmbed(interaction, userId, page, pageSize, totalPages);
        }
        // Handle add to queue select menu
        else if (interaction.customId === 'add_to_queue') {
          await this.handleAddToQueue(interaction, client, likes);
        }
        // Handle remove from likes select menu
        else if (interaction.customId === 'remove_from_likes') {
          await this.handleRemoveFromLikes(interaction, userId, likes, page, pageSize, totalPages);
        }
        // Handle clear all likes button
        else if (interaction.customId === 'clear_likes') {
          await this.handleClearLikes(interaction, userId, reply);
        }
      });

      collector.on('end', () => {
        // Disable all components after timeout
        const disabledComponents = actionRows.map(row => {
          const newRow = ActionRowBuilder.from(row);
          newRow.components.forEach(component => component.setDisabled(true));
          return newRow;
        });

        reply.edit({ 
          embeds: [likesEmbed.setFooter({ 
            text: `${likesEmbed.data.footer.text} • Interaction timed out` 
          })],
          components: disabledComponents 
        }).catch(() => {});
      });

    } catch (error) {
      logger.error('LikesCommand', 'Error displaying liked songs', error);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('❌ Error')
            .setDescription('An error occurred while retrieving your liked songs.')
        ]
      });
    }
  }

  /**
   * Create components and embed for likes display
   * @param {Array} likes - Liked tracks array
   * @param {string} userId - User ID
   * @param {number} page - Current page
   * @param {number} pageSize - Items per page
   * @param {number} totalPages - Total number of pages
   * @param {number} totalLikes - Total number of liked songs
   * @returns {Object} - Action rows and embed
   */
  async generateLikesComponents(likes, userId, page, pageSize, totalPages, totalLikes) {
    // Create select menu for adding tracks to queue
    const addToQueueMenu = new StringSelectMenuBuilder()
      .setCustomId('add_to_queue')
      .setPlaceholder('Select songs to add to queue')
      .setMinValues(1)
      .setMaxValues(likes.length);

    // Create select menu for removing songs from likes
    const removeFromLikesMenu = new StringSelectMenuBuilder()
      .setCustomId('remove_from_likes')
      .setPlaceholder('Select songs to remove from likes')
      .setMinValues(1)
      .setMaxValues(likes.length);

    // Add each track as an option to both menus
    likes.forEach((track, index) => {
      // Add to queue menu
      addToQueueMenu.addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel(track.title.length > 80 ? track.title.substring(0, 77) + '...' : track.title)
          .setDescription(track.author.length > 90 ? track.author.substring(0, 87) + '...' : track.author)
          .setValue(`${index}:${track.uri}`)
          .setEmoji('🎵')
      );

      // Remove from likes menu
      removeFromLikesMenu.addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel(track.title.length > 80 ? track.title.substring(0, 77) + '...' : track.title)
          .setDescription(track.author.length > 90 ? track.author.substring(0, 87) + '...' : track.author)
          .setValue(`${index}:${track.uri}`)
          .setEmoji('❌')
      );
    });

    // Create action rows
    const actionRows = [
      new ActionRowBuilder().addComponents(addToQueueMenu),
      new ActionRowBuilder().addComponents(removeFromLikesMenu)
    ];

    // Create clear all button and pagination row
    const controlRow = new ActionRowBuilder();
    
    // Add clear all button
    controlRow.addComponents(
      new ButtonBuilder()
        .setCustomId('clear_likes')
        .setLabel('Clear All Likes')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🗑️')
    );
    
    // Add pagination buttons if needed
    if (totalPages > 1) {
      controlRow.addComponents(
        new ButtonBuilder()
          .setCustomId('likes_prev')
          .setLabel('Previous')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('⬅️')
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId('likes_next')
          .setLabel('Next')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('➡️')
          .setDisabled(page >= totalPages - 1)
      );
    }

    actionRows.push(controlRow);

    // Create embedded likes display
    const likesEmbed = new EmbedBuilder()
      .setColor('#e91e63')
      .setTitle('❤️ Your Liked Songs')
      .setDescription('Select songs to add to the queue or remove from your favorites')
      .setFooter({
        text: `Page ${page + 1}/${totalPages || 1} • ${totalLikes} total liked songs`
      });

    // Add liked tracks to embed
    likes.forEach((track, index) => {
      likesEmbed.addFields({
        name: `${index + 1}. ${track.title}`,
        value: `Artist: ${track.author} • Duration: ${formatDuration(track.duration)}`
      });
    });

    return { actionRows, likesEmbed };
  }

  /**
   * Handle adding tracks to queue from liked songs
   * @param {object} interaction - Discord interaction
   * @param {object} client - Discord client
   * @param {Array} likes - Liked tracks array
   */
  async handleAddToQueue(interaction, client, likes) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const values = interaction.values;
      const guildId = interaction.guild?.id;

      if (!values || values.length === 0) {
        return interaction.editReply({
          content: '❌ No tracks selected'
        });
      }

      // Check if user is in a voice channel
      const member = interaction.guild.members.cache.get(interaction.user.id);
      const voiceChannelId = member?.voice?.channelId;

      if (!voiceChannelId) {
        return interaction.editReply({
          content: '❌ You need to be in a voice channel to add tracks to the queue'
        });
      }

      // Get or create player
      let player = client.music.getPlayer(guildId);
      let playerManager;

      if (!player) {
        try {
          logger.info('LikesCommand', `Creating new player for guild ${guildId} in voice channel ${voiceChannelId}`);

          // Create a new player with the user's voice channel
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
          logger.error('LikesCommand', 'Failed to create player', createError);
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

      // Process each selected track
      for (const value of values) {
        // Parse URI from the value (format: "index:URI")
        const parts = value.split(':');
        const uri = parts.slice(1).join(':'); // Skip the index part and get the URI

        if (!uri) continue;

        try {
          // Search for the track using the SearchManager for better platform detection
          const searchResult = await searchManager.search(uri, {
            requester: interaction.user
          });

          if (searchResult && searchResult.tracks && searchResult.tracks.length > 0) {
            // Add the first track to queue
            const track = searchResult.tracks[0];
            playerManager.queue.add(track);
            successTracks.push(track.title);
          } else {
            failedTracks.push(uri);
          }
        } catch (error) {
          logger.error('LikesCommand', `Failed to search or add track: ${uri}`, error);
          failedTracks.push(uri);
        }
      }

      // If player exists but wasn't playing, start playback
      if (player && !player.playing && !player.paused && successTracks.length > 0) {
        try {
          await playerManager.play();
        } catch (playError) {
          logger.error('LikesCommand', 'Error starting playback after adding tracks', playError);
        }
      }

      // Send response based on success/failure
      if (successTracks.length > 0) {
        const embedResponse = new EmbedBuilder()
          .setColor('#2ecc71')
          .setTitle('✅ Added to Queue')
          .setDescription(`Successfully added ${successTracks.length} track(s) to the queue.`)
          .setFooter({ text: 'Music will start playing automatically' });
          
        if (failedTracks.length > 0) {
          embedResponse.addFields({ 
            name: '❌ Failed Tracks', 
            value: `Failed to add ${failedTracks.length} track(s).` 
          });
        }
        
        await interaction.editReply({ embeds: [embedResponse] });
      } else if (failedTracks.length > 0) {
        await interaction.editReply({ 
          embeds: [
            new EmbedBuilder()
              .setColor('#e74c3c')
              .setTitle('❌ Failed to Add Tracks')
              .setDescription('Failed to add any tracks to the queue.')
          ]
        });
      } else {
        await interaction.editReply({ 
          embeds: [
            new EmbedBuilder()
              .setColor('#f39c12')
              .setTitle('❓ No Tracks Processed')
              .setDescription('No tracks were processed. Please try again.')
          ]
        });
      }
    } catch (error) {
      logger.error('LikesCommand', 'Error handling add to queue interaction', error);

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
        logger.error('LikesCommand', 'Failed to send error reply', replyError);
      }
    }
  }

  /**
   * Handle removing tracks from likes
   * @param {object} interaction - Discord interaction
   * @param {string} userId - User ID
   * @param {Array} likes - Liked tracks array
   * @param {number} page - Current page number
   * @param {number} pageSize - Items per page
   * @param {number} totalPages - Total number of pages
   */
  async handleRemoveFromLikes(interaction, userId, likes, page, pageSize, totalPages) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const values = interaction.values;

      if (!values || values.length === 0) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor('#e74c3c')
              .setTitle('❌ No Selection')
              .setDescription('No tracks were selected to remove.')
          ]
        });
      }

      const removedTracks = [];
      const failedToRemove = [];

      // Process each selected track
      for (const value of values) {
        // Parse URI from the value (format: "index:URI")
        const parts = value.split(':');
        const uri = parts.slice(1).join(':'); // Skip the index part and get the URI

        if (!uri) continue;

        try {
          // Remove from liked songs
          const removed = db.user.removeLikedSong(userId, uri);
          if (removed) {
            const trackIndex = values.indexOf(value);
            if (trackIndex !== -1 && likes[trackIndex]) {
              removedTracks.push(likes[trackIndex].title || uri);
            } else {
              removedTracks.push(uri);
            }
          } else {
            failedToRemove.push(uri);
          }
        } catch (error) {
          logger.error('LikesCommand', `Failed to remove liked song: ${uri}`, error);
          failedToRemove.push(uri);
        }
      }

      // Send response
      if (removedTracks.length > 0) {
        // Update the main message with new likes data
        const totalLikes = db.user.countLikedSongs(userId);
        const newTotalPages = Math.ceil(totalLikes / pageSize);
        
        // Adjust page if we removed all items from current page
        const updatedPage = totalLikes === 0 ? 0 : 
                          (page >= newTotalPages && newTotalPages > 0) ? newTotalPages - 1 : page;
        
        // Get updated likes for the current page
        const updatedLikes = totalLikes === 0 ? [] : 
                            db.user.getLikedSongs(userId, pageSize, updatedPage * pageSize);
        
        // Update the main embed with new content
        if (totalLikes > 0) {
          await this.updateLikesEmbed(interaction, userId, updatedPage, pageSize, newTotalPages);
        } else {
          // If no more likes, update the main message
          const parentMessage = await interaction.message.fetch();
          
          await parentMessage.edit({
            embeds: [
              new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('❤️ No Liked Songs')
                .setDescription('You have removed all your liked songs.\n\nUse the ❤️ button on the player or the `like` command to add songs to your favorites.')
                .setFooter({ text: 'Tip: Like a song by reacting with ❤️ to any playing track!' })
            ],
            components: [] // Remove all components as there are no likes
          });
        }
        
        // Send confirmation message
        const responseEmbed = new EmbedBuilder()
          .setColor('#2ecc71')
          .setTitle('🗑️ Songs Removed')
          .setDescription(`Successfully removed ${removedTracks.length} song(s) from your likes.`);
        
        if (failedToRemove.length > 0) {
          responseEmbed.addFields({
            name: '❌ Failed to Remove',
            value: `Failed to remove ${failedToRemove.length} song(s).`
          });
        }
        
        await interaction.editReply({ embeds: [responseEmbed] });
      } else {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor('#e74c3c')
              .setTitle('❌ Failed to Remove')
              .setDescription('Failed to remove any tracks from your liked songs.')
          ]
        });
      }
    } catch (error) {
      logger.error('LikesCommand', 'Error handling remove from likes interaction', error);

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
        logger.error('LikesCommand', 'Failed to send error reply', replyError);
      }
    }
  }

  /**
   * Handle clearing all likes
   * @param {object} interaction - Discord interaction
   * @param {string} userId - User ID
   * @param {object} reply - Original message reply
   */
  async handleClearLikes(interaction, userId, reply) {
    try {
      // Create confirmation buttons
      const confirmRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('confirm_clear_likes')
          .setLabel('Yes, Clear All')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('⚠️'),
        new ButtonBuilder()
          .setCustomId('cancel_clear_likes')
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Secondary)
      );

      // Ask for confirmation
      const confirmMsg = await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#f39c12')
            .setTitle('⚠️ Clear All Liked Songs')
            .setDescription('Are you sure you want to remove **ALL** your liked songs? This action cannot be undone.')
        ],
        components: [confirmRow],
        ephemeral: true
      });

      // Create collector for confirmation
      const filter = i => 
        (i.customId === 'confirm_clear_likes' || i.customId === 'cancel_clear_likes') && 
        i.user.id === interaction.user.id;

      const collector = confirmMsg.createMessageComponentCollector({
        filter,
        time: 30000 // 30 seconds
      });

      collector.on('collect', async i => {
        if (i.customId === 'confirm_clear_likes') {
          // Clear all liked songs
          try {
            const success = db.user.clearLikedSongs(userId);

            if (success) {
              // Update the original message
              await reply.edit({
                embeds: [
                  new EmbedBuilder()
                    .setColor('#e74c3c')
                    .setTitle('❤️ No Liked Songs')
                    .setDescription('You have removed all your liked songs.\n\nUse the ❤️ button on the player or the `like` command to add songs to your favorites.')
                    .setFooter({ text: 'Tip: Like a song by reacting with ❤️ to any playing track!' })
                ],
                components: [] // Remove all components
              });

              // Send confirmation message
              await i.update({
                embeds: [
                  new EmbedBuilder()
                    .setColor('#2ecc71')
                    .setTitle('✅ All Likes Cleared')
                    .setDescription('Successfully removed all your liked songs.')
                ],
                components: []
              });
            } else {
              await i.update({
                embeds: [
                  new EmbedBuilder()
                    .setColor('#e74c3c')
                    .setTitle('❌ Error')
                    .setDescription('Failed to clear your liked songs. Please try again later.')
                ],
                components: []
              });
            }
          } catch (error) {
            logger.error('LikesCommand', 'Error clearing liked songs', error);
            await i.update({
              embeds: [
                new EmbedBuilder()
                  .setColor('#e74c3c')
                  .setTitle('❌ Error')
                  .setDescription('An error occurred while clearing your liked songs.')
              ],
              components: []
            });
          }
        } else if (i.customId === 'cancel_clear_likes') {
          // Cancel the action
          await i.update({
            embeds: [
              new EmbedBuilder()
                .setColor('#3498db')
                .setTitle('❌ Action Cancelled')
                .setDescription('Your liked songs have not been cleared.')
            ],
            components: []
          });
        }
      });

      collector.on('end', async collected => {
        if (collected.size === 0) {
          try {
            // Timed out without any interaction
            await interaction.editReply({
              embeds: [
                new EmbedBuilder()
                  .setColor('#95a5a6')
                  .setTitle('⏱️ Timed Out')
                  .setDescription('Clear likes action cancelled due to timeout.')
              ],
              components: []
            });
          } catch (error) {
            logger.error('LikesCommand', 'Error updating timed out message', error);
          }
        }
      });
    } catch (error) {
      logger.error('LikesCommand', 'Error handling clear likes', error);
      
      try {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('#e74c3c')
              .setTitle('❌ Error')
              .setDescription('An error occurred while processing your request.')
          ],
          ephemeral: true
        });
      } catch (replyError) {
        logger.error('LikesCommand', 'Failed to send error reply', replyError);
      }
    }
  }

  /**
   * Update likes embed with new page
   * @param {object} interaction - Discord interaction
   * @param {string} userId - User ID
   * @param {number} page - Current page
   * @param {number} pageSize - Items per page
   * @param {number} totalPages - Total pages
   */
  async updateLikesEmbed(interaction, userId, page, pageSize, totalPages) {
    try {
      const likes = db.user.getLikedSongs(userId, pageSize, page * pageSize);
      const totalLikes = db.user.countLikedSongs(userId);

      // Generate fresh components and embed
      const { actionRows, likesEmbed } = await this.generateLikesComponents(likes, userId, page, pageSize, totalPages, totalLikes);

      // Update the message
      await interaction.update({
        embeds: [likesEmbed],
        components: actionRows
      });
    } catch (error) {
      logger.error('updateLikesEmbed', 'Error updating likes embed', error);
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('❌ Error')
            .setDescription('Failed to update likes page. Please try again.')
        ],
        ephemeral: true
      });
    }
  }
}

/**
 * Format duration in milliseconds to a readable string
 * @param {number} duration - Duration in milliseconds
 * @returns {string} - Formatted duration string
 */
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

export default new LikesCommand();
