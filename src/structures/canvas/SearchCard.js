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
import { logger } from '../../utils/logger.js'; // Assuming logger is in this path

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * SearchCard class for generating search result cards
 */
export class SearchCard {
  static ITEMS_PER_PAGE = 5; // <--- ADDED: Default card prefers 5 items

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
          logger.warn('SearchCard', 'Montserrat fonts not found, using Arial as fallback');
        }
        
        this._fontsInitialized = true;
      }
    } catch (error) {
      logger.error('SearchCard', 'Failed to load fonts:', error);
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
    text = String(text); // Ensure text is a string
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

  getTrackPlatformSourceInfo(track) {
    let sourceId = '';
    let sourceName = '';
    
    if (track?.raw) {
      if (track.raw.isrc || 
          track.raw.spotifyId || 
          (track.raw.source && track.raw.source === 'spotify') ||
          (track.raw.uri && track.raw.uri.includes('spotify'))) {
        sourceId = 'spotify';
        sourceName = 'Spotify';
      }
      else if (track.raw.youtube || 
              (track.raw.source && track.raw.source === 'youtube') ||
              (track.raw.uri && track.raw.uri.includes('youtube'))) {
        sourceId = 'youtube';
        sourceName = 'YouTube';
      }
      else if (track.raw.soundcloud || 
              (track.raw.source && track.raw.source === 'soundcloud') ||
              (track.raw.uri && track.raw.uri.includes('soundcloud'))) {
        sourceId = 'soundcloud';
        sourceName = 'SoundCloud';
      }
    }
    
    if (!sourceId) {
      const uri = track?.uri?.toLowerCase() || '';
      const trackSource = track?.sourceName?.toLowerCase() || '';
      
      if (uri.includes('spotify') || trackSource.includes('spotify')) {
        sourceId = 'spotify';
        sourceName = 'Spotify';
      } else if (uri.includes('youtube') || trackSource.includes('youtube')) {
        sourceId = 'youtube';
        sourceName = 'YouTube';
      } else if (uri.includes('soundcloud') || trackSource.includes('soundcloud')) {
        sourceId = 'soundcloud';
        sourceName = 'SoundCloud';
      } else if (uri.includes('deezer') || trackSource.includes('deezer')) {
        sourceId = 'deezer';
        sourceName = 'Deezer';
      } else {
        sourceId = 'default';
        sourceName = 'Music';
      }
    }
    
    return { id: sourceId, name: sourceName };
  }
  
  getHeaderPlatformSourceInfo(platformString) {
    let sourceId = '';
    let sourceName = '';
    const pLower = platformString.toLowerCase();

    if (pLower.includes('spotify')) {
      sourceId = 'spotify';
      sourceName = 'Spotify';
    } else if (pLower.includes('youtube')) {
      sourceId = 'youtube';
      sourceName = 'YouTube';
    } else if (pLower.includes('soundcloud')) {
      sourceId = 'soundcloud';
      sourceName = 'SoundCloud';
    } else if (pLower.includes('deezer')) {
        sourceId = 'deezer';
        sourceName = 'Deezer';
    } else {
      sourceId = 'default';
      sourceName = platformString.charAt(0).toUpperCase() + platformString.slice(1); 
    }
    return { id: sourceId, name: sourceName };
  }

  async loadPlatformLogo(sourceId) {
    try {
      const logoPath = path.join(__dirname, `../../assets/images/${sourceId}.png`);
      return await loadImage(logoPath);
    } catch (error) {
      logger.error('SearchCard', `Failed to load ${sourceId} logo:`, error.message);
      return null;
    }
  }

  async drawPlatformIcon(ctx, x, y, sourceInput, iconSize = 28) {
    ctx.save();
    
    let platformInfo;
    if (typeof sourceInput === 'string') {
        platformInfo = this.getHeaderPlatformSourceInfo(sourceInput);
    } else { 
        platformInfo = this.getTrackPlatformSourceInfo(sourceInput);
    }
    const sourceId = platformInfo.id;
    
    try {
      const logoImg = await this.loadPlatformLogo(sourceId);
      
      if (logoImg) {
        ctx.drawImage(logoImg, x, y, iconSize, iconSize);
      } else {
        ctx.beginPath();
        ctx.arc(x + iconSize/2, y + iconSize/2, iconSize/2, 0, Math.PI * 2);
        
        if (sourceId === 'spotify') ctx.fillStyle = '#1DB954';
        else if (sourceId === 'youtube') ctx.fillStyle = '#FF0000';
        else if (sourceId === 'soundcloud') ctx.fillStyle = '#FF7700';
        else if (sourceId === 'deezer') ctx.fillStyle = '#EF54C6';
        else ctx.fillStyle = '#ff5733'; // Changed to orange-red
        
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.font = `${Math.floor(iconSize * 0.6)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('♪', x + iconSize/2, y + iconSize/2 +1); 
      }
    } catch (error) {
      logger.error('SearchCard', 'Error drawing platform icon:', error);
      ctx.beginPath();
      ctx.arc(x + iconSize/2, y + iconSize/2, iconSize/2, 0, Math.PI * 2);
      ctx.fillStyle = '#ff5733'; // Changed to orange-red
      ctx.fill();
    }
    ctx.restore();
  }

  async generateSearchCard({
    query,
    platform, 
    tracks,   
    page,
    totalPages,
    guildName,
    guildIcon,
    requester 
  }) {
    const width = 900;
    const height = 700; 
    
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    const mainFont = GlobalFonts.has('Montserrat') ? 'Montserrat' : 'Arial';
    const boldFont = GlobalFonts.has('Montserrat Bold') ? 'Montserrat Bold' : 'Arial Bold';
    
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#1a0a00'); // Darker reddish-black
    bgGradient.addColorStop(0.5, '#3d1f0e'); // Warm reddish-brown
    bgGradient.addColorStop(1, '#1a0a00'); // Darker reddish-black
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Simplified particles for brevity
    for (let i = 0; i < 50; i++) {
        ctx.fillStyle = `rgba(255, 99, 71, ${Math.random() * 0.3 + 0.1})`; // Soft tomato red
        ctx.beginPath();
        ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 2 + 1, 0, Math.PI * 2);
        ctx.fill();
    }

    let guildIconImg;
    try {
      if (guildIcon) guildIconImg = await loadImage(guildIcon);
    } catch (error) { logger.error('SearchCard', 'Failed to load guild icon:', error.message); }
    
    this.drawGlassPanel(ctx, 30, 30, width - 60, 80, 16, 'rgba(211, 84, 0, 0.5)', 'rgba(255, 99, 71, 0.6)', 2); // Orange-red panel
    
    if (guildIconImg) {
      ctx.save(); ctx.beginPath(); ctx.arc(80, 70, 30, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(guildIconImg, 50, 40, 60, 60); ctx.restore();
      ctx.shadowColor = 'rgba(255, 99, 71, 0.8)'; // Orange-red shadow
      ctx.shadowBlur = 15;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(80, 70, 31, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0;
    }
    
    ctx.shadowColor = 'rgba(255, 99, 71, 0.8)'; // Orange-red shadow
    ctx.shadowBlur = 10;
    ctx.font = `28px "${boldFont}"`; ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff';
    ctx.fillText('SEARCH RESULTS', width / 2, 65); 
    
    await this.drawPlatformIcon(ctx, width / 2 + ctx.measureText('SEARCH RESULTS').width / 2 + 15, 48, platform, 32);
    
    ctx.shadowBlur = 0;
    ctx.font = `16px "${mainFont}"`; ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.textAlign = 'right'; ctx.fillText(guildName || 'Discord Server', width - 50, 75);
    
    this.drawGlassPanel(ctx, 30, 130, width - 60, 70, 16, 'rgba(211, 84, 0, 0.4)', 'rgba(255, 99, 71, 0.5)', 2); // Orange-red panel
    ctx.shadowColor = '#ff5733'; // Orange-red
    ctx.shadowBlur = 5;
    ctx.font = `20px "${boldFont}"`; ctx.fillStyle = '#ff5733'; // Orange-red
    ctx.textAlign = 'left';
    ctx.fillText('SEARCHED FOR:', 50, 170);
    ctx.shadowBlur = 0;
    ctx.font = `20px "${mainFont}"`; ctx.fillStyle = '#ffffff';
    ctx.fillText(this.truncateText(ctx, `"${query}"`, width - 280), 240, 170); 
    
    this.drawGlassPanel(ctx, 30, 220, width - 60, 50, 16, 'rgba(211, 84, 0, 0.6)', 'rgba(255, 99, 71, 0.5)', 2); // Orange-red panel
    ctx.shadowColor = '#ff5733'; // Orange-red
    ctx.shadowBlur = 5;
    ctx.font = `20px "${boldFont}"`; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left';
    ctx.fillText(`TOP TRACKS`, 50, 250);
    ctx.shadowBlur = 0;
    ctx.font = `18px "${mainFont}"`; ctx.textAlign = 'right';
    ctx.fillText(`PAGE ${page}/${totalPages}`, width - 50, 250);
    
    const resultsStartY = 290;
    const resultsHeight = height - resultsStartY - 100;
    this.drawGlassPanel(ctx, 30, resultsStartY, width - 60, resultsHeight, 16, 'rgba(211, 84, 0, 0.3)', 'rgba(255, 99, 71, 0.3)', 2); // Orange-red panel
    
    const rowHeight = 55;
    let yPos = resultsStartY + 40; 
    
    const maxItemsToDisplayOnCard = SearchCard.ITEMS_PER_PAGE; // Use static property

    if (tracks.length > 0) {
      for (let i = 0; i < Math.min(tracks.length, maxItemsToDisplayOnCard); i++) { 
        if (i >= maxItemsToDisplayOnCard && resultsHeight < (i+1)*rowHeight + 40 ) break; 
        const track = tracks[i];
        
        if (i % 2 === 0) {
          this.drawGlassPanel(ctx, 45, yPos - (rowHeight/2) - 2, width - 90, rowHeight, 8, 'rgba(255, 255, 255, 0.05)');
        }
        
        ctx.shadowColor = '#ff5733'; // Orange-red
        ctx.shadowBlur = 8;
        ctx.font = `18px "${boldFont}"`; ctx.fillStyle = '#ff5733'; // Orange-red
        ctx.textAlign = 'left';
        ctx.fillText(`${(page - 1) * SearchCard.ITEMS_PER_PAGE + i + 1}`, 60, yPos); // Use static property for numbering
        ctx.shadowBlur = 0;
        
        await this.drawPlatformIcon(ctx, 95, yPos - 14, track, 28); 
        
        const thumbSize = 45;
        const thumbX = 95 + 28 + 10; 
        let textX = thumbX;

        let thumbnailImg;
        try {
          if (track?.thumbnail) thumbnailImg = await loadImage(track.thumbnail);
        } catch (error) { logger.warn('SearchCard', 'Failed to load track thumbnail:', error.message); }
        
        if (thumbnailImg) {
          ctx.save(); ctx.beginPath(); ctx.roundRect(thumbX, yPos - (thumbSize/2) -2 , thumbSize, thumbSize, 6); ctx.clip();
          ctx.drawImage(thumbnailImg, thumbX, yPos - (thumbSize/2) -2, thumbSize, thumbSize); ctx.restore();
          ctx.strokeStyle = 'rgba(255, 99, 71, 0.4)'; // Orange-red stroke
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.roundRect(thumbX, yPos - (thumbSize/2)-2, thumbSize, thumbSize, 6); ctx.stroke();
          textX += thumbSize + 15;
        } else {
          textX += 5; 
        }
        
        ctx.shadowColor = 'rgba(255, 255, 255, 0.3)'; ctx.shadowBlur = 3;
        ctx.font = `18px "${mainFont}"`; ctx.fillStyle = '#ffffff';
        const title = this.truncateText(ctx, track.title, 300); 
        ctx.fillText(title, textX, yPos - 8); 
        ctx.shadowBlur = 0;
        
        if (track.author) {
          ctx.font = `16px "${mainFont}"`; ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          const author = this.truncateText(ctx, track.author, 280);
          ctx.fillText(author, textX, yPos + 14); 
        }
        
        ctx.font = `18px "${mainFont}"`; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'right';
        ctx.fillText(this.formatTime(track.length || 0), width - 180, yPos);
        
        ctx.font = `16px "${mainFont}"`; ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        const requesterName = requester?.username || 'Unknown'; 
        ctx.fillText(this.truncateText(ctx, requesterName, 100), width - 60, yPos);
        
        yPos += rowHeight;
        if (yPos > resultsStartY + resultsHeight - 30) break; 
      }
    } else {
      ctx.font = `22px "${mainFont}"`; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center';
      ctx.fillText('No results found for this page', width / 2, resultsStartY + resultsHeight / 2);
    }
    
    this.drawGlassPanel(ctx, 30, height - 80, width - 60, 50, 16, 'rgba(211, 84, 0, 0.4)', 'rgba(255, 99, 71, 0.3)', 2); // Orange-red panel
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; ctx.font = `16px "${mainFont}"`;
    ctx.textAlign = 'center';
    ctx.fillText(`Select songs to add to queue | Use buttons to navigate pages`, width / 2, height - 50);
    
    return canvas.toBuffer('image/png');
  }
}