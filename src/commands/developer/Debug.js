/**
 * Muffin STUDIO - Bre4d777 & prayag 
 * https://discord.gg/TRPqseUq32
 * give credits or ill touch you in your dreams
 */

import {
    ContainerBuilder,
    TextDisplayBuilder,
    SectionBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    codeBlock,
    ComponentType,
    MessageFlags
} from 'discord.js';
import { Command } from '../../structures/Command.js'
import { PlayerManager } from '../../managers/PlayerManager.js';
import { config } from '../../config/config.js';
import util from 'util';
import os from 'os';
import process from 'process';
import vm from 'vm';
import { exec as callbackExec } from 'child_process';

const exec = util.promisify(callbackExec);

class DebugCommand extends Command {
    constructor() {
        super({
            name: 'debug',
            description: 'Developer tools for inspection and execution.',
            usage: 'debug',
            aliases: ['dev', 'dbg'],
            category: 'developer',
            ownerOnly: true,
        });

        this.context = {
            client: null,
            message: null,
            guild: null,
            channel: null,
            author: null,
            musicManager: null,
            player: null,
            playerManager: null,
            config,
            util,
            os,
            process,
            console,
            require: (id) =>
                import (id),
            Buffer,
            URL,
            setTimeout,
            setInterval,
            clearTimeout,
            clearInterval,
        };

        this.evalHistory = [];
        this.maxHistorySize = 50;
    }

    async execute({ client, message, args, musicManager }) {
        this.updateContext({ client, message, musicManager });

        const mainDashboard = this.buildDashboard();
        const msg = await message.channel.send({
            ...mainDashboard,
            flags: [MessageFlags.IsComponentsV2],
        });

        const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 600_000,
            filter: (i) => i.user.id === message.author.id,
        });

        collector.on('collect', async (i) => {
            try {
                let view;
                switch (i.customId) {
                    case 'debug_refresh':
                        view = this.buildDashboard();
                        await i.update({ ...view, flags: [MessageFlags.IsComponentsV2] });
                        break;
                    case 'debug_eval':
                        await this.showEvalModal(i);
                        break;
                    case 'debug_system':
                        view = this.buildSystemView();
                        await i.update({ ...view, flags: [MessageFlags.IsComponentsV2] });
                        break;
                    case 'debug_cache':
                        view = this.buildCacheView();
                        await i.update({ ...view, flags: [MessageFlags.IsComponentsV2] });
                        break;
                    case 'debug_exec':
                        await this.showExecModal(i);
                        break;
                    case 'debug_history':
                        view = this.buildHistoryView();
                        await i.reply({ ...view, flags: [MessageFlags.IsComponentsV2], ephemeral: true });
                        break;
                    case 'debug_home':
                        view = this.buildDashboard();
                        await i.update({ ...view, flags: [MessageFlags.IsComponentsV2] });
                        break;
                    case 'debug_cleanup':
                        view = this.performCleanup();
                        await i.update({ ...view, flags: [MessageFlags.IsComponentsV2] });
                        break;
                }
            } catch (error) {
                console.error('Debug command interaction failed:', error);
                const reply = { content: 'An error occurred while processing your request.', ephemeral: true };
                if (i.replied || i.deferred) {
                    await i.followUp(reply).catch(() => {});
                } else {
                    await i.reply(reply).catch(() => {});
                }
            }
        });

        collector.on('end', () => {
            msg.edit({ components: [] }).catch(() => {});
        });
    }

    updateContext({ client, message, musicManager }) {
        const { guild, channel, author } = message;
        const player = musicManager?.getPlayer(guild?.id);

        Object.assign(this.context, {
            client,
            message,
            guild,
            channel,
            author,
            musicManager,
            player,
            playerManager: player ? new PlayerManager(player) : null,
        });
    }

    buildMainActions() {
        return new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('debug_eval').setLabel('Evaluate').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('debug_system').setLabel('System').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('debug_cache').setLabel('Cache').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('debug_exec').setLabel('Execute').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('debug_history').setLabel('History').setStyle(ButtonStyle.Secondary)
        );
    }

    buildNavActions(isHome = false) {
        return new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('debug_home').setLabel('Dashboard').setStyle(ButtonStyle.Success).setDisabled(isHome),
            new ButtonBuilder().setCustomId('debug_cleanup').setLabel('Cleanup').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('debug_refresh').setLabel('Refresh').setStyle(ButtonStyle.Primary)
        );
    }

    buildDashboard() {
        const memUsage = process.memoryUsage();
        return new ContainerBuilder()
            .setAccentColor(0x5865F2)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent('# Developer Suite'))
            .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
            .addSectionComponents(
                new SectionBuilder().addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`**Node.js:** ${process.version}`),
                    new TextDisplayBuilder().setContent(`**Uptime:** ${this.formatUptime(process.uptime())}`),
                    new TextDisplayBuilder().setContent(`**Memory:** ${this.formatBytes(memUsage.rss)}`)
                )
            )
            .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true))
            .addActionRowComponents(this.buildMainActions())
            .addActionRowComponents(this.buildNavActions(true));
    }

    buildSystemView() {
        const totalMem = os.totalmem();
        const usedMem = totalMem - os.freemem();
        const cpu = os.cpus()[0];
        return new ContainerBuilder()
            .setAccentColor(0x3498DB)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent('## System Overview'))
            .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
            .addSectionComponents(
                new SectionBuilder().addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`**Platform:** ${os.platform()} (${os.arch()})`),
                    new TextDisplayBuilder().setContent(`**CPU:** ${cpu.model}`),
                    new TextDisplayBuilder().setContent(`**Cores:** ${os.cpus().length}`)
                ),
                new SectionBuilder().addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`**Memory:** ${this.formatBytes(usedMem)} / ${this.formatBytes(totalMem)} (${((usedMem / totalMem) * 100).toFixed(2)}%)`),
                    new TextDisplayBuilder().setContent(`**Load Avg:** ${os.loadavg().map(l => l.toFixed(2)).join(', ')}`)
                )
            )
            .addActionRowComponents(this.buildNavActions());
    }

    buildCacheView() {
        const { client } = this.context;
        const totalMessages = client.channels.cache.reduce((acc, channel) => acc + (channel.messages?.cache.size || 0), 0);
        return new ContainerBuilder()
            .setAccentColor(0x1ABC9C)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent('## Cache Analysis'))
            .addSeparatorComponents(new SeparatorBuilder())
            .addSectionComponents(
                new SectionBuilder().addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`**Guilds:** ${client.guilds.cache.size.toLocaleString()}`),
                    new TextDisplayBuilder().setContent(`**Users:** ${client.users.cache.size.toLocaleString()}`),
                    new TextDisplayBuilder().setContent(`**Channels:** ${client.channels.cache.size.toLocaleString()}`)
                ),
                new SectionBuilder().addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`**Messages:** ${totalMessages.toLocaleString()}`),
                    new TextDisplayBuilder().setContent(`**Emojis:** ${client.emojis.cache.size.toLocaleString()}`),
                    new TextDisplayBuilder().setContent(`**Voice States:** ${client.guilds.cache.reduce((a, g) => a + g.voiceStates.cache.size, 0)}`)
                )
            )
            .addActionRowComponents(this.buildNavActions());
    }

    performCleanup() {
        const { client } = this.context;
        let messagesCleaned = 0;
        client.guilds.cache.forEach(guild => guild.channels.cache.forEach(channel => {
            if (channel.messages?.cache.size > 0) {
                messagesCleaned += channel.messages.cache.size;
                channel.messages.cache.clear();
            }
        }));
        if (global.gc) global.gc();
        const historyCleared = this.evalHistory.length;
        this.evalHistory = [];

        return new ContainerBuilder()
            .setAccentColor(0x2ECC71)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent('## Cleanup Complete'))
            .addSectionComponents(new SectionBuilder().addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`**Messages Cleared:** ${messagesCleaned.toLocaleString()}`),
                new TextDisplayBuilder().setContent(`**Eval History:** ${historyCleared} entries cleared`),
                new TextDisplayBuilder().setContent(`**GC Executed:** ${global.gc ? 'Yes' : 'No'}`)
            ))
            .addActionRowComponents(this.buildNavActions());
    }

    buildHistoryView() {
        if (this.evalHistory.length === 0) {
            return new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent('No execution history.'));
        }
        const container = new ContainerBuilder()
            .setAccentColor(0x95A5A6)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent('## Execution History'));

        this.evalHistory.slice(-5).reverse().forEach(item => {
            const status = item.success ? '✅' : '❌';
            const preview = item.code.length > 200 ? item.code.substring(0, 200) + '...' : item.code;
            container.addSectionComponents(new SectionBuilder().addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`**${status} [${new Date(item.timestamp).toLocaleTimeString()}]**\n\`\`\`js\n${preview}\n\`\`\``)
            ));
        });
        return container;
    }

    async showEvalModal(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('debug_eval_modal')
            .setTitle('Code Evaluation')
            .addComponents(new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('code').setLabel('Code to Evaluate').setStyle(TextInputStyle.Paragraph).setPlaceholder('Enter JavaScript code...').setRequired(true)
            ));
        await interaction.showModal(modal);

        try {
            const modalInteraction = await interaction.awaitModalSubmit({ time: 300_000, filter: i => i.user.id === interaction.user.id });
            await modalInteraction.deferReply({ ephemeral: true });
            const code = modalInteraction.fields.getTextInputValue('code');
            await this.evalCode(modalInteraction, code);
        } catch (e) { /* Modal timeout */ }
    }

    async showExecModal(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('debug_exec_modal')
            .setTitle('Execute Shell Command')
            .addComponents(new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('command').setLabel('Shell Command').setStyle(TextInputStyle.Short).setPlaceholder('e.g., ls -la').setRequired(true)
            ));
        await interaction.showModal(modal);
        try {
            const modalInteraction = await interaction.awaitModalSubmit({ time: 120_000, filter: i => i.user.id === interaction.user.id });
            await modalInteraction.deferReply({ ephemeral: true });
            const command = modalInteraction.fields.getTextInputValue('command');
            await this.execCommand(modalInteraction, command);
        } catch (e) { /* Modal timeout */ }
    }

    async evalCode(interaction, code) {
        const startTime = process.hrtime.bigint();
        let output, error, type;

        try {
            const script = new vm.Script(code, { timeout: 10000 });
            const context = vm.createContext({ ...this.context });
            let result = script.runInContext(context, { timeout: 10000 });
            if (result instanceof Promise) {
                result = await Promise.race([result, new Promise((_, reject) => setTimeout(() => reject(new Error('Promise timed out')), 15000))]);
            }
            type = this.getDetailedType(result);
            output = result;
            this.addToHistory({ code, result: output, type, timestamp: Date.now(), success: true });
        } catch (err) {
            error = err;
            output = err.stack || err.message;
            type = 'Error';
            this.addToHistory({ code, result: output, type: 'Error', timestamp: Date.now(), success: false });
        }
        const executionTime = Number(process.hrtime.bigint() - startTime) / 1e6;
        return this.sendPaginatedResult(interaction, { input: code, output, error, type, executionTime, title: 'Evaluation Result' });
    }

    async execCommand(interaction, command) {
        const startTime = process.hrtime.bigint();
        try {
            const { stdout, stderr } = await exec(command, { timeout: 15000, maxBuffer: 1024 * 5 * 1024 });
            const executionTime = Number(process.hrtime.bigint() - startTime) / 1e6;
            this.sendPaginatedResult(interaction, {
                input: command,
                output: stdout || stderr || 'Command executed with no output.',
                error: null,
                executionTime,
                title: 'Shell Execution Result'
            });
        } catch (err) {
            const executionTime = Number(process.hrtime.bigint() - startTime) / 1e6;
            this.sendPaginatedResult(interaction, {
                input: command,
                output: err.stdout || err.stderr || err.message,
                error: err,
                executionTime,
                title: 'Shell Execution Result'
            });
        }
    }

    async sendPaginatedResult(interaction, { input, output, error, type, executionTime, title }) {
        const processedOutput = this.processOutput(output);
        const chunks = this.chunkString(processedOutput, 1800);
        let page = 0;

        const buildResultView = () => {
            const container = new ContainerBuilder()
                .setAccentColor(error ? 0xED4245 : 0x57F287)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${title}`));

            const metadata = [];
            if (type) metadata.push(`**Type:** \`${type}\``);
            if (executionTime !== undefined) metadata.push(`**Time:** \`${executionTime.toFixed(3)}ms\``);
            if (chunks.length > 1) metadata.push(`**Page:** ${page + 1}/${chunks.length}`);

            container.addSectionComponents(
                new SectionBuilder().addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`**Input**\n${codeBlock('js', this.clean(input))}`),
                    new TextDisplayBuilder().setContent(`**Output**\n${codeBlock('js', chunks[page] || 'No output.')}`),
                    new TextDisplayBuilder().setContent(metadata.join('\n'))
                )
            );
            return container;
        };

        const createComponents = () => {
            if (chunks.length <= 1) return [];
            return [new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('prev').setLabel('◀').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
                new ButtonBuilder().setCustomId('next').setLabel('▶').setStyle(ButtonStyle.Secondary).setDisabled(page === chunks.length - 1)
            )];
        };

        const msg = await interaction.editReply({ ...buildResultView(), components: createComponents(), ephemeral: true });
        if (chunks.length <= 1) return;

        const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300_000, filter: i => i.user.id === interaction.user.id });
        collector.on('collect', async i => {
            if (i.customId === 'prev') page--;
            if (i.customId === 'next') page++;
            await i.update({ ...buildResultView(), components: createComponents() });
        });
        collector.on('end', () => msg.edit({ components: [] }).catch(() => {}));
    }

    processOutput(output) {
        if (typeof output !== 'string') {
            output = util.inspect(output, { depth: 3, maxArrayLength: 100, breakLength: 100 });
        }
        return this.clean(output);
    }

    clean(text) {
        if (typeof text !== 'string') return text;
        const tokenPattern = this.context.client?.token ? new RegExp(this.context.client.token, "g") : null;
        text = text.replace(/`/g, '`\u200b').replace(/@/g, '@\u200b');
        if (tokenPattern) {
            text = text.replace(tokenPattern, '[REDACTED]');
        }
        return text;
    }

    chunkString(str, size) {
        const numChunks = Math.ceil(str.length / size);
        const chunks = new Array(numChunks);
        for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
            chunks[i] = str.substring(o, size);
        }
        return chunks.length > 0 ? chunks : [' '];
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${['Bytes', 'KB', 'MB', 'GB', 'TB'][i]}`;
    }

    formatUptime(seconds) {
        seconds = Number(seconds);
        const d = Math.floor(seconds / 86400);
        const h = Math.floor(seconds % 86400 / 3600);
        const m = Math.floor(seconds % 3600 / 60);
        const s = Math.floor(seconds % 60);
        return [
            d > 0 ? `${d}d` : '', h > 0 ? `${h}h` : '', m > 0 ? `${m}m` : '', s > 0 ? `${s}s` : ''
        ].filter(Boolean).join(' ') || '0s';
    }

    getDetailedType(value) {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (value.constructor) return value.constructor.name;
        return typeof value;
    }

    addToHistory(entry) {
        this.evalHistory.push(entry);
        if (this.evalHistory.length > this.maxHistorySize) {
            this.evalHistory.shift();
        }
    }
}

export default new DebugCommand();
