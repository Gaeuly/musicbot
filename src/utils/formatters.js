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
import ms from 'ms';

/**
 * Format duration in milliseconds to a readable string
 * @param {number} ms - Duration in milliseconds
 * @returns {string} - Formatted duration
 */
export function formatDuration(milliseconds) {
  if (!milliseconds || isNaN(milliseconds) || milliseconds < 0) return '00:00';

  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Create a progress bar
 * @param {number} current - Current position
 * @param {number} total - Total length
 * @param {number} size - Size of the bar (default: 15)
 * @returns {string} - Progress bar string
 */
export function createProgressBar(current, total, size = 15) {
  if (!current || !total || isNaN(current) || isNaN(total)) {
    return '▬'.repeat(size);
  }

  const percentage = Math.min(Math.max(current / total, 0), 1);
  const progress = Math.round(size * percentage);
  const emptyProgress = size - progress;

  const progressText = '▬'.repeat(progress);
  const emptyProgressText = '▬'.repeat(emptyProgress);
  const percentageText = Math.round(percentage * 100);

  return `${progressText}🔘${emptyProgressText} (${percentageText}%)`;
}

/**
 * Parse time string to milliseconds
 * @param {string} time - Time string (1h, 30m, 15s, etc.)
 * @returns {number} - Milliseconds
 */
export function parseTimeString(time) {
  if (!time) return 0;

  try {
    return ms(time);
  } catch (error) {
    return 0;
  }
}

/**
 * Format number with commas
 * @param {number} number - Number to format
 * @returns {string} - Formatted number
 */
export function formatNumber(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Truncate string with ellipsis
 * @param {string} string - String to truncate
 * @param {number} length - Max length
 * @returns {string} - Truncated string
 */
export function truncate(string = '', length = 100) {
  if (!string) return '';

  if (string.length <= length) return string;

  return string.substring(0, length - 3) + '...';
}

/**
 * Format array as a list with Oxford comma
 * @param {Array} array - Array to format
 * @returns {string} - Formatted list
 */
export function formatList(array) {
  if (!array || !array.length) return '';

  if (array.length === 1) return array[0];

  if (array.length === 2) return `${array[0]} and ${array[1]}`;

  return array.slice(0, -1).join(', ') + ', and ' + array.slice(-1);
}

/**
 * Convert string to title case
 * @param {string} string - String to convert
 * @returns {string} - Title cased string
 */
export function toTitleCase(string) {
  if (!string) return '';

  return string
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/* coded by bre4d */
