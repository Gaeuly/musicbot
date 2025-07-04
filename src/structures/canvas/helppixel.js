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

const COLORS = {
  BG_PRIMARY: '#000000',
  BG_GRID: 'rgba(0, 255, 0, 0.08)',
  STAR_COLOR: 'rgba(255, 255, 255, 0.4)',

  PANEL_BG: '#101010',
  PANEL_BORDER_OUTER: '#00FF00',
  PANEL_BORDER_INNER: '#008000',
  PANEL_BORDER_HIGHLIGHT: '#33FF33',
  PANEL_BORDER_SHADOW: '#005000',


  TEXT_HEADER: '#FFFF00',
  TEXT_PRIMARY: '#FFFFFF',
  TEXT_SECONDARY: '#A0A0A0',
  TEXT_ACCENT: '#FF00FF',
  TEXT_DISABLED: '#404040',
  TEXT_SHADOW: 'rgba(0,0,0,0.75)',

  SUCCESS: '#39FF14',
  ERROR: '#FF0000',
  WARNING: '#FFA500',
  INFO: '#00FFFF',

  MUSIC: '#FF00FF',
  ADMIN: '#FFA500',
  MODERATION: '#FF4500',
  GENERAL: '#00FFFF',
  UTILITY: '#FFFFFF',
  FUN: '#39FF14',
  DEVELOPER: '#8A2BE2',
  SPOTIFY: '#1DB954',
  INFORMATION: '#00BFFF',
  OWNER: '#FFD700',
};

const PIXEL_BORDER_WIDTH = 3;
const ITEM_BORDER_WIDTH = 2;

export class HelpCanvas {
  constructor() {
    this.initFonts();
  }

  initFonts() {
    try {
      GlobalFonts.registerFromPath(path.join(__dirname, '../../assets/fonts/PressStart2P-Regular.ttf'), 'Press Start 2P');
    } catch (e) {
      console.warn('Press Start 2P font not found. Falling back. Please add PressStart2P-Regular.ttf to assets/fonts/.');
      try {
        GlobalFonts.registerFromPath(path.join(__dirname, '../../assets/fonts/arial.ttf'), 'Arial');
        GlobalFonts.registerFromPath(path.join(__dirname, '../../assets/fonts/arial-bold.ttf'), 'Arial Bold');
      } catch (error) {
        console.error('Failed to load fallback Arial fonts:', error);
      }
    }
  }

  getFonts() {
    const hasPressStart = GlobalFonts.has('Press Start 2P');
    return {
      main: hasPressStart ? 'Press Start 2P' : 'Arial',
      bold: hasPressStart ? 'Press Start 2P' : 'Arial Bold',
    };
  }

  getCategoryColor(category) {
    const catLower = category?.toLowerCase() || 'default';
    const colorMap = {
      music: COLORS.MUSIC,
      admin: COLORS.ADMIN,
      moderation: COLORS.MODERATION,
      general: COLORS.GENERAL,
      utility: COLORS.UTILITY,
      fun: COLORS.FUN,
      developer: COLORS.DEVELOPER,
      owner: COLORS.OWNER,
      spotify: COLORS.SPOTIFY,
      information: COLORS.INFORMATION,
    };
    return colorMap[catLower] || COLORS.TEXT_PRIMARY;
  }

  formatCategoryName(category) {
    if (!category) return 'UNKNOWN';
    return category.toUpperCase();
  }

  truncateText(ctx, text = '', maxWidth) {
    if (!text) return '';
    text = String(text);
    if (ctx.measureText(text).width <= maxWidth) return text;

    let truncatedText = text;
    while (ctx.measureText(truncatedText + '...').width > maxWidth && truncatedText.length > 0) {
      truncatedText = truncatedText.slice(0, -1);
    }
    return truncatedText + '...';
  }

  drawTextWithShadow(ctx, text, x, y, fontColor, shadowColor = COLORS.TEXT_SHADOW, shadowOffset = 1) {
    ctx.fillStyle = shadowColor;
    ctx.fillText(text, x + shadowOffset, y + shadowOffset);
    ctx.fillStyle = fontColor;
    ctx.fillText(text, x, y);
  }

  drawPixelatedPanel(ctx, x, y, width, height, bgColor, outerBorder, innerBorder, borderWidth = PIXEL_BORDER_WIDTH) {
    ctx.fillStyle = outerBorder;
    ctx.fillRect(x, y, width, height);

    ctx.fillStyle = innerBorder;
    ctx.fillRect(x + borderWidth, y + borderWidth, width - 2 * borderWidth, height - 2 * borderWidth);
    
    ctx.fillStyle = bgColor;
    ctx.fillRect(x + borderWidth * 2, y + borderWidth * 2, width - 4 * borderWidth, height - 4 * borderWidth);
  }
  
  drawRetroItemPanel(ctx, x, y, width, height, bgColor, accentColor, borderWidth = ITEM_BORDER_WIDTH) {
    ctx.fillStyle = accentColor; 
    ctx.fillRect(x, y, width, height);

    ctx.fillStyle = COLORS.BG_PRIMARY;
    ctx.fillRect(x + borderWidth, y + borderWidth, width - 2 * borderWidth, height - 2 * borderWidth);
    
    ctx.fillStyle = bgColor;
    ctx.fillRect(x + borderWidth * 1.5, y + borderWidth * 1.5, width - 3 * borderWidth, height - 3 * borderWidth);

    ctx.fillStyle = accentColor;
    ctx.fillRect(x + borderWidth * 1.5, y + borderWidth * 1.5, borderWidth / 2, height - 3 * borderWidth);
  }


  drawRetroGridBackground(ctx, width, height) {
    ctx.fillStyle = COLORS.BG_PRIMARY;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = COLORS.BG_GRID;
    ctx.lineWidth = 1;
    const gridSize = 25;
    for (let i = 0; i < width; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(i + 0.5, 0);
      ctx.lineTo(i + 0.5, height);
      ctx.stroke();
    }
    for (let i = 0; i < height; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, i + 0.5);
      ctx.lineTo(width, i + 0.5);
      ctx.stroke();
    }

    ctx.fillStyle = COLORS.STAR_COLOR;
    for (let i = 0; i < 70; i++) {
        const pX = Math.random() * width;
        const pY = Math.random() * height;
        const pSize = Math.random() * 2 + 1;
        ctx.fillRect(pX - pSize / 2, pY - pSize / 2, pSize, pSize);
    }
  }

  async generateHomePage(client, prefix, categories) {
    const width = 800;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const fonts = this.getFonts();
    ctx.imageSmoothingEnabled = false;

    this.drawRetroGridBackground(ctx, width, height);

    const p = 20;
    const headerH = 70;
    this.drawPixelatedPanel(ctx, p, p, width - 2 * p, headerH, COLORS.PANEL_BG, COLORS.PANEL_BORDER_OUTER, COLORS.PANEL_BORDER_INNER);

    let avatarImg;
    const avatarSize = 40;
    try {
      const avatarURL = client.user.displayAvatarURL({ format: 'png', size: 64 });
      avatarImg = await loadImage(avatarURL);
      ctx.drawImage(avatarImg, p + 15, p + (headerH - avatarSize) / 2, avatarSize, avatarSize);
      ctx.strokeStyle = COLORS.PANEL_BORDER_OUTER;
      ctx.lineWidth = 2;
      ctx.strokeRect(p + 15 -1 , p + (headerH - avatarSize) / 2 -1, avatarSize + 2, avatarSize + 2);
    } catch (error) {
       ctx.fillStyle = COLORS.TEXT_DISABLED;
       ctx.fillRect(p + 15, p + (headerH - avatarSize) / 2, avatarSize, avatarSize);
    }
    
    ctx.font = `20px "${fonts.bold}"`;
    ctx.textAlign = 'center';
    this.drawTextWithShadow(ctx, 'COMMANDS', width / 2, p + headerH / 2 + 8, COLORS.TEXT_HEADER);
    
    ctx.font = `10px "${fonts.main}"`;
    ctx.textAlign = 'right';
    const botInfo = `${client.user.username.toUpperCase()} V${client.version || '1.0'}`;
    this.drawTextWithShadow(ctx, botInfo, width - p - 15, p + headerH - 15, COLORS.TEXT_SECONDARY);
    
    const infoPanelY = p + headerH + 15;
    const infoPanelH = 100;
    this.drawPixelatedPanel(ctx, p, infoPanelY, width - 2 * p, infoPanelH, COLORS.PANEL_BG, COLORS.PANEL_BORDER_OUTER, COLORS.PANEL_BORDER_INNER);

    ctx.font = `12px "${fonts.bold}"`;
    ctx.textAlign = 'center';
    this.drawTextWithShadow(ctx, 'WELCOME, USER!', width / 2, infoPanelY + 30, COLORS.TEXT_PRIMARY);
    
    ctx.font = `10px "${fonts.main}"`;
    this.drawTextWithShadow(ctx, `USE DROPDOWN FOR CATEGORIES`, width / 2, infoPanelY + 55, COLORS.TEXT_SECONDARY);
    this.drawTextWithShadow(ctx, `OR "${prefix}HELP [COMMAND]"`, width / 2, infoPanelY + 75, COLORS.TEXT_SECONDARY);

    const prefixPanelY = infoPanelY + infoPanelH + 10;
    const prefixPanelW = 200;
    const prefixPanelH = 30;
    this.drawPixelatedPanel(ctx, width/2 - prefixPanelW/2, prefixPanelY, prefixPanelW, prefixPanelH, COLORS.TEXT_ACCENT, COLORS.PANEL_BORDER_OUTER, COLORS.BG_PRIMARY);

    ctx.font = `10px "${fonts.bold}"`;
    ctx.fillStyle = COLORS.BG_PRIMARY;
    ctx.fillText(`PREFIX: ${prefix}`, width / 2, prefixPanelY + prefixPanelH/2 + 4);

    const catTitleY = prefixPanelY + prefixPanelH + 25;
    ctx.font = `14px "${fonts.bold}"`;
    ctx.textAlign = 'left';
    this.drawTextWithShadow(ctx, 'CATEGORIES:', p + 10, catTitleY, COLORS.TEXT_HEADER);

    const catPanelY = catTitleY + 10;
    const catPanelH = height - catPanelY - p - 50;
    this.drawPixelatedPanel(ctx, p, catPanelY, width - 2 * p, catPanelH, COLORS.BG_PRIMARY, COLORS.PANEL_BORDER_OUTER, COLORS.PANEL_BORDER_INNER);

    const visibleCategories = [...categories.keys()]
      .filter(category => category.toLowerCase() !== 'developer' && category.toLowerCase() !== 'owner')
      .sort();
    
    const catCols = 2;
    const catItemMargin = 10;
    const catPanelInnerW = width - 2 * p - 2 * catItemMargin - (PIXEL_BORDER_WIDTH*2);
    const catItemW = (catPanelInnerW - (catCols -1) * catItemMargin ) / catCols;
    const catItemH = 45;
    const catStartX = p + catItemMargin + PIXEL_BORDER_WIDTH*2;
    const catStartY = catPanelY + catItemMargin + PIXEL_BORDER_WIDTH*2;

    for (let i = 0; i < visibleCategories.length; i++) {
      const category = visibleCategories[i];
      const commandCount = categories.get(category).length;
      const catColor = this.getCategoryColor(category);
      
      const col = i % catCols;
      const row = Math.floor(i / catCols);
      
      const x = catStartX + col * (catItemW + catItemMargin);
      const y = catStartY + row * (catItemH + catItemMargin);

      if (y + catItemH > catPanelY + catPanelH - (PIXEL_BORDER_WIDTH*2) - catItemMargin) break;
      
      this.drawRetroItemPanel(ctx, x, y, catItemW, catItemH, COLORS.PANEL_BG, catColor);
      
      ctx.font = `10px "${fonts.bold}"`;
      ctx.textAlign = 'left';
      this.drawTextWithShadow(ctx, this.truncateText(ctx,this.formatCategoryName(category), catItemW - 25 - ITEM_BORDER_WIDTH * 2), x + 10 + ITEM_BORDER_WIDTH, y + 20, COLORS.TEXT_PRIMARY);
      
      ctx.font = `8px "${fonts.main}"`;
      this.drawTextWithShadow(ctx, `${commandCount} CMD${commandCount !== 1 ? 'S' : ''}`, x + 10 + ITEM_BORDER_WIDTH, y + 35, COLORS.TEXT_SECONDARY);
    }
    
    const footerY = height - p - 35;
    this.drawPixelatedPanel(ctx, p, footerY, width - 2 * p, 35, COLORS.PANEL_BG, COLORS.PANEL_BORDER_OUTER, COLORS.PANEL_BORDER_INNER);
    ctx.font = `8px "${fonts.main}"`;
    ctx.textAlign = 'center';
    const serverCount = client.guilds.cache.size;
    this.drawTextWithShadow(ctx, `SERVING ${serverCount} SERVER${serverCount !== 1 ? 'S' : ''} | SELECT BELOW TO EXPLORE`, width / 2, footerY + 22, COLORS.TEXT_SECONDARY);
    
    return canvas.toBuffer('image/png');
  }

  async generateCategoryPage(categoryName, allCommands, prefix, client, page = 1, itemsPerPage = 24) {
    const width = 800;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const fonts = this.getFonts();
    ctx.imageSmoothingEnabled = false;

    this.drawRetroGridBackground(ctx, width, height);

    const p = 20;
    const headerH = 70;
    const catColor = this.getCategoryColor(categoryName);
    this.drawPixelatedPanel(ctx, p, p, width - 2 * p, headerH, COLORS.PANEL_BG, catColor, COLORS.PANEL_BORDER_INNER, PIXEL_BORDER_WIDTH);

    ctx.font = `18px "${fonts.bold}"`;
    ctx.textAlign = 'center';
    this.drawTextWithShadow(ctx, `${this.formatCategoryName(categoryName)} CMDS`, width / 2, p + headerH / 2 + 7, COLORS.TEXT_HEADER);

    ctx.font = `10px "${fonts.main}"`;
    ctx.textAlign = 'right';
    this.drawTextWithShadow(ctx, `${allCommands.length} CMD${allCommands.length !== 1 ? 'S' : ''}`, width - p - 15, p + headerH - 15, COLORS.TEXT_SECONDARY);

    const infoBarY = p + headerH + 10;
    const infoBarH = 30;
    this.drawPixelatedPanel(ctx, p, infoBarY, width - 2 * p, infoBarH, COLORS.PANEL_BG, COLORS.PANEL_BORDER_OUTER);
    ctx.font = `10px "${fonts.main}"`;
    ctx.textAlign = 'center';
    this.drawTextWithShadow(ctx, `"${prefix}HELP [CMD]" FOR DETAILS`, width / 2, infoBarY + infoBarH / 2 + 4, COLORS.TEXT_PRIMARY);

    const cmdListY = infoBarY + infoBarH + 10;
    const cmdListH = height - cmdListY - p - 50;
    this.drawPixelatedPanel(ctx, p, cmdListY, width - 2 * p, cmdListH, COLORS.BG_PRIMARY, COLORS.PANEL_BORDER_OUTER, COLORS.PANEL_BORDER_INNER);

    allCommands.sort((a, b) => a.name.localeCompare(b.name));
    
    const totalPages = Math.ceil(allCommands.length / itemsPerPage);
    page = Math.max(1, Math.min(page, totalPages));
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, allCommands.length);
    const commandsToShow = allCommands.slice(startIndex, endIndex);

    const cols = 3;
    const itemMargin = 8;
    const listPadding = 10 + PIXEL_BORDER_WIDTH;
    const listInnerW = width - 2 * p - 2 * listPadding;
    const itemW = (listInnerW - (cols - 1) * itemMargin) / cols;
    const itemH = 40; 
    const startX = p + listPadding;
    const startY = cmdListY + listPadding;

    for (let i = 0; i < commandsToShow.length; i++) {
      const command = commandsToShow[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (itemW + itemMargin);
      const y = startY + row * (itemH + itemMargin);

      this.drawRetroItemPanel(ctx, x, y, itemW, itemH, COLORS.PANEL_BG, catColor, ITEM_BORDER_WIDTH);
      
      ctx.font = `10px "${fonts.bold}"`;
      ctx.textAlign = 'left';
      this.drawTextWithShadow(ctx, this.truncateText(ctx, command.name.toUpperCase(), itemW - 10 - ITEM_BORDER_WIDTH * 2), x + 5 + ITEM_BORDER_WIDTH, y + 15, COLORS.TEXT_PRIMARY);

      ctx.font = `8px "${fonts.main}"`;
      const desc = command.description || 'NO DESCRIPTION';
      this.drawTextWithShadow(ctx, this.truncateText(ctx, desc.toUpperCase(), itemW - 10 - ITEM_BORDER_WIDTH*2), x + 5 + ITEM_BORDER_WIDTH, y + 30, COLORS.TEXT_SECONDARY);
    }
    
    const footerY = height - p - 35;
    this.drawPixelatedPanel(ctx, p, footerY, width - 2 * p, 35, COLORS.PANEL_BG, COLORS.PANEL_BORDER_OUTER, COLORS.PANEL_BORDER_INNER);
    ctx.font = `8px "${fonts.main}"`;
    ctx.textAlign = 'center';
    const pageInfo = allCommands.length > 0 ? `PAGE ${page}/${totalPages}` : 'NO COMMANDS';
    this.drawTextWithShadow(ctx, `${pageInfo} | USE BUTTONS TO NAVIGATE`, width / 2, footerY + 22, COLORS.TEXT_SECONDARY);

    return canvas.toBuffer('image/png');
  }

  async generateCommandPage(command, prefix, client) {
    const width = 800;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const fonts = this.getFonts();
    ctx.imageSmoothingEnabled = false;

    this.drawRetroGridBackground(ctx, width, height);
    
    const p = 20;
    const headerH = 70;
    const catColor = this.getCategoryColor(command.category);
    this.drawPixelatedPanel(ctx, p, p, width - 2 * p, headerH, COLORS.PANEL_BG, COLORS.TEXT_ACCENT, COLORS.PANEL_BORDER_INNER, PIXEL_BORDER_WIDTH);

    ctx.font = `18px "${fonts.bold}"`;
    ctx.textAlign = 'center';
    this.drawTextWithShadow(ctx, `CMD: ${command.name.toUpperCase()}`, width / 2, p + headerH / 2 + 7, COLORS.TEXT_HEADER);

    ctx.font = `10px "${fonts.main}"`;
    ctx.textAlign = 'right';
    this.drawTextWithShadow(ctx, this.formatCategoryName(command.category), width - p - 15, p + headerH - 15, catColor);

    const infoPanelY = p + headerH + 10;
    const infoPanelH = 100;
    this.drawPixelatedPanel(ctx, p, infoPanelY, width - 2 * p, infoPanelH, COLORS.PANEL_BG, catColor, COLORS.PANEL_BORDER_INNER);

    ctx.font = `10px "${fonts.main}"`;
    ctx.textAlign = 'center';
    const description = command.description ? command.description.toUpperCase() : 'NO DESCRIPTION AVAILABLE.';
    const maxDescLineWidth = width - 2 * p - 30 - (PIXEL_BORDER_WIDTH * 2);
    
    const words = description.split(' ');
    let line = '';
    let descY = infoPanelY + 25 + (PIXEL_BORDER_WIDTH * 2);
    const lineHeight = 14;

    for (const word of words) {
        const testLine = line + (line ? ' ' : '') + word;
        if (ctx.measureText(testLine).width > maxDescLineWidth && line) {
            if (descY + lineHeight < infoPanelY + infoPanelH - 35 - (PIXEL_BORDER_WIDTH * 2)) {
                this.drawTextWithShadow(ctx, line, width / 2, descY, COLORS.TEXT_PRIMARY);
                descY += lineHeight;
            }
            line = word;
        } else {
            line = testLine;
        }
    }
    if (line && descY + lineHeight < infoPanelY + infoPanelH - 35 - (PIXEL_BORDER_WIDTH * 2)) {
         this.drawTextWithShadow(ctx, line, width / 2, descY, COLORS.TEXT_PRIMARY);
    }

    ctx.font = `10px "${fonts.bold}"`;
    const usage = command.usage || command.name;
    this.drawTextWithShadow(ctx, `USAGE: ${prefix}${this.truncateText(ctx, usage.toUpperCase(), maxDescLineWidth - ctx.measureText(`USAGE: ${prefix}`).width)}`, width / 2, infoPanelY + infoPanelH - 20 - (PIXEL_BORDER_WIDTH*2), COLORS.TEXT_ACCENT);

    const detailStartY = infoPanelY + infoPanelH + 10;
    const detailSectionH = 150;
    const panelInnerPadding = PIXEL_BORDER_WIDTH * 2;
    const halfW = (width - 2 * p - 10 - panelInnerPadding * 2) / 2; 

    this.drawPixelatedPanel(ctx, p, detailStartY, halfW + panelInnerPadding, detailSectionH, COLORS.PANEL_BG, COLORS.PANEL_BORDER_OUTER, COLORS.PANEL_BORDER_INNER);
    this.drawPixelatedPanel(ctx, p + halfW + panelInnerPadding + 10, detailStartY, halfW + panelInnerPadding, detailSectionH, COLORS.PANEL_BG, COLORS.PANEL_BORDER_OUTER, COLORS.PANEL_BORDER_INNER);
    
    const contentXLeft = p + 10 + panelInnerPadding;
    const contentXRight = p + halfW + panelInnerPadding + 10 + 10 + panelInnerPadding;
    let currentYLeft = detailStartY + 25 + panelInnerPadding;
    let currentYRight = detailStartY + 25 + panelInnerPadding;
    const detailLineHeight = 18;
    const detailValOffset = 12;
    const textMaxW = halfW - 20;

    ctx.textAlign = 'left';
    ctx.font = `10px "${fonts.bold}"`;
    this.drawTextWithShadow(ctx, 'ALIASES:', contentXLeft, currentYLeft, COLORS.TEXT_PRIMARY);
    ctx.font = `8px "${fonts.main}"`;
    const aliases = command.aliases && command.aliases.length > 0 ? command.aliases.join(', ').toUpperCase() : 'NONE';
    this.drawTextWithShadow(ctx, this.truncateText(ctx, aliases, textMaxW), contentXLeft, currentYLeft + detailValOffset, COLORS.TEXT_SECONDARY);
    currentYLeft += detailLineHeight * 2;

    ctx.font = `10px "${fonts.bold}"`;
    this.drawTextWithShadow(ctx, 'COOLDOWN:', contentXLeft, currentYLeft, COLORS.TEXT_PRIMARY);
    ctx.font = `8px "${fonts.main}"`;
    this.drawTextWithShadow(ctx, `${command.cooldown || 0} SECONDS`, contentXLeft, currentYLeft + detailValOffset, COLORS.TEXT_SECONDARY);
    
    ctx.font = `10px "${fonts.bold}"`;
    this.drawTextWithShadow(ctx, 'CATEGORY:', contentXRight, currentYRight, COLORS.TEXT_PRIMARY);
    ctx.font = `8px "${fonts.main}"`;
    this.drawTextWithShadow(ctx, this.formatCategoryName(command.category), contentXRight, currentYRight + detailValOffset, catColor);
    currentYRight += detailLineHeight * 2;

    ctx.font = `10px "${fonts.bold}"`;
    this.drawTextWithShadow(ctx, 'PERMISSIONS:', contentXRight, currentYRight, COLORS.TEXT_PRIMARY);
    ctx.font = `8px "${fonts.main}"`;
    const requirements = this.getCommandRequirements(command);
    if (requirements.length > 0) {
        for (let i = 0; i < Math.min(requirements.length, 4) ; i++) {
            if(currentYRight + detailValOffset + (i * 10) < detailStartY + detailSectionH - 10 - panelInnerPadding)
             this.drawTextWithShadow(ctx, `• ${this.truncateText(ctx, requirements[i].toUpperCase(), textMaxW - 10)}`, contentXRight, currentYRight + detailValOffset + (i * 10), COLORS.TEXT_SECONDARY);
        }
        if (requirements.length > 4) {
             if(currentYRight + detailValOffset + (4 * 10) < detailStartY + detailSectionH -10 - panelInnerPadding)
            this.drawTextWithShadow(ctx, `  (+${requirements.length - 4} MORE)`, contentXRight, currentYRight + detailValOffset + (4 * 10), COLORS.TEXT_ACCENT);
        }
    } else {
        this.drawTextWithShadow(ctx, 'NONE', contentXRight, currentYRight + detailValOffset, COLORS.TEXT_SECONDARY);
    }
    
    const examplesY = detailStartY + detailSectionH + 10;
    const examplesMinH = 80;
    const examplesContentH = (command.examples && command.examples.length > 0 ? Math.min(command.examples.length, 4) : 0) * 12 + (command.examples && command.examples.length > 4 ? 12 : 0) + 40;
    const examplesH = Math.max(examplesMinH, examplesContentH) ;

    if (command.examples && command.examples.length > 0) {
        if (examplesY + examplesH < height - p - 35) {
            this.drawPixelatedPanel(ctx, p, examplesY, width - 2 * p, examplesH, COLORS.PANEL_BG, COLORS.PANEL_BORDER_OUTER, COLORS.PANEL_BORDER_INNER);
            const examplePanelInnerP = panelInnerPadding + 10;
            ctx.font = `10px "${fonts.bold}"`;
            this.drawTextWithShadow(ctx, 'EXAMPLES:', p + examplePanelInnerP, examplesY + 20 + panelInnerPadding, COLORS.TEXT_PRIMARY);
            ctx.font = `8px "${fonts.main}"`;
            for (let i = 0; i < Math.min(command.examples.length, 4); i++) {
                const example = `• ${prefix}${command.examples[i]}`.toUpperCase();
                 if(examplesY + 35 + panelInnerPadding + (i * 12) < examplesY + examplesH - 5 - panelInnerPadding)
                this.drawTextWithShadow(ctx, this.truncateText(ctx, example, width - 2 * p - 40 - panelInnerPadding*2), p + examplePanelInnerP + 5, examplesY + 35 + panelInnerPadding + (i * 12), COLORS.TEXT_SECONDARY);
            }
            if (command.examples.length > 4 && examplesY + 35 + panelInnerPadding + (4*12) < examplesY + examplesH -5 - panelInnerPadding ) {
                this.drawTextWithShadow(ctx, `  (+${command.examples.length - 4} MORE)`, p + examplePanelInnerP + 5, examplesY + 35 + panelInnerPadding + (4*12), COLORS.TEXT_ACCENT);
            }
        }
    }
    
    const footerY = height - p - 35;
    this.drawPixelatedPanel(ctx, p, footerY, width - 2 * p, 35, COLORS.PANEL_BG, COLORS.PANEL_BORDER_OUTER, COLORS.PANEL_BORDER_INNER);
    ctx.font = `8px "${fonts.main}"`;
    ctx.textAlign = 'center';
    this.drawTextWithShadow(ctx, `TYPE "${prefix}HELP" TO RETURN TO MAIN MENU`, width / 2, footerY + 22, COLORS.TEXT_SECONDARY);

    return canvas.toBuffer('image/png');
  }

  async generateSearchResultsPage(searchTerm, allFilteredCommands, prefix, client, page = 1, itemsPerPage = 24) {
    const width = 800;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const fonts = this.getFonts();
    ctx.imageSmoothingEnabled = false;

    this.drawRetroGridBackground(ctx, width, height);

    const p = 20;
    const headerH = 70;
    this.drawPixelatedPanel(ctx, p, p, width - 2 * p, headerH, COLORS.PANEL_BG, COLORS.TEXT_ACCENT, COLORS.PANEL_BORDER_INNER, PIXEL_BORDER_WIDTH);

    ctx.font = `18px "${fonts.bold}"`;
    ctx.textAlign = 'center';
    this.drawTextWithShadow(ctx, 'SEARCH RESULTS', width / 2, p + headerH / 2 + 7, COLORS.TEXT_HEADER);

    ctx.font = `8px "${fonts.main}"`;
    ctx.textAlign = 'right';
    const resultText = `"${this.truncateText(ctx, searchTerm.toUpperCase(), 20)}" - ${allFilteredCommands.length} RESULT${allFilteredCommands.length !== 1 ? 'S' : ''}`;
    this.drawTextWithShadow(ctx, resultText, width - p - 15, p + headerH - 15, COLORS.TEXT_SECONDARY);
    
    const infoBarY = p + headerH + 10;
    const infoBarH = 30;
    this.drawPixelatedPanel(ctx, p, infoBarY, width - 2 * p, infoBarH, COLORS.PANEL_BG, COLORS.PANEL_BORDER_OUTER);
    ctx.font = `10px "${fonts.main}"`;
    ctx.textAlign = 'center';
    this.drawTextWithShadow(ctx, `RESULTS FOR "${this.truncateText(ctx, searchTerm.toUpperCase(), 30)}"`, width / 2, infoBarY + infoBarH / 2 + 4, COLORS.TEXT_PRIMARY);

    const resultsPanelY = infoBarY + infoBarH + 10;
    const resultsPanelH = height - resultsPanelY - p - 50;
    this.drawPixelatedPanel(ctx, p, resultsPanelY, width - 2 * p, resultsPanelH, COLORS.BG_PRIMARY, COLORS.PANEL_BORDER_OUTER, COLORS.PANEL_BORDER_INNER);
    
    const listPadding = 10 + PIXEL_BORDER_WIDTH;

    if (allFilteredCommands.length === 0) {
        ctx.font = `12px "${fonts.bold}"`;
        ctx.textAlign = 'center';
        this.drawTextWithShadow(ctx, 'NO COMMANDS FOUND', width / 2, resultsPanelY + resultsPanelH / 2 - 5, COLORS.TEXT_PRIMARY);
        ctx.font = `10px "${fonts.main}"`;
        this.drawTextWithShadow(ctx, 'TRY A DIFFERENT SEARCH TERM.', width / 2, resultsPanelY + resultsPanelH / 2 + 10, COLORS.TEXT_SECONDARY);
    } else {
        allFilteredCommands.sort((a, b) => a.name.localeCompare(b.name));
        
        const totalPages = Math.ceil(allFilteredCommands.length / itemsPerPage);
        page = Math.max(1, Math.min(page, totalPages));
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, allFilteredCommands.length);
        const commandsToShow = allFilteredCommands.slice(startIndex, endIndex);

        const cols = 3;
        const itemMargin = 8;
        const listInnerW = width - 2 * p - 2 * listPadding;
        const itemW = (listInnerW - (cols - 1) * itemMargin) / cols;
        const itemH = 40;
        const startX = p + listPadding;
        const startY = resultsPanelY + listPadding;

        for (let i = 0; i < commandsToShow.length; i++) {
            const command = commandsToShow[i];
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = startX + col * (itemW + itemMargin);
            const y = startY + row * (itemH + itemMargin);
            const cmdCatColor = this.getCategoryColor(command.category);

            this.drawRetroItemPanel(ctx, x, y, itemW, itemH, COLORS.PANEL_BG, cmdCatColor, ITEM_BORDER_WIDTH);
            
            ctx.font = `10px "${fonts.bold}"`;
            ctx.textAlign = 'left';
            this.drawTextWithShadow(ctx, this.truncateText(ctx, command.name.toUpperCase(), itemW - 10 - ITEM_BORDER_WIDTH*2), x + 5 + ITEM_BORDER_WIDTH, y + 15, COLORS.TEXT_PRIMARY);

            ctx.font = `8px "${fonts.main}"`;
            const catStr = this.formatCategoryName(command.category);
            this.drawTextWithShadow(ctx, this.truncateText(ctx, catStr, itemW - 10 - ITEM_BORDER_WIDTH*2), x + 5 + ITEM_BORDER_WIDTH, y + 30, cmdCatColor);
        }
    }
    
    const footerY = height - p - 35;
    this.drawPixelatedPanel(ctx, p, footerY, width - 2 * p, 35, COLORS.PANEL_BG, COLORS.PANEL_BORDER_OUTER, COLORS.PANEL_BORDER_INNER);
    ctx.font = `8px "${fonts.main}"`;
    ctx.textAlign = 'center';
    const pageInfo = allFilteredCommands.length > 0 ? `PAGE ${page}/${Math.ceil(allFilteredCommands.length / itemsPerPage)}` : 'NO RESULTS';
    this.drawTextWithShadow(ctx, `"${prefix}HELP [CMD]" FOR DETAILS | ${pageInfo} | USE BUTTONS TO NAVIGATE`, width / 2, footerY + 22, COLORS.TEXT_SECONDARY);
    
    return canvas.toBuffer('image/png');
  }

  getCommandRequirements(command) {
    const requirements = [];
    if (command.ownerOnly || command.category?.toLowerCase() === 'owner') {
      requirements.push('Bot Owner Only');
    } else if (command.category?.toLowerCase() === 'developer') {
      requirements.push('Bot Developer Only');
    }

    if (command.permissions && command.permissions.length > 0) {
      command.permissions.forEach(perm => {
        requirements.push(`Perm: ${this.formatPermission(perm)}`);
      });
    }
    if (command.voiceRequired) {
      requirements.push('Voice Channel Req.');
    }
    if (command.sameVoiceRequired) {
      requirements.push('Same Voice Req.');
    }
    if (command.playerRequired) {
      requirements.push('Player Active Req.');
    }
    if (command.playingRequired) { 
     requirements.push('Music Playing Req.');
    }
    if (command.customRequirements && command.customRequirements.length > 0) {
        command.customRequirements.forEach(req => requirements.push(req));
    }
    return requirements;
  }

  formatPermission(permission) {
    return permission
      .toUpperCase()
      .replace(/_/g, ' ');
  }
}
