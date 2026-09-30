/**
 * ═══════════════════════════════════════════════════════════════
 * 🛠️ HELPER UTILITIES
 * ═══════════════════════════════════════════════════════════════
 */

import { ChannelType } from "discord.js";
import config from "../config.js";

/**
 * Permission Checker
 */
export function hasPermission(member, permissionType) {
  if (!member) return false;

  switch (permissionType) {
    case "admin":
      return member.permissions.has("Administrator");
    case "moderator":
      return member.permissions.has("ManageGuild");
    case "operator":
      return member.roles.cache.some(
        (r) => r.name === config.roles.operator
      );
    default:
      return false;
  }
}

/**
 * Check if user is in voice channel
 */
export function isUserInVoiceChannel(member) {
  return (
    member.voice.channel !== null &&
    member.voice.channel.type === ChannelType.GuildVoice
  );
}

/**
 * Get user's voice channel
 */
export function getUserVoiceChannel(member) {
  if (isUserInVoiceChannel(member)) {
    return member.voice.channel;
  }
  return null;
}

/**
 * Format Discord tag for user
 */
export function formatUserTag(user) {
  return `${user.username}#${user.discriminator}`;
}

/**
 * Format user mention
 */
export function formatUserMention(userId) {
  return `<@${userId}>`;
}

/**
 * Format role mention
 */
export function formatRoleMention(roleId) {
  return `<@&${roleId}>`;
}

/**
 * Format channel mention
 */
export function formatChannelMention(channelId) {
  return `<#${channelId}>`;
}

/**
 * Check if role exists in guild
 */
export async function roleExists(guild, roleName) {
  return guild.roles.cache.some((r) => r.name === roleName);
}

/**
 * Get role by name
 */
export async function getRoleByName(guild, roleName) {
  return guild.roles.cache.find((r) => r.name === roleName);
}

/**
 * Check if channel exists
 */
export function channelExists(guild, channelName) {
  return guild.channels.cache.some((c) => c.name === channelName);
}

/**
 * Get channel by name
 */
export function getChannelByName(guild, channelName) {
  return guild.channels.cache.find((c) => c.name === channelName);
}

/**
 * Add role to user
 */
export async function addRoleToUser(member, roleName) {
  const role = await getRoleByName(member.guild, roleName);
  if (role) {
    await member.roles.add(role);
    return true;
  }
  return false;
}

/**
 * Remove role from user
 */
export async function removeRoleFromUser(member, roleName) {
  const role = await getRoleByName(member.guild, roleName);
  if (role) {
    await member.roles.remove(role);
    return true;
  }
  return false;
}

/**
 * Send DM to user
 */
export async function sendDMToUser(user, content) {
  try {
    const dmChannel = await user.createDM();
    return await dmChannel.send(content);
  } catch (error) {
    console.error(`Couldn't send DM to ${user.tag}:`, error);
    return null;
  }
}

/**
 * Get guild settings
 */
export function getGuildSettings(db, guildId) {
  return db.get(`guild_settings_${guildId}`) || {
    guildId,
    prefix: config.commands.prefix,
    mesaiChannelId: null,
    logsChannelId: null,
    excusesChannelId: null,
    exemptRoles: [],
    createdAt: Date.now(),
  };
}

/**
 * Update guild settings
 */
export function updateGuildSettings(db, guildId, settings) {
  db.set(`guild_settings_${guildId}`, {
    ...getGuildSettings(db, guildId),
    ...settings,
  });
}

/**
 * Check if user has admin role or is bot owner
 */
export function isAdmin(member, ownerId) {
  return (
    member.id === ownerId ||
    member.permissions.has("Administrator")
  );
}

/**
 * Check if target is higher role
 */
export function isHigherRole(member, targetMember) {
  return (
    member.roles.highest.position >
    targetMember.roles.highest.position
  );
}

/**
 * Parse milliseconds to object
 */
export function parseMs(ms) {
  return {
    days: Math.floor(ms / 86400000),
    hours: Math.floor((ms % 86400000) / 3600000),
    minutes: Math.floor(((ms % 86400000) % 3600000) / 60000),
    seconds: Math.floor(
      (((ms % 86400000) % 3600000) % 60000) / 1000
    ),
  };
}

/**
 * Validate Discord ID format
 */
export function isValidDiscordId(id) {
  return /^\d{17,19}$/.test(id);
}

/**
 * Truncate string to length
 */
export function truncate(str, length = 2000) {
  if (str.length > length) {
    return str.substring(0, length - 3) + "...";
  }
  return str;
}

/**
 * Escape Discord markdown
 */
export function escapeMarkdown(text) {
  const escapeMap = {
    "*": "\\*",
    "_": "\\_",
    "`": "\\`",
    "[": "\\[",
    "]": "\\]",
    "(": "\\(",
    ")": "\\)",
    "~": "\\~",
    "|": "\\|",
    ">": "\\>",
    "#": "\\#",
  };

  return text.replace(/[*_`[\]()~|>#]/g, (char) => escapeMap[char]);
}

/**
 * Convert seconds to time string
 */
export function secondsToTimeString(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hours}s ${minutes}d ${secs}sn`;
}

/**
 * Get random element from array
 */
export function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Sleep function (async delay)
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if user has a specific role
 */
export function hasRole(member, roleName) {
  return member.roles.cache.some((r) => r.name === roleName);
}

/**
 * Get all members with role
 */
export async function getMembersWithRole(guild, roleName) {
  const role = guild.roles.cache.find((r) => r.name === roleName);
  if (!role) return [];

  return (await guild.members.fetch()).filter((m) =>
    m.roles.cache.has(role.id)
  );
}

export default {
  hasPermission,
  isUserInVoiceChannel,
  getUserVoiceChannel,
  formatUserTag,
  formatUserMention,
  formatRoleMention,
  formatChannelMention,
  roleExists,
  getRoleByName,
  channelExists,
  getChannelByName,
  addRoleToUser,
  removeRoleFromUser,
  sendDMToUser,
  getGuildSettings,
  updateGuildSettings,
  isAdmin,
  isHigherRole,
  parseMs,
  isValidDiscordId,
  truncate,
  escapeMarkdown,
  secondsToTimeString,
  getRandomElement,
  sleep,
  hasRole,
  getMembersWithRole,
};
