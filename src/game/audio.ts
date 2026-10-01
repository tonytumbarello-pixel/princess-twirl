type Mode = "waltz" | "tea" | "dance";

type Tune = {
  beat: number;
  per: number;
  melody: number[];
  chords: number[][];
};

const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

const WALTZ: Tune = {
  beat: 0.56,
  per: 3,
  melody: [69, 72, 77, 76, 74, 72, 74, 72, 70, 69, 67, 65, 69, 74, 77, 76, 72, 67, 74, 72, 70, 69, 72, 65],
  chords: [
    [53, 57, 60],
    [48, 52, 55],
    [46, 50, 53],
    [53, 57, 60],
    [50, 53, 57],
    [48, 52, 55],
    [46, 50, 53],
    [53, 57, 60],
  ],
};

const TEA: Tune = {
  beat: 0.72,
  per: 3,
  melody: [72, 76, 79, 77, 74, 72, 74, 77, 81, 79, 76, 74, 72, 69, 67, 69, 72, 76],
  chords: [
    [60, 64, 67],
    [65, 69, 72],
    [57, 60, 64],
    [55, 59, 62],
    [60, 64, 67],
    [53, 57, 60],
  ],
};

const DANCE: Tune = {
  beat: 0.34,
  per: 4,
  melody: [72, 72, 76, 79, 77, 76, 74, 72, 74, 77, 81, 79, 76, 74, 72, 69],
  chords: [
    [60, 64, 67],
    [65, 69, 72],
    [57, 60, 64],
    [55, 59, 62],
  ],
};

const TUNES: Record<Mode, Tune> = { waltz: WALTZ, tea: TEA, dance: DANCE };

const A: {
  ctx: AudioContext | null;
  master: GainNode | null;
  music: GainNode | null;
  sfx: GainNode | null;
  on: boolean;
  voiceOn: boolean;
  mode: Mode;
  step: number;
  next: number;
  timer: number;
  noise: AudioBuffer | null;
  duck: number;
} = {
  ctx: null,
  master: null,
  music: null,
  sfx: null,
  on: true,
  voiceOn: true,
  mode: "waltz",
  step: 0,
  next: 0,
  timer: 0,
  noise: null,
  duck: 0,
};

let voiceEl: HTMLAudioElement | null = null;

function reverb(ctx: AudioContext) {
  const len = ctx.sampleRate * 2.2;
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
  }
  const conv = ctx.createConvolver();
  conv.buffer = buf;
  return conv;
}

function tone(
  freq: number,
  t: number,
  dur: number,
  type: OscillatorType,
  vol: number,
  attack: number,
  cutoff: number,
) {
  const ctx = A.ctx;
  const music = A.music;
  if (!ctx || !music) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  const f = ctx.createBiquadFilter();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  f.type = "lowpass";
  f.frequency.setValueAtTime(cutoff, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0002), t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(f);
  f.connect(g);
  g.connect(music);
  o.start(t);
  o.stop(t + dur + 0.03);
}

function shaker(t: number, vol: number) {
  const ctx = A.ctx;
  const sfx = A.sfx;
  if (!ctx || !sfx || !A.noise) return;
  const src = ctx.createBufferSource();
  src.buffer = A.noise;
  const f = ctx.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = 1800;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
  src.connect(f);
  f.connect(g);
  g.connect(sfx);
  src.start(t);
  src.stop(t + 0.09);
}

function schedule() {
  const ctx = A.ctx;
  if (!ctx || !A.on) return;
  if (A.next < ctx.currentTime - 0.15) A.next = ctx.currentTime + 0.05;
  const tune = TUNES[A.mode];
  while (A.next < ctx.currentTime + 0.45) {
    const i = A.step % tune.melody.length;
    const bar = Math.floor(A.step / tune.per) % tune.chords.length;
    const beat = A.step % tune.per;
    const chord = tune.chords[bar];
    const t = A.next;
    if (A.mode === "dance") {
      if (beat % 2 === 0) {
        tone(midi(chord[0] - 12), t, 0.18, "sine", 0.09, 0.01, 500);
        shaker(t, beat === 0 ? 0.12 : 0.06);
      }
      chord.forEach((n, k) => tone(midi(n), t, 0.16, "triangle", 0.035, 0.008, 2200));
      tone(midi(tune.melody[i]), t, tune.beat * 0.85, "sine", 0.07, 0.02, 3200);
      tone(midi(tune.melody[i] + 12), t, 0.1, "sine", 0.018, 0.005, 5000);
    } else if (A.mode === "tea") {
      if (beat === 0) {
        chord.forEach((n) => tone(midi(n), t, tune.beat * 2.6, "sawtooth", 0.012, 0.18, 900));
        tone(midi(chord[0] - 12), t, tune.beat * 2.2, "sine", 0.07, 0.04, 420);
      }
      tone(midi(chord[beat % chord.length] + 12), t, 0.7, "sine", 0.045, 0.01, 3800);
      tone(midi(tune.melody[i]), t, tune.beat * 1.3, "sine", 0.045, 0.08, 2600);
    } else {
      if (beat === 0) {
        chord.forEach((n, k) => {
          const det = (k - 1) * 4;
          tone(midi(n) * Math.pow(2, det / 1200), t, tune.beat * 2.7, "sawtooth", 0.014, 0.12, 1100);
        });
        tone(midi(chord[0] - 12), t, tune.beat * 2.4, "sine", 0.08, 0.03, 380);
        tone(midi(tune.melody[i] + 12), t, 0.35, "sine", 0.02, 0.01, 5000);
      } else {
        tone(midi(chord[beat % chord.length] + 12), t, 0.42, "sine", 0.05, 0.008, 4000);
      }
      tone(midi(tune.melody[i]), t, tune.beat * 1.15, "sine", 0.055, 0.05, 2800);
      tone(midi(tune.melody[i]) * 2, t, tune.beat * 0.9, "sine", 0.012, 0.05, 3200);
    }
    A.next += tune.beat;
    A.step++;
  }
}

export function startAudio() {
  if (A.ctx) {
    void A.ctx.resume();
    return;
  }
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = 0.85;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16;
  comp.knee.value = 18;
  comp.ratio.value = 2.2;
  comp.attack.value = 0.01;
  comp.release.value = 0.25;
  master.connect(comp);
  comp.connect(ctx.destination);
  const music = ctx.createGain();
  music.gain.value = 0.9;
  const wet = ctx.createGain();
  wet.gain.value = 0.38;
  const rv = reverb(ctx);
  music.connect(master);
  music.connect(rv);
  rv.connect(wet);
  wet.connect(master);
  const sfx = ctx.createGain();
  sfx.gain.value = 0.7;
  sfx.connect(master);
  const noise = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
  const nd = noise.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  A.ctx = ctx;
  A.master = master;
  A.music = music;
  A.sfx = sfx;
  A.noise = noise;
  A.next = ctx.currentTime + 0.12;
  A.timer = window.setInterval(schedule, 80);
  void ctx.resume();
}

export function setTune(mode: Mode) {
  if (A.mode === mode) return;
  A.mode = mode;
  A.step = 0;
  if (A.ctx) A.next = A.ctx.currentTime + 0.12;
}

export function toggleMusic() {
  A.on = !A.on;
  if (A.on && A.ctx) A.next = A.ctx.currentTime + 0.08;
  return A.on;
}

export function musicOn() {
  return A.on;
}

export function toggleVoice() {
  A.voiceOn = !A.voiceOn;
  if (!A.voiceOn) voiceEl?.pause();
  return A.voiceOn;
}

export function voiceOn() {
  return A.voiceOn;
}

function duck(on: boolean) {
  const music = A.music;
  const ctx = A.ctx;
  if (!music || !ctx) return;
  const now = ctx.currentTime;
  music.gain.cancelScheduledValues(now);
  music.gain.setValueAtTime(music.gain.value, now);
  music.gain.linearRampToValueAtTime(on ? 0.28 : 0.9, now + 0.12);
}

export function speak(id: string) {
  if (!A.voiceOn) return;
  try {
    voiceEl?.pause();
    const el = new Audio(`${import.meta.env.BASE_URL || "/"}voice/${id}.mp3`);
    voiceEl = el;
    duck(true);
    el.onended = () => duck(false);
    void el.play().catch(() => duck(false));
  } catch {
    duck(false);
  }
}

function blip(freq: number, t: number, dur: number, vol: number, type: OscillatorType = "sine") {
  const ctx = A.ctx;
  const sfx = A.sfx;
  if (!ctx || !sfx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(sfx);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export function sfxSparkle() {
  if (!A.ctx) return;
  const t = A.ctx.currentTime;
  [784, 988, 1318].forEach((f, i) => blip(f, t + i * 0.06, 0.28, 0.06));
}

export function sfxChime() {
  if (!A.ctx) return;
  const t = A.ctx.currentTime;
  [523, 659, 784, 1046].forEach((f, i) => blip(f, t + i * 0.07, 0.7, 0.07, "triangle"));
}

export function sfxPop() {
  if (!A.ctx || !A.sfx || !A.noise) return;
  const t = A.ctx.currentTime;
  shaker(t, 0.2);
  blip(196, t, 0.2, 0.1);
}

export function sfxPour() {
  if (!A.ctx) return;
  const t = A.ctx.currentTime;
  for (let i = 0; i < 7; i++) blip(520 + i * 70, t + i * 0.05, 0.12, 0.04);
}

export function sfxCheer() {
  if (!A.ctx) return;
  const t = A.ctx.currentTime;
  [523, 659, 784, 1046, 1318].forEach((f, i) => blip(f, t + i * 0.05, 0.6, 0.06, "triangle"));
}
