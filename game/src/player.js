// Player Character (Marina Vale) Movement, Car Entry, and Collisions

import { CONFIG } from './config.js';
import { getBuildings } from './city.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.name = "Marina Vale";
    this.role = "Courier";
    this.health = 100;
    this.maxHealth = 100;
    this.cash = 1500;
    this.wantedLevel = 0; // 0 to 5 stars
    
    this.inVehicle = false;
    this.currentCar = null;
    this.angle = 0;
    this.animTimer = 0;
  }

  update(input, trafficCars, dt) {
    if (this.inVehicle && this.currentCar) {
      // Update car position
      this.currentCar.update(input, dt);
      this.x = this.currentCar.x;
      this.y = this.currentCar.y;
      this.angle = this.currentCar.angle;

      // Exit car with E
      if (input.keysJustPressed['KeyE']) {
        this.inVehicle = false;
        this.currentCar.isPlayerControlled = false;
        // Step out to the side
        this.x -= Math.sin(this.angle) * 45;
        this.y += Math.cos(this.angle) * 45;
        this.currentCar = null;
      }
    } else {
      // On-foot movement
      let dx = 0;
      let dy = 0;
      const speed = (input.keys['ShiftLeft'] || input.keys['ShiftRight']) ? CONFIG.PLAYER_RUN_SPEED : CONFIG.PLAYER_WALK_SPEED;

      if (input.keys['ArrowUp'] || input.keys['KeyW']) dy -= 1;
      if (input.keys['ArrowDown'] || input.keys['KeyS']) dy += 1;
      if (input.keys['ArrowLeft'] || input.keys['KeyA']) dx -= 1;
      if (input.keys['ArrowRight'] || input.keys['KeyD']) dx += 1;

      if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy);
        this.x += (dx / len) * speed;
        this.y += (dy / len) * speed;
        this.angle = Math.atan2(dy, dx);
        this.animTimer += 0.15;
      }

      this.checkCollisions();

      // Enter nearest car with E (stealing car raises wanted level)
      if (input.keysJustPressed['KeyE']) {
        for (const car of trafficCars) {
          const dist = Math.hypot(car.x - this.x, car.y - this.y);
          if (dist < CONFIG.INTERACT_DIST) {
            this.inVehicle = true;
            this.currentCar = car;
            car.isPlayerControlled = true;
            this.wantedLevel = Math.min(5, this.wantedLevel + 1);
            break;
          }
        }
      }
    }

    // Clamp to world bounds
    this.x = Math.max(300, Math.min(CONFIG.WORLD_WIDTH - 300, this.x));
    this.y = Math.max(200, Math.min(CONFIG.WORLD_HEIGHT - 200, this.y));
  }

  checkCollisions() {
    const buildings = getBuildings();
    for (const b of buildings) {
      if (this.x + 12 > b.x && this.x - 12 < b.x + b.w &&
          this.y + 12 > b.y && this.y - 12 < b.y + b.h) {
        // Push out
        const overlapX = Math.min(this.x + 12 - b.x, b.x + b.w - (this.x - 12));
        const overlapY = Math.min(this.y + 12 - b.y, b.y + b.h - (this.y - 12));
        if (overlapX < overlapY) {
          this.x += (this.x < b.x + b.w / 2) ? -overlapX : overlapX;
        } else {
          this.y += (this.y < b.y + b.h / 2) ? -overlapY : overlapY;
        }
      }
    }
  }

  draw(ctx) {
    if (this.inVehicle) return; // Car renders itself

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.arc(0, 4, 10, 0, Math.PI * 2);
    ctx.fill();

    // Body / Outfit (Courier jacket)
    ctx.fillStyle = CONFIG.COLOR_PLAYER;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();

    // Head / Hair
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(4, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    // Walking animation bobbing arms/legs
    ctx.strokeStyle = '#db2777';
    ctx.lineWidth = 3;
    const limbOffset = Math.sin(this.animTimer) * 6;
    ctx.beginPath();
    ctx.moveTo(-6, -8);
    ctx.lineTo(-6 - limbOffset, 8);
    ctx.moveTo(6, -8);
    ctx.lineTo(6 + limbOffset, 8);
    ctx.stroke();

    ctx.restore();
  }
}
