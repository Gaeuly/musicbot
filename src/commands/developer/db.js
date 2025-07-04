/**
 * Muffin STUDIO - Bre4d777 & prayag 
 * https://discord.gg/TRPqseUq32
 * give credits or ill touch you in your dreams
 */

import { Command } from '../../structures/Command.js';
import { 
  ContainerBuilder, 
  TextDisplayBuilder, 
  SectionBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  MessageFlags, 
  ButtonStyle, 
  SeparatorBuilder, 
  SeparatorSpacingSize 
} from 'discord.js';
import { Test } from '../../database/Test.js';

class DBTestCommand extends Command {
  constructor() {
    super({
      name: 'dbtest',
      description: 'Comprehensive database performance benchmarking and testing',
      usage: 'dbtest [full|insert|select|update|delete|transaction|memory|stress|cleanup|cachedread|largedata|complextx|vacuum]',
      aliases: ['dbt', 'dbperf'],
      category: 'owner',
      ownerOnly: true
    });
    this.testDb = new Test();
  }

  async execute({ message, args, client }) {
    const testType = args[0]?.toLowerCase() || 'help';
    let container;

    try {
      switch (testType) {
        case 'full':
          container = await this.runFullBenchmark(message);
          break;
        case 'insert':
          container = await this.runInsertTest(message);
          break;
        case 'select':
          container = await this.runSelectTest(message);
          break;
        case 'update':
          container = await this.runUpdateTest(message);
          break;
        case 'delete':
          container = await this.runDeleteTest(message);
          break;
        case 'transaction':
          container = await this.runTransactionTest(message);
          break;
        case 'memory':
          container = await this.runMemoryTest(message);
          break;
        case 'stress':
          container = await this.runStressTest(message);
          break;
        case 'cleanup':
          container = await this.runCleanup(message);
          break;
        case 'info':
          container = await this.showDatabaseInfo(message);
          break;
        case 'cachedread':
          container = await this.runCachedReadTest(message);
          break;
        case 'largedata':
          container = await this.runLargeDataInsertTest(message);
          break;
        case 'complextx':
          container = await this.runComplexTransactionTest(message);
          break;
        case 'vacuum':
          container = await this.runVacuumTest(message);
          break;
        default:
          container = this.buildHelpMessage();
          break;
      }
      
      await message.channel.send({ components: [container], flags: [MessageFlags.IsComponentsV2] });

    } catch (error) {
      const errorContainer = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('# Test Failed')
        )
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setDivider(true)
            .setSpacing(SeparatorSpacingSize.Small)
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`${error.message}\n\`\`\`${error.stack.slice(0, 1000)}\`\`\``)
        );
      
      await message.channel.send({ components: [errorContainer], flags: [MessageFlags.IsComponentsV2] });
    }
  }

  buildHelpMessage() {
    return new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('# Database Test Commands')
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('**full**: Complete benchmark suite\n**insert**: Insert performance test\n**select**: Select query performance')
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(false)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('**update**: Update operation test\n**delete**: Delete operation test\n**transaction**: Transaction performance')
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(false)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('**memory**: Memory usage analysis\n**stress**: 10-second stress test\n**cleanup**: Clean test data')
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(false)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('**info**: Database information\n**cachedread**: Cached read performance\n**largedata**: Large data insert performance\n**complextx**: Complex transaction test\n**vacuum**: VACUUM performance test')
      );
  }

  async runFullBenchmark(message) {
    const statusMsg = await message.channel.send('Running full database benchmark suite...');
    
    const startTime = performance.now();
    const results = await this.testDb.runFullBenchmark();
    const totalTime = performance.now() - startTime;

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# Complete Database Benchmark Results\nTotal benchmark time: ${(totalTime / 1000).toFixed(2)}s`)
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**Insert Performance**\n${this.formatInsertResults(results.insert_benchmark)}`)
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(false)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**Select Performance**\n${this.formatSelectResults(results.select_benchmark)}`)
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(false)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**Transaction Performance**\n${this.formatTransactionResults(results.transaction_benchmark)}`)
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(false)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**Memory Usage**\n${this.formatMemoryResults(results.memory_benchmark)}`)
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(false)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**Stress Test**\n${this.formatStressResults(results.stress_test)}`)
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(false)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**Database Info**\n${this.formatDatabaseInfo(results.database_info)}`)
      )
      .addActionRowComponents(row =>
        row.setComponents(
          new ButtonBuilder().setCustomId('refresh_full').setLabel('Refresh').setStyle(ButtonStyle.Primary)
        )
      );

    await statusMsg.delete();
    return container;
  }

  async runInsertTest(message) {
    const statusMsg = await message.channel.send('Running insert performance test...');
    
    const results = await this.testDb.benchmarkInserts();
    
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('# Insert Performance Test\nResults for different batch sizes:')
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(SeparatorSpacingSize.Small)
      );
    
    const entries = Object.entries(results);
    entries.forEach(([size, data], index) => {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**${size.replace('_', ' ').toUpperCase()}**\n` +
          `**${data.operations_per_second.toFixed(0)}** ops/sec\n` +
          `Avg: ${data.avg_response_time.toFixed(2)}ms\n` +
          `95th: ${data.percentile_95?.toFixed(2) || 'N/A'}ms\n` +
          `99th: ${data.percentile_99?.toFixed(2) || 'N/A'}ms`
        )
      );
      
      if (index < entries.length - 1) {
        container.addSeparatorComponents(
          new SeparatorBuilder()
            .setDivider(false)
            .setSpacing(SeparatorSpacingSize.Small)
        );
      }
    });

    container.addActionRowComponents(row =>
      row.setComponents(
        new ButtonBuilder().setCustomId('refresh_insert').setLabel('Refresh').setStyle(ButtonStyle.Primary)
      )
    );

    await statusMsg.delete();
    return container;
  }

  async runSelectTest(message) {
    const statusMsg = await message.channel.send('Running select performance test...');
    
    const results = await this.testDb.benchmarkSelects();
    
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('# Select Performance Test\nResults for different query types:')
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(SeparatorSpacingSize.Small)
      );

    const entries = Object.entries(results);
    entries.forEach(([queryType, data], index) => {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**${queryType.replace('_', ' ').toUpperCase()}**\n` +
          `**${data.operations_per_second.toFixed(0)}** ops/sec\n` +
          `Avg: ${data.avg_response_time.toFixed(2)}ms\n` +
          `95th: ${data.percentile_95?.toFixed(2) || 'N/A'}ms\n` +
          `99th: ${data.percentile_99?.toFixed(2) || 'N/A'}ms`
        )
      );
      
      if (index < entries.length - 1) {
        container.addSeparatorComponents(
          new SeparatorBuilder()
            .setDivider(false)
            .setSpacing(SeparatorSpacingSize.Small)
        );
      }
    });

    container.addActionRowComponents(row =>
      row.setComponents(
        new ButtonBuilder().setCustomId('refresh_select').setLabel('Refresh').setStyle(ButtonStyle.Primary)
      )
    );

    await statusMsg.delete();
    return container;
  }

  async runUpdateTest(message) {
    const statusMsg = await message.channel.send('Running update performance test...');
    
    const results = await this.testDb.benchmarkUpdates();
    
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('# Update Performance Test\nResults for different update operations:')
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(SeparatorSpacingSize.Small)
      );

    const entries = Object.entries(results);
    entries.forEach(([updateType, data], index) => {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**${updateType.replace('_', ' ').toUpperCase()}**\n` +
          `**${data.operations_per_second.toFixed(0)}** ops/sec\n` +
          `Avg: ${data.avg_response_time.toFixed(2)}ms\n` +
          `Range: ${data.min_response_time.toFixed(2)}-${data.max_response_time.toFixed(2)}ms`
        )
      );
      
      if (index < entries.length - 1) {
        container.addSeparatorComponents(
          new SeparatorBuilder()
            .setDivider(false)
            .setSpacing(SeparatorSpacingSize.Small)
        );
      }
    });

    container.addActionRowComponents(row =>
      row.setComponents(
        new ButtonBuilder().setCustomId('refresh_update').setLabel('Refresh').setStyle(ButtonStyle.Primary)
      )
    );

    await statusMsg.delete();
    return container;
  }

  async runDeleteTest(message) {
    const statusMsg = await message.channel.send('Running delete performance test...');
    
    const results = await this.testDb.benchmarkDeletes();
    
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('# Delete Performance Test')
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**Delete Operations**\n` +
          `**${results.operations_per_second.toFixed(0)}** ops/sec\n` +
          `Total Operations: ${results.total_operations}\n` +
          `Duration: ${results.duration_ms.toFixed(2)}ms\n` +
          `Avg Response: ${results.avg_response_time.toFixed(2)}ms\n` +
          `Range: ${results.min_response_time.toFixed(2)}-${results.max_response_time.toFixed(2)}ms`
        )
      )
      .addActionRowComponents(row =>
        row.setComponents(
          new ButtonBuilder().setCustomId('refresh_delete').setLabel('Refresh').setStyle(ButtonStyle.Primary)
        )
      );

    await statusMsg.delete();
    return container;
  }

  async runTransactionTest(message) {
    const statusMsg = await message.channel.send('Running transaction performance test...');
    
    const results = await this.testDb.benchmarkTransactions();
    
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('# Transaction Performance Test\nResults for different transaction sizes:')
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(SeparatorSpacingSize.Small)
      );

    const entries = Object.entries(results);
    entries.forEach(([size, data], index) => {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**${size.replace('_', ' ').toUpperCase()}**\n` +
          `**${data.transactions_per_second.toFixed(0)}** tx/sec\n` +
          `**${data.operations_per_second.toFixed(0)}** ops/sec\n` +
          `Avg TX Time: ${data.avg_transaction_time.toFixed(2)}ms\n` +
          `Range: ${data.min_transaction_time.toFixed(2)}-${data.max_transaction_time.toFixed(2)}ms`
        )
      );
      
      if (index < entries.length - 1) {
        container.addSeparatorComponents(
          new SeparatorBuilder()
            .setDivider(false)
            .setSpacing(SeparatorSpacingSize.Small)
        );
      }
    });

    container.addActionRowComponents(row =>
      row.setComponents(
        new ButtonBuilder().setCustomId('refresh_transaction').setLabel('Refresh').setStyle(ButtonStyle.Primary)
      )
    );

    await statusMsg.delete();
    return container;
  }

  async runMemoryTest(message) {
    const statusMsg = await message.channel.send('Running memory usage test...');
    
    const results = await this.testDb.benchmarkMemoryUsage();
    
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('# Memory Usage Test')
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**Memory Statistics**\n` +
          `Initial Heap: ${(results.initial_memory.heapUsed / 1024 / 1024).toFixed(2)} MB\n` +
          `Final Heap: ${(results.final_memory.heapUsed / 1024 / 1024).toFixed(2)} MB\n` +
          `Memory Growth: ${(results.memory_growth / 1024 / 1024).toFixed(2)} MB\n` +
          `Records Inserted: ${results.records_inserted.toLocaleString()}\n` +
          `Memory per Record: ${(results.memory_per_record / 1024).toFixed(2)} KB`
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(false)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**RSS Memory**\n` +
          `Initial: ${(results.initial_memory.rss / 1024 / 1024).toFixed(2)} MB\n` +
          `Final: ${(results.final_memory.rss / 1024 / 1024).toFixed(2)} MB\n` +
          `Growth: ${((results.final_memory.rss - results.initial_memory.rss) / 1024 / 1024).toFixed(2)} MB`
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(false)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**External Memory**\n` +
          `Initial: ${(results.initial_memory.external / 1024 / 1024).toFixed(2)} MB\n` +
          `Final: ${(results.final_memory.external / 1024 / 1024).toFixed(2)} MB\n` +
          `Growth: ${((results.final_memory.external - results.initial_memory.external) / 1024 / 1024).toFixed(2)} MB`
        )
      )
      .addActionRowComponents(row =>
        row.setComponents(
          new ButtonBuilder().setCustomId('refresh_memory').setLabel('Refresh').setStyle(ButtonStyle.Primary)
        )
      );

    await statusMsg.delete();
    return container;
  }

  async runStressTest(message) {
    const statusMsg = await message.channel.send('Running 10-second stress test...');
    
    const results = await this.testDb.runStressTest();
    
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('# Database Stress Test (10 seconds)')
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**Performance Metrics**\n` +
          `**${results.operations_per_second.toFixed(0)}** ops/sec\n` +
          `Total Operations: ${results.total_operations.toLocaleString()}\n` +
          `Duration: ${(results.duration_ms / 1000).toFixed(2)}s\n` +
          `Avg Operation Time: ${results.avg_operation_time.toFixed(2)}ms`
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(false)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**Response Time Distribution**\n` +
          `Min: ${results.min_operation_time.toFixed(2)}ms\n` +
          `Max: ${results.max_operation_time.toFixed(2)}ms\n` +
          `95th Percentile: ${results.percentile_95.toFixed(2)}ms\n` +
          `99th Percentile: ${results.percentile_99.toFixed(2)}ms`
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(false)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**Test Configuration**\n` +
          `Mixed Operations: INSERT, SELECT, UPDATE, DELETE\n` +
          `Random Distribution: 25% each operation type\n` +
          `Concurrent Execution: Single-threaded`
        )
      )
      .addActionRowComponents(row =>
        row.setComponents(
          new ButtonBuilder().setCustomId('refresh_stress').setLabel('Refresh').setStyle(ButtonStyle.Primary)
        )
      );

    await statusMsg.delete();
    return container;
  }

  async runCleanup(message) {
    const statusMsg = await message.channel.send('Cleaning up test data...');
    
    this.testDb.cleanup();
    
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('# Test Data Cleanup\nAll test data has been removed from the database')
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**Cleanup Actions**\n` +
          `Deleted all benchmark_data records\n` +
          `Deleted all performance_logs records\n` +
          `Executed VACUUM to reclaim space`
        )
      );

    await statusMsg.delete();
    return container;
  }

  async showDatabaseInfo(message) {
    const info = await this.testDb.getDatabaseInfo();
    const systemInfo = this.testDb.getSystemInfo();
    
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('# Database Information')
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**Database Details**\n` +
          `Path: ${info.database_path}\n` +
          `File Size: ${info.file_size_mb} MB\n` +
          `Total Records: ${info.total_records.toLocaleString()}\n` +
          `SQLite Version: ${info.sqlite_version}`
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(false)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**System Information**\n` +
          `Node.js: ${systemInfo.node_version}\n` +
          `Platform: ${systemInfo.platform}\n` +
          `Architecture: ${systemInfo.arch}\n` +
          `Uptime: ${(systemInfo.uptime_seconds / 60).toFixed(1)} minutes`
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(false)
          .setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**Memory Usage**\n` +
          `RSS: ${systemInfo.memory_usage.rss}\n` +
          `Heap Used: ${systemInfo.memory_usage.heap_used}\n` +
          `Heap Total: ${systemInfo.memory_usage.heap_total}\n` +
          `External: ${systemInfo.memory_usage.external}`
        )
      );

    return container;
  }

  // Placeholder methods for missing test types
  async runCachedReadTest(message) {
    const statusMsg = await message.channel.send('Running cached read test...');
    
    // Add your cached read test logic here
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('# Cached Read Test\nTest not implemented yet')
      );

    await statusMsg.delete();
    return container;
  }

  async runLargeDataInsertTest(message) {
    const statusMsg = await message.channel.send('Running large data insert test...');
    
    // Add your large data insert test logic here
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('# Large Data Insert Test\nTest not implemented yet')
      );

    await statusMsg.delete();
    return container;
  }

  async runComplexTransactionTest(message) {
    const statusMsg = await message.channel.send('Running complex transaction test...');
    
    // Add your complex transaction test logic here
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('# Complex Transaction Test\nTest not implemented yet')
      );

    await statusMsg.delete();
    return container;
  }

  async runVacuumTest(message) {
    const statusMsg = await message.channel.send('Running vacuum test...');
    
    // Add your vacuum test logic here
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('# Vacuum Test\nTest not implemented yet')
      );

    await statusMsg.delete();
    return container;
  }

  // Helper methods for formatting results
  formatInsertResults(results) {
    const entries = Object.entries(results);
    if (entries.length === 0) return 'No data available';
    
    return entries.slice(0, 3).map(([size, data]) => 
      `**${size}**: ${data.operations_per_second.toFixed(0)} ops/sec`
    ).join('\n');
  }

  formatSelectResults(results) {
    const topResults = Object.entries(results)
      .sort((a, b) => b[1].operations_per_second - a[1].operations_per_second)
      .slice(0, 3);
    
    return topResults.map(([type, data]) => 
      `**${type.replace('_', ' ')}**: ${data.operations_per_second.toFixed(0)} ops/sec`
    ).join('\n');
  }

  formatTransactionResults(results) {
    const entries = Object.entries(results);
    if (entries.length === 0) return 'No data available';
    
    return entries.slice(0, 2).map(([size, data]) => 
      `**${size}**: ${data.transactions_per_second.toFixed(0)} tx/sec`
    ).join('\n');
  }

  formatMemoryResults(results) {
    return `Growth: ${(results.memory_growth / 1024 / 1024).toFixed(2)} MB\n` +
           `Per Record: ${(results.memory_per_record / 1024).toFixed(2)} KB\n` +
           `Records: ${results.records_inserted.toLocaleString()}`;
  }

  formatStressResults(results) {
    return `**${results.operations_per_second.toFixed(0)}** ops/sec\n` +
           `Operations: ${results.total_operations.toLocaleString()}\n` +
           `99th Percentile: ${results.percentile_99.toFixed(2)}ms`;
  }

  formatDatabaseInfo(info) {
    return `Size: ${info.file_size_mb} MB\n` +
           `Records: ${info.total_records.toLocaleString()}\n` +
           `SQLite: ${info.sqlite_version}`;
  }
}

export default new DBTestCommand();