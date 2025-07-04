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

const CARD_WIDTH = 520;
const CARD_HEIGHT = 400; // Made taller for the queue

// Using similar color palette from MusicCardpixel.js
const PIXEL_COLORS = {
  BG_PRIMARY: '#10101E',
  BG_GRID: 'rgba(80, 80, 150, 0.12)',
  STAR_COLOR: 'rgba(200, 200, 255, 0.55)',

  PANEL_BG: '#1C1C2B',
  PANEL_BORDER_OUTER: '#00FFFF', // Main border color from MusicCardpixel
  PANEL_BORDER_HIGHLIGHT: '#E0E0FF', // Highlight from MusicCardpixel
  
  TEXT_HEADER: '#FFFF00', // For main titles like "MUSIC QUEUE"
  TEXT_TITLE: '#FFFFFF', // For track titles
  TEXT_ARTIST: '#D0D0D0',
  TEXT_INFO: '#A0A0B8', // General info, timestamps, page numbers
  TEXT_ACCENT: '#39FF14', // For platform names, special highlights
  TEXT_REQUESTER: '#8888FF',
  TEXT_SHADOW: 'rgba(0,0,0,0.9)',
  TEXT_ITEM_NUMBER: '#00FFFF', // Color for queue item numbers

  PROGRESS_BAR_BG_MAIN: '#101018',
  PROGRESS_BAR_FILLED_START: '#00FF00',
  PROGRESS_BAR_FILLED_END: '#A0FF40', 
  PROGRESS_BAR_UNLIT_PIXEL: '#303038',
  PROGRESS_BAR_OUTLINE: '#404050',

  ICON_SPOTIFY: '#1DB954',
  ICON_YOUTUBE: '#FF0000',
  ICON_SOUNDCLOUD: '#FF8800',
  ICON_DEEZER: '#EF54C6',
  ICON_DEFAULT_BG: '#303040',
  ICON_TEXT: '#FFFFFF',
  ICON_BORDER: '#606070',

  QUEUE_ITEM_BG_ALT: 'rgba(255, 255, 255, 0.03)', // Subtle alternating background
  QUEUE_SEPARATOR_LINE: 'rgba(160, 160, 184, 0.2)', // For separating queue items if not using BG_ALT
};

const PIXEL_BORDER_WIDTH = 2;

const FONT_SIZE_HEADER = 12; // For "MUSIC QUEUE"
const FONT_SIZE_TITLE = 10; // For track titles
const FONT_SIZE_DEFAULT = 9;
const FONT_SIZE_SMALL = 8; 

export class QueueCard {
  static ITEMS_PER_PAGE_FIRST = 8; // <--- ADDED: For page 1 (pixel theme)
  static ITEMS_PER_PAGE_OTHER = 11; // <--- ADDED: For other pages (pixel theme)

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
      logger.warn('QueueCardPixel', 'Press Start 2P font not found. Please add PressStart2P-Regular.ttf to assets/fonts/. Default system font will be used.');
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
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const iw = Math.floor(width);
    const ih = Math.floor(height);
    const ibw = Math.floor(borderWidth);

    ctx.fillStyle = outerBorder;
    ctx.fillRect(ix, iy, iw, ih);

    ctx.fillStyle = highlightBorder;
    ctx.fillRect(ix + ibw, iy + ibw, iw - 2 * ibw, ih - 2 * ibw);
    
    ctx.fillStyle = bgColor;
    ctx.fillRect(ix + ibw * 2, iy + ibw * 2, iw - 4 * ibw, ih - 4 * ibw);
  }

  drawRetroGridBackground(ctx, width, height) {
    ctx.fillStyle = PIXEL_COLORS.BG_PRIMARY;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = PIXEL_COLORS.BG_GRID;
    ctx.lineWidth = 1;
    const gridSize = 20; 
    for (let i = 0; i < width; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(Math.floor(i) + 0.5, 0);
      ctx.lineTo(Math.floor(i) + 0.5, height);
      ctx.stroke();
    }
    for (let i = 0; i < height; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, Math.floor(i) + 0.5);
      ctx.lineTo(width, Math.floor(i) + 0.5);
      ctx.stroke();
    }

    ctx.fillStyle = PIXEL_COLORS.STAR_COLOR;
    for (let i = 0; i < Math.floor((width * height) / 3000); i++) { // Adjusted star count
        const pX = Math.random() * width;
        const pY = Math.random() * height;
        const pSize = Math.random() < 0.6 ? 1 : (Math.random() < 0.85 ? 2 : 3) ;
        ctx.fillRect(Math.floor(pX), Math.floor(pY), pSize, pSize);
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

  drawPlatformIcon(ctx, x, y, track, size = 11) { // Default size for queue items
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
    
    const charFontSize = Math.max(FONT_SIZE_SMALL -1, Math.floor(isize * 0.7));
    ctx.font = this.getFont(charFontSize);
    ctx.textAlign = 'center';
    const textMetrics = ctx.measureText(platformInfo.char);
    const charYOffset = Math.round((isize - (textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent)) / 2) + textMetrics.actualBoundingBoxAscent -1;

    this.drawTextWithShadow(ctx, platformInfo.char, ix + isize / 2, iy + charYOffset , PIXEL_COLORS.ICON_TEXT, 'rgba(0,0,0,0.7)', 1);
    ctx.textAlign = 'left'; // Reset
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
    player // For current track's loop status
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

    // Header: Guild Info & Title
    const headerIconSize = 18;
    if (guildIcon) {
      try {
        const guildIconImg = await loadImage(guildIcon);
        ctx.drawImage(guildIconImg, currentX, currentY, headerIconSize, headerIconSize);
      } catch (error) {
        logger.warn('QueueCardPixel', `Failed to load guild icon: ${error.message}`);
        ctx.fillStyle = PIXEL_COLORS.ICON_DEFAULT_BG;
        ctx.fillRect(currentX, currentY, headerIconSize, headerIconSize);
      }
    } else {
        ctx.fillStyle = PIXEL_COLORS.ICON_DEFAULT_BG;
        ctx.fillRect(currentX, currentY, headerIconSize, headerIconSize);
    }
    
    ctx.font = this.getFont(FONT_SIZE_DEFAULT);
    const guildTextX = currentX + headerIconSize + 5;
    const guildTextMaxWidth = CONTENT_WIDTH / 2 - (headerIconSize + 5) - 5;
    const guildTextY = currentY + Math.floor((headerIconSize - FONT_SIZE_DEFAULT)/2) +1;
    this.drawTextWithShadow(ctx, this.truncateText(ctx, (guildName || "SERVER").toUpperCase(), guildTextMaxWidth), guildTextX, guildTextY, PIXEL_COLORS.TEXT_INFO);

    ctx.font = this.getFont(FONT_SIZE_HEADER);
    ctx.textAlign = 'center';
    this.drawTextWithShadow(ctx, "MUSIC QUEUE", CARD_WIDTH / 2, currentY + Math.floor((headerIconSize - FONT_SIZE_HEADER)/2) + 1, PIXEL_COLORS.TEXT_HEADER);
    ctx.textAlign = 'left'; // Reset

    currentY += headerIconSize + SECTION_SPACING_Y;

    // Now Playing Section (if page === 1 && current)
    if (page === 1 && current) {
      const npThumbSize = 60;
      const npThumbX = CONTENT_X_START;
      const npThumbY = currentY;

      ctx.fillStyle = PIXEL_COLORS.PANEL_BORDER_OUTER; 
      ctx.fillRect(Math.floor(npThumbX) - 1, Math.floor(npThumbY) - 1, npThumbSize + 2, npThumbSize + 2);
      ctx.fillStyle = PIXEL_COLORS.PANEL_BORDER_HIGHLIGHT;
      ctx.fillRect(Math.floor(npThumbX), Math.floor(npThumbY), npThumbSize, npThumbSize);

      if (current.thumbnail) {
        try {
          const thumbnailImg = await loadImage(current.thumbnail);
          ctx.drawImage(thumbnailImg, npThumbX, npThumbY, npThumbSize, npThumbSize);
        } catch (e) {
          ctx.fillStyle = PIXEL_COLORS.ICON_DEFAULT_BG; ctx.fillRect(npThumbX, npThumbY, npThumbSize, npThumbSize);
        }
      } else {
        ctx.fillStyle = PIXEL_COLORS.ICON_DEFAULT_BG; ctx.fillRect(npThumbX, npThumbY, npThumbSize, npThumbSize);
      }

      let npInfoX = npThumbX + npThumbSize + 6;
      let npInfoY = npThumbY;
      const npInfoMaxWidth = CONTENT_RIGHT_EDGE - npInfoX;

      ctx.font = this.getFont(FONT_SIZE_TITLE);
      this.drawTextWithShadow(ctx, this.truncateText(ctx, (current.title || "Unknown").toUpperCase(), npInfoMaxWidth), npInfoX, npInfoY, PIXEL_COLORS.TEXT_TITLE);
      npInfoY += FONT_SIZE_TITLE + ELEMENT_SPACING_Y;

      if (current.author) {
        ctx.font = this.getFont(FONT_SIZE_DEFAULT);
        this.drawTextWithShadow(ctx, this.truncateText(ctx, current.author.toUpperCase(), npInfoMaxWidth), npInfoX, npInfoY, PIXEL_COLORS.TEXT_ARTIST);
        npInfoY += FONT_SIZE_DEFAULT + ELEMENT_SPACING_Y;
      }
      
      const npPlatformIconSize = 11;
      this.drawPlatformIcon(ctx, npInfoX, npInfoY, current, npPlatformIconSize);
      const npPlatformInfo = this.getPlatformSourceInfo(current);
      ctx.font = this.getFont(FONT_SIZE_SMALL);
      const npPlatformTextX = npInfoX + npPlatformIconSize + 4;
      const npPlatformTextY = npInfoY + Math.floor((npPlatformIconSize - FONT_SIZE_SMALL)/2) + 1;
      this.drawTextWithShadow(ctx, this.truncateText(ctx, npPlatformInfo.name.toUpperCase(), npInfoMaxWidth - (npPlatformIconSize + 4)), npPlatformTextX, npPlatformTextY, PIXEL_COLORS.TEXT_ACCENT);


      currentY += npThumbSize + ELEMENT_SPACING_Y; 

      const npBarHeight = 8;
      const npBarActualWidth = CONTENT_WIDTH;
      ctx.fillStyle = PIXEL_COLORS.PROGRESS_BAR_BG_MAIN;
      ctx.fillRect(CONTENT_X_START, currentY, npBarActualWidth, npBarHeight);

      const currentDuration = current.length || 0;
      const currentPos = Math.min(position, currentDuration);
      const progress = currentDuration > 0 ? (currentPos / currentDuration) : (current.isStream ? 1 : 0);
      
      const pixelBlockWidth = 3; const pixelGap = 1; const pixelBlockHeight = npBarHeight - 2;
      const pixelBlockY = currentY + 1; const totalUnitWidth = pixelBlockWidth + pixelGap;
      const numPossibleBlocks = Math.floor(npBarActualWidth / totalUnitWidth);
      const numLitBlocks = Math.floor(progress * numPossibleBlocks);
      const startColorRGB = this.hexToRgb(PIXEL_COLORS.PROGRESS_BAR_FILLED_START);
      const endColorRGB = this.hexToRgb(PIXEL_COLORS.PROGRESS_BAR_FILLED_END);

      if (startColorRGB && endColorRGB) {
        for (let i = 0; i < numPossibleBlocks; i++) {
          const blockActualX = CONTENT_X_START + i * totalUnitWidth;
          if (i < numLitBlocks) {
            let t = numLitBlocks > 1 ? i / (numLitBlocks - 1) : 0;
            const r = Math.floor(startColorRGB.r * (1 - t) + endColorRGB.r * t);
            const g = Math.floor(startColorRGB.g * (1 - t) + endColorRGB.g * t);
            const b = Math.floor(startColorRGB.b * (1 - t) + endColorRGB.b * t);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
          } else {
            ctx.fillStyle = PIXEL_COLORS.PROGRESS_BAR_UNLIT_PIXEL;
          }
          ctx.fillRect(Math.floor(blockActualX), Math.floor(pixelBlockY), pixelBlockWidth, pixelBlockHeight);
        }
      }
      ctx.strokeStyle = PIXEL_COLORS.PROGRESS_BAR_OUTLINE; ctx.lineWidth = 1;
      ctx.strokeRect(Math.floor(CONTENT_X_START) - 0.5, Math.floor(currentY) - 0.5, npBarActualWidth + 1, npBarHeight + 1);
      currentY += npBarHeight + ELEMENT_SPACING_Y;

      ctx.font = this.getFont(FONT_SIZE_SMALL);
      this.drawTextWithShadow(ctx, this.formatTime(currentPos), CONTENT_X_START, currentY, PIXEL_COLORS.TEXT_INFO);
      ctx.textAlign = 'right';
      this.drawTextWithShadow(ctx, current.isStream ? '🔴 LIVE' : this.formatTime(currentDuration), CONTENT_RIGHT_EDGE, currentY, PIXEL_COLORS.TEXT_INFO);
      ctx.textAlign = 'left'; 

      currentY += FONT_SIZE_SMALL + SECTION_SPACING_Y;
    }

    const upcomingHeaderY = currentY;
    ctx.font = this.getFont(FONT_SIZE_DEFAULT);
    this.drawTextWithShadow(ctx, "UPCOMING:", CONTENT_X_START, upcomingHeaderY, PIXEL_COLORS.TEXT_HEADER);
    ctx.textAlign = 'right';
    this.drawTextWithShadow(ctx, `PAGE ${page}/${totalPages}`, CONTENT_RIGHT_EDGE, upcomingHeaderY, PIXEL_COLORS.TEXT_INFO);
    ctx.textAlign = 'left'; 
    currentY += FONT_SIZE_DEFAULT + ELEMENT_SPACING_Y;

    const queueListStartY = currentY;
    const queueItemHeight = FONT_SIZE_DEFAULT + FONT_SIZE_SMALL + ELEMENT_SPACING_Y * 2 + 2; 
    const maxItemsToDisplayOnThisPage = itemsPerPage; // Use the itemsPerPage passed by the command for this page

    // Determine the starting index in the full 'tracks' array for the current page
    // If page 1, start is 0. If page > 1, we need to account for items on previous pages.
    // This assumes itemsPerPage for page 1 might be different.
    // This calculation should ideally be handled by the command passing the correct slice,
    // or the command passes the full list and the card slices. Current card code slices.
    
    let effectiveGlobalStartIndex;
    if (page === 1) {
        effectiveGlobalStartIndex = 0;
    } else {
        // This assumes the command has calculated totalPages correctly based on varying itemsPerPage
        // For simplicity in the card, we'll assume the command passes 'page' correctly
        // and 'itemsPerPage' is for *this page*. The card slices from the *full* 'tracks' list.
        // The calculation for effectiveStart in the command will be more complex.
        // Here, we need to know how many items were on *previous* pages.
        // This is complex if page 1 has X items and other pages have Y items.
        // FOR THE CARD: It's simpler if it just uses `(page - 1) * some_average_items_per_page`
        // OR, even better, the command passes the `startIndexForThisPage`.
        // Since the command passes `itemsPerPage` specific to THIS page's display needs,
        // and `tracks` is the full upcoming list, the card needs a robust way to get `effectiveStart`.

        // Let's stick to the original card logic which implies `itemsPerPage` is consistent or that `page` accounts for it.
        // The command's `totalPages` calculation and `page` value will be critical.
        // The card's `effectiveStart` should be `(page - 1) * itemsPerPageForPreviousPages`.
        // This is tricky. Let's adjust the card to use `page` and `itemsPerPage` (for *this* page) and assume `tracks` is full list.
        // The `effectiveStart` for global numbering needs to be based on the actual number of items on preceding pages.
        // If the first page shows `QueueCard.ITEMS_PER_PAGE_FIRST` (e.g., 8)
        // and subsequent pages show `QueueCard.ITEMS_PER_PAGE_OTHER` (e.g., 11)

        // If page 1 -> effectiveStart = 0
        // If page 2 -> effectiveStart = QueueCard.ITEMS_PER_PAGE_FIRST (or the value used for page 1)
        // If page 3 -> effectiveStart = QueueCard.ITEMS_PER_PAGE_FIRST + QueueCard.ITEMS_PER_PAGE_OTHER
        // etc. This logic should be in the command, or the command should pass the slice.

        // The current card code: const effectiveStart = (page - 1) * itemsPerPage;
        // This is problematic if itemsPerPage changes. The command MUST pass the correct itemsPerPage for *this* page.
        // And the numbering `trackNumText = ${effectiveStart + i + 1}.` relies on this.

        // Let's assume the command will handle determining the true global start index for numbering
        // if it wants to pass the full track list.
        // OR, the command passes a pre-sliced `pageTracks` array and a `globalStartIndexForThisPage`.

        // For now, let's keep the card's slicing simple and assume the command ensures `page` and `itemsPerPage` (for this page) make sense.
        // The `effectiveStart` for display numbering will be based on the *passed* `itemsPerPage` for *this page*,
        // but the actual items on *previous* pages might have been different.
        // This means the simple `(page-1)*itemsPerPage` for global numbering might be off.

        // The simplest for the card: It receives a `tracks` array that is ALREADY SLICED FOR THE PAGE by the command.
        // And it receives a `globalStartIndexOffset` for numbering.
        // The current `tracks` is the full upcoming queue.

        // Let's adjust: The card slices based on `page` and `itemsPerPage` (for this page).
        // Numbering will be `globalTrackNumberOffset + i + 1`. The command must provide this offset.
        // For now, the card calculates a local `effectiveStart` for slicing, and numbering based on that.
        // This will only be accurate if `itemsPerPage` was constant for previous pages.
        // The command will have to manage the true `page` and `totalPages` carefully.
        
        const itemsOnFirstPage = (current && (QueueCardClassUsedByCommand?.ITEMS_PER_PAGE_FIRST || 8)) || (QueueCardClassUsedByCommand?.ITEMS_PER_PAGE_OTHER || 11); // Approximation
        const itemsOnOtherPages = QueueCardClassUsedByCommand?.ITEMS_PER_PAGE_OTHER || 11; // Approximation

        if (page === 1) {
            effectiveGlobalStartIndex = 0;
        } else {
            // This calculation is illustrative of what the command needs to do.
            // The card itself should ideally get a pre-calculated global start index.
            effectiveGlobalStartIndex = itemsOnFirstPage + (page - 2) * itemsOnOtherPages;
        }
    }
    // The card should use the `itemsPerPage` value passed to it to determine how many to take for *this page*.
    // `tracks` is the full upcoming list.
    // The slice start needs to be based on what was on previous pages.
    let sliceStartIndex = 0;
    if (page > 1) {
        // This is an approximation if the command doesn't pass a more precise start index
        // It assumes the ITEMS_PER_PAGE_FIRST and ITEMS_PER_PAGE_OTHER are known here (they are static on class)
        sliceStartIndex = (QueueCard.ITEMS_PER_PAGE_FIRST || 8) + (page - 2) * (QueueCard.ITEMS_PER_PAGE_OTHER || 11);
         if (page ===1 && !current) { // If no 'now playing', page 1 uses 'other' count
            sliceStartIndex = (page -1) * (QueueCard.ITEMS_PER_PAGE_OTHER || 11)
        }
    }
     if (page === 1 && !current) { // If no 'now playing', page 1 uses 'other' count for slicing
        sliceStartIndex = 0;
    }


    const pageTracks = tracks.slice(sliceStartIndex, sliceStartIndex + maxItemsToDisplayOnThisPage);
    
    if (pageTracks.length > 0) {
      for (let i = 0; i < pageTracks.length; i++) {
        const track = pageTracks[i];
        const itemY = queueListStartY + i * queueItemHeight;
        
        if (itemY + queueItemHeight > CARD_HEIGHT - (PANEL_MARGIN + PANEL_BORDER_TOTAL_THICKNESS + CONTENT_PADDING + FONT_SIZE_DEFAULT + SECTION_SPACING_Y)) break;

        if (i % 2 !== 0) {
          ctx.fillStyle = PIXEL_COLORS.QUEUE_ITEM_BG_ALT;
          ctx.fillRect(CONTENT_X_START - 2, itemY - 1, CONTENT_WIDTH + 4, queueItemHeight -1);
        }

        let itemCurrentX = CONTENT_X_START;
        let textLineY = itemY;

        ctx.font = this.getFont(FONT_SIZE_DEFAULT);
        const trackNumText = `${sliceStartIndex + i + 1}.`; // Use sliceStartIndex for global numbering
        this.drawTextWithShadow(ctx, trackNumText, itemCurrentX, textLineY, PIXEL_COLORS.TEXT_ITEM_NUMBER);
        itemCurrentX += ctx.measureText(trackNumText).width + 4;

        const qPlatformIconSize = 10;
        this.drawPlatformIcon(ctx, itemCurrentX, textLineY + Math.floor((FONT_SIZE_DEFAULT - qPlatformIconSize)/2), track, qPlatformIconSize);
        itemCurrentX += qPlatformIconSize + 4;

        const qTitleMaxWidth = CONTENT_RIGHT_EDGE - itemCurrentX - ctx.measureText(" 00:00").width - 5; 
        this.drawTextWithShadow(ctx, this.truncateText(ctx, (track.title || "Unknown").toUpperCase(), qTitleMaxWidth), itemCurrentX, textLineY, PIXEL_COLORS.TEXT_TITLE);
        
        ctx.textAlign = 'right';
        this.drawTextWithShadow(ctx, this.formatTime(track.length || 0), CONTENT_RIGHT_EDGE, textLineY, PIXEL_COLORS.TEXT_INFO);
        ctx.textAlign = 'left'; 

        textLineY += FONT_SIZE_DEFAULT + ELEMENT_SPACING_Y -1 ; 

        itemCurrentX = CONTENT_X_START + ctx.measureText("00.").width + 4; 
        ctx.font = this.getFont(FONT_SIZE_SMALL);
        let secondLineText = "";
        if (track.author) {
            secondLineText += `BY: ${track.author.toUpperCase()}`;
        }
        const requesterName = track.requester?.username || track.requester?.tag || 'N/A';
        if (requesterName !== 'N/A') {
            secondLineText += `${track.author ? " | " : ""}REQ: ${requesterName.toUpperCase()}`;
        }
        const secondLineMaxWidth = CONTENT_RIGHT_EDGE - itemCurrentX;
        this.drawTextWithShadow(ctx, this.truncateText(ctx, secondLineText, secondLineMaxWidth), itemCurrentX, textLineY, PIXEL_COLORS.TEXT_INFO);
      }
    } else {
      ctx.font = this.getFont(FONT_SIZE_DEFAULT);
      ctx.textAlign = 'center';
      this.drawTextWithShadow(ctx, page > 1 ? "NO MORE TRACKS" : "QUEUE IS EMPTY", CARD_WIDTH / 2, queueListStartY + 20, PIXEL_COLORS.TEXT_INFO);
      ctx.textAlign = 'left'; 
    }
    
    const footerY = CARD_HEIGHT - (PANEL_MARGIN + PANEL_BORDER_TOTAL_THICKNESS + CONTENT_PADDING) - FONT_SIZE_DEFAULT - 2;
    ctx.font = this.getFont(FONT_SIZE_DEFAULT);
    ctx.textAlign = 'center';
    const totalTracksInQueue = tracks.length; 
    this.drawTextWithShadow(ctx, `TOTAL: ${totalTracksInQueue} | USE BUTTONS TO NAVIGATE`, CARD_WIDTH / 2, footerY, PIXEL_COLORS.TEXT_INFO);
    ctx.textAlign = 'left'; 

    return canvas.toBuffer('image/png');
  }
}
// Used to help approximate sliceStartIndex calculation, will be replaced by command's logic
const QueueCardClassUsedByCommand = QueueCard;
