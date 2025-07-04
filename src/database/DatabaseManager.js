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
import { Guild } from './Guild.js';
import { User } from './User.js';
import { Player } from './Player.js';
import { Spotify } from './Spotify/Spotify.js';
import { Premium } from './Premium.js';
import { Management } from './Management.js'; // Added
import { logger } from '../utils/logger.js';
import playlistDB from './Playlist.js';
import { Theme } from './Theme.js';
import { Pong } from './pong.js'
/**
 * DatabaseManager class to handle all database operations
 */
export class DatabaseManager {
  /**
   * Create a new DatabaseManager instance
   */
  constructor() {
    this.initDatabases();
  }

  /**
   * Initialize all databases
   */
  initDatabases() {
    try {
      this.guild = new Guild();
      this.user = new User();
      this.player = new Player();
      this.spotify = new Spotify();
      this.playlist = playlistDB;
      this.theme = new Theme();
      this.premium = new Premium();
      this.pong= new Pong()
      this.management = new Management(); // Added: Initialize Management database

      logger.success('DatabaseManager', 'All databases initialized successfully');
    } catch (error) {
      logger.error('DatabaseManager', 'Failed to initialize databases', error);
      throw error;
    }
  }

  /**
   * Close all database connections
   */
  closeAll() {
    try {
      this.guild.close();
      this.user.close();
      this.player.close();
      if (this.theme && typeof this.theme.close === 'function') {
        this.theme.close();
      }
      if (this.premium && typeof this.premium.close === 'function') {
        this.premium.close();
      }
      if (this.management && typeof this.management.close === 'function') { // Added
        this.management.close();
      }
      // if (this.spotify && typeof this.spotify.close === 'function') this.spotify.close();
      // if (this.playlist && typeof this.playlist.close === 'function') this.playlist.close();

      logger.info('DatabaseManager', 'All database connections closed');
    } catch (error) {
      logger.error('DatabaseManager', 'Failed to close database connections', error);
    }
  }

  /**
   * Get a guild's prefix
   * @param {string} guildId - The guild ID
   * @returns {string} - The guild's prefix
   */
  getPrefix(guildId) {
    return this.guild.getPrefix(guildId);
  }

  /**
   * Set a guild's prefix
   * @param {string} guildId - The guild ID
   * @param {string} prefix - The new prefix
   */
  setPrefix(guildId, prefix) {
    return this.guild.setPrefix(guildId, prefix);
  }

  /**
   * Check if a guild has 24/7 mode enabled
   * @param {string} guildId - The guild ID
   * @returns {boolean} - Whether 24/7 is enabled
   */
  is247Enabled(guildId) {
    return this.guild.is247Enabled(guildId);
  }

  /**
   * Get 24/7 channel info for a guild
   * @param {string} guildId - The guild ID
   * @returns {object|null} - Channel info or null if 24/7 is disabled
   */
  get247Channels(guildId) {
    return this.guild.get247Channels(guildId);
  }

  /**
   * Set 24/7 mode for a guild
   * @param {string} guildId - The guild ID
   * @param {boolean} enabled - Whether to enable or disable
   * @param {string|null} voiceChannelId - Voice channel ID
   * @param {string|null} textChannelId - Text channel ID
   */
  set247Mode(guildId, enabled, voiceChannelId = null, textChannelId = null) {
    return this.guild.set247Mode(guildId, enabled, voiceChannelId, textChannelId);
  }

  /**
   * Get all guilds with 24/7 mode enabled
   * @returns {object[]} - All guilds with 24/7 mode
   */
  getAll247Guilds() {
    return this.guild.getAll247Guilds();
  }

  /**
   * Save player state
   * @param {string} guildId - The guild ID
   * @param {object} data - Player data
   */
  savePlayerState(guildId, data) {
    return this.player.createPlayer({
      guildId,
      ...data
    });
  }

  /**
   * Get player state
   * @param {string} guildId - The guild ID
   * @returns {object|null} - Parsed player data or null if not found
   */
  getPlayerState(guildId) {
    const playerData = this.player.getPlayer(guildId);
    return this.player.parsePlayerData(playerData);
  }

  /**
   * Delete player state
   * @param {string} guildId - The guild ID
   */
  deletePlayerState(guildId) {
    return this.player.deletePlayer(guildId);
  }

  /**
   * Get all saved player states
   * @returns {object[]} - All parsed player states
   */
  getAllPlayerStates() {
    const players = this.player.getAllPlayers();
    return players.map(player => this.player.parsePlayerData(player)).filter(Boolean);
  }

  /**
   * Update player queue
   * @param {string} guildId - The guild ID
   * @param {Array} queue - The new queue
   */
  updatePlayerQueue(guildId, queue) {
    return this.player.updateQueue(guildId, queue);
  }

  /**
   * Update player current track
   * @param {string} guildId - The guild ID
   * @param {object|null} track - The current track or null if none
   */
  updatePlayerCurrentTrack(guildId, track) {
    return this.player.updateCurrentTrack(guildId, track);
  }

  /**
   * Add track to history
   * @param {string} guildId - The guild ID
   * @param {object} trackData - Track data
   */
  addTrackToHistory(guildId, trackData) {
    return this.player.addTrackToHistory(guildId, trackData);
  }

  /**
   * Get track history for a guild
   * @param {string} guildId - The guild ID
   * @param {number} limit - Max tracks to retrieve
   * @returns {Array} - Track history
   */
  getTrackHistory(guildId, limit = 20) {
    return this.player.getTrackHistory(guildId, limit);
  }

  /**
   * Check if a user has no prefix mode enabled
   * @param {string} userId - The user ID
   * @returns {boolean} - Whether no prefix is enabled
   */
  hasNoPrefix(userId) {
    return this.user.hasNoPrefix(userId);
  }

  /**
   * Set no prefix mode for a user
   * @param {string} userId - The user ID
   * @param {boolean} enabled - Whether to enable or disable
   * @param {number|null} expiryTimestamp - Optional expiry timestamp in ms
   */
  setNoPrefix(userId, enabled, expiryTimestamp = null) {
    return this.user.setNoPrefix(userId, enabled, expiryTimestamp);
  }

  /**
   * Blacklist a user
   * @param {string} userId - The user ID
   * @param {string} reason - Reason for blacklisting
   */
  blacklistUser(userId, reason = 'No reason provided') {
    return this.user.blacklistUser(userId, reason);
  }

  /**
   * Remove user from blacklist
   * @param {string} userId - The user ID
   */
  unblacklistUser(userId) {
    return this.user.unblacklistUser(userId);
  }

  /**
   * Check if a user is blacklisted
   * @param {string} userId - The user ID
   * @returns {object|false} - Blacklist data or false if not blacklisted
   */
  isUserBlacklisted(userId) {
    return this.user.isBlacklisted(userId);
  }

  /**
   * Blacklist a guild
   * @param {string} guildId - The guild ID
   * @param {string} reason - Reason for blacklisting
   */
  blacklistGuild(guildId, reason = 'No reason provided') {
    return this.guild.blacklistGuild(guildId, reason);
  }

  /**
   * Remove guild from blacklist
   * @param {string} guildId - The guild ID
   */
  unblacklistGuild(guildId) {
    return this.guild.unblacklistGuild(guildId);
  }

  /**
   * Check if a guild is blacklisted
   * @param {string} guildId - The guild ID
   * @returns {object|false} - Blacklist data or false if not blacklisted
   */
  isGuildBlacklisted(guildId) {
    return this.guild.isBlacklisted(guildId);
  }

  /**
   * Get all blacklisted guilds
   * @returns {object[]} - All blacklisted guilds
   */
  getAllBlacklistedGuilds() {
    return this.guild.getAllBlacklistedGuilds();
  }

  /**
   * Get user data by ID
   * @param {string} userId - The user ID
   * @returns {object|null} - User data
   */
  getUserData(userId) {
    return this.user.ensureUser(userId);
  }

  // --- Theme specific methods ---
  /**
   * Get the current theme for a guild
   * @param {string} guildId - The guild ID
   * @returns {string} - The theme name
   */
  getGuildTheme(guildId) {
    return this.theme.getTheme(guildId);
  }

  /**
   * Set the theme for a guild
   * @param {string} guildId - The guild ID
   * @param {string} themeName - The name of the theme (e.g., 'default', 'pixel')
   */
  setGuildTheme(guildId, themeName) {
    return this.theme.setTheme(guildId, themeName);
  }

  // --- Premium specific methods ---
  /**
   * Grant user premium
   * @param {string} userId - The user ID
   * @param {string} grantedBy - Who granted the premium
   * @param {number|null} expiresAt - Expiry timestamp (null for permanent)
   * @param {string} reason - Reason for granting
   */
  grantUserPremium(userId, grantedBy, expiresAt = null, reason = 'Premium granted') {
    return this.premium.grantUserPremium(userId, grantedBy, expiresAt, reason);
  }

  /**
   * Grant guild premium
   * @param {string} guildId - The guild ID
   * @param {string} grantedBy - Who granted the premium
   * @param {number|null} expiresAt - Expiry timestamp (null for permanent)
   * @param {string} reason - Reason for granting
   */
  grantGuildPremium(guildId, grantedBy, expiresAt = null, reason = 'Premium granted') {
    return this.premium.grantGuildPremium(guildId, grantedBy, expiresAt, reason);
  }

  /**
   * Revoke user premium
   * @param {string} userId - The user ID
   */
  revokeUserPremium(userId) {
    return this.premium.revokeUserPremium(userId);
  }

  /**
   * Revoke guild premium
   * @param {string} guildId - The guild ID
   */
  revokeGuildPremium(guildId) {
    return this.premium.revokeGuildPremium(guildId);
  }

  /**
   * Check if user has premium
   * @param {string} userId - The user ID
   * @returns {object|false} - Premium data or false if not premium
   */
  isUserPremium(userId) {
    return this.premium.isUserPremium(userId);
  }

  /**
   * Check if guild has premium
   * @param {string} guildId - The guild ID
   * @returns {object|false} - Premium data or false if not premium
   */
  isGuildPremium(guildId) {
    return this.premium.isGuildPremium(guildId);
  }

  /**
   * Check if user or guild has any premium
   * @param {string} userId - The user ID
   * @param {string} guildId - The guild ID
   * @returns {object|false} - Premium data or false if no premium
   */
  hasAnyPremium(userId, guildId) {
    return this.premium.hasAnyPremium(userId, guildId);
  }

  /**
   * Get premium statistics
   * @returns {object} - Premium statistics
   */
  getPremiumStats() {
    return this.premium.getStats();
  }

  /**
   * Clean up expired premiums
   * @returns {object} - Cleanup results
   */
  cleanupExpiredPremiums() {
    return this.premium.cleanupExpired();
  }

  /**
   * Extend premium subscription
   * @param {string} type - 'user' or 'guild'
   * @param {string} id - User ID or Guild ID
   * @param {number} additionalTime - Additional time in milliseconds
   * @returns {object|false} - Updated premium data or false if not found
   */
  extendPremium(type, id, additionalTime) {
    return this.premium.extendPremium(type, id, additionalTime);
  }

  /**
   * Get all user premiums
   * @returns {object[]} - All active user premiums
   */
  getAllUserPremiums() {
    return this.premium.getAllUserPremiums();
  }

  /**
   * Get all guild premiums
   * @returns {object[]} - All active guild premiums
   */
  getAllGuildPremiums() {
    return this.premium.getAllGuildPremiums();
  }

  // --- Management specific methods ---
  /**
   * Add a user as manager
   * @param {string} userId - The user ID to add as manager
   * @param {string} addedBy - Who added them as manager
   * @param {string} reason - Reason for adding as manager
   */
  addManager(userId, addedBy, reason = 'No reason provided') {
    return this.management.addManager(userId, addedBy, reason);
  }

  /**
   * Remove a user from managers
   * @param {string} userId - The user ID to remove from managers
   */
  removeManager(userId) {
    return this.management.removeManager(userId);
  }

  /**
   * Check if user is a manager
   * @param {string} userId - The user ID
   * @returns {object|false} - Manager data or false if not manager
   */
  isManager(userId) {
    return this.management.isManager(userId);
  }

  /**
   * Get all active managers
   * @returns {object[]} - All active managers
   */
  getAllManagers() {
    return this.management.getAllManagers();
  }

  /**
   * Get manager statistics
   * @returns {object} - Manager statistics
   */
  getManagerStats() {
    return this.management.getStats();
  }

  /**
   * Check if a manager exists (active or inactive)
   * @param {string} userId - The user ID
   * @returns {boolean} - Whether the user exists in managers table
   */
  managerExists(userId) {
    return this.management.managerExists(userId);
  }
}

// Initialize the database manager as a singleton
export const db = new DatabaseManager();