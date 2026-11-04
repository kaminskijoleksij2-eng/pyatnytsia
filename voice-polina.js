// Озвучка голосового чату П'ятниці: Поліна (Microsoft Edge TTS) через Cloudflare Worker, маршрут /tts.
// Підключається одним рядком у index.html і перевизначає стару speakPremium (ElevenLabs/Puter більше не викликається).
// Якщо Worker не відповів — П'ятниця автоматично говорить системним голосом.

const TTS_VOICE = 'uk-UA-PolinaNeural';

function playPolina(audio) {
  return new Promise((resolve, reject) => {
    currentVoiceAudio = audio;
    audio.onended = resolve;
    audio.onerror = () => reject(new Error('помилка відтворення'));
    audio.play().catch(reject);
  });
}

speakPremium = async function (text) {
  setFaceState('speaking');
  voiceStatus.textContent = 'говорю...';
  voiceTranscript.textContent = '';
  let url = null;
  try {
    const clean = text
      .replace(/[*_#`]/g, '')
      .replace(/\p{Extended_Pictographic}/gu, '')
      .trim();
    if (!clean) return;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 25000);
    const res = await fetch(ENDPOINT + '/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: clean, voice: TTS_VOICE }),
      signal: ctrl.signal
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error('TTS ' + res.status);
    const blob = await res.blob();
    if (!blob.size) throw new Error('порожнє аудіо');
    url = URL.createObjectURL(blob);
    await playPolina(new Audio(url));
  } catch (err) {
    console.error('Поліна недоступна, перехід на системний голос:', err);
    await speakFallbackSystem(text);
  } finally {
    if (url) URL.revokeObjectURL(url);
    currentVoiceAudio = null;
    if (voiceModeOn) {
      setFaceState('idle');
      voiceStatus.textContent = 'Натисни мікрофон, щоб говорити';
    }
  }
};
