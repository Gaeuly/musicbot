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
 * QueueCard class for generating music queue cards
 */
export class QueueCard {
  static ITEMS_PER_PAGE_FIRST = 5; // <--- ADDED: For page 1 (default theme)
  static ITEMS_PER_PAGE_OTHER = 8; // <--- ADDED: For other pages (default theme)

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
          logger.warn('QueueCard', 'Montserrat fonts not found, using Arial as fallback');
        }
        
        this._fontsInitialized = true;
      }
    } catch (error) {
      logger.error('QueueCard', 'Failed to load fonts:', error);
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
      logger.error('QueueCard', `Failed to load ${sourceId} logo:`, error.message);
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
      logger.error('QueueCard', 'Error drawing platform icon:', error);
      ctx.beginPath();
      ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
      ctx.fillStyle = '#ff5733'; // Changed to orange-red 
      ctx.fill();
    }
    
    ctx.restore();
  }

  async generateQueueCard({ 
    current, 
    position, 
    // duration of current track is current.length
    tracks, // This is the array of ALL upcoming tracks
    page, 
    totalPages, 
    itemsPerPage, // Max upcoming items to show on THIS page, determined by the command
    guildName,
    guildIcon,
    player // For current track's loop status (not used in this version yet)
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

    let guildIconImg;
    try {
      if (guildIcon) {
        guildIconImg = await loadImage(guildIcon);
      }
    } catch (error) {
      logger.error('QueueCard', 'Failed to load guild icon:', error.message);
    }
    
    this.drawGlassPanel(ctx, 30, 30, width - 60, 80, 16, 'rgba(211, 84, 0, 0.5)', 'rgba(255, 99, 71, 0.6)', 2); // Orange-red panel
    
    if (guildIconImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(80, 70, 30, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(guildIconImg, 50, 40, 60, 60);
      ctx.restore();
      
      ctx.shadowColor = 'rgba(255, 99, 71, 0.8)'; // Orange-red shadow
      ctx.shadowBlur = 15;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(80, 70, 31, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    
    ctx.shadowColor = 'rgba(255, 99, 71, 0.8)'; // Orange-red shadow
    ctx.shadowBlur = 10;
    ctx.font = `28px "${boldFont}"`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('MUSIC QUEUE', width / 2, 75);
    ctx.shadowBlur = 0;
    
    ctx.font = `16px "${mainFont}"`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.textAlign = 'right';
    ctx.fillText(guildName || 'Discord Server', width - 50, 75);
    
    const currentTrackDuration = current?.length || 0;

    if (page === 1 && current) {
      this.drawGlassPanel(ctx, 30, 130, width - 60, 180, 16, 'rgba(211, 84, 0, 0.4)', 'rgba(255, 99, 71, 0.5)', 2); // Orange-red panel
      
      let thumbnailImg;
      try {
        if (current?.thumbnail) {
          thumbnailImg = await loadImage(current.thumbnail);
        }
      } catch (error) {
        logger.error('QueueCard','Failed to load current track thumbnail:', error.message);
      }
      
      if (thumbnailImg) {
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        ctx.beginPath();
        ctx.roundRect(50, 150, 140, 140, 10);
        ctx.clip();
        ctx.drawImage(thumbnailImg, 50, 150, 140, 140);
        ctx.restore();
        
        ctx.strokeStyle = 'rgba(255, 99, 71, 0.6)'; // Orange-red stroke
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(255, 99, 71, 0.4)'; // Orange-red shadow
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.roundRect(50, 150, 140, 140, 10);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      
      ctx.shadowColor = '#ff5733'; // Orange-red
      ctx.shadowBlur = 10;
      ctx.font = `18px "${boldFont}"`;
      ctx.fillStyle = '#ff5733'; // Orange-red
      ctx.textAlign = 'left';
      ctx.fillText('NOW PLAYING', thumbnailImg ? 210 : 50, 170);
      ctx.shadowBlur = 0;
      
      const platformIconSizeNP = 32; // Larger for Now Playing
      const platformInfoCurrent = this.getPlatformSourceInfo(current);
      const logoImgCurrent = await this.loadPlatformLogo(platformInfoCurrent.id);
      const platformIconXNP = thumbnailImg ? width - 50 - platformIconSizeNP : width - 50 - platformIconSizeNP - 150 ; // Position right
      
      if (logoImgCurrent) {
          ctx.drawImage(logoImgCurrent, platformIconXNP , 152, platformIconSizeNP, platformIconSizeNP); 
      } else {
          ctx.save();
          ctx.beginPath();
          ctx.arc(platformIconXNP + platformIconSizeNP/2, 152 + platformIconSizeNP/2, platformIconSizeNP/2, 0, Math.PI * 2);
          if (platformInfoCurrent.id === 'spotify') ctx.fillStyle = '#1DB954';
          else if (platformInfoCurrent.id === 'youtube') ctx.fillStyle = '#FF0000';
          else if (platformInfoCurrent.id === 'soundcloud') ctx.fillStyle = '#FF7700';
          else if (platformInfoCurrent.id === 'deezer') ctx.fillStyle = '#EF54C6';
          else ctx.fillStyle = '#ff5733'; // Orange-red
          ctx.fill();
          ctx.fillStyle = 'white';
          ctx.font = '16px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('♪', platformIconXNP + platformIconSizeNP/2, 152 + platformIconSizeNP/2 + 1);
          ctx.restore();
      }
      
      ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
      ctx.shadowBlur = 5;
      ctx.font = `22px "${boldFont}"`;
      ctx.fillStyle = '#ffffff';
      const title = this.truncateText(ctx, current.title, width - (thumbnailImg ? 260 : 100) - platformIconSizeNP - 20); // Adjusted width for platform icon
      ctx.fillText(title, thumbnailImg ? 210 : 50, 205);
      ctx.shadowBlur = 0;
      
      if (current.author) {
        ctx.font = `18px "${mainFont}"`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        const author = this.truncateText(ctx, current.author, width - (thumbnailImg ? 260 : 100));
        ctx.fillText(author, thumbnailImg ? 210 : 50, 235);
      }
      
      const requester = current.requester?.username || 'Unknown';
      ctx.font = `16px "${mainFont}"`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText(`Requested by: ${requester}`, thumbnailImg ? 210 : 50, 265);
      
      const barX = thumbnailImg ? 210 : 50;
      const barY = 285;
      const barWidthVal = width - (thumbnailImg ? 260 : 100);
      const barHeight = 8;
      
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.roundRect(barX, barY, barWidthVal, barHeight, barHeight / 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      const progress = currentTrackDuration > 0 ? Math.min(position / currentTrackDuration, 1) : (current.isStream ? 1: 0);
      const progressWidth = Math.max(barWidthVal * progress, current.isStream ? barWidthVal : 10); // Full bar if stream
      
      const progressGradient = ctx.createLinearGradient(barX, 0, barX + barWidthVal, 0);
      progressGradient.addColorStop(0, '#ff8c66'); // Light orange
      progressGradient.addColorStop(0.5, '#d32f2f'); // Deep red
      progressGradient.addColorStop(1, '#ff8c66'); // Light orange
      ctx.fillStyle = progressGradient;
      ctx.beginPath();
      ctx.roundRect(barX, barY, progressWidth, barHeight, barHeight / 2);
      ctx.fill();
      
      ctx.shadowColor = '#ff5733'; // Orange-red
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.roundRect(barX, barY, progressWidth, barHeight, barHeight / 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      if(!current.isStream){
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ff5733'; // Orange-red
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(barX + progressWidth, barY + barHeight / 2, barHeight, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      
      ctx.font = `16px "${mainFont}"`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(this.formatTime(position), barX, barY + 25);
      
      ctx.textAlign = 'right';
      ctx.fillText(current.isStream ? '🔴 LIVE' : this.formatTime(currentTrackDuration), barX + barWidthVal, barY + 25);
    }
    
    const queueHeaderY = (page === 1 && current) ? 330 : 130;
    this.drawGlassPanel(ctx, 30, queueHeaderY, width - 60, 50, 16, 'rgba(211, 84, 0, 0.6)', 'rgba(255, 99, 71, 0.5)', 2); // Orange-red panel
    
    ctx.shadowColor = '#ff5733'; // Orange-red
    ctx.shadowBlur = 5;
    ctx.font = `20px "${boldFont}"`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(`UPCOMING TRACKS`, 50, queueHeaderY + 30);
    ctx.shadowBlur = 0;
    
    ctx.font = `18px "${mainFont}"`;
    ctx.textAlign = 'right';
    ctx.fillText(`PAGE ${page}/${totalPages}`, width - 50, queueHeaderY + 30);
    
    const queueListStartY = queueHeaderY + 60;
    const queueListHeight = height - queueListStartY - 80; // Adjusted for footer
    this.drawGlassPanel(ctx, 30, queueListStartY, width - 60, queueListHeight, 16, 'rgba(211, 84, 0, 0.3)', 'rgba(255, 99, 71, 0.3)', 2); // Orange-red panel
    
    // Slicing logic based on itemsPerPage for *this specific page*
    // The command must calculate the correct global start index for numbering if tracks is the full list.
    // For the card, `itemsPerPage` is how many to take for *this page's display*.
    // `tracks` is the full upcoming queue.
    
    let sliceStartIndex = 0;
    if (page > 1) {
        // Command is responsible for `page` and `totalPages` calculation.
        // This card needs to know where to start slicing in the `tracks` array for *this* page.
        // This depends on how many items were on *previous* pages.
        const itemsOnFirstPage = (current && (QueueCard.ITEMS_PER_PAGE_FIRST || 5)) || (QueueCard.ITEMS_PER_PAGE_OTHER || 8);
        const itemsOnOtherPages = QueueCard.ITEMS_PER_PAGE_OTHER || 8;

        sliceStartIndex = itemsOnFirstPage + (page - 2) * itemsOnOtherPages;
        if (page === 1 && !current) { // If no 'now playing', page 1 uses 'other' count
            sliceStartIndex = (page-1) * itemsOnOtherPages;
        }
    }
    if (page === 1 && !current) {
        sliceStartIndex = 0;
    }

    const pageTracksToDisplay = tracks.slice(sliceStartIndex, sliceStartIndex + itemsPerPage);

    const rowHeight = Math.min(55, queueListHeight / (itemsPerPage + 0.5)); // +0.5 for a bit of padding
    let yPos = queueListStartY + 30; // Start yPos for first item content (not panel top)
    
    if (pageTracksToDisplay.length > 0) {
      for (let i = 0; i < pageTracksToDisplay.length; i++) {
        if (yPos + rowHeight/2 > queueListStartY + queueListHeight - 15) break; // Boundary check
        const track = pageTracksToDisplay[i];
        
        if (i % 2 === 0) {
          this.drawGlassPanel(ctx, 45, yPos - (rowHeight/2) +5, width - 90, rowHeight -5, 8, 'rgba(255, 255, 255, 0.05)');
        }
        
        ctx.shadowColor = '#ff5733'; // Orange-red
        ctx.shadowBlur = 8;
        ctx.font = `18px "${boldFont}"`;
        ctx.fillStyle = '#ff5733'; // Orange-red
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${sliceStartIndex + i + 1}`, 60, yPos); 
        ctx.shadowBlur = 0;
        
        await this.drawPlatformIcon(ctx, 95, yPos - 14, track); // yPos is middle, icon top needs -14 adjustment
        
        ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
        ctx.shadowBlur = 3;
        ctx.font = `18px "${mainFont}"`;
        ctx.fillStyle = '#ffffff';
        const title = this.truncateText(ctx, track.title, 360);
        ctx.fillText(title, 135, yPos);
        ctx.shadowBlur = 0;
        
        if (track.author) {
          ctx.font = `16px "${mainFont}"`;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          const author = this.truncateText(ctx, track.author, 180); // Shorter for author on same line
          // Attempt to fit author on the same line if space allows, or underneath if needed.
          // This part is tricky without more complex layout logic. For now, keep it simple.
          // If drawing author below: ctx.fillText(author, 135, yPos + 22);
        }
        
        ctx.font = `18px "${mainFont}"`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'right';
        ctx.fillText(this.formatTime(track.length || 0), width - 190, yPos);
        
        const requesterName = track.requester?.username || 'Unknown';
        ctx.font = `16px "${mainFont}"`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillText(this.truncateText(ctx, requesterName, 100), width - 60, yPos);
        
        yPos += rowHeight;
      }
    } else {
      ctx.font = `20px "${mainFont}"`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(page > 1 ? "NO MORE TRACKS" : "QUEUE IS EMPTY", width / 2, queueListStartY + queueListHeight / 2);
    }
    
    // Footer
    const footerPanelY = height - 70;
    this.drawGlassPanel(ctx, 30, footerPanelY, width - 60, 50, 16, 'rgba(211, 84, 0, 0.5)', 'rgba(255, 99, 71, 0.6)', 2); // Orange-red panel
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = `16px "${mainFont}"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Total Tracks in Queue: ${tracks.length} | Use buttons to navigate`, width / 2, footerPanelY + 25);
    
    return canvas.toBuffer('image/png');
  }
}
// Used to help approximate sliceStartIndex calculation, will be replaced by command's logic
const QueueCardClassUsedByCommand = QueueCard; 
