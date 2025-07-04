/**
 * Muffin STUDIO - Bre4d777 & prayag 
 * https://discord.gg/TRPqseUq32
 * give credits or ill touch you in your dreams
 */

import { config } from '../config/config.js';

export class CooldownManager {
  constructor() {
    this.cooldowns = new Map();
    this.usageCount = new Map();
    this.defaultCooldown = 3;
    this.maxUsageIncrement = 500;
    this.incrementRate =2.5 ;
    this.decayInterval = 60000; // 2 minutes
  }

  checkCooldown(userId, command) {
    const commandName = command.name;
    const baseCooldown = command.cooldown || this.defaultCooldown;
    const usageKey = `${userId}:${commandName}`;
    const usage = this.usageCount.get(usageKey) || 0;
    
    const adjustedCooldown = Math.min(
      baseCooldown + (usage * this.incrementRate),
      baseCooldown * 3
    );
    
    const cooldownMs = adjustedCooldown * 1000;
    const cooldownKey = `${commandName}:${userId}`;
    const lastUsed = this.cooldowns.get(cooldownKey);
    
    if (lastUsed) {
      const timeLeft = (lastUsed + cooldownMs) - Date.now();
      if (timeLeft > 0) {
        return (timeLeft / 1000).toFixed(1);
      }
    }

    return null;
  }

  setCooldown(userId, command) {
    const commandName = command.name;
    const cooldownKey = `${commandName}:${userId}`;
    const usageKey = `${userId}:${commandName}`;
    
    this.cooldowns.set(cooldownKey, Date.now());
    
    const currentUsage = this.usageCount.get(usageKey) || 0;
    if (currentUsage < this.maxUsageIncrement) {
      this.usageCount.set(usageKey, currentUsage + 1);
      
      setTimeout(() => {
        const usage = this.usageCount.get(usageKey);
        if (usage && usage > 0) {
          this.usageCount.set(usageKey, usage - 1);
        }
      }, this.decayInterval);
    }
  }

  resetCooldown(userId, commandName) {
    const cooldownKey = `${commandName}:${userId}`;
    const usageKey = `${userId}:${commandName}`;
    this.cooldowns.delete(cooldownKey);
    this.usageCount.delete(usageKey);
  }

  resetAll() {
    this.cooldowns.clear();
    this.usageCount.clear();
  }

  getUserStats(userId, command) {
    const usageKey = `${userId}:${command.name}`;
    const usage = this.usageCount.get(usageKey) || 0;
    const baseCooldown = command.cooldown || this.defaultCooldown;
    const currentCooldown = Math.min(
      baseCooldown + (usage * this.incrementRate),
      baseCooldown * 3
    );
    
    return { baseCooldown, currentCooldown, usage };
  }
}

export const cooldownManager = new CooldownManager();