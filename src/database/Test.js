/**
 * Muffin STUDIO - Bre4d777 & prayag 
 * https://discord.gg/TRPqseUq32
 * give credits or ill touch you in your dreams
 */

import { Database } from './Database.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';
import fs from 'fs';
import path from 'path';

export class Test extends Database {
  constructor() {
    super(config.database.test || 'database/test.db');
    this.initTables();
  }

  initTables() {
    try {
      this.exec(`
        CREATE TABLE IF NOT EXISTS benchmark_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          guild_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          channel_id TEXT NOT NULL,
          message_content TEXT NOT NULL,
          metadata TEXT,
          score INTEGER DEFAULT 0,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT 1
        )
      `);

      this.exec(`
        CREATE TABLE IF NOT EXISTS performance_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          test_type TEXT NOT NULL,
          operations_per_second REAL NOT NULL,
          avg_response_time REAL NOT NULL,
          min_response_time REAL NOT NULL,
          max_response_time REAL NOT NULL,
          total_operations INTEGER NOT NULL,
          duration_ms REAL NOT NULL,
          memory_before INTEGER NOT NULL,
          memory_after INTEGER NOT NULL,
          memory_peak INTEGER NOT NULL,
          cpu_usage REAL,
          database_size INTEGER,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_benchmark_guild ON benchmark_data(guild_id)',
        'CREATE INDEX IF NOT EXISTS idx_benchmark_user ON benchmark_data(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_benchmark_timestamp ON benchmark_data(timestamp)',
        'CREATE INDEX IF NOT EXISTS idx_benchmark_composite ON benchmark_data(guild_id, user_id, is_active)'
      ];

      indexes.forEach((indexSQL) => {
        try {
          this.exec(indexSQL);
        } catch (indexError) {
          logger.warn('TestDatabase', 'Failed to create index', indexError);
        }
      });

      logger.success('TestDatabase', 'Benchmark tables initialized');
    } catch (error) {
      logger.error('TestDatabase', 'Failed to initialize benchmark tables', error);
      throw error;
    }
  }

  async runFullBenchmark() {
    const benchmark = {
      database_info: await this.getDatabaseInfo(),
      insert_benchmark: await this.benchmarkInserts(),
      select_benchmark: await this.benchmarkSelects(),
      update_benchmark: await this.benchmarkUpdates(),
      delete_benchmark: await this.benchmarkDeletes(),
      transaction_benchmark: await this.benchmarkTransactions(),
      concurrent_benchmark: await this.benchmarkConcurrency(),
      memory_benchmark: await this.benchmarkMemoryUsage(),
      index_benchmark: await this.benchmarkIndexPerformance(),
      cached_read_benchmark: await this.benchmarkCachedReads(), // New
      large_data_insert_benchmark: await this.benchmarkLargeDataInserts(), // New
      complex_transaction_benchmark: await this.benchmarkComplexTransactions(), // New
      vacuum_benchmark: await this.benchmarkVacuum(), // New
      stress_test: await this.runStressTest(),
      system_info: this.getSystemInfo()
    };

    await this.saveBenchmarkResults(benchmark);
    return benchmark;
  }

  async benchmarkInserts() {
    const testSizes = [100, 1000, 5000, 10000];
    const results = {};

    for (const size of testSizes) {
      const startTime = performance.now();
      const startMemory = process.memoryUsage();
      const responseTimes = [];

      this.exec('BEGIN TRANSACTION');
      
      for (let i = 0; i < size; i++) {
        const opStart = performance.now();
        this.exec(
          'INSERT INTO benchmark_data (guild_id, user_id, channel_id, message_content, metadata, score) VALUES (?, ?, ?, ?, ?, ?)',
          [
            `guild_${Math.floor(i / 100)}`,
            `user_${i}`,
            `channel_${Math.floor(i / 50)}`,
            `message_content_${i}_${'x'.repeat(Math.floor(Math.random() * 100))}`,
            JSON.stringify({ test: i, random: Math.random(), timestamp: Date.now() }),
            Math.floor(Math.random() * 1000)
          ]
        );
        responseTimes.push(performance.now() - opStart);
      }
      
      this.exec('COMMIT');
      
      const endTime = performance.now();
      const endMemory = process.memoryUsage();
      const duration = endTime - startTime;

      results[`${size}_records`] = {
        total_operations: size,
        duration_ms: duration,
        operations_per_second: (size / duration) * 1000,
        avg_response_time: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
        min_response_time: Math.min(...responseTimes),
        max_response_time: Math.max(...responseTimes),
        memory_delta: endMemory.heapUsed - startMemory.heapUsed,
        throughput_mb_per_sec: ((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024) / (duration / 1000)
      };

      this.logPerformanceResult('INSERT', results[`${size}_records`]);
    }

    return results;
  }

  async benchmarkSelects() {
    const queryTypes = {
      simple_select: 'SELECT * FROM benchmark_data WHERE id = ?',
      indexed_select: 'SELECT * FROM benchmark_data WHERE guild_id = ?',
      range_select: 'SELECT * FROM benchmark_data WHERE id BETWEEN ? AND ?',
      complex_select: `
        SELECT guild_id, COUNT(*) as count, AVG(score) as avg_score, 
               MAX(timestamp) as latest, MIN(timestamp) as earliest
        FROM benchmark_data 
        WHERE is_active = 1 AND score > ?
        GROUP BY guild_id 
        ORDER BY count DESC 
        LIMIT ?
      `,
      join_select: `
        SELECT b1.guild_id, b1.user_id, COUNT(b2.id) as related_count
        FROM benchmark_data b1
        LEFT JOIN benchmark_data b2 ON b1.guild_id = b2.guild_id AND b1.id != b2.id
        WHERE b1.score > ?
        GROUP BY b1.guild_id, b1.user_id
        LIMIT ?
      `
    };

    const results = {};
    const iterations = 1000;

    for (const [queryName, query] of Object.entries(queryTypes)) {
      const startTime = performance.now();
      const responseTimes = [];

      for (let i = 0; i < iterations; i++) {
        const opStart = performance.now();
        
        switch (queryName) {
          case 'simple_select':
            this.get(query, [Math.floor(Math.random() * 1000) + 1]);
            break;
          case 'indexed_select':
            this.all(query, [`guild_${Math.floor(Math.random() * 10)}`]);
            break;
          case 'range_select':
            const start = Math.floor(Math.random() * 900) + 1;
            this.all(query, [start, start + 100]);
            break;
          case 'complex_select':
            this.all(query, [Math.floor(Math.random() * 500), 10]);
            break;
          case 'join_select':
            this.all(query, [Math.floor(Math.random() * 300), 20]);
            break;
        }
        
        responseTimes.push(performance.now() - opStart);
      }

      const duration = performance.now() - startTime;

      results[queryName] = {
        total_operations: iterations,
        duration_ms: duration,
        operations_per_second: (iterations / duration) * 1000,
        avg_response_time: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
        min_response_time: Math.min(...responseTimes),
        max_response_time: Math.max(...responseTimes),
        percentile_95: this.calculatePercentile(responseTimes, 95),
        percentile_99: this.calculatePercentile(responseTimes, 99)
      };

      this.logPerformanceResult(`SELECT_${queryName.toUpperCase()}`, results[queryName]);
    }

    return results;
  }

  async benchmarkUpdates() {
    const updateTypes = {
      single_update: 'UPDATE benchmark_data SET score = ? WHERE id = ?',
      bulk_update: 'UPDATE benchmark_data SET metadata = ? WHERE guild_id = ?',
      conditional_update: 'UPDATE benchmark_data SET is_active = 0 WHERE score < ? AND timestamp < ?'
    };

    const results = {};
    const iterations = 500;

    for (const [updateName, query] of Object.entries(updateTypes)) {
      const startTime = performance.now();
      const responseTimes = [];

      for (let i = 0; i < iterations; i++) {
        const opStart = performance.now();
        
        switch (updateName) {
          case 'single_update':
            this.exec(query, [Math.floor(Math.random() * 1000), Math.floor(Math.random() * 1000) + 1]);
            break;
          case 'bulk_update':
            this.exec(query, [JSON.stringify({ updated: Date.now(), batch: i }), `guild_${Math.floor(Math.random() * 10)}`]);
            break;
          case 'conditional_update':
            this.exec(query, [200, new Date(Date.now() - 86400000).toISOString()]);
            break;
        }
        
        responseTimes.push(performance.now() - opStart);
      }

      const duration = performance.now() - startTime;

      results[updateName] = {
        total_operations: iterations,
        duration_ms: duration,
        operations_per_second: (iterations / duration) * 1000,
        avg_response_time: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
        min_response_time: Math.min(...responseTimes),
        max_response_time: Math.max(...responseTimes)
      };

      this.logPerformanceResult(`UPDATE_${updateName.toUpperCase()}`, results[updateName]);
    }

    return results;
  }

  async benchmarkDeletes() {
    const iterations = 200;
    const startTime = performance.now();
    const responseTimes = [];

    for (let i = 0; i < iterations; i++) {
      const opStart = performance.now();
      this.exec('DELETE FROM benchmark_data WHERE score < ? AND id % 10 = ?', [100, i % 10]);
      responseTimes.push(performance.now() - opStart);
    }

    const duration = performance.now() - startTime;

    return {
      total_operations: iterations,
      duration_ms: duration,
      operations_per_second: (iterations / duration) * 1000,
      avg_response_time: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      min_response_time: Math.min(...responseTimes),
      max_response_time: Math.max(...responseTimes)
    };
  }

  async benchmarkTransactions() {
    const transactionSizes = [10, 50, 100, 500];
    const results = {};

    for (const size of transactionSizes) {
      const iterations = 50;
      const startTime = performance.now();
      const responseTimes = [];

      for (let i = 0; i < iterations; i++) {
        const txStart = performance.now();
        
        this.exec('BEGIN TRANSACTION');
        try {
          for (let j = 0; j < size; j++) {
            this.exec(
              'INSERT INTO benchmark_data (guild_id, user_id, channel_id, message_content, score) VALUES (?, ?, ?, ?, ?)',
              [`tx_guild_${i}`, `tx_user_${j}`, `tx_channel_${i}`, `tx_message_${j}`, Math.floor(Math.random() * 1000)]
            );
          }
          this.exec('COMMIT');
        } catch (error) {
          this.exec('ROLLBACK');
          throw error;
        }
        
        responseTimes.push(performance.now() - txStart);
      }

      const duration = performance.now() - startTime;
      const totalOps = iterations * size;

      results[`${size}_ops_per_tx`] = {
        transactions: iterations,
        operations_per_transaction: size,
        total_operations: totalOps,
        duration_ms: duration,
        transactions_per_second: (iterations / duration) * 1000,
        operations_per_second: (totalOps / duration) * 1000,
        avg_transaction_time: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
        min_transaction_time: Math.min(...responseTimes),
        max_transaction_time: Math.max(...responseTimes)
      };

      this.logPerformanceResult(`TRANSACTION_${size}OPS`, results[`${size}_ops_per_tx`]);
    }

    return results;
  }

  async benchmarkConcurrency() {
    const concurrentOperations = async (opCount, opType) => {
      const promises = [];
      const startTime = performance.now();

      for (let i = 0; i < opCount; i++) {
        if (opType === 'read') {
          promises.push(Promise.resolve().then(() => {
            return this.get('SELECT * FROM benchmark_data WHERE id = ?', [Math.floor(Math.random() * 1000) + 1]);
          }));
        } else if (opType === 'write') {
          promises.push(Promise.resolve().then(() => {
            return this.exec(
              'INSERT INTO benchmark_data (guild_id, user_id, channel_id, message_content, score) VALUES (?, ?, ?, ?, ?)',
              [`conc_guild_${i}`, `conc_user_${i}`, `conc_channel_${i}`, `concurrent_message_${i}`, Math.floor(Math.random() * 1000)]
            );
          }));
        }
      }

      await Promise.all(promises);
      return performance.now() - startTime;
    };

    const concurrencyLevels = [10, 50, 100];
    const results = {};

    for (const level of concurrencyLevels) {
      const readTime = await concurrentOperations(level, 'read');
      const writeTime = await concurrentOperations(level, 'write');

      results[`${level}_concurrent`] = {
        concurrent_reads: {
          operations: level,
          duration_ms: readTime,
          operations_per_second: (level / readTime) * 1000
        },
        concurrent_writes: {
          operations: level,
          duration_ms: writeTime,
          operations_per_second: (level / writeTime) * 1000
        }
      };

      this.logPerformanceResult(`CONCURRENT_${level}`, results[`${level}_concurrent`]);
    }

    return results;
  }

  async benchmarkMemoryUsage() {
    const initialMemory = process.memoryUsage();
    const memorySnapshots = [initialMemory];

    const largeDataSet = 10000;
    for (let i = 0; i < largeDataSet; i++) {
      this.exec(
        'INSERT INTO benchmark_data (guild_id, user_id, channel_id, message_content, metadata, score) VALUES (?, ?, ?, ?, ?, ?)',
        [
          `mem_guild_${i % 100}`,
          `mem_user_${i}`,
          `mem_channel_${i % 50}`,
          'x'.repeat(500),
          JSON.stringify({ large_data: 'x'.repeat(200), index: i }),
          i
        ]
      );

      if (i % 1000 === 0) {
        memorySnapshots.push(process.memoryUsage());
      }
    }

    const finalMemory = process.memoryUsage();

    return {
      initial_memory: initialMemory,
      final_memory: finalMemory,
      memory_growth: finalMemory.heapUsed - initialMemory.heapUsed,
      memory_snapshots: memorySnapshots,
      records_inserted: largeDataSet,
      memory_per_record: (finalMemory.heapUsed - initialMemory.heapUsed) / largeDataSet
    };
  }

  async benchmarkIndexPerformance() {
    const testQueries = [
      'SELECT * FROM benchmark_data WHERE guild_id = ? LIMIT 100',
      'SELECT * FROM benchmark_data WHERE user_id = ? LIMIT 100',
      'SELECT * FROM benchmark_data WHERE timestamp > ? LIMIT 100'
    ];

    const results = {};
    const iterations = 1000;

    for (let i = 0; i < testQueries.length; i++) {
      const query = testQueries[i];
      const startTime = performance.now();

      for (let j = 0; j < iterations; j++) {
        switch (i) {
          case 0:
            this.all(query, [`guild_${j % 10}`]);
            break;
          case 1:
            this.all(query, [`user_${j % 100}`]);
            break;
          case 2:
            this.all(query, [new Date(Date.now() - Math.random() * 86400000).toISOString()]);
            break;
        }
      }

      const duration = performance.now() - startTime;
      results[`index_test_${i + 1}`] = {
        query: query,
        iterations: iterations,
        duration_ms: duration,
        operations_per_second: (iterations / duration) * 1000
      };
    }

    return results;
  }

  async benchmarkCachedReads() {
    const numReads = 5000;
    const readIds = [];

    // Insert some data first to ensure there's data to read
    this.exec('BEGIN TRANSACTION');
    for (let i = 0; i < 10000; i++) {
      this.exec('INSERT INTO benchmark_data (guild_id, user_id, channel_id, message_content, score) VALUES (?, ?, ?, ?, ?)',
        [`cached_guild_${i % 10}`, `cached_user_${i}`, `cached_channel_${i % 5}`, `cached_message_${i}`, Math.floor(Math.random() * 1000)]);
      if (i % 2 === 0) { // Select a subset of IDs to read repeatedly
        readIds.push(i + 1); // Assuming IDs start from 1
      }
    }
    this.exec('COMMIT');

    // Warm-up reads
    for (let i = 0; i < readIds.length; i++) {
      this.get('SELECT * FROM benchmark_data WHERE id = ?', [readIds[i]]);
    }

    const responseTimes = [];
    const startTime = performance.now();
    for (let i = 0; i < numReads; i++) {
      const opStart = performance.now();
      const idToRead = readIds[Math.floor(Math.random() * readIds.length)];
      this.get('SELECT * FROM benchmark_data WHERE id = ?', [idToRead]);
      responseTimes.push(performance.now() - opStart);
    }
    const duration = performance.now() - startTime;

    return {
      total_operations: numReads,
      duration_ms: duration,
      operations_per_second: (numReads / duration) * 1000,
      avg_response_time: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      min_response_time: Math.min(...responseTimes),
      max_response_time: Math.max(...responseTimes),
      percentile_95: this.calculatePercentile(responseTimes, 95),
      percentile_99: this.calculatePercentile(responseTimes, 99)
    };
  }

  async benchmarkLargeDataInserts() {
    const numRecords = 50;
    const recordSizeKB = 500; // 500KB per record
    const largeString = 'x'.repeat(recordSizeKB * 1024); // 500KB string

    const startTime = performance.now();
    const startMemory = process.memoryUsage();
    const responseTimes = [];

    this.exec('BEGIN TRANSACTION');
    for (let i = 0; i < numRecords; i++) {
      const opStart = performance.now();
      this.exec(
        'INSERT INTO benchmark_data (guild_id, user_id, channel_id, message_content, metadata, score) VALUES (?, ?, ?, ?, ?, ?)',
        [
          `large_guild_${i}`,
          `large_user_${i}`,
          `large_channel_${i}`,
          largeString, // Large string for message_content
          JSON.stringify({ large_data_payload: largeString.substring(0, 1024) }), // Smaller payload for metadata
          i
        ]
      );
      responseTimes.push(performance.now() - opStart);
    }
    this.exec('COMMIT');

    const endTime = performance.now();
    const endMemory = process.memoryUsage();
    const duration = endTime - startTime;

    return {
      total_operations: numRecords,
      duration_ms: duration,
      operations_per_second: (numRecords / duration) * 1000,
      avg_response_time: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      min_response_time: Math.min(...responseTimes),
      max_response_time: Math.max(...responseTimes),
      memory_delta: endMemory.heapUsed - startMemory.heapUsed,
      data_size_per_record_kb: recordSizeKB
    };
  }

  async benchmarkComplexTransactions() {
    const numTransactions = 20;
    const operationsPerTransaction = 50;

    const results = {};
    const responseTimes = [];

    for (let i = 0; i < numTransactions; i++) {
      const txStart = performance.now();
      this.exec('BEGIN TRANSACTION');
      try {
        for (let j = 0; j < operationsPerTransaction; j++) {
          const userId = `complex_user_${Math.floor(Math.random() * 100)}`;
          const score = Math.floor(Math.random() * 1000);

          // Operation 1: Insert new record
          this.exec('INSERT INTO benchmark_data (guild_id, user_id, channel_id, message_content, score) VALUES (?, ?, ?, ?, ?)',
            [`complex_guild_${i}`, userId, `complex_channel_${j}`, `complex_message_${j}`, score]);

          // Operation 2: Update existing record based on user_id
          this.exec('UPDATE benchmark_data SET score = ? WHERE user_id = ? AND is_active = 1', [score + 100, userId]);

          // Operation 3: Select data to simulate read-modify-write
          const existing = this.get('SELECT id, score FROM benchmark_data WHERE user_id = ? ORDER BY id DESC LIMIT 1', [userId]);
          if (existing) {
            this.exec('UPDATE benchmark_data SET metadata = ? WHERE id = ?', [JSON.stringify({ last_updated: Date.now(), old_score: existing.score }), existing.id]);
          }
        }
        this.exec('COMMIT');
      } catch (error) {
        this.exec('ROLLBACK');
        throw error;
      }
      responseTimes.push(performance.now() - txStart);
    }

    const duration = responseTimes.reduce((a, b) => a + b, 0);
    const totalOperations = numTransactions * operationsPerTransaction * 3; // Approx 3 ops per inner loop

    results.complex_transactions = {
      transactions: numTransactions,
      operations_per_transaction: operationsPerTransaction * 3, // Approx
      total_operations: totalOperations,
      duration_ms: duration,
      transactions_per_second: (numTransactions / duration) * 1000,
      operations_per_second: (totalOperations / duration) * 1000,
      avg_transaction_time: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      min_transaction_time: Math.min(...responseTimes),
      max_transaction_time: Math.max(...responseTimes)
    };

    return results;
  }

  async benchmarkVacuum() {
    // Insert a large number of records, then delete some to create fragmentation
    this.exec('BEGIN TRANSACTION');
    for (let i = 0; i < 50000; i++) {
      this.exec('INSERT INTO benchmark_data (guild_id, user_id, channel_id, message_content, score) VALUES (?, ?, ?, ?, ?)',
        [`vacuum_guild_${i % 100}`, `vacuum_user_${i}`, `vacuum_channel_${i % 50}`, `vacuum_message_${i}`, Math.floor(Math.random() * 1000)]);
    }
    this.exec('COMMIT');

    this.exec('DELETE FROM benchmark_data WHERE score < 500'); // Delete ~half the records

    const startTime = performance.now();
    this.exec('VACUUM');
    const duration = performance.now() - startTime;

    return {
      duration_ms: duration,
      description: 'Time taken to VACUUM the database after deletions.'
    };
  }

  async runStressTest() {
    const stressResults = {};
    const stressDuration = 10000;
    const startTime = Date.now();

    let operations = 0;
    const operationTimes = [];

    while (Date.now() - startTime < stressDuration) {
      const opStart = performance.now();
      const operation = Math.floor(Math.random() * 4);

      switch (operation) {
        case 0:
          this.exec(
            'INSERT INTO benchmark_data (guild_id, user_id, channel_id, message_content, score) VALUES (?, ?, ?, ?, ?)',
            [`stress_guild_${operations % 20}`, `stress_user_${operations}`, `stress_channel_${operations % 10}`, `stress_message_${operations}`, Math.floor(Math.random() * 1000)]
          );
          break;
        case 1:
          this.get('SELECT * FROM benchmark_data WHERE id = ?', [Math.floor(Math.random() * 1000) + 1]);
          break;
        case 2:
          this.exec('UPDATE benchmark_data SET score = ? WHERE id = ?', [Math.floor(Math.random() * 1000), Math.floor(Math.random() * 1000) + 1]);
          break;
        case 3:
          this.exec('DELETE FROM benchmark_data WHERE score < ? LIMIT 1', [Math.floor(Math.random() * 100)]);
          break;
      }

      operationTimes.push(performance.now() - opStart);
      operations++;
    }

    const actualDuration = Date.now() - startTime;

    return {
      duration_ms: actualDuration,
      total_operations: operations,
      operations_per_second: (operations / actualDuration) * 1000,
      avg_operation_time: operationTimes.reduce((a, b) => a + b, 0) / operationTimes.length,
      min_operation_time: Math.min(...operationTimes),
      max_operation_time: Math.max(...operationTimes),
      percentile_95: this.calculatePercentile(operationTimes, 95),
      percentile_99: this.calculatePercentile(operationTimes, 99)
    };
  }

  async getDatabaseInfo() {
    const stats = this.get('SELECT COUNT(*) as total_records FROM benchmark_data');
    const dbPath = this.databasePath || config.database.test || 'database/test.db';
    
    let fileSize = 0;
    try {
      const stat = fs.statSync(dbPath);
      fileSize = stat.size;
    } catch (error) {
      logger.warn('TestDatabase', 'Could not get database file size');
    }

    return {
      database_path: dbPath,
      file_size_bytes: fileSize,
      file_size_mb: (fileSize / 1024 / 1024).toFixed(2),
      total_records: stats.total_records,
      sqlite_version: this.get('SELECT sqlite_version() as version').version
    };
  }

  getSystemInfo() {
    const memUsage = process.memoryUsage();
    return {
      node_version: process.version,
      platform: process.platform,
      arch: process.arch,
      memory_usage: {
        rss: (memUsage.rss / 1024 / 1024).toFixed(2) + ' MB',
        heap_used: (memUsage.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
        heap_total: (memUsage.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
        external: (memUsage.external / 1024 / 1024).toFixed(2) + ' MB'
      },
      uptime_seconds: process.uptime()
    };
  }

  calculatePercentile(arr, percentile) {
    const sorted = arr.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  logPerformanceResult(testType, data) {
    this.exec(`
      INSERT INTO performance_logs (
        test_type, operations_per_second, avg_response_time, min_response_time, 
        max_response_time, total_operations, duration_ms, memory_before, 
        memory_after, memory_peak, database_size
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      testType,
      data.operations_per_second || 0,
      data.avg_response_time || data.avg_operation_time || 0,
      data.min_response_time || data.min_operation_time || 0,
      data.max_response_time || data.max_operation_time || 0,
      data.total_operations || 0,
      data.duration_ms || 0,
      data.memory_before || 0,
      data.memory_after || 0,
      data.memory_peak || 0,
      data.database_size || 0
    ]);
  }

  async saveBenchmarkResults(benchmark) {
    const filePath = path.join(process.cwd(), 'logs', `benchmark_${Date.now()}.json`);
    try {
      if (!fs.existsSync(path.dirname(filePath))) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(benchmark, null, 2));
      logger.success('TestDatabase', `Benchmark results saved to ${filePath}`);
    } catch (error) {
      logger.error('TestDatabase', 'Failed to save benchmark results', error);
    }
  }

  cleanup() {
    try {
      this.exec('DELETE FROM benchmark_data');
      this.exec('DELETE FROM performance_logs');
      this.exec('VACUUM');
      
      const dbPath = this.databasePath || config.database.test || 'database/test.db';
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
        logger.success('TestDatabase', `Database file ${dbPath} deleted.`);
      } else {
        logger.warn('TestDatabase', `Database file ${dbPath} not found for deletion.`);
      }
      logger.success('TestDatabase', 'Test data cleaned up');
    } catch (error) {
      logger.error('TestDatabase', 'Failed to cleanup test data', error);
    }
  }
}
