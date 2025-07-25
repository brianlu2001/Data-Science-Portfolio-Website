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
      } catch (error) {
        console.warn('Failed to resume audio context:', error);
        return false;
      }
    }
    
    return true;
  }

  // Create hover sound effect
  async playHoverSound(frequency: number = 800, duration: number = 0.1) {
    if (!await this.ensureAudioContext()) return;

    const oscillator = this.audioContext!.createOscillator();
    const gainNode = this.audioContext!.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext!.destination);
    
    oscillator.frequency.setValueAtTime(frequency, this.audioContext!.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, this.audioContext!.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext!.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + duration);
    
    oscillator.start(this.audioContext!.currentTime);
    oscillator.stop(this.audioContext!.currentTime + duration);
  }

  // Create click sound effect
  async playClickSound() {
    if (!await this.ensureAudioContext()) return;

    const oscillator = this.audioContext!.createOscillator();
    const gainNode = this.audioContext!.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext!.destination);
    
    oscillator.frequency.setValueAtTime(1200, this.audioContext!.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext!.currentTime + 0.1);
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0, this.audioContext!.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, this.audioContext!.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + 0.1);
    
    oscillator.start(this.audioContext!.currentTime);
    oscillator.stop(this.audioContext!.currentTime + 0.1);
  }

  // Create magical glow sound effect
  async playGlowSound(baseFrequency: number = 440) {
    if (!await this.ensureAudioContext()) return;

    const oscillator1 = this.audioContext!.createOscillator();
    const oscillator2 = this.audioContext!.createOscillator();
    const gainNode = this.audioContext!.createGain();
    
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(this.audioContext!.destination);
    
    oscillator1.frequency.setValueAtTime(baseFrequency, this.audioContext!.currentTime);
    oscillator2.frequency.setValueAtTime(baseFrequency * 1.5, this.audioContext!.currentTime);
    
    oscillator1.type = 'sine';
    oscillator2.type = 'triangle';
    
    gainNode.gain.setValueAtTime(0, this.audioContext!.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.08, this.audioContext!.currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0.05, this.audioContext!.currentTime + 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + 0.6);
    
    oscillator1.start(this.audioContext!.currentTime);
    oscillator2.start(this.audioContext!.currentTime);
    oscillator1.stop(this.audioContext!.currentTime + 0.6);
    oscillator2.stop(this.audioContext!.currentTime + 0.6);
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  isAudioEnabled(): boolean {
    return this.isEnabled && this.audioContext !== null;
  }
}

export const audioManager = new AudioManager();