// Main-theme refrain, starting at the two E pickups requested for the grid.
// Reference: https://pianoletternotes.blogspot.com/2017/10/the-avengers-main-theme.html
// E E B A G F# E | E E B C# A B E | E E B ...
// Approved phrase, now in E4-C#5 so the violin melody speaks clearly.
export const MELODY = [64, 64, 71, 69, 67, 66, 64, 64, 64, 71, 73, 69, 71, 64, 64, 64, 71];
// Independent bass + inner-string voicings for each melodic position.
export const HARMONIES = [
  [40, 55, 59], [48, 55, 60], [40, 55, 64], [50, 57, 62],
  [48, 55, 60], [50, 57, 62], [40, 55, 59], [45, 57, 60],
  [40, 55, 59], [43, 59, 62], [45, 61, 64], [45, 61, 64],
  [47, 62, 66], [40, 55, 59], [48, 55, 60], [45, 57, 60], [40, 55, 64],
];
export function snakePosition(index: number, columns: number, count: number): number {
  const row = Math.floor(index / columns);
  const start = row * columns;
  const rowLength = Math.min(columns, count - start);
  return start + (row % 2 ? rowLength - 1 - (index % columns) : index % columns);
}
type Instrument = 'violin' | 'cello';
const SAMPLE_NOTES = { violin: [[64, 'E4'], [69, 'A4'], [72, 'C5']], cello: [[40, 'E2'], [47, 'B2'], [52, 'E3']] } as const;
type Sample = { buffer: AudioBuffer; offset: number; level: number };
type Voice = { source: AudioScheduledSourceNode; nodes: AudioNode[] };

class AudioManager {
  private context: AudioContext | null = null;
  private enabled = true;
  private active: { gain: GainNode; voices: Voice[] } | null = null;
  private samples = new Map<string, Promise<Sample | null>>();
  private request = 0;
  private lastPosition = 0;
  private lastHover = -Infinity;
  private listeners = new Set<() => void>();

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  getSnapshot = (): 'muted' | 'pending' | 'ready' =>
    !this.enabled ? 'muted' : this.context?.state === 'running' ? 'ready' : 'pending';
  private notify = () => { this.listeners.forEach(listener => listener()); };

  private async ready(activate = false) {
    if (!this.enabled) return null;
    try {
      if (!this.context || this.context.state === 'closed') {
        this.context?.removeEventListener('statechange', this.notify);
        this.context = new AudioContext();
        this.context.addEventListener('statechange', this.notify);
        this.notify();
      }
      // Hover cannot unlock browser autoplay. Only gesture-driven calls resume
      // audio, so silent hovers never queue stale chords for a later click.
      if (activate && this.context.state !== 'running') await this.context.resume();
      return this.enabled && this.context.state === 'running' ? this.context : null;
    } catch { return null; }
  }

  private sample(ctx: AudioContext, instrument: Instrument, name: string) {
    const key = `${instrument}/${name}`;
    if (!this.samples.has(key)) this.samples.set(key, (async () => {
      try {
        const response = await fetch(`/audio/strings/${key}.mp3`, { signal: AbortSignal.timeout(5000) });
        if (!response.ok) throw new Error('Sample unavailable');
        const buffer = await ctx.decodeAudioData(await response.arrayBuffer());
        const channel = buffer.getChannelData(0);
        let peak = 0;
        for (let i = 0; i < channel.length; i++) peak = Math.max(peak, Math.abs(channel[i]));
        let onset = 0;
        while (onset < channel.length && Math.abs(channel[onset]) < peak * 0.07) onset++;
        const offset = Math.min(onset / buffer.sampleRate + 0.035, buffer.duration * 0.1);
        const first = Math.floor(offset * buffer.sampleRate);
        const end = Math.min(channel.length, first + buffer.sampleRate * 0.6);
        let sum = 0;
        for (let i = first; i < end; i++) sum += channel[i] * channel[i];
        const rms = Math.sqrt(sum / Math.max(1, end - first));
        return { buffer, offset, level: Math.min(6, 0.15 / Math.max(0.01, rms)) };
      } catch { return null; }
    })());
    return this.samples.get(key)!;
  }

  async preload() {
    const ctx = await this.ready(true);
    if (!ctx) return;
    await Promise.all((['violin', 'cello'] as const).flatMap(instrument =>
      SAMPLE_NOTES[instrument].map(([, name]) => this.sample(ctx, instrument, name))));
  }

  private fadeActive() {
    if (!this.active || !this.context) return;
    const now = this.context.currentTime;
    this.active.gain.gain.cancelAndHoldAtTime(now);
    this.active.gain.gain.linearRampToValueAtTime(0, now + 0.035);
    for (const { source } of this.active.voices) { try { source.stop(now + 0.04); } catch {} }
    this.active = null;
  }

  private async chord(position: number, emphasis = 1, activate = false) {
    const request = ++this.request;
    const ctx = await this.ready(activate);
    if (!ctx || request !== this.request) return;
    const index = Math.abs(position) % MELODY.length;
    // Two quiet inner strings support the melody without a sustained bass layer.
    const notes = [...HARMONIES[index].slice(1), MELODY[index]];
    const prepared = await Promise.all(notes.map(async (note, i) => {
      const instrument: Instrument = i === 2 || note >= 60 ? 'violin' : 'cello';
      const [root, name] = [...SAMPLE_NOTES[instrument]].sort((a, b) => Math.abs(a[0] - note) - Math.abs(b[0] - note))[0];
      return { note, root, sample: await this.sample(ctx, instrument, name) };
    }));
    if (!this.enabled || request !== this.request) return;
    this.fadeActive();
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const compressor = ctx.createDynamicsCompressor();
    filter.type = 'lowpass'; filter.frequency.value = 4200; filter.Q.value = 0.35;
    compressor.threshold.value = -12; compressor.knee.value = 12; compressor.ratio.value = 3;
    gain.connect(filter); filter.connect(compressor); compressor.connect(ctx.destination);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.8 * emphasis, now + 0.025);
    gain.gain.setValueAtTime(0.8 * emphasis, now + 0.065);
    gain.gain.linearRampToValueAtTime(0.45 * emphasis, now + 0.15);
    gain.gain.linearRampToValueAtTime(0, now + 0.34);
    const voices = prepared.map(({ note, root, sample }, i): Voice => {
      const volume = ctx.createGain();
      const pan = ctx.createStereoPanner();
      volume.gain.value = [0.12, 0.16, 0.8][i] * (sample?.level ?? 0.22);
      pan.pan.value = [-0.2, 0.2, 0.04][i];
      volume.connect(pan); pan.connect(gain);
      let source: AudioBufferSourceNode | OscillatorNode;
      if (sample) {
        source = ctx.createBufferSource(); source.buffer = sample.buffer;
        source.playbackRate.value = 2 ** ((note - root) / 12);
        source.connect(volume); source.start(now, sample.offset);
      } else {
        // A bowed-harmonic fallback keeps cues audible if an asset fails to load.
        const oscillator = ctx.createOscillator();
        const partials = Float32Array.from([0, 1, 0.42, 0.26, 0.16, 0.09, 0.05]);
        oscillator.setPeriodicWave(ctx.createPeriodicWave(new Float32Array(partials.length), partials));
        oscillator.frequency.value = 440 * 2 ** ((note - 69) / 12);
        oscillator.connect(volume); oscillator.start(now); source = oscillator;
      }
      source.stop(now + 0.36);
      return { source, nodes: [volume, pan] };
    });
    let ended = 0;
    voices.forEach(({ source, nodes }) => source.addEventListener('ended', () => {
      source.disconnect(); nodes.forEach(node => node.disconnect());
      if (++ended === voices.length) {
        gain.disconnect(); filter.disconnect(); compressor.disconnect();
        if (this.active?.gain === gain) this.active = null;
      }
    }));
    this.active = { gain, voices };
  }

  async playHoverSound(position = 0) {
    const now = performance.now();
    if (now - this.lastHover < 125) return;
    this.lastHover = now; this.lastPosition = position;
    await this.chord(position);
  }
  async playClickSound() { await this.chord(this.lastPosition, 0.8, true); }
  async playGlowSound() { await this.chord(this.lastPosition, 0.65); }
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) { ++this.request; this.fadeActive(); }
    else void this.preload();
    this.notify();
  }
  isAudioEnabled() { return this.enabled; }
}
export const audioManager = new AudioManager();
