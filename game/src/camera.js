// Sunfall City - Smooth Follow Camera with Dynamic Look-Ahead

import { CONFIG } from './config.js';

export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.shakeTimer = 0;
    this.zoom = CONFIG.CAMERA_ZOOM;
  }

  update(target, viewportWidth, viewportHeight) {
    let lookAheadX = 0;
    let lookAheadY = 0;

    if (target.inVehicle && target.currentCar) {
      const car = target.currentCar;
      const speedFactor = Math.min(2.0, 1.0 + Math.abs(car.speed) * 0.1);
      lookAheadX = Math.cos(car.angle) * 90 * speedFactor;
      lookAheadY = Math.sin(car.angle) * 90 * speedFactor;
    }

    this.targetX = target.x + lookAheadX - (viewportWidth / 2) / this.zoom;
    this.targetY = target.y + lookAheadY - (viewportHeight / 2) / this.zoom;

    // Smooth lerp
    this.x += (this.targetX - this.x) * 0.12;
    this.y += (this.targetY - this.y) * 0.12;

    // Clamp to world bounds
    this.x = Math.max(0, Math.min(CONFIG.WORLD_WIDTH - viewportWidth / this.zoom, this.x));
    this.y = Math.max(0, Math.min(CONFIG.WORLD_HEIGHT - viewportHeight / this.zoom, this.y));
  }

  snapTo(target, viewportWidth, viewportHeight) {
    let lookAheadX = 0;
    let lookAheadY = 0;

    if (target.inVehicle && target.currentCar) {
      const car = target.currentCar;
      const speedFactor = Math.min(2.0, 1.0 + Math.abs(car.speed) * 0.1);
      lookAheadX = Math.cos(car.angle) * 90 * speedFactor;
      lookAheadY = Math.sin(car.angle) * 90 * speedFactor;
    }

    this.targetX = target.x + lookAheadX - (viewportWidth / 2) / this.zoom;
    this.targetY = target.y + lookAheadY - (viewportHeight / 2) / this.zoom;

    this.x = this.targetX;
    this.y = this.targetY;

    // Clamp to world bounds
    this.x = Math.max(0, Math.min(CONFIG.WORLD_WIDTH - viewportWidth / this.zoom, this.x));
    this.y = Math.max(0, Math.min(CONFIG.WORLD_HEIGHT - viewportHeight / this.zoom, this.y));
  }
}
