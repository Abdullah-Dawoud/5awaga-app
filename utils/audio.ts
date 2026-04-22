let audioCtx: AudioContext | null = null;
let thockBuffer: AudioBuffer | null = null;

function createThockBuffer(ctx: AudioContext): AudioBuffer {
  // 40ms buffer
  const bufferSize = ctx.sampleRate * 0.04; 
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    // White noise with a very fast exponential decay
    const envelope = Math.exp(-i / (ctx.sampleRate * 0.005));
    output[i] = (Math.random() * 2 - 1) * envelope;
  }
  return buffer;
}

export const playTypingSound = (isCorrect: boolean) => {
  if (typeof window === 'undefined') return;

  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    if (isCorrect) {
      // Create the buffer if we haven't yet
      if (!thockBuffer) {
        thockBuffer = createThockBuffer(audioCtx);
      }

      const source = audioCtx.createBufferSource();
      source.buffer = thockBuffer;

      // Filter to make it sound "thocky" or "creamy" like a good mechanical keyboard
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200; // Muffled, deeper sound
      filter.Q.value = 1;

      const gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(0.3, now);

      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      source.start(now);
    } else {
      // Soft, slightly longer dull thud for error
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);

      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.start(now);
      osc.stop(now + 0.1);
    }
  } catch (e) {
    console.error("Audio error:", e);
  }
};

export const speakText = (text: string, isRtl: boolean = false) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  // Cancel any currently playing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = isRtl ? 'ar-SA' : 'en-US';
  utterance.rate = 0.85; // Slightly slower than normal for dictation
  
  window.speechSynthesis.speak(utterance);
};
