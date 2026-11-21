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

  // Smooth, quiet mechanical slide-out sound when opening the sidebar
  slideIn() {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      if (ctx.state === 'suspended') ctx.resume();
      
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.09);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) {
      console.error("slideIn sound failed", e);
    }
  }

  // Authentic sound of two dense neodymium magnets attaching together ("CLACK")
  // Zero high-pitched chirps: deep solid impact + metallic transient
  magneticSnap() {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      if (ctx.state === 'suspended') ctx.resume();
      
      const now = ctx.currentTime;
      
      // 1. Solid metallic impact strike (crisp, dense clack without chirp)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(480, now);
      osc1.frequency.exponentialRampToValueAtTime(120, now + 0.028);
      gain1.gain.setValueAtTime(0.24, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.028);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.028);

      // 2. Heavy magnet body sub-thud (gives physical weight/mass of two magnets colliding)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(150, now);
      osc2.frequency.exponentialRampToValueAtTime(40, now + 0.045);
      gain2.gain.setValueAtTime(0.28, now);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now);
      osc2.stop(now + 0.045);

      // 3. Fast contact micro-click (0.008s)
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'square';
      osc3.frequency.setValueAtTime(320, now);
      osc3.frequency.exponentialRampToValueAtTime(80, now + 0.012);
      gain3.gain.setValueAtTime(0.08, now);
      gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now);
      osc3.stop(now + 0.012);
    } catch (e) {
      console.error("magneticSnap sound failed", e);
    }
  }

  // Soft slide-back sound when hiding sidebar
  slideOut() {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      if (ctx.state === 'suspended') ctx.resume();
      
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.07);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch (e) {
      console.error("slideOut sound failed", e);
    }
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
