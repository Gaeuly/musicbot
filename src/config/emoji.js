/**
 * Muffin STUDIO - Bre4d777 & prayag 
 * https://discord.gg/TRPqseUq32
 * give credits or ill touch you in your dreams
 */

/**
 * Emoji configuration for the bot
 * These emojis can be used throughout the bot to maintain consistent styling
 */
export const emoji = {
  // Status Emojis
  success: '<:discotoolsxyzicon69:1347122753613987890>',
  error: '<:discotoolsxyzicon70:1347122749876863048>',
  warning: '<:discotoolsxyzicon87:1347122685267939348>',
  info: '<:discotoolsxyzicon87:1347122685267939348>',
  
  // Music Player Emojis
  playing: '<:Play:1372101837733236736>',
  paused: '<:pause:1372091659881418823>',
  stopped: '<:Stop:1372101811934199818>',
  skipped: '<:skip:1372101831429455882>',
  previous: '<:Previous:1372101825771077713>',
  loop: '<:Loop_none:1372101799984500831>',
  loopOne: '<:Loop_track:1372101820578664519>',
  shuffle: '<:Shuffle:1372101919279022151>',
  queue: '<:queue:1372101913662984243>',
  volume: '<:Vol:1372101789033173073>',
  volumeUp: '🔊',
  volumeDown: '🔉',
  volumeMute: '🔇',
  favorite: '<:discotoolsxyzicon77:1347122721724825641>',
  unfavorite: '<:discotoolsxyzicon78:1347122717803024394>',
  
  // Music Content Emojis
  music: '🎵',
  musicNotes: '🎶',
  disc: '💿',
  cd: '💿',
  vinyl: '🎧',
  playlist: '📂',
  album: '💽',
  radio: '📻',
  liveMusic: '🎤',
  dj: '🎧',
  studio: '🎚️',
  microphone: '🎙️',
  guitar: '🎸',
  piano: '🎹',
  drum: '🥁',
  saxophone: '🎷',
  trumpet: '🎺',
  violin: '🎻',
  headphones: '🎧',
  
  // Music Actions
  play: '▶️',
  fastForward: '⏩',
  rewind: '⏪',
  next: '⏭️',
  back: '⏮️',
  repeat: '🔁',
  repeatOne: '🔂',
  nowPlaying: '🎧',
  addToQueue: '➕',
  removeFromQueue: '➖',
  clearQueue: '🧹',
  filter: '🔍',
  bassBoost: '💥',
  karaoke: '🎤',
  nightcore: '🌙',
  eightD: '🔄',
  vaporwave: '🌊',
  
  // Level/Rank Emojis
  level: '🌟',
  experience: '✨',
  rank: '🏆',
  leaderboard: '📊',
  
  // Achievement Emojis
  achievement: '🏅',
  commandAchievement: '💬',
  musicAchievement: '🎵',
  specialAchievement: '🎖️',
  
  // Profile Emojis
  profile: '👤',
  bio: '📝',
  calendar: '📅',
  
  // System Emojis
  loading: '<a:loading_red:1378726957138575403>',
  settings: '⚙️',
  time: '⏰',
  
  // Badge Emojis
  developer: '👨‍💻',
  owner: '👑',
  admin: '🛡️',
  moderator: '🔨',
  vip: '💎',
  supporter: '❤️',
  
  // Progress bar elements
  progressFilled: '█',
  progressEmpty: '░',
  progressStart: '⏮️',
  progressEnd: '⏭️',
  progressCurrent: '🔘',
  
  // Music Services & Platforms
  spotify: '🟢',
  youtube: '🔴',
  soundcloud: '🟠',
  appleMusic: '🍎',
  deezer: '🎵',
  
  // Music Mood & Genres
  partyMusic: '🎉',
  chill: '😌',
  sad: '😢',
  energetic: '⚡',
  romantic: '💖',
  pop: '🎤',
  rock: '🤘',
  electronic: '🎛️',
  classical: '🎻',
  hiphop: '🎧',
  jazz: '🎷',
  
  // Misc Music Emojis
  heart: '❤️',
  star: '⭐',
  fire: '🔥',
  sparkles: '✨',
  trophy: '🏆',
  medal: '🎖️',
  chart: '📈',
  note: '🎵',
  notes: '🎶',
  microphone: '🎤',
  headphones: '🎧',
  speaker: '🔈',
  loudSpeaker: '📢',
  megaphone: '📣',
  clock: '🕒',
  hourglass: '⌛',
  pin: '📌',
  bookmark: '🔖',
  label: '🏷️',
  speechBalloon: '💬',
  envelope: '✉️',
  rocket: '🚀',
  star2: '🌠',
  dizzy: '💫',
  partyPopper: '🎉',
  confettiBall: '🎊',
  tada: '🎉',
  gift: '🎁',
  crown: '👑',
  gem: '💎',
  moneybag: '💰',
  magicWand: '🪄',
  lock: '🔒',
  unlock: '🔓',
  key: '🔑',
  hammer: '🔨',
  wrench: '🔧',
  gear: '⚙️',
  notepad: '📝',
  memo: '📝',
  book: '📖',
  books: '📚',
  newspaper: '📰',
  
  // DJ & Audio Effects
  mixer: '🎚️',
  equalizer: '🎛️',
  wave: '〰️',
  audioWave: '📶',
  vibration: '📳',
  muted: '🔇',
  loud: '🔊',
  
  // Music States
  offline: '⚫',
  online: '🟢',
  streaming: '🔴',
  buffering: '🔄',
  connecting: '🔌',
  
  // Get emoji by name with a fallback
  get(name, fallback = '') {
    return this[name] || fallback;
  }
};

// Export the emojis object as default
export default emoji;