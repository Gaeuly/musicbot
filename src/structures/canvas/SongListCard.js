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
 * SongListCard class for generating playlist/song list cards
 */
export class SongListCard {
  static ITEMS_PER_PAGE = 10; // Items per page for song lists

  constructor() {
    this._fontsInitialized = false;
    this.initFonts();
  }

  initFonts() {
    try {
      if (!this._fontsInitialized) {
        GlobalFonts.registerFromPath(path.join(__dirname, '../../assets/fonts/arial.ttf'), 'Arial');
        GlobalFonts.registerFromPath(path.join(__dirname, '../../assets/fonts/arial-bold.ttf'), 'Arial Bold');
        
        try {
          GlobalFonts.registerFromPath(path.join(__dirname, '../../assets/fonts/montserrat-regular.ttf'), 'Montserrat');
          GlobalFonts.registerFromPath(path.join(__dirname, '../../assets/fonts/montserrat-bold.ttf'), 'Montserrat Bold');
        } catch (e) {
          logger.warn('SongListCard', 'Montserrat fonts not found, using Arial as fallback');
        }
        
        this._fontsInitialized = true;
      }
    } catch (error) {
      logger.error('SongListCard', 'Failed to load fonts:', error);
    }
  }

  formatTime(ms) {
    if (!ms || isNaN(ms)) return '00:00';
    
    const totalSeconds = Math.floor(ms / 1000);
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    const m = (Math.floor(totalSeconds / 60) % 60).toString().padStart(2, '0');
    const h = Math.floor(totalSeconds / 3600);
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  }

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

  getPlatformSourceInfo(track) {
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
      const uri = track?.uri?.toLowerCase() || ''; // Added optional chaining
      const source = track?.sourceName?.toLowerCase() || track?.raw?.source?.toLowerCase() || ''; // Prefer sourceName, fallback
      
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

  async loadPlatformLogo(sourceId) {
    try {
      const logoPath = path.join(__dirname, `../../assets/images/${sourceId}.png`);
      return await loadImage(logoPath);
    } catch (error) {
      logger.error('SongListCard', `Failed to load ${sourceId} logo:`, error.message);
      return null;
    }
  }

  async drawPlatformIcon(ctx, x, y, track) {
    const size = 28; 
    
    ctx.save();
    
    const platformInfo = this.getPlatformSourceInfo(track);
    const sourceId = platformInfo.id;
    
    try {
      const logoImg = await this.loadPlatformLogo(sourceId);
      
      if (logoImg) {
        ctx.drawImage(logoImg, x, y, size, size);
      } else {
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
        
        if (sourceId === 'spotify') ctx.fillStyle = '#1DB954';
        else if (sourceId === 'youtube') ctx.fillStyle = '#FF0000';
        else if (sourceId === 'soundcloud') ctx.fillStyle = '#FF7700';
        else if (sourceId === 'deezer') ctx.fillStyle = '#EF54C6';
        else ctx.fillStyle = '#ff5733'; // Changed to orange-red
        
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial'; 
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('♪', x + size/2, y + size/2 + 1); // Small adjustment for ♪
      }
    } catch (error) {
      logger.error('SongListCard', 'Error drawing platform icon:', error);
      ctx.beginPath();
      ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
      ctx.fillStyle = '#ff5733'; // Changed to orange-red 
      ctx.fill();
    }
    
    ctx.restore();
  }

  async generateSongListCard({ 
    tracks, // Array of all songs in the playlist/list
    page, 
    totalPages, 
    itemsPerPage, // Max items to show on THIS page
    listName, // Name of the playlist/list
    listDescription, // Optional description
    guildName,
    guildIcon,
    totalDuration, // Optional total duration of all tracks
    createdBy // Optional creator info
  }) {
    const width = 900;
    const height = 700;
    
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    const mainFont = GlobalFonts.has('Montserrat') ? 'Montserrat' : 'Arial';
    const boldFont = GlobalFonts.has('Montserrat Bold') ? 'Montserrat Bold' : 'Arial Bold';
    
    // Background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#1a0a00'); // Darker reddish-black
    bgGradient.addColorStop(0.5, '#3d1f0e'); // Warm reddish-brown
    bgGradient.addColorStop(1, '#1a0a00'); // Darker reddish-black
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add starfield background
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
    
    // Add glowing orbs
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = 2 + Math.random() * 3;
      ctx.fillStyle = 'rgba(255, 99, 71, 0.2)'; // Soft tomato red
      ctx.shadowColor = '#ff5733'; // Orange-red glow
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Load guild icon
    let guildIconImg;
    try {
      if (guildIcon) {
        guildIconImg = await loadImage(guildIcon);
      }
    } catch (error) {
      logger.error('SongListCard', 'Failed to load guild icon:', error.message);
    }
    
    // Header panel
    this.drawGlassPanel(ctx, 30, 30, width - 60, 120, 16, 'rgba(211, 84, 0, 0.5)', 'rgba(255, 99, 71, 0.6)', 2);
    
    // Guild icon
    if (guildIconImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(80, 70, 30, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(guildIconImg, 50, 40, 60, 60);
      ctx.restore();
      
      ctx.shadowColor = 'rgba(255, 99, 71, 0.8)';
      ctx.shadowBlur = 15;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(80, 70, 31, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    
    // Main title
    ctx.shadowColor = 'rgba(255, 99, 71, 0.8)';
    ctx.shadowBlur = 10;
    ctx.font = `28px "${boldFont}"`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(listName || 'SONG LIST', width / 2, 75);
    ctx.shadowBlur = 0;
    
    // Guild name
    ctx.font = `16px "${mainFont}"`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.textAlign = 'right';
    ctx.fillText(guildName || 'Discord Server', width - 50, 60);
    
    // Description or additional info
    if (listDescription || createdBy || totalDuration) {
      ctx.font = `14px "${mainFont}"`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.textAlign = 'center';
      let infoText = '';
      if (listDescription) infoText += listDescription;
      if (createdBy) infoText += (infoText ? ' • ' : '') + `Created by ${createdBy}`;
      if (totalDuration) infoText += (infoText ? ' • ' : '') + `Total: ${this.formatTime(totalDuration)}`;
      
      const truncatedInfo = this.truncateText(ctx, infoText, width - 100);
      ctx.fillText(truncatedInfo, width / 2, 100);
    }
    
    // Page info
    ctx.font = `16px "${mainFont}"`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.textAlign = 'center';
    ctx.fillText(`Page ${page} of ${totalPages}`, width / 2, 130);
    
    // Song list header
    const listHeaderY = 170;
    this.drawGlassPanel(ctx, 30, listHeaderY, width - 60, 50, 16, 'rgba(211, 84, 0, 0.6)', 'rgba(255, 99, 71, 0.5)', 2);
    
    ctx.shadowColor = '#ff5733';
    ctx.shadowBlur = 5;
    ctx.font = `20px "${boldFont}"`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText('SONGS', 50, listHeaderY + 30);
    ctx.shadowBlur = 0;
    
    ctx.font = `18px "${mainFont}"`;
    ctx.textAlign = 'right';
    ctx.fillText(`${tracks.length} tracks`, width - 50, listHeaderY + 30);
    
    // Song list area
    const listStartY = listHeaderY + 60;
    const listHeight = height - listStartY - 80;
    this.drawGlassPanel(ctx, 30, listStartY, width - 60, listHeight, 16, 'rgba(211, 84, 0, 0.3)', 'rgba(255, 99, 71, 0.3)', 2);
    
    // Calculate which tracks to display on this page
    const startIndex = (page - 1) * itemsPerPage;
    const pageTracksToDisplay = tracks.slice(startIndex, startIndex + itemsPerPage);
    
    const rowHeight = Math.min(55, listHeight / (itemsPerPage + 0.5));
    let yPos = listStartY + 30;
    
    if (pageTracksToDisplay.length > 0) {
      for (let i = 0; i < pageTracksToDisplay.length; i++) {
        if (yPos + rowHeight/2 > listStartY + listHeight - 15) break;
        const track = pageTracksToDisplay[i];
        
        // Alternating row background
        if (i % 2 === 0) {
          this.drawGlassPanel(ctx, 45, yPos - (rowHeight/2) + 5, width - 90, rowHeight - 5, 8, 'rgba(255, 255, 255, 0.05)');
        }
        
        // Track number
        ctx.shadowColor = '#ff5733';
        ctx.shadowBlur = 8;
        ctx.font = `18px "${boldFont}"`;
        ctx.fillStyle = '#ff5733';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${startIndex + i + 1}`, 60, yPos);
        ctx.shadowBlur = 0;
        
        // Platform icon
        await this.drawPlatformIcon(ctx, 95, yPos - 14, track);
        
        // Track title
        ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
        ctx.shadowBlur = 3;
        ctx.font = `18px "${mainFont}"`;
        ctx.fillStyle = '#ffffff';
        const title = this.truncateText(ctx, track.title, 400);
        ctx.fillText(title, 135, yPos - 8);
        ctx.shadowBlur = 0;
        
        // Track author
        if (track.author) {
          ctx.font = `14px "${mainFont}"`;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          const author = this.truncateText(ctx, track.author, 300);
          ctx.fillText(author, 135, yPos + 10);
        }
        
        // Duration
        ctx.font = `16px "${mainFont}"`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'right';
        ctx.fillText(this.formatTime(track.length || 0), width - 190, yPos);
        
        // Requester/Added by
        const requesterName = track.requester?.username || track.addedBy || 'Unknown';
        ctx.font = `14px "${mainFont}"`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillText(this.truncateText(ctx, requesterName, 100), width - 60, yPos);
        
        yPos += rowHeight;
      }
    } else {
      // Empty list message
      ctx.font = `20px "${mainFont}"`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText("NO SONGS FOUND", width / 2, listStartY + listHeight / 2);
    }
    
    // Footer
    const footerPanelY = height - 70;
    this.drawGlassPanel(ctx, 30, footerPanelY, width - 60, 50, 16, 'rgba(211, 84, 0, 0.5)', 'rgba(255, 99, 71, 0.6)', 2);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = `16px "${mainFont}"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Total Songs: ${tracks.length} | Use buttons to navigate`, width / 2, footerPanelY + 25);
    
    return canvas.toBuffer('image/png');
  }
}