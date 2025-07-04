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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define theme-wide constants
const COLORS = {
  DEFAULT: '#FF4500',    // Orange Red
  SUCCESS: '#32CD32',    // Lime Green
  ERROR: '#DC143C',      // Crimson
  WARNING: '#FFD700',    // Gold
  INFO: '#FF6347',       // Tomato
  MUSIC: '#FF1493',      // Deep Pink
  ADMIN: '#FFA500',      // Orange
  MODERATION: '#FF0000', // Red
  GENERAL: '#FF7F50',    // Coral
  UTILITY: '#A9A9A9',    // Dark Gray
  FUN: '#ADFF2F',        // Green Yellow
  DEVELOPER: '#FF4500',  // Orange Red
  SPOTIFY: '#1DB954',    // Spotify Green (unchanged as it's brand-specific)
  INFORMATION: '#FF6347',// Tomato

  // Background gradient colors
  BG_START: '#2E0C00',   // Dark Red
  BG_MID: '#4B1C0F',     // Rich Red-Orange
  BG_END: '#2E0C00',     // Dark Red

  // Glass panel colors
  GLASS_PRIMARY: 'rgba(255, 69, 0, 0.5)',     // Orange Red with transparency
  GLASS_BORDER: 'rgba(255, 140, 0, 0.6)',     // Dark Orange
  GLASS_SECONDARY: 'rgba(255, 69, 0, 0.4)',   // Orange Red lighter
  GLASS_CONTENT: 'rgba(255, 69, 0, 0.3)',     // Orange Red lightest
};

/**
 * Manages creation of canvas-based help images
 */
export class HelpCanvas {
  constructor() {
    this.initFonts();
  }

  initFonts() {
    try {
      // Register Arial fonts as fallback
      GlobalFonts.registerFromPath(path.join(__dirname, '../../assets/fonts/arial.ttf'), 'Arial');
      GlobalFonts.registerFromPath(path.join(__dirname, '../../assets/fonts/arial-bold.ttf'), 'Arial Bold');

      try {
        // Try to register Montserrat fonts (preferred)
        GlobalFonts.registerFromPath(path.join(__dirname, '../../assets/fonts/montserrat-regular.ttf'), 'Montserrat');
        GlobalFonts.registerFromPath(path.join(__dirname, '../../assets/fonts/montserrat-bold.ttf'), 'Montserrat Bold');
      } catch (e) {
        console.log('Montserrat fonts not found, using Arial as fallback');
      }
    } catch (error) {
      console.error('Failed to load fonts:', error);
    }
  }

  /**
   * Get font names based on availability
   */
  getFonts() {
    return {
      main: GlobalFonts.has('Montserrat') ? 'Montserrat' : 'Arial',
      bold: GlobalFonts.has('Montserrat Bold') ? 'Montserrat Bold' : 'Arial Bold'
    };
  }

  /**
   * Get category color
   */
  getCategoryColor(category) {
    const catLower = category?.toLowerCase() || 'default';
    const colorMap = {
      music: COLORS.MUSIC,
      admin: COLORS.ADMIN,
      utility: COLORS.UTILITY,
      general: COLORS.GENERAL,
      developer: COLORS.DEVELOPER,
      owner: COLORS.DEVELOPER, // Assuming owner uses developer color
      fun: COLORS.FUN,
      spotify: COLORS.SPOTIFY,
      information: COLORS.INFORMATION,
      moderation: COLORS.MODERATION,
    };
    return colorMap[catLower] || COLORS.DEFAULT;
  }

  /**
   * Format category name
   */
  formatCategoryName(category) {
    if (!category) return 'Unknown';
    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  }

  /**
   * Truncate text
   */
  truncateText(ctx, text = '', maxWidth) {
    if (!text) return '';
    if (ctx.measureText(text).width <= maxWidth) return text;

    let truncated = text;
    while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
      truncated = truncated.slice(0, -1);
    }
    return truncated.length === 0 ? '...' : truncated + '...';
  }

  /**
   * Draw a glass panel
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
   * Create particles in the background
   */
  createBackgroundEffects(ctx, width, height) {
    // Create gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, COLORS.BG_START);
    bgGradient.addColorStop(0.5, COLORS.BG_MID);
    bgGradient.addColorStop(1, COLORS.BG_END);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Add small particles
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

    // Add glowing particles
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = 2 + Math.random() * 3;

      ctx.fillStyle = 'rgba(255, 140, 0, 0.2)'; // Orange glow
      ctx.shadowColor = '#FF8C00'; // Dark Orange shadow
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  /**
   * Generate the main help page
   */
  async generateHomePage(client, prefix, categories) {
    const width = 900;
    const height = 700;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const fonts = this.getFonts();

    // Create background
    this.createBackgroundEffects(ctx, width, height);

    // Draw header panel
    this.drawGlassPanel(
      ctx,
      30, 30,
      width - 60, 80,
      16,
      COLORS.GLASS_PRIMARY,
      COLORS.GLASS_BORDER,
      2
    );

    // Load bot avatar
    let avatarImg;
    try {
      const avatarURL = client.user.displayAvatarURL({ format: 'png', size: 128 });
      avatarImg = await loadImage(avatarURL);
    } catch (error) {
      console.error('Failed to load avatar:', error);
    }

    // Draw bot avatar with glow
    if (avatarImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(80, 70, 30, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatarImg, 50, 40, 60, 60);
      ctx.restore();

      // Add a glowing border to the avatar
      ctx.shadowColor = 'rgba(255, 140, 0, 0.8)';
      ctx.shadowBlur = 15;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(80, 70, 31, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Title with glow
    ctx.shadowColor = 'rgba(255, 140, 0, 0.8)';
    ctx.shadowBlur = 10;
    ctx.font = `28px "${fonts.bold}"`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('COMMAND HELP', width / 2, 75);
    ctx.shadowBlur = 0;

    // Bot name with version
    ctx.font = `16px "${fonts.main}"`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.textAlign = 'right';
    ctx.fillText(`${client.user.username} v${client.version || '1.0.0'}`, width - 50, 75);

    // Draw info panel
    this.drawGlassPanel(
      ctx,
      30, 130,
      width - 60, 150,
      16,
      COLORS.GLASS_SECONDARY,
      COLORS.GLASS_BORDER,
      2
    );

    // Help info text
    ctx.font = `20px "${fonts.bold}"`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Welcome to the Help Menu', width / 2, 170);

    ctx.font = `18px "${fonts.main}"`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(`Use the dropdown menu to browse commands by category`, width / 2, 200);
    ctx.fillText(`For specific command info, use "${prefix}help [command]"`, width / 2, 230);

    // Draw command prefix panel
    this.drawGlassPanel(
      ctx,
      width / 2 - 100, 250,
      200, 50,
      16,
      'rgba(255, 69, 0, 0.7)',
      COLORS.GLASS_BORDER,
      2
    );

    // Command prefix
    ctx.font = `22px "${fonts.bold}"`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Prefix: ${prefix}`, width / 2, 282);

    // Categories panel header
    this.drawGlassPanel(
      ctx,
      30, 300,
      width - 60, 50,
      16,
      COLORS.GLASS_PRIMARY,
      COLORS.GLASS_BORDER,
      2
    );

    // Categories title
    ctx.shadowColor = 'rgba(255, 140, 0, 0.8)';
    ctx.shadowBlur = 5;
    ctx.font = `22px "${fonts.bold}"`;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('CATEGORIES', 50, 332);
    ctx.shadowBlur = 0;

    // Draw categories content panel
    this.drawGlassPanel(
      ctx,
      30, 360,
      width - 60, height - 430,
      16,
      COLORS.GLASS_CONTENT,
      COLORS.GLASS_BORDER,
      2
    );

    // Filter out developer/owner category and sort alphabetically
    const visibleCategories = [...categories.keys()]
      .filter(category => category.toLowerCase() !== 'developer' && category.toLowerCase() !== 'owner')
      .sort();

    // Create category grid layout
    const columns = 2;
    const itemWidth = (width - 90) / columns;
    const itemHeight = 65;
    const startY = 380;

    for (let i = 0; i < visibleCategories.length; i++) {
      const category = visibleCategories[i];
      const commandCount = categories.get(category)?.length || 0;

      const col = i % columns;
      const row = Math.floor(i / columns);

      const x = 45 + (col * itemWidth);
      const y = startY + (row * itemHeight);

      if (y + itemHeight > (360 + height - 430 - 15)) continue;

      // Draw category item background
      this.drawGlassPanel(
        ctx,
        x, y,
        itemWidth - 15, 55,
        10,
        'rgba(255, 255, 255, 0.1)'
      );

      // Draw colored indicator
      const categoryColor = this.getCategoryColor(category);
      ctx.fillStyle = categoryColor;
      ctx.beginPath();
      ctx.roundRect(x + 10, y + 15, 6, 25, 3);
      ctx.fill();

      // Category name
      ctx.font = `20px "${fonts.bold}"`;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(this.formatCategoryName(category), x + 25, y + 25);

      // Command count
      ctx.font = `16px "${fonts.main}"`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText(`${commandCount} command${commandCount !== 1 ? 's' : ''}`, x + 25, y + 45);
    }

    // Draw footer panel
    this.drawGlassPanel(
      ctx,
      30, height - 60,
      width - 60, 50,
      16,
      COLORS.GLASS_SECONDARY,
      'rgba(255, 140, 0, 0.3)',
      2
    );

    // Footer text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = `16px "${fonts.main}"`;
    ctx.textAlign = 'center';
    const serverCount = client.guilds.cache.size;
    ctx.fillText(`Serving ${serverCount} server${serverCount !== 1 ? 's' : ''} | Use dropdown below to explore commands`, width / 2, height - 30);

    return canvas.toBuffer('image/png');
  }

  /**
   * Generate category page
   */
  async generateCategoryPage(categoryName, allCommandsInThisCategory, prefix, client, page = 1, itemsPerPage = 24) {
    const width = 900;
    const height = 700;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const fonts = this.getFonts();

    this.createBackgroundEffects(ctx, width, height);

    const categoryColor = this.getCategoryColor(categoryName);
    this.drawGlassPanel(ctx, 30, 30, width - 60, 80, 16, COLORS.GLASS_PRIMARY, COLORS.GLASS_BORDER, 2);

    ctx.shadowColor = 'rgba(255, 140, 0, 0.8)';
    ctx.shadowBlur = 10;
    ctx.font = `28px "${fonts.bold}"`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    const formattedCategoryName = this.formatCategoryName(categoryName);
    ctx.fillText(`${formattedCategoryName.toUpperCase()} COMMANDS`, width / 2, 75);
    ctx.shadowBlur = 0;

    ctx.font = `18px "${fonts.main}"`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.textAlign = 'right';
    ctx.fillText(`${allCommandsInThisCategory.length} command${allCommandsInThisCategory.length !== 1 ? 's' : ''}`, width - 50, 75);

    this.drawGlassPanel(ctx, 30, 130, width - 60, 50, 16, categoryColor, 'rgba(255, 255, 255, 0.3)', 2);

    ctx.font = `18px "${fonts.main}"`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Use "${prefix}help [command]" for detailed information`, width / 2, 162);

    this.drawGlassPanel(ctx, 30, 200, width - 60, height - 280, 16, COLORS.GLASS_CONTENT, COLORS.GLASS_BORDER, 2);

    allCommandsInThisCategory.sort((a, b) => a.name.localeCompare(b.name));

    const totalPages = Math.ceil(allCommandsInThisCategory.length / itemsPerPage);
    const currentPage = Math.max(1, Math.min(page, totalPages || 1));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const commandsToDisplay = allCommandsInThisCategory.slice(startIndex, startIndex + itemsPerPage);

    const columns = 3;
    const itemWidth = (width - 120) / columns;
    const itemHeight = 40;
    const startXOffset = 45;
    const startYOffset = 220;

    if (commandsToDisplay.length === 0 && currentPage === 1) {
      ctx.font = `20px "${fonts.bold}"`;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText('No commands in this category.', width / 2, startYOffset + 100);
    } else {
      for (let i = 0; i < commandsToDisplay.length; i++) {
        const command = commandsToDisplay[i];

        const col = i % columns;
        const row = Math.floor(i / columns);

        const x = startXOffset + (col * itemWidth);
        const y = startYOffset + (row * itemHeight);

        if (y + itemHeight > (200 + height - 280 - 15)) break;

        if (i % 2 === 0) {
          this.drawGlassPanel(ctx, x, y, itemWidth - 15, 35, 8, 'rgba(255, 255, 255, 0.05)');
        }

        ctx.fillStyle = categoryColor;
        ctx.beginPath();
        ctx.roundRect(x + 6, y + 10, 4, 16, 2);
        ctx.fill();

        ctx.font = `16px "${fonts.bold}"`;
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(this.truncateText(ctx, command.name, itemWidth - 30), x + 16, y + 17);

        ctx.font = `12px "${fonts.main}"`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        const description = command.description || 'No description';
        ctx.fillText(this.truncateText(ctx, description, itemWidth - 30), x + 16, y + 33);
      }
    }

    this.drawGlassPanel(ctx, 30, height - 70, width - 60, 50, 16, COLORS.GLASS_SECONDARY, 'rgba(255, 140, 0, 0.3)', 2);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = `16px "${fonts.main}"`;
    ctx.textAlign = 'center';
    const pageText = allCommandsInThisCategory.length > 0 ? `Page ${currentPage}/${totalPages}` : 'Page 1/1';
    ctx.fillText(`${pageText} | Use buttons below to navigate`, width / 2, height - 40);

    return canvas.toBuffer('image/png');
  }

  /**
   * Generate command detail page
   */
  async generateCommandPage(command, prefix, client) {
    const width = 900;
    const height = 700;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const fonts = this.getFonts();

    this.createBackgroundEffects(ctx, width, height);

    const categoryColor = this.getCategoryColor(command.category);

    this.drawGlassPanel(ctx, 30, 30, width - 60, 80, 16, COLORS.GLASS_PRIMARY, COLORS.GLASS_BORDER, 2);

    ctx.shadowColor = 'rgba(255, 140, 0, 0.8)';
    ctx.shadowBlur = 10;
    ctx.font = `28px "${fonts.bold}"`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`COMMAND: ${command.name.toUpperCase()}`, width / 2, 75);
    ctx.shadowBlur = 0;

    ctx.font = `18px "${fonts.main}"`;
    ctx.fillStyle = categoryColor;
    ctx.textAlign = 'right';
    ctx.fillText(this.formatCategoryName(command.category), width - 50, 75);

    // Command info panel (description and usage)
    this.drawGlassPanel(ctx, 30, 130, width - 60, 130, 16, COLORS.GLASS_SECONDARY, categoryColor, 2);

    ctx.font = `18px "${fonts.main}"`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    const description = command.description || 'No description available.';

    // Word wrap for description
    const maxDescLineWidth = width - 100;
    let currentDescY = 165;
    const descLineHeight = 22;
    const words = description.split(' ');
    let currentLine = '';
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      if (ctx.measureText(testLine).width > maxDescLineWidth && currentLine !== '') {
        ctx.fillText(currentLine, width / 2, currentDescY);
        currentLine = word;
        currentDescY += descLineHeight;
      } else {
        currentLine = testLine;
      }
      if (currentDescY + descLineHeight > 130 + 130 - 50) break;
    }
    if (currentLine) ctx.fillText(currentLine, width / 2, currentDescY);

    // Command usage
    currentDescY += descLineHeight + 5;
    if (currentDescY < 130 + 130 - 25) {
      ctx.font = `20px "${fonts.bold}"`;
      ctx.fillStyle = '#ffffff';
      const usageText = `Usage: ${prefix}${command.usage || command.name}`;
      ctx.fillText(this.truncateText(ctx, usageText, maxDescLineWidth), width / 2, currentDescY);
    }

    // Details Section (Aliases, Cooldown, Category, Requirements)
    const detailStartY = 280;
    const detailPanelHeight = 180;

    // Left Panel: Aliases & Cooldown
    this.drawGlassPanel(ctx, 30, detailStartY, width / 2 - 45, detailPanelHeight, 16, COLORS.GLASS_CONTENT, 'rgba(255, 140, 0, 0.3)', 2);

    ctx.font = `20px "${fonts.bold}"`;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Aliases', 50, detailStartY + 35);

    ctx.font = `16px "${fonts.main}"`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    const aliases = command.aliases && command.aliases.length > 0 ? command.aliases.join(', ') : 'None';
    ctx.fillText(this.truncateText(ctx, aliases, width / 2 - 100), 50, detailStartY + 60);

    ctx.font = `20px "${fonts.bold}"`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Cooldown', 50, detailStartY + 100);

    ctx.font = `18px "${fonts.main}"`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(`${command.cooldown || 0} seconds`, 50, detailStartY + 125);

    // Right Panel: Category & Requirements
    this.drawGlassPanel(ctx, width / 2 + 15, detailStartY, width / 2 - 45, detailPanelHeight, 16, COLORS.GLASS_CONTENT, 'rgba(255, 140, 0, 0.3)', 2);

    ctx.font = `20px "${fonts.bold}"`;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Category', width / 2 + 35, detailStartY + 35);

    ctx.font = `18px "${fonts.main}"`;
    ctx.fillStyle = categoryColor;
    ctx.fillText(this.formatCategoryName(command.category), width / 2 + 35, detailStartY + 60);

    ctx.font = `20px "${fonts.bold}"`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Requirements', width / 2 + 35, detailStartY + 95);

    const requirements = this.getCommandRequirements(command);
    ctx.font = `14px "${fonts.main}"`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    let reqY = detailStartY + 120;
    const reqLineHeight = 18;
    if (requirements.length > 0) {
      for (let i = 0; i < Math.min(requirements.length, 3); i++) {
        if (reqY + reqLineHeight > detailStartY + detailPanelHeight - 10) break;
        ctx.fillText(`• ${this.truncateText(ctx, requirements[i], width / 2 - 100)}`, width / 2 + 35, reqY);
        reqY += reqLineHeight;
      }
      if (requirements.length > 3) {
        if (reqY + reqLineHeight <= detailStartY + detailPanelHeight - 10) {
          ctx.fillText(`(+${requirements.length - 3} more)`, width / 2 + 45, reqY);
        }
      }
    } else {
      ctx.fillText('None', width / 2 + 35, reqY);
    }

    // Examples Panel
    const examplesStartY = detailStartY + detailPanelHeight + 20;
    const examplesPanelHeight = height - examplesStartY - 80;

    if (command.examples && command.examples.length > 0 && examplesPanelHeight > 50) {
      this.drawGlassPanel(ctx, 30, examplesStartY, width - 60, examplesPanelHeight, 16, COLORS.GLASS_CONTENT, 'rgba(255, 140, 0, 0.3)', 2);

      ctx.font = `20px "${fonts.bold}"`;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('Examples', 50, examplesStartY + 35);

      ctx.font = `16px "${fonts.main}"`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      let exY = examplesStartY + 60;
      const exLineHeight = 22;
      for (let i = 0; i < command.examples.length; i++) {
        if (exY + exLineHeight > examplesStartY + examplesPanelHeight - 15) {
          ctx.fillText(`(+${command.examples.length - i} more examples)`, 70, exY);
          break;
        }
        ctx.fillText(`• ${prefix}${this.truncateText(ctx, command.examples[i], width - 150)}`, 70, exY);
        exY += exLineHeight;
      }
    }

    // Footer
    this.drawGlassPanel(ctx, 30, height - 70, width - 60, 50, 16, COLORS.GLASS_SECONDARY, 'rgba(255, 140, 0, 0.3)', 2);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = `16px "${fonts.main}"`;
    ctx.textAlign = 'center';
    ctx.fillText(`Type "${prefix}help" or use the button to return to the main help menu`, width / 2, height - 40);

    return canvas.toBuffer('image/png');
  }

  /**
   * Generate search results page
   */
  async generateSearchResultsPage(searchTerm, allFilteredCommands, prefix, client, page = 1, itemsPerPage = 24) {
    const width = 900;
    const height = 700;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const fonts = this.getFonts();

    this.createBackgroundEffects(ctx, width, height);

    this.drawGlassPanel(ctx, 30, 30, width - 60, 80, 16, COLORS.GLASS_PRIMARY, COLORS.GLASS_BORDER, 2);

    ctx.shadowColor = 'rgba(255, 140, 0, 0.8)';
    ctx.shadowBlur = 10;
    ctx.font = `28px "${fonts.bold}"`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('SEARCH RESULTS', width / 2, 75);
    ctx.shadowBlur = 0;

    ctx.font = `18px "${fonts.main}"`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.textAlign = 'right';
    ctx.fillText(`"${this.truncateText(ctx, searchTerm, 20)}" - ${allFilteredCommands.length} result${allFilteredCommands.length !== 1 ? 's' : ''}`, width - 50, 75);

    this.drawGlassPanel(ctx, 30, 130, width - 60, 50, 16, COLORS.GLASS_SECONDARY, COLORS.GLASS_BORDER, 2);

    ctx.font = `18px "${fonts.main}"`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Showing commands matching "${this.truncateText(ctx, searchTerm, 40)}"`, width / 2, 162);

    this.drawGlassPanel(ctx, 30, 200, width - 60, height - 280, 16, COLORS.GLASS_CONTENT, COLORS.GLASS_BORDER, 2);

    allFilteredCommands.sort((a, b) => a.name.localeCompare(b.name));

    const totalPages = Math.ceil(allFilteredCommands.length / itemsPerPage);
    const currentPage = Math.max(1, Math.min(page, totalPages || 1));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const commandsToDisplay = allFilteredCommands.slice(startIndex, startIndex + itemsPerPage);

    const columns = 3;
    const itemWidth = (width - 120) / columns;
    const itemHeight = 40;
    const startXOffset = 45;
    const startYOffset = 220;

    if (commandsToDisplay.length === 0 && currentPage === 1) {
      ctx.font = `22px "${fonts.bold}"`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('No commands found', width / 2, startYOffset + 100);

      ctx.font = `18px "${fonts.main}"`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('Try a different search term', width / 2, startYOffset + 130);
    } else {
      for (let i = 0; i < commandsToDisplay.length; i++) {
        const command = commandsToDisplay[i];

        const col = i % columns;
        const row = Math.floor(i / columns);

        const x = startXOffset + (col * itemWidth);
        const y = startYOffset + (row * itemHeight);

        if (y + itemHeight > (200 + height - 280 - 15)) break;

        if (i % 2 === 0) {
          this.drawGlassPanel(ctx, x, y, itemWidth - 15, 35, 8, 'rgba(255, 255, 255, 0.05)');
        }

        const categoryColor = this.getCategoryColor(command.category);
        ctx.fillStyle = categoryColor;
        ctx.beginPath();
        ctx.roundRect(x + 6, y + 10, 4, 16, 2);
        ctx.fill();

        ctx.font = `16px "${fonts.bold}"`;
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(this.truncateText(ctx, command.name, itemWidth - 50), x + 16, y + 17);

        const categoryName = this.formatCategoryName(command.category);
        ctx.font = `12px "${fonts.main}"`;
        ctx.fillStyle = categoryColor;
        ctx.fillText(this.truncateText(ctx, categoryName, itemWidth - 30), x + 16, y + 33);
      }
    }

    this.drawGlassPanel(ctx, 30, height - 70, width - 60, 50, 16, COLORS.GLASS_SECONDARY, 'rgba(255, 140, 0, 0.3)', 2);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = `16px "${fonts.main}"`;
    ctx.textAlign = 'center';
    const pageText = allFilteredCommands.length > 0 ? `Page ${currentPage}/${totalPages}` : 'Page 1/1';
    ctx.fillText(`${pageText} | Use buttons below to navigate`, width / 2, height - 40);

    return canvas.toBuffer('image/png');
  }

  /**
   * Get command requirements as readable strings
   */
  getCommandRequirements(command) {
    const requirements = [];

    if (command.ownerOnly || command.category?.toLowerCase() === 'owner') {
      requirements.push('Bot Owner Only');
    } else if (command.category?.toLowerCase() === 'developer') {
      requirements.push('Bot Developer Only');
    }

    if (command.permissions && command.permissions.length > 0) {
      command.permissions.forEach(perm => {
        requirements.push(`Requires ${this.formatPermission(perm)}`);
      });
    }

    if (command.voiceRequired) {
      requirements.push('Must be in a voice channel');
    }

    if (command.sameVoiceRequired) {
      requirements.push('Must be in same voice channel as bot');
    }

    if (command.playerRequired) {
      requirements.push('Music player must be active');
    }

    if (command.playingRequired) {
      requirements.push('Music must be playing');
    }

    if (command.customRequirements && command.customRequirements.length > 0) {
      command.customRequirements.forEach(req => {
        requirements.push(req);
      });
    }

    return requirements;
  }

  /**
   * Format permission names to be more readable
   */
  formatPermission(permission) {
    return permission
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}