/**
 * Battery Saver & Dynamic Framerate Throttling Module
 * Optimizes animation loops and GPU render cycles for OLED displays and battery preservation.
 */

export interface BatteryState {
  level: number; // 0.0 to 1.0
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
}

export type FrameRateTarget = 60 | 30 | 15;

export class BatteryThrottler {
  private targetFps: FrameRateTarget = 60;
  private isLowPowerMode = false;
  private intervalMs = 1000 / 60;
  private lastFrameTime = 0;

  constructor(initialFps: FrameRateTarget = 60) {
    this.setTargetFps(initialFps);
  }

  public setTargetFps(fps: FrameRateTarget) {
    this.targetFps = fps;
    this.intervalMs = 1000 / fps;
  }

  public getTargetFps(): FrameRateTarget {
    return this.targetFps;
  }

  public getIntervalMs(): number {
    return this.intervalMs;
  }

  public updateFromBattery(battery: { level: number; charging: boolean }) {
    if (!battery.charging && battery.level <= 0.2) {
      // Critical battery (< 20%): drop to 15fps
      this.isLowPowerMode = true;
      this.setTargetFps(15);
    } else if (!battery.charging && battery.level <= 0.4) {
      // Low battery (< 40%): drop to 30fps
      this.isLowPowerMode = true;
      this.setTargetFps(30);
    } else {
      // Normal battery or charging: full 60fps
      this.isLowPowerMode = false;
      this.setTargetFps(60);
    }
    return { fps: this.targetFps, lowPower: this.isLowPowerMode };
  }

  public shouldRenderFrame(currentTime: number): boolean {
    if (currentTime - this.lastFrameTime >= this.intervalMs) {
      this.lastFrameTime = currentTime;
      return true;
    }
    return false;
  }
}
