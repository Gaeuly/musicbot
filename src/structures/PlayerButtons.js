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
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export class PlayerButtons {
  constructor() {
    this.ids = {
      play: 'player_play',
      pause: 'player_pause',
      stop: 'player_stop',
      skip: 'player_skip',
      previous: 'player_previous',
      loop: 'player_loop',
      shuffle: 'player_shuffle',
      queue: 'player_queue',
      volume: 'player_volume',
      like: 'player_like',
      // Removed: download: 'player_download'
      lyric: 'player_lyric' // Added lyric button ID
    };
    
    this.emojis = {
      play: '<:Play:1372101837733236736>',
      pause: '<:pause:1372091659881418823>',
      stop: '<:Stop:1372101811934199818>',
      skip: '<:skip:1372101831429455882>',
      previous: '<:Previous:1372101825771077713>',
      loopNone: '<:Loop_none:1372101799984500831>',
      loopQueue: '<:Loop_queue:1372101807345504266>',
      loopTrack: '<:Loop_track:1372101820578664519>',
      queue: '<:queue:1372101913662984243>',
      like: '<:Like:1372101783320793100>',
      shuffle: '<:Shuffle:1372101919279022151>',
      volume: '<:Vol:1372101789033173073>',
      // Removed: download: '<:Down:1372101795224223764>'
      lyric: '📜' // Added lyric emoji (using a common emoji, you can replace with custom)
    };
  }

  /**
   * Creates the primary player control buttons (previous, play/pause, stop, skip, loop).
   * @param {object} playerState - Current state of the player.
   * @returns {ActionRowBuilder}
   */
  createPlayerControls(playerState = {}) {
    const { paused = false, loop = '' } = playerState;

    const previousButton = new ButtonBuilder()
      .setCustomId(this.ids.previous)
      .setStyle(ButtonStyle.Secondary)
      .setEmoji(this.emojis.previous);

    const playPauseButton = new ButtonBuilder()
      .setCustomId(paused ? this.ids.play : this.ids.pause)
      .setStyle(ButtonStyle.Secondary)
      .setEmoji(paused ? this.emojis.play : this.emojis.pause);

    const stopButton = new ButtonBuilder()
      .setCustomId(this.ids.stop)
      .setStyle(ButtonStyle.Secondary)
      .setEmoji(this.emojis.stop);

    const skipButton = new ButtonBuilder()
      .setCustomId(this.ids.skip)
      .setStyle(ButtonStyle.Secondary)
      .setEmoji(this.emojis.skip);

    const loopButton = new ButtonBuilder()
      .setCustomId(this.ids.loop)
      .setStyle(ButtonStyle.Secondary)
      .setEmoji(this.getLoopEmoji(loop))
      .setLabel(this.getLoopLabel(loop));
      
    return new ActionRowBuilder().addComponents(
      previousButton,
      playPauseButton,
      stopButton,
      skipButton,
      loopButton
    );
  }

  /**
   * Creates the secondary player control buttons (queue, like, shuffle, volume, lyric).
   * @param {object} playerState - Current state of the player.
   * @returns {ActionRowBuilder}
   */
  createSecondaryControls(playerState = {}) {
    const queueButton = new ButtonBuilder()
      .setCustomId(this.ids.queue)
      .setStyle(ButtonStyle.Secondary)
      .setEmoji(this.emojis.queue);

    const likeButton = new ButtonBuilder()
      .setCustomId(this.ids.like)
      .setStyle(ButtonStyle.Secondary)
      .setEmoji(this.emojis.like);

    const shuffleButton = new ButtonBuilder()
      .setCustomId(this.ids.shuffle)
      .setStyle(ButtonStyle.Secondary)
      .setEmoji(this.emojis.shuffle);

    const volumeButton = new ButtonBuilder()
      .setCustomId(this.ids.volume)
      .setStyle(ButtonStyle.Secondary)
      .setEmoji(this.emojis.volume);

    // Replaced download button with lyric button
    const lyricButton = new ButtonBuilder()
      .setCustomId(this.ids.lyric)
      .setStyle(ButtonStyle.Secondary)
      .setEmoji(this.emojis.lyric);

    return new ActionRowBuilder().addComponents(
      queueButton,
      likeButton,
      shuffleButton,
      volumeButton,
      lyricButton // Changed from downloadButton
    );
  }

  /**
   * Creates an empty, disabled button for spacing/placeholding.
   * @returns {ButtonBuilder}
   */
  createEmptyButton() {
    return new ButtonBuilder()
      .setCustomId('empty_button')
      .setLabel('\u200B') 
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true);
  }

  /**
   * Gets the label for the loop button based on the loop state.
   * @param {string} loopState - The current loop state ('none', 'track', 'queue').
   * @returns {string}
   */
  getLoopLabel(loopState) {
    switch (loopState) {
      case 'track':
        return '‎ ';
      case 'queue':
        return '‎ ';
      default:
        return '‎ ';
    }
  }

  /**
   * Gets the emoji for the loop button based on the loop state.
   * @param {string} loopState - The current loop state ('none', 'track', 'queue').
   * @returns {string}
   */
  getLoopEmoji(loopState) {
    switch (loopState) {
      case 'track':
        return this.emojis.loopTrack;
      case 'queue':
        return this.emojis.loopQueue;
      default:
        return this.emojis.loopNone;
    }
  }
}

export const playerButtons = new PlayerButtons();
