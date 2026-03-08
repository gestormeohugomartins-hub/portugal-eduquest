// Ambient medieval music generator using Web Audio API
// Produces a looping, gentle medieval-style background track

let musicCtx: AudioContext | null = null;
let musicGain: GainNode | null = null;
let isPlaying = false;
let intervalIds: number[] = [];

// Medieval scale: D Dorian (D E F G A B C)
const SCALE = [293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
const LOW_SCALE = SCALE.map(f => f / 2);

function getCtx() {
  if (!musicCtx) {
    musicCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    musicGain = musicCtx.createGain();
    musicGain.gain.setValueAtTime(0, musicCtx.currentTime);
    musicGain.connect(musicCtx.destination);
  }
  if (musicCtx.state === 'suspended') musicCtx.resume();
  return { ctx: musicCtx, gain: musicGain! };
}

function playNote(freq: number, duration: number, type: OscillatorType, vol: number, delay = 0) {
  const { ctx, gain } = getCtx();
  const osc = ctx.createOscillator();
  const noteGain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
  noteGain.gain.setValueAtTime(0, ctx.currentTime + delay);
  noteGain.gain.linearRampToValueAtTime(vol, ctx.currentTime + delay + 0.05);
  noteGain.gain.setValueAtTime(vol, ctx.currentTime + delay + duration * 0.7);
  noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  osc.connect(noteGain);
  noteGain.connect(gain);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Play a gentle melody phrase
function playMelodyPhrase() {
  const noteCount = 3 + Math.floor(Math.random() * 4);
  const tempo = 0.4 + Math.random() * 0.3;
  for (let i = 0; i < noteCount; i++) {
    const freq = randomFrom(SCALE);
    const dur = tempo + Math.random() * 0.3;
    playNote(freq, dur, 'sine', 0.06 + Math.random() * 0.03, i * tempo);
  }
}

// Play a drone bass note
function playDrone() {
  const freq = randomFrom(LOW_SCALE.slice(0, 3)); // D, E, F bass
  playNote(freq, 3 + Math.random() * 2, 'triangle', 0.04);
}

// Play a gentle harp-like arpeggio
function playArpeggio() {
  const startIdx = Math.floor(Math.random() * 4);
  for (let i = 0; i < 4; i++) {
    const freq = SCALE[(startIdx + i) % SCALE.length];
    playNote(freq, 0.8, 'sine', 0.04, i * 0.15);
  }
}

export const AmbientMusic = {
  start() {
    if (isPlaying) return;
    isPlaying = true;
    const { gain } = getCtx();
    gain.gain.linearRampToValueAtTime(1, (musicCtx?.currentTime || 0) + 1);

    // Melody every 4-7 seconds
    const melodyLoop = () => {
      if (!isPlaying) return;
      playMelodyPhrase();
    };
    intervalIds.push(window.setInterval(melodyLoop, 5000));
    melodyLoop();

    // Drone every 5-8 seconds
    const droneLoop = () => {
      if (!isPlaying) return;
      playDrone();
    };
    intervalIds.push(window.setInterval(droneLoop, 6500));
    setTimeout(droneLoop, 1000);

    // Arpeggio every 8-12 seconds
    const arpLoop = () => {
      if (!isPlaying) return;
      if (Math.random() > 0.4) playArpeggio();
    };
    intervalIds.push(window.setInterval(arpLoop, 9000));
    setTimeout(arpLoop, 3000);
  },

  stop() {
    isPlaying = false;
    intervalIds.forEach(id => clearInterval(id));
    intervalIds = [];
    if (musicGain && musicCtx) {
      musicGain.gain.linearRampToValueAtTime(0, musicCtx.currentTime + 1);
    }
  },

  toggle() {
    if (isPlaying) this.stop();
    else this.start();
    return isPlaying;
  },

  isPlaying() {
    return isPlaying;
  },

  setVolume(vol: number) {
    if (musicGain && musicCtx) {
      musicGain.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, vol)), musicCtx.currentTime + 0.1);
    }
  },
};
