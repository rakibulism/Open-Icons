// Synthesizes the demo soundtrack as a 16-bit stereo WAV.
// Ambient pad + UI "pops" on icon reveals + transition whooshes + closing chime.
import { writeFileSync } from "node:fs";

const SR = 44100;
const DUR = 24.0;
const N = Math.floor(SR * DUR);
const L = new Float64Array(N);
const R = new Float64Array(N);

const clamp = (x) => Math.max(-1, Math.min(1, x));
function add(buf, start, samples) {
  const s = Math.floor(start * SR);
  for (let i = 0; i < samples.length; i++) if (s + i < N) buf[s + i] += samples[i];
}

// --- ambient pad: two detuned sines with a slow swell ---
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const swell = 0.06 + 0.04 * Math.sin(t * 0.45 - 1.2);
  const env = Math.min(1, t / 2.5) * Math.min(1, (DUR - t) / 2.5); // fade in/out
  const pad =
    Math.sin(2 * Math.PI * 110 * t) * 0.5 +
    Math.sin(2 * Math.PI * 110.4 * t) * 0.5 +
    Math.sin(2 * Math.PI * 220 * t) * 0.18 +
    Math.sin(2 * Math.PI * 164.81 * t) * 0.12; // add a fifth-ish
  const v = pad * swell * env;
  L[i] += v * 0.95;
  R[i] += v;
}

// --- soft "pop" (sine blip with fast exp decay) ---
function pop(time, freq, gain = 0.22, dur = 0.09, pan = 0) {
  const len = Math.floor(dur * SR);
  const a = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = Math.exp(-t * 38);
    a[i] = Math.sin(2 * Math.PI * freq * t) * env * gain;
  }
  add(L, time, a.map((x) => x * (1 - Math.max(0, pan))));
  add(R, time, a.map((x) => x * (1 + Math.min(0, pan))));
}

// --- whoosh (band-passed noise sweep) ---
function whoosh(time, dur = 0.55, gain = 0.14) {
  const len = Math.floor(dur * SR);
  const a = new Float64Array(len);
  let lp = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const p = t / dur;
    const env = Math.sin(Math.PI * p); // swell up+down
    const cutoff = 0.04 + 0.5 * p;
    lp += (Math.random() * 2 - 1 - lp) * cutoff;
    a[i] = lp * env * gain;
  }
  add(L, time, a);
  add(R, time, a);
}

// --- pluck (chime note) ---
function pluck(time, freq, gain = 0.16, dur = 0.9) {
  const len = Math.floor(dur * SR);
  const a = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = Math.exp(-t * 4.5);
    a[i] = (Math.sin(2 * Math.PI * freq * t) + 0.4 * Math.sin(2 * Math.PI * freq * 2 * t)) * env * gain;
  }
  add(L, time, a);
  add(R, time, a);
}

// Scene 1: logo settle
pop(0.55, 660, 0.26, 0.16);
pluck(0.6, 523.25, 0.1);

// Scene 2 (3.5–9s): icon wall — staggered pops, rising pitch
whoosh(3.45);
const scale = [523.25, 587.33, 659.25, 783.99, 880]; // C D E G A
for (let k = 0; k < 22; k++) {
  pop(3.7 + k * 0.18, scale[k % scale.length] * 2, 0.12, 0.07, (k % 2 ? 0.4 : -0.4));
}

// Scene 3 (9–15s): search — typing ticks + result pops
whoosh(8.95);
for (let k = 0; k < 4; k++) pop(9.4 + k * 0.16, 1200, 0.07, 0.04); // typing "home"
for (let k = 0; k < 10; k++) pop(10.4 + k * 0.13, scale[(k + 2) % scale.length] * 2, 0.12, 0.07, (k % 2 ? 0.4 : -0.4));

// Scene 4 (15–20s): swap cycle — a tick per pack change
whoosh(14.95);
for (let k = 0; k < 6; k++) pop(15.4 + k * 0.72, scale[k % scale.length] * 1.5, 0.16, 0.1);

// Scene 5 (20–24s): CTA chime (major triad arpeggio)
whoosh(19.95, 0.7, 0.12);
pluck(20.3, 523.25, 0.18);
pluck(20.5, 659.25, 0.18);
pluck(20.7, 783.99, 0.2);
pluck(20.95, 1046.5, 0.16, 1.4);

// --- master soft-clip + write 16-bit stereo WAV ---
const bytesPerSample = 2;
const dataLen = N * 2 * bytesPerSample;
const buf = Buffer.alloc(44 + dataLen);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + dataLen, 4); buf.write("WAVE", 8);
buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2 * bytesPerSample, 28);
buf.writeUInt16LE(2 * bytesPerSample, 32); buf.writeUInt16LE(16, 34);
buf.write("data", 36); buf.writeUInt32LE(dataLen, 40);
let o = 44;
const sc = (x) => Math.tanh(x * 1.1); // gentle saturation/limiter
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.round(clamp(sc(L[i])) * 32000), o); o += 2;
  buf.writeInt16LE(Math.round(clamp(sc(R[i])) * 32000), o); o += 2;
}
writeFileSync(new URL("./audio.wav", import.meta.url), buf);
console.log("wrote audio.wav", (buf.length / 1e6).toFixed(2), "MB", DUR + "s");
