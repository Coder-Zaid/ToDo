"use client";

class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private getCtx() {
    if (!this.ctx) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.ctx;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number) {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.error("Sound playback failed", e);
    }
  }

  // Soft "tick" for task add
  tick() {
    this.playTone(1200, 'sine', 0.04, 0.08);
  }

  // Soft "tap" for task complete
  tap() {
    this.playTone(400, 'sine', 0.06, 0.1);
  }

  // Light "pop" for open
  pop() {
    this.playTone(600, 'sine', 0.1, 0.04);
  }

  // Soft "click" for close
  click() {
    this.playTone(300, 'sine', 0.05, 0.04);
  }

  // Soothing "type" for keypress
  type() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.playTone(1800 + Math.random() * 200, 'sine', 0.02, 0.012);
  }
}

export const soundEngine = typeof window !== 'undefined' ? new SoundEngine() : null;
