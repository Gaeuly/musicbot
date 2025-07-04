/**
 * Muffin STUDIO - Bre4d777 & prayag 
 * https://discord.gg/TRPqseUq32
 * give credits or ill touch you in your dreams
 */

import { ClusterManager, HeartbeatManager } from 'discord-hybrid-sharding';
import { config } from './config/config.js';

const manager = new ClusterManager('./src/index.js', {
    totalShards: 3,                  // Let Discord decide based on guild count
    shardsPerClusters: 10,                     // You can tweak this to 3–6 for 3k–4k servers
    mode: 'process',                      // 'process' is safer for production
    token: config.token,                  // Required for /gateway/bot shard count
    respawn: true,                        // Auto-respawn on crash
    restartMode: 'gracefulSwitch',        // Clean restarts without downtime
});

manager.extend(
    new HeartbeatManager({
        interval: 2000,                   // 2s interval
        maxMissedHeartbeats: 5,           // Restart cluster if no heartbeat in 10s
    })
);

// Optional: cluster lifecycle logs
manager.on('clusterCreate', cluster => {
    console.log(`[Cluster] Launched Cluster ${cluster.id}`);
});
manager.on('debug', msg => {
    if (!msg.includes('Heartbeats')) console.log(`[Debug] ${msg}`);
});

manager.spawn({ timeout: -1 });           // Spawn with no timeout limit