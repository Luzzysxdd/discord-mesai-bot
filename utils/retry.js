/**
 * ═══════════════════════════════════════════════════════════════
 * 🔄 RETRY UTILITIES - Hata Toleransı ve Yeniden Deneme
 * ═══════════════════════════════════════════════════════════════
 * Discord API bağlantı sorunları için retry mekanizması
 */

import logger from "./logger.js";

/**
 * Bir fonksiyonu belirli sayıda ve gecikmeyle yeniden dener
 * @param {Function} fn - Yürütülecek fonksiyon
 * @param {Object} options - Retry seçenekleri
 * @param {number} options.maxRetries - Maksimum deneme sayısı (default: 3)
 * @param {number} options.delay - İlk gecikme süresi ms (default: 1000)
 * @param {number} options.backoff - Çarpan (default: 2)
 * @param {Function} options.shouldRetry - Hata kontrol fonksiyonu
 * @returns {Promise} - Fonksiyon sonucu
 */
export async function withRetry(fn, options = {}) {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = 2,
    shouldRetry = (error) => isNetworkError(error),
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Son deneme miydi?
      if (attempt === maxRetries) {
        logger.error(`❌ Tüm ${maxRetries} deneme başarısız: ${error.message}`);
        throw error;
      }

      // Retry yapılmalı mı?
      if (!shouldRetry(error)) {
        logger.debug(`⚠️ Retry yapılmayacak hata: ${error.message}`);
        throw error;
      }

      // Gecikme hesapla (exponential backoff)
      const waitTime = delay * Math.pow(backoff, attempt);
      
      logger.warn(`⚠️ Deneme ${attempt + 1}/${maxRetries + 1} başarısız: ${error.message}`);
      logger.info(`🔄 ${waitTime}ms sonra yeniden deneniyor...`);
      
      await sleep(waitTime);
    }
  }

  throw lastError;
}

/**
 * Ağ/DNS hatası mı kontrol et
 * @param {Error} error - Hata objesi
 * @returns {boolean} - Ağ hatası mı?
 */
export function isNetworkError(error) {
  if (!error) return false;

  const networkErrorPatterns = [
    "ConnectTimeoutError",
    "ECONNREFUSED",
    "ECONNRESET",
    "ETIMEDOUT",
    "ENOTFOUND",
    "getaddrinfo",
    "socket hang up",
    "connection reset",
    "timeout",
    "UND_ERR_CONNECT_TIMEOUT",
    "AbortError",
  ];

  const errorMessage = error.message?.toLowerCase() || "";
  const errorName = error.name || "";
  const errorCode = error.code || "";

  return networkErrorPatterns.some((pattern) => 
    errorMessage.includes(pattern.toLowerCase()) ||
    errorName.includes(pattern) ||
    errorCode.includes(pattern)
  );
}

/**
 * Discord.js specific retry wrapper
 * @param {Function} operation - Discord API işlemi
 * @param {string} operationName - İşlem adı (logging için)
 * @returns {Promise}
 */
export async function discordRetry(operation, operationName = "Discord operation") {
  return withRetry(operation, {
    maxRetries: 3,
    delay: 2000, // Discord API için daha uzun bekle
    backoff: 2,
    shouldRetry: (error) => isNetworkError(error) || isDiscordRateLimit(error),
  }).catch((error) => {
    logger.error(`❌ ${operationName} başarısız: ${error.message}`);
    throw error;
  });
}

/**
 * Rate limit hatası mı?
 * @param {Error} error 
 * @returns {boolean}
 */
function isDiscordRateLimit(error) {
  return error.code === 429 || 
         error.message?.includes("rate limit") ||
         error.message?.includes("too many requests");
}

/**
 * Kanal oluşturma işlemi (retry'li)
 * @param {Guild} guild - Discord sunucusu
 * @param {Object} channelData - Kanal verisi
 * @returns {Promise<Channel>}
 */
export async function createChannelWithRetry(guild, channelData) {
  return discordRetry(
    () => guild.channels.create(channelData),
    `Kanal oluşturma: ${channelData.name}`
  );
}

/**
 * Rol oluşturma işlemi (retry'li)
 * @param {Guild} guild - Discord sunucusu
 * @param {Object} roleData - Rol verisi
 * @returns {Promise<Role>}
 */
export async function createRoleWithRetry(guild, roleData) {
  return discordRetry(
    () => guild.roles.create(roleData),
    `Rol oluşturma: ${roleData.name}`
  );
}

/**
 * Mesaj gönderme işlemi (retry'li)
 * @param {TextChannel} channel - Kanal
 * @param {Object} messageData - Mesaj verisi
 * @returns {Promise<Message>}
 */
export async function sendMessageWithRetry(channel, messageData) {
  return discordRetry(
    () => channel.send(messageData),
    `Mesaj gönderme: #${channel.name}`
  );
}

/**
 * Sleep fonksiyonu
 * @param {number} ms - Milisaniye
 * @returns {Promise}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Promise timeout wrapper
 * @param {Promise} promise - Promise
 * @param {number} timeoutMs - Timeout süresi
 * @param {string} errorMessage - Hata mesajı
 * @returns {Promise}
 */
export async function withTimeout(promise, timeoutMs = 10000, errorMessage = "İşlem zaman aşımına uğradı") {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}

export default {
  withRetry,
  isNetworkError,
  discordRetry,
  createChannelWithRetry,
  createRoleWithRetry,
  sendMessageWithRetry,
  withTimeout,
};
