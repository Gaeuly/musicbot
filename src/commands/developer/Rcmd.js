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

class ReloadCommand extends Command {
  constructor() {
    super({
      name: 'reloadC',
      description: 'Reloads bot commands.',
      usage: 'reload [command]',
      aliases: ['rc'],
      category: 'owner',
      ownerOnly: true
    });
  }

  async execute({ message, args, client }) {
    const embed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setTimestamp();

    // If no arguments, reload all commands
    if (!args.length) {
      message.channel.send('🔄 Reloading all commands, please wait...');
      
      const result = await client.commandHandler.reloadCommands();
      
      embed
        .setTitle('Commands Reloaded')
        .setDescription(`✅ Successfully reloaded **${result.success}/${result.total}** commands.`);
      
      // If there were failures, add details
      if (result.failed > 0) {
        embed.addFields({
          name: '❌ Failed Commands',
          value: result.details
            .filter(cmd => !cmd.success)
            .map(cmd => `\`${cmd.name}\``)
            .join(', ') || 'None'
        });
      }
      
      return message.channel.send({ embeds: [embed] });
    }
    
    // Reload specific command
    const commandName = args[0].toLowerCase();
    const result = await client.commandHandler.reloadCommand(commandName);
    
    if (result.success) {
      embed
        .setTitle('Command Reloaded')
        .setDescription(`✅ Successfully reloaded command: \`${commandName}\``);
    } else {
      embed
        .setTitle('Reload Failed')
        .setDescription(`❌ Failed to reload command: \`${commandName}\``)
        .setColor('#e74c3c')
        .addFields({ name: 'Error', value: result.message });
    }
    
    return message.channel.send({ embeds: [embed] });
  }
}

export default new ReloadCommand();
