/** Soft two-tone notification chime via WebAudio — no asset needed. */
export function playChime() {
  try {
    type AudioCtor = typeof AudioContext;
    const Ctx: AudioCtor | undefined =
      window.AudioContext || (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const tone = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t = ctx.currentTime + start;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.16, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    };
    tone(880, 0, 0.32);
    tone(1174.66, 0.13, 0.42);
    window.setTimeout(() => void ctx.close(), 1400);
  } catch {
    /* audio not available / blocked — silently skip */
  }
}

/** Phone-style "ring-ring" burst — repeat on an interval for a call effect. */
export function playRing() {
  try {
    type AudioCtor = typeof AudioContext;
    const Ctx: AudioCtor | undefined =
      window.AudioContext || (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const burst = (start: number) => {
      // Classic telephone ring: two detuned tones warbling together.
      for (const freq of [1000, 1250] as const) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ctx.destination);
        const t = ctx.currentTime + start;
        gain.gain.setValueAtTime(0, t);
        // tremolo-ish envelope: pulse the gain for the warble
        for (let i = 0; i < 8; i++) {
          gain.gain.linearRampToValueAtTime(0.09, t + i * 0.05 + 0.015);
          gain.gain.linearRampToValueAtTime(0.015, t + i * 0.05 + 0.045);
        }
        gain.gain.linearRampToValueAtTime(0.0001, t + 0.45);
        osc.start(t);
        osc.stop(t + 0.5);
      }
    };
    burst(0);
    burst(0.65); // "ring-ring"
    window.setTimeout(() => void ctx.close(), 1600);
  } catch {
    /* audio not available / blocked — silently skip */
  }
}
