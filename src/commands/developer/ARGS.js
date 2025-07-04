/**
 * Muffin STUDIO - Bre4d777 & prayag 
 * https://discord.gg/TRPqseUq32
 * give credits or ill touch you in your dreams
 */

import { Command } from '../../structures/Command.js';
import { ArgumentType } from '../../structures/ArgumentTypes.js';
import { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } from 'discord.js';

class ArgShowcaseCommand extends Command {
  constructor() {
    super({
      name: 'arg-showcase',
      description: 'Demonstrates the new message command argument parser.',
      category: 'utility',
      aliases: ['args'],
      usage: 'arg-showcase <required_text> <required_user> <required_number> [optional_boolean] [optional_role] [optional_channel]',
      messageArgs: [
        { name: 'required_text', type: ArgumentType.STRING, description: 'Some required text.', required: true },
        { name: 'required_user', type: ArgumentType.USER, description: 'A required user mention or ID.', required: true },
        { name: 'required_number', type: ArgumentType.NUMBER, description: 'Any required number.', required: true },
        { name: 'optional_boolean', type: ArgumentType.BOOLEAN, description: 'An optional boolean (true/false, yes/no, 1/0).', required: false },
        { name: 'optional_role', type: ArgumentType.ROLE, description: 'An optional role mention or ID.', required: false },
        { name: 'optional_channel', type: ArgumentType.CHANNEL, description: 'An optional channel mention or ID.', required: false },
        { name: 'optional_integer', type: ArgumentType.INTEGER, description: 'An optional whole number.', required: false },
      ],
      examples: [
        'args "hello world" @user 123.45 true',
        'args "another example" 123456789012345678 99 #general 5'
      ],
    });
  }

  async execute({ message, options }) {
    const container = new ContainerBuilder()
      .setAccentColor(0x57F287);

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent('# ✨ Argument Parser '));
    container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));

    const requiredText = options.getString('required_text');
    const requiredUser = options.getUser('required_user');
    const requiredNumber = options.getNumber('required_number');

    const optionalBoolean = options.getBoolean('optional_boolean');
    const optionalRole = options.getRole('optional_role');
    const optionalChannel = options.getChannel('optional_channel');
    const optionalInteger = options.getInteger('optional_integer');

    let requiredSection = `## ✅ Required Arguments\n`;
    requiredSection += `**Text:** ${requiredText}\n`;
    requiredSection += `**User:** ${requiredUser} (\`${requiredUser.tag}\`)\n`;
    requiredSection += `**Number:** \`${requiredNumber}\``;
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(requiredSection));
    
    container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large));

    let optionalSection = `## 📝 Optional Arguments\n`;
    optionalSection += `**Boolean:** ${optionalBoolean === null ? '*Not Provided*' : `\`${optionalBoolean}\``}\n`;
    optionalSection += `**Role:** ${optionalRole || '*Not Provided*'}\n`;
    optionalSection += `**Channel:** ${optionalChannel || '*Not Provided*'}\n`;
    optionalSection += `**Integer:** ${optionalInteger === null ? '*Not Provided*' : `\`${optionalInteger}\``}`;
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(optionalSection));
    
    container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`*This new system is sexy*`));

    await message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  }
}

export default new ArgShowcaseCommand();