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

const CARD_WIDTH = 520;
const CARD_HEIGHT = 210;

const PIXEL_COLORS = {
  BG_PRIMARY: '#1a1a2e',
  BG_GRID: 'rgba(50, 50, 70, 0.1)',
  STAR_COLOR: 'rgba(200, 200, 255, 0.05)',

  PANEL_BG: '#202038',
  PANEL_BORDER_OUTER: '#4a00e0',
  PANEL_BORDER_HIGHLIGHT: '#6a00f0',

  TEXT_TITLE: '#e0b0ff',
  TEXT_ARTIST: '#bbbbdd',
  TEXT_INFO: '#9999bb',
  TEXT_ACCENT: '#00f2fe',
  TEXT_REQUESTER: '#f06292',
  TEXT_SHADOW: 'rgba(0, 0, 0, 0.8)',

  PROGRESS_BAR_BG_MAIN: '#30304a',
  PROGRESS_BAR_FILLED_START: '#00c6ff',
  PROGRESS_BAR_FILLED_END: '#0072ff',
  PROGRESS_BAR_UNLIT_PIXEL: '#3a3a5a',
  PROGRESS_BAR_OUTLINE: '#505070',

  HEART_FILLED: '#ff4081',
  HEART_EMPTY: '#6a4081',

  ICON_SPOTIFY: '#1db954',
  ICON_YOUTUBE: '#ff0000',
  ICON_SOUNDCLOUD: '#ff7700',
  ICON_DEEZER: '#ef5466',
  ICON_DEFAULT_BG: '#3a3a5a',
  ICON_TEXT: '#ffffff',
  ICON_BORDER: '#505070',
};

const PIXEL_BORDER_WIDTH = 2;

const FONT_SIZE_TITLE = 11; 
const FONT_SIZE_DEFAULT = 9;
const FONT_SIZE_SMALL = 8; 

export class MusicCard {
  constructor() {
    this._fontsInitialized = false;
    this.initFonts();
  }

  initFonts() {
    try {
      if (!this._fontsInitialized) {
        GlobalFonts.registerFromPath(path.join(__dirname, '../../assets/fonts/PressStart-Regular.ttf'), 'Press Start 2P');
        this._fontsInitialized = true;
      }
    } catch (error) {
      logger.warn('MusicCard', 'Press Start 2P font not found. Please add PressStart2P-Regular.ttf to assets/fonts/. Default system font will be used.');
    }
  }

  getFont(size = FONT_SIZE_DEFAULT) {
    const family = GlobalFonts.has('Press Start 2P') ? 'Press Start 2P' : 'Arial';
    return `${size}px "${family}"`;
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
  }

  formatTime(ms) {
    if (!ms || isNaN(ms)) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    const m = (Math.floor(totalSeconds / 60) % 60).toString().padStart(2, '0');
    const h = Math.floor(totalSeconds / 3600);
    return h > 0 ? `${h.toString().padStart(2, '0')}:${m}:${s}` : `${m}:${s}`;
  }

  truncateText(ctx, text = '', maxWidth) {
    if (!text) return '';
    text = String(text);
    if (maxWidth <= 0) return '...';
    if (ctx.measureText(text).width <= maxWidth) return text;

    let truncatedText = text;
    const ellipsisWidth = ctx.measureText('...').width;
    if (ellipsisWidth > maxWidth) return '.'; 

    while (ctx.measureText(truncatedText + '...').width > maxWidth && truncatedText.length > 0) {
      truncatedText = truncatedText.slice(0, -1);
    }
    return truncatedText + '...';
  }
  
  drawTextWithShadow(ctx, text, x, y, fontColor, shadowColor = PIXEL_COLORS.TEXT_SHADOW, shadowOffset = 1) {
  const floorX = Math.floor(x);
  const floorY = Math.floor(y);

  ctx.fillStyle = shadowColor;
  ctx.fillText(text, floorX + shadowOffset, floorY + shadowOffset);

  ctx.fillStyle = fontColor;
  ctx.fillText(text, floorX, floorY);
}

 drawPixelatedPanel(ctx, x, y, width, height, bgColor, outerBorder, highlightBorder) {
  const radius = 10;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();

  ctx.fillStyle = highlightBorder;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = outerBorder;
  ctx.stroke();

  ctx.fillStyle = bgColor;
  ctx.fill();
}

 drawRetroGridBackground(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, PIXEL_COLORS.BG_PRIMARY);
  gradient.addColorStop(1, '#101025');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = PIXEL_COLORS.BG_GRID;
  ctx.lineWidth = 1;
  const gridSize = 10;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  for (let i = 0; i < 70; i++) {
    const pX = Math.random() * width;
    const pY = Math.random() * height;
    const radius = Math.random() * 1.5 + 0.5;
    ctx.beginPath();
    ctx.arc(pX, pY, radius, 0, Math.PI * 2);
    ctx.fillStyle = PIXEL_COLORS.STAR_COLOR;
    ctx.fill();
  }
}

  getPlatformSourceInfo(track) {
    let sourceId = 'default';
    let sourceName = 'Music';
    let sourceChar = '?';

    const uri = track?.uri?.toLowerCase() || '';
    const trackSource = track?.sourceName?.toLowerCase() || track?.raw?.source?.toLowerCase() || '';

    if (uri.includes('spotify') || trackSource.includes('spotify')) {
      sourceId = 'spotify'; sourceName = 'Spotify'; sourceChar = 'S';
    } else if (uri.includes('youtube') || trackSource.includes('youtube')) {
      sourceId = 'youtube'; sourceName = 'YouTube'; sourceChar = 'Y';
    } else if (uri.includes('soundcloud') || trackSource.includes('soundcloud')) {
      sourceId = 'soundcloud'; sourceName = 'SoundCloud'; sourceChar = 'C';
    } else if (uri.includes('deezer') || trackSource.includes('deezer')) {
      sourceId = 'deezer'; sourceName = 'Deezer'; sourceChar = 'D';
    }
    return { id: sourceId, name: sourceName, char: sourceChar };
  }

  drawPlatformIcon(ctx, x, y, track, size = 12) {
    const platformInfo = this.getPlatformSourceInfo(track);
    let bgColor = PIXEL_COLORS.ICON_DEFAULT_BG;

    switch (platformInfo.id) {
      case 'spotify': bgColor = PIXEL_COLORS.ICON_SPOTIFY; break;
      case 'youtube': bgColor = PIXEL_COLORS.ICON_YOUTUBE; break;
      case 'soundcloud': bgColor = PIXEL_COLORS.ICON_SOUNDCLOUD; break;
      case 'deezer': bgColor = PIXEL_COLORS.ICON_DEEZER; break;
    }
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const isize = Math.floor(size);

    ctx.fillStyle = bgColor;
    ctx.fillRect(ix, iy, isize, isize);

    ctx.strokeStyle = PIXEL_COLORS.ICON_BORDER;
    ctx.lineWidth = 1;
    ctx.strokeRect(ix -0.5, iy-0.5, isize+1, isize+1);
    
    const charFontSize = Math.floor(isize * 0.7);
    ctx.font = this.getFont(charFontSize);
    ctx.textAlign = 'center';
    const charYOffset = Math.round((isize - charFontSize) / 2) + (charFontSize === FONT_SIZE_SMALL ? 1 : 1);
    this.drawTextWithShadow(ctx, platformInfo.char, ix + isize / 2, iy + charYOffset , PIXEL_COLORS.ICON_TEXT, 'rgba(0,0,0,0.7)', 1);
    ctx.textAlign = 'left';
  }

  drawPixelHeart(ctx, x, y, size, filled = false) {
    ctx.fillStyle = filled ? PIXEL_COLORS.HEART_FILLED : PIXEL_COLORS.HEART_EMPTY;
    const s = Math.max(1, Math.floor(size / 5)); 
    const ix = Math.floor(x);
    const iy = Math.floor(y);

    ctx.fillRect(ix + s, iy, s * 3, s);
    ctx.fillRect(ix, iy + s, s * 5, s);
    ctx.fillRect(ix + s, iy + s * 2, s * 3, s);
    ctx.fillRect(ix + s * 2, iy + s * 3, s, s);
  }


  async generateNowPlayingCard({ 
    track, 
    position, 
    isLiked,
    guildName,
    guildIcon,
    player
  }) {
    if (!track) {
        logger.error('MusicCard', 'Track data is missing for card generation.');
        const errorCanvas = createCanvas(CARD_WIDTH, CARD_HEIGHT);
        const errorCtx = errorCanvas.getContext('2d');
        errorCtx.fillStyle = 'black';
        errorCtx.fillRect(0,0,CARD_WIDTH, CARD_HEIGHT);
        errorCtx.font = this.getFont(12);
        errorCtx.fillStyle = 'red';
        errorCtx.textAlign = 'center';
        errorCtx.fillText('Error: No Track Data', CARD_WIDTH/2, CARD_HEIGHT/2);
        return errorCanvas.toBuffer('image/png');
    }

    const canvas = createCanvas(CARD_WIDTH, CARD_HEIGHT);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.textBaseline = 'top'; 
    
    this.drawRetroGridBackground(ctx, CARD_WIDTH, CARD_HEIGHT);

    const PANEL_MARGIN = 10;
    const PANEL_BORDER_TOTAL_THICKNESS = PIXEL_BORDER_WIDTH * 2;
    const CONTENT_PADDING = 8;

    const CONTENT_X_START = PANEL_MARGIN + PANEL_BORDER_TOTAL_THICKNESS + CONTENT_PADDING;
    const CONTENT_Y_START = PANEL_MARGIN + PANEL_BORDER_TOTAL_THICKNESS + CONTENT_PADDING;
    const CONTENT_RIGHT_EDGE = CARD_WIDTH - (PANEL_MARGIN + PANEL_BORDER_TOTAL_THICKNESS + CONTENT_PADDING);
    
    const ELEMENT_SPACING_Y = 5;
    const SECTION_SPACING_Y = 10;

    this.drawPixelatedPanel(ctx, 
        PANEL_MARGIN, 
        PANEL_MARGIN, 
        CARD_WIDTH - 2 * PANEL_MARGIN, 
        CARD_HEIGHT - 2 * PANEL_MARGIN, 
        PIXEL_COLORS.PANEL_BG, 
        PIXEL_COLORS.PANEL_BORDER_OUTER, 
        PIXEL_COLORS.PANEL_BORDER_HIGHLIGHT
    );

    let currentX = CONTENT_X_START;
    let currentY = CONTENT_Y_START;

    const guildIconSize = 30;
    const GUILD_TEXT_OFFSET_Y = 2;
    if (guildIcon) {
      try {
        const guildIconImg = await loadImage(guildIcon);
        ctx.fillStyle = PIXEL_COLORS.PANEL_BORDER_OUTER; 
        ctx.fillRect(Math.floor(currentX) - 2, Math.floor(currentY) - 2, guildIconSize + 4, guildIconSize + 4);
        ctx.fillStyle = PIXEL_COLORS.PANEL_BORDER_HIGHLIGHT;
        ctx.fillRect(Math.floor(currentX) - 1, Math.floor(currentY) - 1, guildIconSize + 2, guildIconSize + 2);
        ctx.drawImage(guildIconImg, currentX, currentY, guildIconSize, guildIconSize);
      } catch (error) {
        logger.warn('MusicCard', `Failed to load guild icon: ${error.message}`);
        ctx.fillStyle = PIXEL_COLORS.ICON_DEFAULT_BG;
        ctx.fillRect(currentX, currentY, guildIconSize, guildIconSize);
      }
    } else {
        ctx.fillStyle = PIXEL_COLORS.ICON_DEFAULT_BG;
        ctx.fillRect(currentX, currentY, guildIconSize, guildIconSize);
    }
    
    const guildTextX = currentX + guildIconSize + 8;
    ctx.font = this.getFont(FONT_SIZE_DEFAULT);
    const guildTextY = currentY + Math.floor((guildIconSize - FONT_SIZE_DEFAULT)/2) + GUILD_TEXT_OFFSET_Y;
    const guildNameMaxWidth = CONTENT_RIGHT_EDGE - guildTextX;
    this.drawTextWithShadow(ctx, this.truncateText(ctx, (guildName || "SERVER").toUpperCase(), guildNameMaxWidth), guildTextX, guildTextY, PIXEL_COLORS.TEXT_INFO);

    currentY += guildIconSize + SECTION_SPACING_Y;
    
    const thumbSize = 85; 
    const thumbX = CONTENT_X_START;
    const thumbY = currentY;

    ctx.fillStyle = PIXEL_COLORS.PANEL_BORDER_OUTER; 
    ctx.fillRect(Math.floor(thumbX) - 3, Math.floor(thumbY) - 3, thumbSize + 6, thumbSize + 6);
    ctx.fillStyle = PIXEL_COLORS.PANEL_BORDER_HIGHLIGHT;
    ctx.fillRect(Math.floor(thumbX) - 2, Math.floor(thumbY) - 2, thumbSize + 4, thumbSize + 4);

    if (track?.thumbnail) {
      try {
        const thumbnailImg = await loadImage(track.thumbnail);
        ctx.drawImage(thumbnailImg, thumbX, thumbY, thumbSize, thumbSize);
      } catch (error) {
        logger.warn('MusicCard', `Failed to load track thumbnail: ${error.message}`);
        ctx.fillStyle = PIXEL_COLORS.ICON_DEFAULT_BG;
        ctx.fillRect(thumbX, thumbY, thumbSize, thumbSize);
      }
    } else {
        ctx.fillStyle = PIXEL_COLORS.ICON_DEFAULT_BG;
        ctx.fillRect(thumbX, thumbY, thumbSize, thumbSize);
    }

    let infoStartX = thumbX + thumbSize + 12;
    let infoCurrentY = thumbY;
    const infoMaxWidth = CONTENT_RIGHT_EDGE - infoStartX;

    ctx.font = this.getFont(FONT_SIZE_TITLE);
    const title = this.truncateText(ctx, (track.title || "Unknown Title").toUpperCase(), infoMaxWidth);
    this.drawTextWithShadow(ctx, title, infoStartX, infoCurrentY, PIXEL_COLORS.TEXT_TITLE);
    infoCurrentY += FONT_SIZE_TITLE + ELEMENT_SPACING_Y + 2;

    ctx.font = this.getFont(FONT_SIZE_DEFAULT);
    if (track.author) {
      const author = this.truncateText(ctx, track.author.toUpperCase(), infoMaxWidth);
      this.drawTextWithShadow(ctx, author, infoStartX, infoCurrentY, PIXEL_COLORS.TEXT_ARTIST);
      infoCurrentY += FONT_SIZE_DEFAULT + ELEMENT_SPACING_Y;
    }
    
    const platformIconSize = 13; 
    this.drawPlatformIcon(ctx, infoStartX, infoCurrentY, track, platformIconSize);
    const platformInfo = this.getPlatformSourceInfo(track);
    ctx.font = this.getFont(FONT_SIZE_SMALL);
    const platformTextX = infoStartX + platformIconSize + 6;
    const platformTextY = infoCurrentY + Math.floor((platformIconSize - FONT_SIZE_SMALL)/2) + 1;
    const platformNameMaxWidth = infoMaxWidth - (platformIconSize + 6);
    this.drawTextWithShadow(ctx, this.truncateText(ctx, platformInfo.name.toUpperCase(), platformNameMaxWidth), platformTextX, platformTextY, PIXEL_COLORS.TEXT_ACCENT);
    infoCurrentY += platformIconSize + ELEMENT_SPACING_Y + 2;

    ctx.font = this.getFont(FONT_SIZE_DEFAULT);
    const requesterName = track.requester?.username || track.requester?.tag || 'UNKNOWN';
    const reqTextPrefix = "REQ: ";
    const requesterText = `${reqTextPrefix}${this.truncateText(ctx, requesterName.toUpperCase(), infoMaxWidth - ctx.measureText(reqTextPrefix).width)}`;
    this.drawTextWithShadow(ctx, requesterText, infoStartX, infoCurrentY, PIXEL_COLORS.TEXT_REQUESTER);
    infoCurrentY += FONT_SIZE_DEFAULT + ELEMENT_SPACING_Y + 2;

    const heartSize = 12;
    const heartYOffset = 0;
    this.drawPixelHeart(ctx, infoStartX, infoCurrentY + heartYOffset, heartSize, isLiked); 
    
    let loopText = 'NO LOOP';
    if (player.loop === 'track') loopText = 'LOOP TRK';
    else if (player.loop === 'queue') loopText = 'LOOP QUE';
    
    const playerStatusTextContent = `VOL:${player.volume}% | ${loopText}`;
    const playerStatusTextX = infoStartX + heartSize + 8;
    ctx.font = this.getFont(FONT_SIZE_SMALL);
    const playerStatusTextY = infoCurrentY + Math.floor((heartSize - FONT_SIZE_SMALL)/2) + heartYOffset;
    const playerStatusMaxWidth = infoMaxWidth - (heartSize + 8);
    this.drawTextWithShadow(ctx, this.truncateText(ctx, playerStatusTextContent, playerStatusMaxWidth), playerStatusTextX, playerStatusTextY, PIXEL_COLORS.TEXT_INFO);

    currentY = thumbY + thumbSize + SECTION_SPACING_Y + 5; 
    
    const barHeight = 12;
    const barActualWidth = CONTENT_RIGHT_EDGE - CONTENT_X_START;
    
    ctx.fillStyle = PIXEL_COLORS.PROGRESS_BAR_BG_MAIN;
    ctx.fillRect(CONTENT_X_START, currentY, barActualWidth, barHeight);

    const duration = track.length || 0;
    const currentPosition = Math.min(position, duration);
    const progress = duration > 0 ? (currentPosition / duration) : (track.isStream ? 1 : 0);

    const pixelBlockWidth = 4;
    const pixelGap = 2;
    const pixelBlockHeight = barHeight - 4; 
    const pixelBlockY = currentY + 2; 
    const totalUnitWidth = pixelBlockWidth + pixelGap;
    
    const numPossibleBlocks = Math.floor(barActualWidth / totalUnitWidth);
    const numLitBlocks = Math.floor(progress * numPossibleBlocks);

    const startColorRGB = this.hexToRgb(PIXEL_COLORS.PROGRESS_BAR_FILLED_START);
    const endColorRGB = this.hexToRgb(PIXEL_COLORS.PROGRESS_BAR_FILLED_END);

    if (startColorRGB && endColorRGB) {
        for (let i = 0; i < numPossibleBlocks; i++) {
            const blockActualX = CONTENT_X_START + i * totalUnitWidth;
            if (i < numLitBlocks) {
                let t = 0;
                if (numLitBlocks > 1) {
                    t = i / (numLitBlocks - 1);
                }
                const r = Math.floor(startColorRGB.r * (1 - t) + endColorRGB.r * t);
                const g = Math.floor(startColorRGB.g * (1 - t) + endColorRGB.g * t);
                const b = Math.floor(startColorRGB.b * (1 - t) + endColorRGB.b * t);
                ctx.fillStyle = `rgb(${r},${g},${b})`;
            } else {
                ctx.fillStyle = PIXEL_COLORS.PROGRESS_BAR_UNLIT_PIXEL;
            }
            ctx.fillRect(Math.floor(blockActualX), Math.floor(pixelBlockY), pixelBlockWidth, pixelBlockHeight);
        }
    } else {
        const filledWidth = Math.floor(barActualWidth * progress);
        if (filledWidth > 0) {
            ctx.fillStyle = PIXEL_COLORS.PROGRESS_BAR_FILLED_START;
            ctx.fillRect(CONTENT_X_START, currentY, filledWidth, barHeight);
        }
    }
    
    ctx.strokeStyle = PIXEL_COLORS.PROGRESS_BAR_OUTLINE;
    ctx.lineWidth = 2;
    ctx.strokeRect(Math.floor(CONTENT_X_START) - 1, Math.floor(currentY) - 1, barActualWidth + 2, barHeight + 2);

    currentY += barHeight + ELEMENT_SPACING_Y + 3; 
    ctx.font = this.getFont(FONT_SIZE_DEFAULT);
    
    ctx.textAlign = 'left';
    this.drawTextWithShadow(ctx, this.formatTime(currentPosition), CONTENT_X_START, currentY, PIXEL_COLORS.TEXT_INFO);
    
    ctx.textAlign = 'right';
    const durationText = track.isStream ? '🔴 LIVE' : this.formatTime(duration);
    this.drawTextWithShadow(ctx, durationText, CONTENT_RIGHT_EDGE, currentY, PIXEL_COLORS.TEXT_INFO);
    
    const textBelowProgressBarY = currentY + 18;
    const textBelowProgressBarY2 = textBelowProgressBarY + FONT_SIZE_DEFAULT + ELEMENT_SPACING_Y + 2;

    const queueCount = player.queue?.length || 0;
    ctx.textAlign = 'center';
    this.drawTextWithShadow(ctx, `${queueCount} SONGS IN QUEUE`, CARD_WIDTH / 2, textBelowProgressBarY, PIXEL_COLORS.TEXT_INFO);
    
    this.drawTextWithShadow(ctx, `USE PLAY COMMAND TO QUEUE MORE SONGS`, CARD_WIDTH / 2, textBelowProgressBarY2, PIXEL_COLORS.TEXT_INFO);
    
    ctx.textAlign = 'left';

    return canvas.toBuffer('image/png');
  }
}