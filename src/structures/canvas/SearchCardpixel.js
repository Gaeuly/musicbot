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

const CARD_WIDTH = 520; // Consistent with other pixel cards
const CARD_HEIGHT = 360; // Slightly shorter than QueueCardPixel, taller than MusicCardPixel

// Using color palette from MusicCardPixel.js and QueueCardPixel.js
const PIXEL_COLORS = {
  BG_PRIMARY: '#10101E',
  BG_GRID: 'rgba(80, 80, 150, 0.12)',
  STAR_COLOR: 'rgba(200, 200, 255, 0.55)',

  PANEL_BG: '#1C1C2B',
  PANEL_BORDER_OUTER: '#00FFFF',
  PANEL_BORDER_HIGHLIGHT: '#E0E0FF',
  
  TEXT_HEADER: '#FFFF00',      // For "SEARCH RESULTS"
  TEXT_SUBHEADER: '#A0A0B8', // For "Searched for:", "Platform:"
  TEXT_QUERY: '#FFFFFF',       // For the actual search query
  TEXT_TITLE: '#FFFFFF',       // For track titles in results
  TEXT_ARTIST: '#D0D0D0',
  TEXT_INFO: '#A0A0B8',        // Timestamps, page numbers, requester
  TEXT_ACCENT: '#39FF14',      // For platform names in results
  TEXT_SHADOW: 'rgba(0,0,0,0.9)',
  TEXT_ITEM_NUMBER: '#00FFFF',

  ICON_SPOTIFY: '#1DB954',
  ICON_YOUTUBE: '#FF0000',
  ICON_SOUNDCLOUD: '#FF8800',
  ICON_DEEZER: '#EF54C6',
  ICON_DEFAULT_BG: '#303040',
  ICON_TEXT: '#FFFFFF',
  ICON_BORDER: '#606070',

  RESULT_ITEM_BG_ALT: 'rgba(255, 255, 255, 0.03)',
};

const PIXEL_BORDER_WIDTH = 2;

const FONT_SIZE_MAIN_HEADER = 12; // "SEARCH RESULTS"
const FONT_SIZE_SUB_HEADER = 9;  // "Searched for:"
const FONT_SIZE_QUERY = 10;      // Actual query text
const FONT_SIZE_TRACK_TITLE = 9; // Titles in list
const FONT_SIZE_TRACK_INFO = 8;  // Artist, duration in list
const FONT_SIZE_FOOTER = 8;      // Page info, instructions

export class SearchCard{
  static ITEMS_PER_PAGE = 10; // <--- ADDED: Pixel card prefers 10 items

  constructor() {
    this._fontsInitialized = false;
    this.initFonts();
  }

  initFonts() {
    try {
      if (!this._fontsInitialized) {
        GlobalFonts.registerFromPath(path.join(__dirname, '../../assets/fonts/PressStart2P-Regular.ttf'), 'Press Start 2P');
        this._fontsInitialized = true;
      }
    } catch (error) {
      logger.warn('SearchCardPixel', 'Press Start 2P font not found. Using fallback.');
    }
  }

  getFont(size = FONT_SIZE_TRACK_INFO) {
    const family = GlobalFonts.has('Press Start 2P') ? 'Press Start 2P' : 'Arial';
    return `${size}px "${family}"`;
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
    if (ellipsisWidth > maxWidth && maxWidth > ctx.measureText('.').width) return '.';
    if (ellipsisWidth > maxWidth) return '';

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

  drawPixelatedPanel(ctx, x, y, width, height, bgColor, outerBorder, highlightBorder, borderWidth = PIXEL_BORDER_WIDTH) {
    const ix = Math.floor(x); const iy = Math.floor(y);
    const iw = Math.floor(width); const ih = Math.floor(height);
    const ibw = Math.floor(borderWidth);

    ctx.fillStyle = outerBorder; ctx.fillRect(ix, iy, iw, ih);
    ctx.fillStyle = highlightBorder; ctx.fillRect(ix + ibw, iy + ibw, iw - 2 * ibw, ih - 2 * ibw);
    ctx.fillStyle = bgColor; ctx.fillRect(ix + ibw * 2, iy + ibw * 2, iw - 4 * ibw, ih - 4 * ibw);
  }

  drawRetroGridBackground(ctx, width, height) {
    ctx.fillStyle = PIXEL_COLORS.BG_PRIMARY; ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = PIXEL_COLORS.BG_GRID; ctx.lineWidth = 1;
    const gridSize = 20; 
    for (let i = 0; i < width; i += gridSize) { /* Grid lines */ }
    for (let i = 0; i < height; i += gridSize) { /* Grid lines */ }
    ctx.fillStyle = PIXEL_COLORS.STAR_COLOR;
    for (let i = 0; i < Math.floor((width * height) / 3000); i++) { /* Stars */ }
  }
  
  getTrackPlatformSourceInfo(track) {
    let sourceId = 'default', sourceName = 'Music', sourceChar = '?';
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

  getHeaderPlatformSourceInfo(platformString) {
    let sourceId = 'default', sourceName = 'Music', sourceChar = '?';
    const pLower = platformString.toLowerCase();
    if (pLower.includes('spotify')) { sourceId = 'spotify'; sourceName = 'Spotify'; sourceChar = 'S'; }
    else if (pLower.includes('youtube')) { sourceId = 'youtube'; sourceName = 'YouTube'; sourceChar = 'Y'; }
    else if (pLower.includes('soundcloud')) { sourceId = 'soundcloud'; sourceName = 'SoundCloud'; sourceChar = 'C'; }
    else if (pLower.includes('deezer')) { sourceId = 'deezer'; sourceName = 'Deezer'; sourceChar = 'D'; }
    else { sourceName = platformString.charAt(0).toUpperCase() + platformString.slice(1); }
    return { id: sourceId, name: sourceName, char: sourceChar };
  }

  async loadPlatformLogo(sourceId) {
    try {
      const logoPath = path.join(__dirname, `../../assets/images/${sourceId}.png`);
      return null; 
    } catch (error) {
      return null;
    }
  }

  async drawPlatformIcon(ctx, x, y, sourceInput, iconSize = 11) {
    ctx.save();
    let platformInfo;
    if (typeof sourceInput === 'string') platformInfo = this.getHeaderPlatformSourceInfo(sourceInput);
    else platformInfo = this.getTrackPlatformSourceInfo(sourceInput);
    
    let bgColor = PIXEL_COLORS.ICON_DEFAULT_BG;
    switch (platformInfo.id) {
      case 'spotify': bgColor = PIXEL_COLORS.ICON_SPOTIFY; break;
      case 'youtube': bgColor = PIXEL_COLORS.ICON_YOUTUBE; break;
      case 'soundcloud': bgColor = PIXEL_COLORS.ICON_SOUNDCLOUD; break;
      case 'deezer': bgColor = PIXEL_COLORS.ICON_DEEZER; break;
    }
    const ix = Math.floor(x); const iy = Math.floor(y); const isize = Math.floor(iconSize);

    ctx.fillStyle = bgColor; ctx.fillRect(ix, iy, isize, isize);
    ctx.strokeStyle = PIXEL_COLORS.ICON_BORDER; ctx.lineWidth = 1;
    ctx.strokeRect(ix - 0.5, iy - 0.5, isize + 1, isize + 1);
    
    const charFontSize = Math.max(FONT_SIZE_TRACK_INFO -1, Math.floor(isize * 0.7));
    ctx.font = this.getFont(charFontSize);
    ctx.textAlign = 'center';
    const textMetrics = ctx.measureText(platformInfo.char);
    const charYOffset = Math.round((isize - (textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent)) / 2) + textMetrics.actualBoundingBoxAscent -1;

    this.drawTextWithShadow(ctx, platformInfo.char, ix + isize / 2, iy + charYOffset, PIXEL_COLORS.ICON_TEXT, 'rgba(0,0,0,0.7)', 1);
    ctx.textAlign = 'left'; 
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
    const canvas = createCanvas(CARD_WIDTH, CARD_HEIGHT);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.textBaseline = 'top'; 
    
    this.drawRetroGridBackground(ctx, CARD_WIDTH, CARD_HEIGHT);

    const PANEL_MARGIN = 7; 
    const PANEL_BORDER_TOTAL_THICKNESS = PIXEL_BORDER_WIDTH * 2;
    const CONTENT_PADDING = 6; 
    const CONTENT_X_START = PANEL_MARGIN + PANEL_BORDER_TOTAL_THICKNESS + CONTENT_PADDING;
    const CONTENT_Y_START = PANEL_MARGIN + PANEL_BORDER_TOTAL_THICKNESS + CONTENT_PADDING;
    const CONTENT_WIDTH = CARD_WIDTH - 2 * (PANEL_MARGIN + PANEL_BORDER_TOTAL_THICKNESS + CONTENT_PADDING);
    const CONTENT_RIGHT_EDGE = CONTENT_X_START + CONTENT_WIDTH;
    const ELEMENT_SPACING_Y = 3; 
    const SECTION_SPACING_Y = 6;

    this.drawPixelatedPanel(ctx, PANEL_MARGIN, PANEL_MARGIN, CARD_WIDTH - 2 * PANEL_MARGIN, CARD_HEIGHT - 2 * PANEL_MARGIN, 
        PIXEL_COLORS.PANEL_BG, PIXEL_COLORS.PANEL_BORDER_OUTER, PIXEL_COLORS.PANEL_BORDER_HIGHLIGHT);

    let currentY = CONTENT_Y_START;

    ctx.font = this.getFont(FONT_SIZE_MAIN_HEADER);
    const headerText = "SEARCH RESULTS";
    const headerTextWidth = ctx.measureText(headerText).width;
    const headerIconSize = 16;
    const headerTotalWidth = headerTextWidth + headerIconSize + 5; 
    const headerStartX = (CARD_WIDTH - headerTotalWidth) / 2;

    this.drawTextWithShadow(ctx, headerText, headerStartX, currentY, PIXEL_COLORS.TEXT_HEADER);
    await this.drawPlatformIcon(ctx, headerStartX + headerTextWidth + 5, currentY - 1, platform, headerIconSize); 

    currentY += FONT_SIZE_MAIN_HEADER + SECTION_SPACING_Y;

    const queryInfoY = currentY;
    ctx.font = this.getFont(FONT_SIZE_SUB_HEADER);
    const searchedForText = "SEARCHED FOR:";
    this.drawTextWithShadow(ctx, searchedForText, CONTENT_X_START, queryInfoY, PIXEL_COLORS.TEXT_SUBHEADER);
    
    ctx.font = this.getFont(FONT_SIZE_QUERY);
    const queryTextX = CONTENT_X_START + ctx.measureText(searchedForText).width + 5;
    const queryMaxWidth = CONTENT_RIGHT_EDGE - queryTextX;
    this.drawTextWithShadow(ctx, this.truncateText(ctx, `"${query.toUpperCase()}"`, queryMaxWidth), queryTextX, queryInfoY -1, PIXEL_COLORS.TEXT_QUERY);
    currentY += FONT_SIZE_QUERY + SECTION_SPACING_Y;

    const resultsHeaderY = currentY;
    ctx.font = this.getFont(FONT_SIZE_SUB_HEADER);
    this.drawTextWithShadow(ctx, "TOP TRACKS:", CONTENT_X_START, resultsHeaderY, PIXEL_COLORS.TEXT_SUBHEADER);
    ctx.textAlign = 'right';
    this.drawTextWithShadow(ctx, `PAGE ${page}/${totalPages}`, CONTENT_RIGHT_EDGE, resultsHeaderY, PIXEL_COLORS.TEXT_INFO);
    ctx.textAlign = 'left';
    currentY += FONT_SIZE_SUB_HEADER + ELEMENT_SPACING_Y;

    const resultsListStartY = currentY;
    const resultItemHeight = FONT_SIZE_TRACK_TITLE + FONT_SIZE_TRACK_INFO + ELEMENT_SPACING_Y * 2 + 2; 
    // VVVVVV MODIFIED VVVVVV
    const maxItemsToDisplayOnCard = SearchCard.ITEMS_PER_PAGE; // Use static property
    // ^^^^^^ MODIFIED ^^^^^^

    if (tracks.length > 0) {
      for (let i = 0; i < Math.min(tracks.length, maxItemsToDisplayOnCard); i++) {
        const track = tracks[i];
        const itemY = resultsListStartY + i * resultItemHeight;

        if (itemY + resultItemHeight > CARD_HEIGHT - (PANEL_MARGIN + PANEL_BORDER_TOTAL_THICKNESS + CONTENT_PADDING + FONT_SIZE_FOOTER + SECTION_SPACING_Y)) break;

        if (i % 2 !== 0) {
          ctx.fillStyle = PIXEL_COLORS.RESULT_ITEM_BG_ALT;
          ctx.fillRect(CONTENT_X_START - 2, itemY - 1, CONTENT_WIDTH + 4, resultItemHeight - 1);
        }

        let itemCurrentX = CONTENT_X_START;
        let textLine1Y = itemY;
        let textLine2Y = textLine1Y + FONT_SIZE_TRACK_TITLE + ELEMENT_SPACING_Y -1;

        ctx.font = this.getFont(FONT_SIZE_TRACK_TITLE);
        // VVVVVV MODIFIED VVVVVV
        const itemNumText = `${(page - 1) * SearchCard.ITEMS_PER_PAGE + i + 1}.`; // Use static property for numbering
        // ^^^^^^ MODIFIED ^^^^^^
        this.drawTextWithShadow(ctx, itemNumText, itemCurrentX, textLine1Y, PIXEL_COLORS.TEXT_ITEM_NUMBER);
        itemCurrentX += ctx.measureText(itemNumText).width + 4;

        const trackIconSize = 10;
        await this.drawPlatformIcon(ctx, itemCurrentX, textLine1Y + Math.floor((FONT_SIZE_TRACK_TITLE - trackIconSize)/2), track, trackIconSize);
        itemCurrentX += trackIconSize + 4;
        
        const titleMaxWidth = CONTENT_RIGHT_EDGE - itemCurrentX - ctx.measureText(" 00:00").width - 3;
        this.drawTextWithShadow(ctx, this.truncateText(ctx, (track.title || "Unknown Track").toUpperCase(), titleMaxWidth), itemCurrentX, textLine1Y, PIXEL_COLORS.TEXT_TITLE);
        
        ctx.textAlign = 'right';
        ctx.font = this.getFont(FONT_SIZE_TRACK_INFO); 
        this.drawTextWithShadow(ctx, this.formatTime(track.length || 0), CONTENT_RIGHT_EDGE, textLine1Y +1, PIXEL_COLORS.TEXT_INFO);
        ctx.textAlign = 'left';

        ctx.font = this.getFont(FONT_SIZE_TRACK_INFO);
        let line2Text = "";
        if (track.author) line2Text += `BY: ${track.author.toUpperCase()}`;
        const requesterName = requester?.username?.toUpperCase() || "N/A";
        if (requesterName !== "N/A") line2Text += `${track.author ? " | " : ""}REQ: ${requesterName}`;
        
        const line2XStart = CONTENT_X_START + ctx.measureText("00.").width + 4; 
        const line2MaxWidth = CONTENT_RIGHT_EDGE - line2XStart;
        this.drawTextWithShadow(ctx, this.truncateText(ctx, line2Text, line2MaxWidth), line2XStart, textLine2Y, PIXEL_COLORS.TEXT_INFO);
      }
    } else {
      ctx.font = this.getFont(FONT_SIZE_SUB_HEADER);
      ctx.textAlign = 'center';
      this.drawTextWithShadow(ctx, "NO RESULTS ON THIS PAGE", CARD_WIDTH / 2, resultsListStartY + 20, PIXEL_COLORS.TEXT_INFO);
      ctx.textAlign = 'left';
    }

    const footerY = CARD_HEIGHT - (PANEL_MARGIN + PANEL_BORDER_TOTAL_THICKNESS + CONTENT_PADDING) - FONT_SIZE_FOOTER - 2;
    ctx.font = this.getFont(FONT_SIZE_FOOTER);
    ctx.textAlign = 'center';
    this.drawTextWithShadow(ctx, "SELECT TRACKS BELOW | USE BUTTONS FOR PAGES", CARD_WIDTH / 2, footerY, PIXEL_COLORS.TEXT_INFO);
    ctx.textAlign = 'left';

    return canvas.toBuffer('image/png');
  }
}
