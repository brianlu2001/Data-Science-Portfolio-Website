// C pentatonic major across two octaves — all intervals are consonant,
// so every card sounds musical regardless of which note it lands on.
const PENTATONIC: number[] = [
  261.63, // C4
  293.66, // D4
  329.63, // E4
  392.00, // G4
  440.00, // A4
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.00, // A5
];

class AudioManager {
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;

  constructor() {
    this.initializeAudioContext();
  }

  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Audio context not supported:', error);
      this.isEnabled = false;
    }
  }

  private async ensureAudioContext() {
    if (!this.audioContext || !this.isEnabled) return false;
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch {
        return false;
      }
    }
    return true;
  }

  // Soft marimba chime — three layered oscillators (root, octave, fifth)
  // with a snappy attack and gentle ~300ms decay.
  async playHoverSound(projectId: number = 0) {
    if (!await this.ensureAudioContext()) return;
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    const root = PENTATONIC[Math.abs(projectId) % PENTATONIC.length];
    const octave = root * 2;
    const fifth = root * 1.5;

    const ATTACK  = 0.010; // 10 ms
    const SUSTAIN = 0.040; // 40 ms
    const DECAY   = 0.280; // 280 ms tail

    const layers: [number, OscillatorType, number][] = [
      [root,   'sine',     0.09],
      [octave, 'triangle', 0.045],
      [fifth,  'sine',     0.028],
    ];

    for (const [freq, type, peak] of layers) {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      // Envelope: silence → peak → sustain → silence
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(peak, now + ATTACK);
      gain.gain.setValueAtTime(peak, now + ATTACK + SUSTAIN);
      gain.gain.exponentialRampToValueAtTime(0.001, now + ATTACK + SUSTAIN + DECAY);

      osc.start(now);
      osc.stop(now + ATTACK + SUSTAIN + DECAY);
    }
  }

  async playClickSound() {
    if (!await this.ensureAudioContext()) return;
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
    osc.type = 'square';

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  async playGlowSound(baseFrequency: number = 440) {
    if (!await this.ensureAudioContext()) return;
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    for (const [freq, type] of [[baseFrequency, 'sine'], [baseFrequency * 1.5, 'triangle']] as [number, OscillatorType][]) {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, now);
      osc.type = type;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.1);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    }
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  isAudioEnabled(): boolean {
    return this.isEnabled && this.audioContext !== null;
  }
}

export const audioManager = new AudioManager();
