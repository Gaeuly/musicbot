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
import axios from 'axios';

export default class  VoiceStatusManager {
  constructor(client) {
    this.client = client;
  }

  async set(channelId, status) {
    if (!channelId || !status) return;

    try {
      await axios.put(
        `https://discord.com/api/v10/channels/${channelId}/voice-status`,
        { status },
        { headers: { Authorization: `Bot ${this.client.token}` } }
      );
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message;
      console.error(`[VoiceStatusManager] Failed to update status: ${errMsg}`);
    }
  }

  async clear(channelId) {
    await this.set(channelId, '<a:a_anime:1371398962669555722> Use play and start playing music with me');
  }

  async updateForStart(player) {
    const current = player.queue.current || player._currentTrack;
    if (player.paused) {
      return this.set(player.voiceId, `<:Playing_1378707448113659995:1378707464479969370> Paused **${current.title}**`);
    }
    if (player.radio) {
      return this.set(player.voiceId, `<a:Playing:1378707448113659995> Playing **${player.radioName}** radio`);
    }
      if (player.data.guessing) {

      return this.set(player.voiceId, `<a:Playing:1378707448113659995> Guess The Song Game!`);
          }
    if (current?.title) {
      return this.set(player.voiceId, `<a:Playing:1378707448113659995> Playing **${current.title}** by ${current.author}`);
    }
  }

  async updateForEnd(player) {
    return this.clear(player.voiceId);
  }

  async updateForEmpty(player, is247, autoplay) {
    let status = '<:discotoolsxyzicon87:1347122685267939348> Use play command to start playing'
    if (autoplay) {
      status = '<a:byte_loading:1370748439918280864> Fetching related songs, please wait';
    } else {
      status = is247 ? '<a:EastAnime115:1371399856727396424> Ready to vibe with **Avon**? <a:EastAnime116:1371493823489904640>' : '<:discotoolsxyzicon87:1347122685267939348> Use play command to start playing';
      return this.set(player.voiceId, status);
    }
  }
}
