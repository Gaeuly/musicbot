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
import { logger } from '../utils/logger.js';
import { createProgressBar, formatDuration, truncate } from '../utils/formatters.js';

/**
 * QueueManager - Advanced queue handling functions
 */
export class QueueManager {
  /**
   * Create a new QueueManager instance
   * @param {object} player - Kazagumo player instance
   */
  constructor(player) {
    this.player = player;
    // Initialize a local queue if needed
    this._queue = [];

    // Ensure player is valid - additional safety check
    if (!player) {
      logger.warn('QueueManager', 'Initialized with undefined player');
    } else if (!player.queue) {
      logger.warn('QueueManager', 'Player has no queue property, using local queue');
    }
  }

  /**
   * Get the current queue
   * @returns {Array} - The current queue
   */
  get queue() {
    // Enhanced safety check
    if (!this.player) {
      logger.debug('QueueManager', 'Player undefined, using local queue');
      return this._queue;
    }

    // Check if player.queue exists and is an array
    if (!this.player.queue || !Array.isArray(this.player.queue)) {
      logger.debug('QueueManager', 'Player queue undefined or not an array, using local queue');
      return this._queue;
    }

    return this.player.queue;
  }

  /**
   * Get the current track
   * @returns {object|null} - The current track
   */
  get current() {
    // Enhanced safety check for player and queue
    if (!this.player) return null;
    if (!this.player.queue) return null;

    // Make sure we're accessing a valid property
    try {
      return this.player.queue.current || null;
    } catch (error) {
      logger.error('QueueManager', 'Error accessing current track', error);
      return null;
    }
  }

  /**
   * Get the queue size
   * @returns {number} - The queue size
   */
  get size() {
    // Enhanced safety check
    if (!this.player) return this._queue.length;
    if (!this.player.queue) return this._queue.length;

    // Check if player.queue.length is accessible
    try {
      return typeof this.player.queue.length === 'number' ? this.player.queue.length : 0;
    } catch (error) {
      logger.error('QueueManager', 'Error accessing queue length', error);
      return this._queue.length;
    }
  }

  /**
   * Get the queue duration
   * @returns {number} - The queue duration in milliseconds
   */
  get duration() {
    try {
      const queue = this.queue;
      return Array.isArray(queue)
        ? queue.reduce((acc, track) => acc + (track?.length || 0), 0)
        : 0;
    } catch (error) {
      logger.error('QueueManager', 'Error calculating queue duration', error);
      return 0;
    }
  }

  /**
   * Get the total duration (including current track)
   * @returns {number} - The total duration in milliseconds
   */
  get totalDuration() {
    const currentLength = this.current?.length || 0;
    return currentLength + this.duration;
  }

  /**
   * Check if the queue is empty
   * @returns {boolean} - Whether the queue is empty
   */
  get isEmpty() {
    return this.size === 0;
  }

  /**
   * Add tracks to the queue
   * @param {object|Array} tracks - Track or array of tracks to add
   * @returns {number} - The new queue size
   */
  add(tracks) {
    try {

      // If player or queue is missing, use local queue
      if (!this.player || !this.player.queue) {
        logger.error('QueueManager', 'Player or queue is undefined, using local queue');
        if (Array.isArray(tracks)) {
          this._queue.push(...tracks);
        } else {
          this._queue.push(tracks);
        }
        return this._queue.length;
      }

      // Determine the type of queue we're dealing with
      const isArrayQueue = Array.isArray(this.player.queue);
      const isObjectQueue = !isArrayQueue && typeof this.player.queue === 'object';

      logger.info('QueueManager', `Queue type: ${isArrayQueue ? 'Array' : isObjectQueue ? 'Object' : 'Unknown'}`);

      // Handle array-style queue (simple array of tracks)
      if (isArrayQueue) {
        if (Array.isArray(tracks)) {
          // Add multiple tracks
          for (const track of tracks) {
            if (track) {
              this.player.queue.push(track);
            
            }
          }
        } else if (tracks) {
          // Add a single track
          this.player.queue.push(tracks);
         
        }
        return this.player.queue.length;
      }

      // Handle object-style queue (Kazagumo-style with push method)
      if (isObjectQueue) {
        // Check if the queue has an add method (Kazagumo) or if we should use push
        const addMethod = typeof this.player.queue.add === 'function' ? 'add' :
                         typeof this.player.queue.push === 'function' ? 'push' : null;

        if (!addMethod) {
          logger.error('QueueManager', 'Queue has no add or push method, using local queue');
          if (Array.isArray(tracks)) {
            this._queue.push(...tracks);
          } else {
            this._queue.push(tracks);
          }
          return this._queue.length;
        }

        if (Array.isArray(tracks)) {
          // Add multiple tracks
          for (const track of tracks) {
            if (track) {
              if (addMethod === 'add') {
                this.player.queue.add(track);
              } else {
                this.player.queue.push(track);
              }
              
            }
          }
        } else if (tracks) {
          // Add a single track
          if (addMethod === 'add') {
            this.player.queue.add(tracks);
          } else {
            this.player.queue.push(tracks);
          }
         
        }

        // Get queue size based on queue type
        const queueSize = typeof this.player.queue.length === 'number' ?
                          this.player.queue.length :
                          (typeof this.player.queue.size === 'number' ? this.player.queue.size : 0);

       
        return queueSize;
      }

      // Fallback to local queue if queue type is unknown
      logger.error('QueueManager', 'Unknown queue type, using local queue');
      if (Array.isArray(tracks)) {
        this._queue.push(...tracks);
      } else {
        this._queue.push(tracks);
      }
      return this._queue.length;
    } catch (error) {
      logger.error('QueueManager', 'Failed to add tracks to queue', error);
      // Fallback to local queue in case of error
      if (Array.isArray(tracks)) {
        this._queue.push(...tracks);
      } else if (tracks) {
        this._queue.push(tracks);
      }
      return this._queue.length;
    }
  }

  /**
   * Remove tracks from the queue
   * @param {number} position - Position of the track to remove
   * @param {number} [amount=1] - Number of tracks to remove
   * @returns {object|Array|null} - The removed track(s) or null if invalid
   */
  remove(position, amount = 1) {
    try {
      const queue = this.queue;
      if (!Array.isArray(queue) || position < 0 || position >= queue.length) {
        return null;
      }

      if (amount === 1) {
        return queue.splice(position, 1)[0];
      }

      const tracks = [];
      for (let i = 0; i < amount; i++) {
        if (position < queue.length) {
          tracks.push(queue.splice(position, 1)[0]);
        }
      }

      return tracks;
    } catch (error) {
      logger.error('QueueManager', 'Failed to remove tracks from queue', error);
      return null;
    }
  }

  /**
   * Clear the queue
   * @returns {Array} - The cleared tracks
   */
  clear() {
    try {
      const queue = this.queue;
      if (!Array.isArray(queue)) {
        const cleared = [...this._queue];
        this._queue = [];
        return cleared;
      }
      const cleared = [...queue];
      queue.length = 0;
      return cleared;
    } catch (error) {
      logger.error('QueueManager', 'Failed to clear queue', error);
      return [];
    }
  }

  /**
   * Shuffle the queue
   * @returns {boolean} - Whether the queue was shuffled
   */
  shuffle() {
    try {
      const queue = this.queue;
      if (!Array.isArray(queue) || queue.length <= 1) return false;

      // Fisher-Yates shuffle
      for (let i = queue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [queue[i], queue[j]] = [queue[j], queue[i]];
      }
      return true;
    } catch (error) {
      logger.error('QueueManager', 'Failed to shuffle queue', error);
      return false;
    }
  }

  /**
   * Get a page of tracks from the queue
   * @param {number} page - The page number (1-based)
   * @param {number} pageSize - The page size
   * @returns {object} - The page info and tracks
   */
  getPage(page = 1, pageSize = 10) {
    try {
      const queue = this.queue;
      // Calculate the total number of pages
      const totalPages = Math.ceil(queue.length / pageSize) || 1;

      // Validate page number
      const validPage = Math.max(1, Math.min(page, totalPages));

      // Calculate the start and end indices
      const startIndex = (validPage - 1) * pageSize;
      const endIndex = Math.min(startIndex + pageSize, queue.length);

      // Get the tracks for this page
      const tracks = queue.slice(startIndex, endIndex);

      return {
        page: validPage,
        pageSize,
        totalPages,
        totalTracks: queue.length,
        startIndex,
        endIndex: endIndex - 1,
        tracks
      };
    } catch (error) {
      logger.error('QueueManager', 'Failed to get queue page', error);
      return {
        page: 1,
        pageSize,
        totalPages: 1,
        totalTracks: 0,
        startIndex: 0,
        endIndex: 0,
        tracks: []
      };
    }
  }

  /**
   * Get formatted queue for display
   * @param {number} page - The page number (1-based)
   * @param {number} pageSize - The page size
   * @returns {object} - The formatted queue
   */
  formatQueue(page = 1, pageSize = 10) {
    try {
      const pageInfo = this.getPage(page, pageSize);
      const { tracks, totalTracks, totalPages } = pageInfo;

      const formatted = tracks.map((track, index) => {
        const position = pageInfo.startIndex + index + 1;
        const duration = formatDuration(track.length);
        const title = truncate(track.title, 45);
        const author = truncate(track.author, 20);
        const requester = track.requester ? `<@${track.requester.id}>` : 'Unknown';

        return `**${position}.** [${title}](${track.uri}) by **${author}** (${duration}) • ${requester}`;
      }).join('\n');

      // Current track info
      let current = '';
      if (this.current) {
        const progress = this.player?.position || 0;
        const duration = this.current.length;
        const progressBar = createProgressBar(progress, duration);
        const progressText = `${formatDuration(progress)} / ${formatDuration(duration)}`;

        current = [
          `**Now Playing:**`,
          `[${truncate(this.current.title, 50)}](${this.current.uri}) by **${this.current.author}** • ${this.current.requester ? `<@${this.current.requester.id}>` : 'Unknown'}`,
          `${progressBar} ${progressText}`
        ].join('\n');
      }

      return {
        current,
        tracks: formatted || 'No tracks in queue.',
        currentPage: pageInfo.page,
        totalPages,
        totalTracks,
        totalDuration: formatDuration(this.totalDuration)
      };
    } catch (error) {
      logger.error('QueueManager', 'Failed to format queue', error);
      return {
        current: '',
        tracks: 'An error occurred while formatting the queue.',
        currentPage: 1,
        totalPages: 1,
        totalTracks: 0,
        totalDuration: '00:00'
      };
    }
  }
}

// Coded by bre4d with ESM modules
