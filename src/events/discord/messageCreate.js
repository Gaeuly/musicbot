/**
 * Muffin STUDIO - Bre4d777 & prayag 
 * https://discord.gg/TRPqseUq32
 * give credits or ill touch you in your dreams
 */

import { logger } from '../../utils/logger.js';
import { db } from '../../database/DatabaseManager.js';

export default {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot) return;

    try {
      const mentions = message.mentions;
      
      // Check if bot is mentioned directly (not through role/everyone)
      const isBotMentioned = mentions.users.has(client.user.id) && 
        !mentions.everyone && 
        !mentions.roles.size;
      
      // If not mentioned, handle as regular command
      if (!isBotMentioned) {
        return client.commandHandler.handleMessage(message);
      }

      // Handle direct mention - check if it's just a mention without content
      const mentionRegex = new RegExp(`^<@!?${client.user.id}>\\s*$`);
      if (mentionRegex.test(message.content.trim())) {
        const guildPrefix = db.getPrefix(message.guild.id);
        await message.reply(
          `I am currently undergoing an update. You can still use me btw but i may go off in between.\n` +
          `- Use **${guildPrefix}help** for my command list\n` +
          `- Use **${guildPrefix}play** to play a song`
        );
        return;
      }

      // Handle mention with command
      const cleanContent = message.content.replace(new RegExp(`<@!?${client.user.id}>`), '').trim();
      if (cleanContent) {
        const firstWord = cleanContent.split(/\s+/)[0];
        if (client.commandHandler.commands.has(firstWord) || client.commandHandler.aliases.has(firstWord)) {
          // Create a new message object with the cleaned content for command processing
          const modifiedMessage = { ...message, content: cleanContent };
          return client.commandHandler.handleMessage(modifiedMessage);
        }
      }

    } catch (error) {
      logger.error('MessageCreate', 'Error', error);
    }
  }
};