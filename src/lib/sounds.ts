// Simple sound effects using Web Audio API - no external files needed
const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
  if (!audioCtx) return;
  // Resume context if suspended (browser policy)
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function playNoise(duration: number, volume = 0.08) {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const source = audioCtx.createBufferSource();
  const gain = audioCtx.createGain();
  source.buffer = buffer;
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  source.connect(gain);
  gain.connect(audioCtx.destination);
  source.start();
}

export const SFX = {
  // UI
  click: () => playTone(800, 0.08, 'sine', 0.1),
  hover: () => playTone(600, 0.04, 'sine', 0.05),
  
  // Building
  place: () => {
    playTone(300, 0.15, 'triangle', 0.12);
    setTimeout(() => playTone(450, 0.12, 'triangle', 0.1), 80);
    setTimeout(() => playNoise(0.1, 0.06), 50);
  },
  upgrade: () => {
    playTone(400, 0.1, 'triangle', 0.12);
    setTimeout(() => playTone(500, 0.1, 'triangle', 0.12), 100);
    setTimeout(() => playTone(650, 0.15, 'triangle', 0.14), 200);
  },
  demolish: () => {
    playNoise(0.3, 0.12);
    playTone(150, 0.3, 'sawtooth', 0.08);
  },
  
  // Resources
  coins: () => {
    playTone(1200, 0.08, 'sine', 0.1);
    setTimeout(() => playTone(1500, 0.1, 'sine', 0.1), 60);
  },
  
  // Battle
  attack: () => {
    playNoise(0.15, 0.15);
    playTone(200, 0.2, 'sawtooth', 0.1);
  },
  victory: () => {
    [523, 659, 784, 1047].forEach((f, i) =>
      setTimeout(() => playTone(f, 0.2, 'triangle', 0.12), i * 120)
    );
  },
  defeat: () => {
    [400, 350, 300, 200].forEach((f, i) =>
      setTimeout(() => playTone(f, 0.25, 'sawtooth', 0.08), i * 150)
    );
  },
  
  // Quiz
  correct: () => {
    playTone(523, 0.1, 'sine', 0.12);
    setTimeout(() => playTone(659, 0.15, 'sine', 0.12), 100);
  },
  wrong: () => {
    playTone(300, 0.2, 'square', 0.08);
    setTimeout(() => playTone(250, 0.3, 'square', 0.06), 150);
  },
  
  // Notifications
  alert: () => {
    playTone(880, 0.12, 'square', 0.1);
    setTimeout(() => playTone(880, 0.12, 'square', 0.1), 200);
  },
};
