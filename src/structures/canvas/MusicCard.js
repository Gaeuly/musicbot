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
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { logger } from '../../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * MusicCard class for generating now playing cards
 */
export class MusicCard {
  constructor() {
    this._fontsInitialized = false;
    this.initFonts();
  }

  /**
   * Initialize fonts for canvas rendering
   */
  initFonts() {
    try {
      if (!this._fontsInitialized) {
        GlobalFonts.registerFromPath(path.join(__dirname, '../../assets/fonts/arial.ttf'), 'Arial');
        GlobalFonts.registerFromPath(path.join(__dirname, '../../assets/fonts/arial-bold.ttf'), 'Arial Bold');
        
        try {
          GlobalFonts.registerFromPath(path.join(__dirname, '../../assets/fonts/montserrat-regular.ttf'), 'Montserrat');
          GlobalFonts.registerFromPath(path.join(__dirname, '../../assets/fonts/montserrat-bold.ttf'), 'Montserrat Bold');
        } catch (e) {
          logger.warn('MusicCard', 'Montserrat fonts not found, using Arial as fallback');
        }
        
        this._fontsInitialized = true;
      }
    } catch (error) {
      logger.error('MusicCard', 'Failed to load fonts:', error);
    }
  }

  /**
   * Format time in milliseconds to readable string
   * @param {number} ms - Time in milliseconds
   * @returns {string} - Formatted time string
   */
  formatTime(ms) {
    if (!ms || isNaN(ms)) return '00:00';
    
    const totalSeconds = Math.floor(ms / 1000);
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    const m = (Math.floor(totalSeconds / 60) % 60).toString().padStart(2, '0');
    const h = Math.floor(totalSeconds / 3600);
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  }

  /**
   * Truncate text if it exceeds maximum width
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} text - Text to truncate
   * @param {number} maxWidth - Maximum width
   * @returns {string} - Truncated text
   */
  truncateText(ctx, text = '', maxWidth) {
    if (!text) return '';
    if (ctx.measureText(text).width <= maxWidth) return text;
    
    let truncated = '';
    for (let i = 0; i < text.length; i++) {
      const testText = text.substring(0, i) + '...';
      if (ctx.measureText(testText).width > maxWidth) {
        return truncated + '...';
      }
      truncated = text.substring(0, i);
    }
    return truncated + '...';
  }

  /**
   * Draw a glass panel effect
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} height - Height
   * @param {number} radius - Corner radius
   * @param {string} fillColor - Fill color
   * @param {string|null} strokeColor - Stroke color
   * @param {number} strokeWidth - Stroke width
   */
  drawGlassPanel(ctx, x, y, width, height, radius, fillColor, strokeColor = null, strokeWidth = 1) {
    ctx.save();
    
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fill();
    
    const gradient = ctx.createLinearGradient(x, y, x, y + height * 0.1);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height * 0.1, radius);
    ctx.fill();
    
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
      ctx.stroke();
    }
    
    ctx.restore();
  }

  /**
   * Get platform source information
   * @param {object} track - Track object
   * @returns {object} - Platform source info
   */
  getPlatformSourceInfo(track) {
    let sourceId = '';
    let sourceName = '';
    
    // Check track.raw for Kazagumo-specific properties
    if (track?.raw) {
      // Spotify detection
      if (track.raw.isrc || 
          track.raw.spotifyId || 
          (track.raw.source && track.raw.source === 'spotify') ||
          (track.raw.uri && track.raw.uri.includes('spotify'))) {
        sourceId = 'spotify';
        sourceName = 'Spotify';
      }
      // YouTube detection
      else if (track.raw.youtube || 
              (track.raw.source && track.raw.source === 'youtube') ||
              (track.raw.uri && track.raw.uri.includes('youtube'))) {
        sourceId = 'youtube';
        sourceName = 'YouTube';
      }
      // SoundCloud detection
      else if (track.raw.soundcloud || 
              (track.raw.source && track.raw.source === 'soundcloud') ||
              (track.raw.uri && track.raw.uri.includes('soundcloud'))) {
        sourceId = 'soundcloud';
        sourceName = 'SoundCloud';
      }
    }
    
    // Fallback detection from track URI or source property
    if (!sourceId) {
      const uri = track.uri || '';
      const source = track.source || '';
      
      if (uri.includes('spotify') || source.includes('spotify')) {
        sourceId = 'spotify';
        sourceName = 'Spotify';
      } else if (uri.includes('youtube') || source.includes('youtube')) {
        sourceId = 'youtube';
        sourceName = 'YouTube';
      } else if (uri.includes('soundcloud') || source.includes('soundcloud')) {
        sourceId = 'soundcloud';
        sourceName = 'SoundCloud';
      } else if (uri.includes('deezer') || source.includes('deezer')) {
        sourceId = 'deezer';
        sourceName = 'Deezer';
      } else {
        sourceId = 'default';
        sourceName = 'Music';
      }
    }
    
    return { id: sourceId, name: sourceName };
  }

  /**
   * Load platform logo image
   * @param {string} sourceId - Source ID
   * @returns {Promise<Image>} - Loaded image
   */
  async loadPlatformLogo(sourceId) {
    try {
      // Path to the platform logos
      const logoPath = path.join(__dirname, `../../assets/images/${sourceId}.png`);
      return await loadImage(logoPath);
    } catch (error) {
      logger.error(`Failed to load ${sourceId} logo:`, error);
      // Return null to handle fallback in the drawing function
      return null;
    }
  }

  /**
   * Draw platform icon
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {object} track - Track object
   */
  async drawPlatformIcon(ctx, x, y, track) {
    const size = 32; // Slightly larger for better visibility
    
    ctx.save();
    
    const platformInfo = this.getPlatformSourceInfo(track);
    const sourceId = platformInfo.id;
    
    try {
      // Try to load the platform logo from assets
      const logoImg = await this.loadPlatformLogo(sourceId);
      
      if (logoImg) {
        // Draw the loaded logo image
        ctx.drawImage(logoImg, x, y, 80, 55);
      } else {
        // Fallback to colored circle if image fails to load
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
        
        // Use platform-specific colors
        if (sourceId === 'spotify') {
          ctx.fillStyle = '#1DB954';
        } else if (sourceId === 'youtube') {
          ctx.fillStyle = '#FF0000';
        } else if (sourceId === 'soundcloud') {
          ctx.fillStyle = '#FF7700';
        } else {
          ctx.fillStyle = '#FF4500'; // Orange Red
        }
        
        ctx.fill();
        
        // Add a small music note as a generic icon
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('♪', x + size/2, y + size/2);
      }
    } catch (error) {
      logger.error('Error drawing platform icon:', error);
      
      // Last resort fallback
      ctx.beginPath();
      ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
      ctx.fillStyle = '#FF4500'; // Orange Red
      ctx.fill();
    }
    
    ctx.restore();
  }

  /**
   * Generate now playing card
   * @param {object} options - Card options
   * @returns {Promise<Buffer>} - Image buffer
   */
  async generateNowPlayingCard({ 
    track, 
    position, 
    isLiked,
    guildName,
    guildIcon,
    player
  }) {
    const width = 900;
    const height = 500;
    
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    const mainFont = GlobalFonts.has('Montserrat') ? 'Montserrat' : 'Arial';
    const boldFont = GlobalFonts.has('Montserrat Bold') ? 'Montserrat Bold' : 'Arial Bold';
    
    // Enhanced background with deeper gradient
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#2E0C00');  // Dark Red
    bgGradient.addColorStop(0.5, '#4B1C0F'); // Rich Red-Orange
    bgGradient.addColorStop(1, '#2E0C00');  // Dark Red
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Enhanced particle effects
    for (let i = 0; i < 150; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = Math.random() * 2;
      const alpha = Math.random() * 0.6;
      
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add some larger glowing particles
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = 2 + Math.random() * 3;
      
      ctx.fillStyle = 'rgba(255, 140, 0, 0.2)'; // Orange glow
      ctx.shadowColor = '#FF8C00'; // Dark Orange
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    let guildIconImg;
    try {
      if (guildIcon) {
        guildIconImg = await loadImage(guildIcon);
      }
    } catch (error) {
      logger.error('Failed to load guild icon:', error);
    }
    
    // Enhanced header glass panel with brighter accent
    this.drawGlassPanel(
      ctx, 
      30, 30, 
      width - 60, 80, 
      16, 
      'rgba(255, 69, 0, 0.5)', // Orange Red
      'rgba(255, 140, 0, 0.6)', // Dark Orange
      2
    );
    
    // Draw guild icon with improved glow
    if (guildIconImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(80, 70, 30, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(guildIconImg, 50, 40, 60, 60);
      ctx.restore();
      
      ctx.shadowColor = 'rgba(255, 140, 0, 0.8)'; // Orange glow
      ctx.shadowBlur = 15;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(80, 70, 31, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    
    // Title with glow
    ctx.shadowColor = 'rgba(255, 140, 0, 0.8)'; // Orange glow
    ctx.shadowBlur = 10;
    ctx.font = `28px "${boldFont}"`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('NOW PLAYING', width / 2, 75);
    ctx.shadowBlur = 0;
    
    // Guild name
    ctx.font = `16px "${mainFont}"`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.textAlign = 'right';
    ctx.fillText(guildName || 'Discord Server', width - 50, 75);
    
    // Main content area
    // Enhanced Now playing glass panel
    this.drawGlassPanel(
      ctx, 
      30, 130, 
      width - 60, 340, 
      16, 
      'rgba(255, 69, 0, 0.4)', // Orange Red lighter
      'rgba(255, 140, 0, 0.5)', // Dark Orange
      2
    );
    
    let thumbnailImg;
    try {
      if (track?.thumbnail) {
        thumbnailImg = await loadImage(track.thumbnail);
      }
    } catch (error) {
      logger.error('Failed to load thumbnail:', error);
    }
    
    // Improved thumbnail with stronger shadow and larger size
    if (thumbnailImg) {
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;
      
      ctx.beginPath();
      ctx.roundRect(50, 150, 240, 240, 16);
      ctx.clip();
      
      ctx.drawImage(thumbnailImg, 50, 150, 240, 240);
      ctx.restore();
      
      // Glowing border for thumbnail
      ctx.strokeStyle = 'rgba(255, 140, 0, 0.6)'; // Orange border
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(255, 140, 0, 0.4)'; // Orange glow
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(50, 150, 240, 240, 16);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    
    // Draw platform icon with improved positioning
    await this.drawPlatformIcon(ctx, 310, 154, track);
    
    // Track title with improved glow
    ctx.shadowColor = 'rgba(255, 140, 0, 0.5)'; // Orange glow
    ctx.shadowBlur = 5;
    ctx.font = `28px "${boldFont}"`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    const title = this.truncateText(ctx, track.title, 300);
    ctx.fillText(title, 375, 189);
    ctx.shadowBlur = 0;
    
    // Artist/Channel name with better vertical spacing
    if (track.author) {
      ctx.font = `22px "${mainFont}"`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      const author = this.truncateText(ctx, track.author, width - 380);
      ctx.fillText(author, 330, 220);
    }
    
    // Draw "liked" status if liked
    if (isLiked) {
      ctx.font = `18px "${mainFont}"`;
      ctx.fillStyle = '#FF7AA1';
      ctx.fillText('♥ Liked', 330, 250);
    }
    
    // Add player status info
    ctx.font = `18px "${mainFont}"`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    
    // Loop status
    let loopStatus = 'No Repeat';
    if (player.loop === 'track') loopStatus = 'Repeating Track';
    else if (player.loop === 'queue') loopStatus = 'Repeating Queue';
    
    ctx.fillText(`Status: ${player.paused ? 'Paused' : 'Playing'} | Volume: ${player.volume}% | ${loopStatus}`, 330, 280);
    
    // Requester
    const requester = track.requester?.username || 'Unknown';
    ctx.font = `18px "${mainFont}"`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText(`Requested by: ${requester}`, 330, 310);
    
    // Enhanced progress bar
    const barX = 50;
    const barY = 420;
    const barWidth = width - 100;
    const barHeight = 16;
    
    // Progress bar background with enhanced glass effect
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, barHeight / 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Progress bar fill with enhanced gradient
    const duration = track.length || 0;
    const progress = duration > 0 ? Math.min(position / duration, 1) : 0;
    const progressWidth = Math.max(barWidth * progress, 10);
    
    const progressGradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
    progressGradient.addColorStop(0, '#FFA07A');  // Light Salmon
    progressGradient.addColorStop(0.5, '#FF4500'); // Orange Red
    progressGradient.addColorStop(1, '#FFA07A');  // Light Salmon
    
    ctx.fillStyle = progressGradient;
    ctx.beginPath();
    ctx.roundRect(barX, barY, progressWidth, barHeight, barHeight / 2);
    ctx.fill();
    
    // Enhanced glow for progress bar
    ctx.shadowColor = '#FF8C00'; // Dark Orange
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.roundRect(barX, barY, progressWidth, barHeight, barHeight / 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Enhanced progress indicator dot
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#FF8C00'; // Dark Orange
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(barX + progressWidth, barY + barHeight / 2, barHeight, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Time display
    ctx.font = `18px "${mainFont}"`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(this.formatTime(position), barX, barY + 35);
    
    ctx.textAlign = 'right';
    ctx.fillText(track.isStream ? '🔴 LIVE' : this.formatTime(duration), barX + barWidth, barY + 35);
    
    // Add queue count info
    const queueCount = player.queue.length || 0;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(`${queueCount} track${queueCount !== 1 ? 's' : ''} in queue`, width / 2, barY + 35);
    
    return canvas.toBuffer('image/png');
  }
}