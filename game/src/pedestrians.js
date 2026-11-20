// Sunfall City - Pedestrians AI & Knockdown Mechanics

import { CONFIG } from './config.js';
import { rngRange, rngChoice, rngInt } from './random.js';

export class Pedestrian {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = rngRange(-0.8, 0.8);
    this.vy = rngRange(-0.8, 0.8);
    this.color = rngChoice(['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6']);
    this.timer = rngRange(100, 300);
    this.knockdown = 0; // frames
  }

  update(player, trafficCars, dt, onWantedIncrease) {
    if (this.knockdown > 0) {
      this.knockdown -= dt;
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 0.9;
      this.vy *= 0.9;
      return;
    }

    this.timer -= dt;

    // Check if car is honking or close and fast
    let flee = false;
    if (player.inVehicle && player.currentCar) {
      const car = player.currentCar;
      const dist = Math.hypot(car.x - this.x, car.y - this.y);
      if (dist < 120 && Math.abs(car.speed) > 2.0) {
        flee = true;
        const angle = Math.atan2(this.y - car.y, this.x - car.x);
        this.vx = Math.cos(angle) * 3.0;
        this.vy = Math.sin(angle) * 3.0;

        // Hit pedestrian with car
        if (dist < 35 && Math.abs(car.speed) > 4.0) {
          this.knockdown = 250;
          if (onWantedIncrease) onWantedIncrease(1);
        }
      }
    }

    if (!flee && (this.timer <= 0 || Math.random() < 0.01)) {
      this.timer = rngRange(150, 400);
      this.vx = rngRange(-0.6, 0.6);
      this.vy = rngRange(-0.6, 0.6);
    }

    this.x += this.vx;
    this.y += this.vy;

    // Clamp to world sidewalks
    this.x = Math.max(350, Math.min(CONFIG.WORLD_WIDTH - 350, this.x));
    this.y = Math.max(250, Math.min(CONFIG.WORLD_HEIGHT - 250, this.y));
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.knockdown > 0) {
      // Fallen pedestrian
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = this.color;
      ctx.fillRect(-8, -4, 16, 8);
    } else {
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.arc(0, 3, 6, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, -2, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

let pedestrians = [];

export function spawnPedestrians(count = 25) {
  pedestrians = [];
  for (let i = 0; i < count; i++) {
    const x = rngRange(400, CONFIG.WORLD_WIDTH - 400);
    const y = rngRange(300, CONFIG.WORLD_HEIGHT - 300);
    pedestrians.push(new Pedestrian(x, y));
  }
}

export function updatePedestrians(player, trafficCars, dt, onWantedIncrease) {
  for (const ped of pedestrians) {
    ped.update(player, trafficCars, dt, onWantedIncrease);
  }
}

export function drawPedestrians(ctx) {
  for (const ped of pedestrians) {
    ped.draw(ctx);
  }
}

export function getPedestrians() {
  return pedestrians;
}
