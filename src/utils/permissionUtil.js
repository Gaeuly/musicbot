/**
 * Muffin STUDIO - Bre4d777 & prayag 
 * https://discord.gg/TRPqseUq32
 * give credits or ill touch you in your dreams
 */

import { PermissionFlagsBits } from 'discord.js';
import { config } from '../config/config.js';
import { db } from '../database/DatabaseManager.js';

const ownerSet = new Set(config.ownerIds || []);
const permissionNames = new Map();

for (const [name, value] of Object.entries(PermissionFlagsBits)) {
  permissionNames.set(value, name.split('_').map(word => 
    word.charAt(0) + word.slice(1).toLowerCase()
  ).join(' '));
}

export function isOwner(userId) {
  return ownerSet.has(userId);
}

export function isManager(userId) {
  return !!db.isManager(userId);
}

export function canUseCommand(member, command) {
  if (command.ownerOnly && !isOwner(member.id)) return false;
  if (command.management && !isManager(member.id) && !isOwner(member.id)) return false;

  if (command.permissions?.length > 0) {
    if (isOwner(member.id)) return true;
    return command.permissions.every(perm => member.permissions.has(perm));
  }

  return true;
}

export function getMissingBotPermissions(channel, permissions) {
  const botPerms = channel.guild.members.me.permissionsIn(channel);
  return permissions
    .filter(perm => !botPerms.has(perm))
    .map(perm => permissionNames.get(perm) || 'Unknown Permission');
}

export function inSameVoiceChannel(member, bot) {
  return member.voice.channel && bot.voice.channel && 
         member.voice.channelId === bot.voice.channelId;
}

export function isUserPremium(userId) {
  return db.isUserPremium(userId);
}

export function isGuildPremium(guildId) {
  return db.isGuildPremium(guildId);
}

export function hasAnyPremium(userId, guildId) {
  return db.hasAnyPremium(userId, guildId);
}

export function hasPremiumAccess(userId, guildId, type = 'any') {
  if (isOwner(userId)) return true;
  
  switch (type) {
    case 'user': return !!isUserPremium(userId);
    case 'guild': return !!isGuildPremium(guildId);
    case 'any':
    default: return !!hasAnyPremium(userId, guildId);
  }
}

export function getPremiumStatus(userId, guildId) {
  const userPremium = isUserPremium(userId);
  const guildPremium = isGuildPremium(guildId);
  
  return {
    hasUserPremium: !!userPremium,
    hasGuildPremium: !!guildPremium,
    hasAnyPremium: !!(userPremium || guildPremium),
    userPremium: userPremium || null,
    guildPremium: guildPremium || null,
    activePremium: userPremium || guildPremium || null
  };
}

export function formatPremiumExpiry(expiresAt) {
  if (!expiresAt) return 'Never (Permanent)';
  
  const timeLeft = expiresAt - Date.now();
  if (timeLeft <= 0) return 'Expired';
  
  const days = Math.floor(timeLeft / 86400000);
  if (days > 0) return `${days} day${days !== 1 ? 's' : ''}`;
  
  const hours = Math.floor(timeLeft / 3600000);
  if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''}`;
  
  const minutes = Math.floor(timeLeft / 60000);
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}