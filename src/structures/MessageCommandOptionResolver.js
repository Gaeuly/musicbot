/**
 * Muffin STUDIO - Bre4d777 & prayag 
 * https://discord.gg/TRPqseUq32
 * give credits or ill touch you in your dreams
 */

import { ArgumentType } from './ArgumentTypes.js';

export class MessageCommandOptionResolver {
  constructor(client, message, commandArgs, rawArgs) {
    this.client = client;
    this.message = message;
    this._options = new Map();
    this._parse(commandArgs, rawArgs);
  }

  async _parse(commandArgs, rawArgs) {
    for (let i = 0; i < commandArgs.length; i++) {
      const argDef = commandArgs[i];
      let value = rawArgs[i];

      if (argDef.required && !value) {
        throw new Error(`**Missing Required Argument: \`${argDef.name}\`**\n**Type:** \`${argDef.type}\`\n**Description:** *${argDef.description}*`);
      }

      if (argDef.type === ArgumentType.STRING && i === commandArgs.length - 1) {
        value = rawArgs.slice(i).join(' ');
      }
      
      if (value) {
          const resolvedValue = await this._resolveValue(value, argDef.type);
          if (argDef.required && resolvedValue === null) {
              throw new Error(`**Invalid Value for Argument: \`${argDef.name}\`**\n**Expected Type:** \`${argDef.type}\`\n**Description:** *${argDef.description}*`);
          }
          this._options.set(argDef.name, { value: resolvedValue, type: argDef.type });
      } else {
          this._options.set(argDef.name, { value: null, type: argDef.type });
      }
    }
  }

  async _resolveValue(value, type) {
    if (value === null || value === undefined) return null;

    switch (type) {
      case ArgumentType.STRING:
        return String(value);

      case ArgumentType.NUMBER:
        const num = parseFloat(value);
        return isNaN(num) ? null : num;

      case ArgumentType.INTEGER:
        const int = parseInt(value, 10);
        return isNaN(int) ? null : int;

      case ArgumentType.BOOLEAN:
        const lowerValue = value.toLowerCase();
        if (['true', '1', 'yes', 'on', 'enable'].includes(lowerValue)) return true;
        if (['false', '0', 'no', 'off', 'disable'].includes(lowerValue)) return false;
        return null;

      case ArgumentType.USER:
        const userMatch = value.match(/^(?:<@!?)?(\d{17,19})>$/);
        const userId = userMatch ? userMatch[1] : value;
        try {
          return await this.client.users.fetch(userId);
        } catch {
          return null;
        }

      case ArgumentType.CHANNEL:
        const channelMatch = value.match(/^(?:<#)?(\d{17,19})>$/);
        const channelId = channelMatch ? channelMatch[1] : value;
        return this.message.guild.channels.cache.get(channelId) || null;

      case ArgumentType.ROLE:
        const roleMatch = value.match(/^(?:<@&)?(\d{17,19})>$/);
        const roleId = roleMatch ? roleMatch[1] : value;
        return this.message.guild.roles.cache.get(roleId) || null;

      default:
        return value;
    }
  }

  get(name, required = false) {
    const option = this._options.get(name);
    if (required && (option === undefined || option.value === null)) {
        throw new Error(`Missing or invalid required option: ${name}`);
    }
    return option ? option.value : null;
  }

  getString(name, required = false) {
    const option = this._options.get(name);
    if (required && (option === undefined || option.value === null)) throw new Error(`Missing required string option: ${name}`);
    return option && option.type === ArgumentType.STRING ? option.value : null;
  }

  getNumber(name, required = false) {
    const option = this._options.get(name);
    if (required && (option === undefined || option.value === null)) throw new Error(`Missing required number option: ${name}`);
    return option && option.type === ArgumentType.NUMBER ? option.value : null;
  }

  getInteger(name, required = false) {
    const option = this._options.get(name);
    if (required && (option === undefined || option.value === null)) throw new Error(`Missing required integer option: ${name}`);
    return option && option.type === ArgumentType.INTEGER ? option.value : null;
  }
  
  getBoolean(name, required = false) {
    const option = this._options.get(name);
    if (required && (option === undefined || option.value === null)) throw new Error(`Missing required boolean option: ${name}`);
    return option && option.type === ArgumentType.BOOLEAN ? option.value : null;
  }

  getUser(name, required = false) {
    const option = this._options.get(name);
    if (required && (option === undefined || option.value === null)) throw new Error(`Missing required user option: ${name}`);
    return option && option.type === ArgumentType.USER ? option.value : null;
  }

  getChannel(name, required = false) {
    const option = this._options.get(name);
    if (required && (option === undefined || option.value === null)) throw new Error(`Missing required channel option: ${name}`);
    return option && option.type === ArgumentType.CHANNEL ? option.value : null;
  }

  getRole(name, required = false) {
    const option = this._options.get(name);
    if (required && (option === undefined || option.value === null)) throw new Error(`Missing required role option: ${name}`);
    return option && option.type === ArgumentType.ROLE ? option.value : null;
  }
}