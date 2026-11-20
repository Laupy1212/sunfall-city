// Web Audio Synthesizer for Engine Hum, Horns, Punches, and UI Clicks

let audioCtx = null;
let engineOsc = null;
let engineGain = null;
let initialized = false;

export function initAudio() {
  if (initialized) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
    initialized = true;

    // Engine hum oscillator
    engineOsc = audioCtx.createOscillator();
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.setValueAtTime(60, audioCtx.currentTime);

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, audioCtx.currentTime);

    engineGain = audioCtx.createGain();
    engineGain.gain.setValueAtTime(0, audioCtx.currentTime);

    engineOsc.connect(filter);
    filter.connect(engineGain);
    engineGain.connect(audioCtx.destination);
    engineOsc.start();
  } catch (e) {
    console.warn("WebAudio not supported or blocked", e);
  }
}

export function updateEngineSound(isDriving, speed) {
  if (!initialized || !audioCtx || !engineGain) return;
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  if (isDriving) {
    const targetGain = 0.15;
    const targetFreq = 50 + Math.abs(speed) * 18;
    engineGain.gain.setTargetAtTime(targetGain, audioCtx.currentTime, 0.1);
    engineOsc.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 0.1);
  } else {
    engineGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
  }
}

export function playHorn() {
  if (!initialized || !audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, audioCtx.currentTime);
    osc.frequency.setValueAtTime(380, audioCtx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
  } catch (e) {}
}

export function playPunchSound() {
  if (!initialized || !audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(120, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  } catch (e) {}
}

export function playUIClick() {
  if (!initialized || !audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
  } catch (e) {}
}
