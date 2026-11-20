// Traffic Vehicles Physics, Rendering, and AI Navigation

import { CONFIG } from './config.js';
import { getBuildings } from './city.js';
import { rngRange, rngChoice, rngInt } from './random.js';

export class Car {
  constructor(x, y, color, isPlayerControlled = false) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.speed = 0;
    this.maxSpeed = CONFIG.CAR_MAX_SPEED;
    this.color = color;
    this.isPlayerControlled = isPlayerControlled;
    this.width = 36;
    this.length = 64;
    this.bodyStyle = rngChoice(['sedan', 'sport']);
    
    // AI state
    this.aiTarget = { x, y };
    this.aiTimer = 0;
  }

  update(input, dt) {
    if (this.isPlayerControlled) {
      if (input.keys['ArrowUp'] || input.keys['KeyW']) {
        this.speed = Math.min(this.maxSpeed, this.speed + CONFIG.CAR_ACCEL);
      } else if (input.keys['ArrowDown'] || input.keys['KeyS']) {
        this.speed = Math.max(-CONFIG.CAR_REVERSE_SPEED, this.speed - CONFIG.CAR_BRAKE);
      } else {
        this.speed *= CONFIG.CAR_FRICTION;
      }

      if (input.keys['ArrowLeft'] || input.keys['KeyA']) {
        if (Math.abs(this.speed) > 0.2) {
          this.angle -= CONFIG.CAR_STEER_SPEED * (this.speed / this.maxSpeed);
        }
      }
      if (input.keys['ArrowRight'] || input.keys['KeyD']) {
        if (Math.abs(this.speed) > 0.2) {
          this.angle += CONFIG.CAR_STEER_SPEED * (this.speed / this.maxSpeed);
        }
      }

      this.vx = Math.cos(this.angle) * this.speed;
      this.vy = Math.sin(this.angle) * this.speed;

      this.x += this.vx;
      this.y += this.vy;

      this.checkCollisions();
    } else {
      this.aiTimer -= dt;
      const speedMag = Math.hypot(this.vx, this.vy);
      if (speedMag < 2.5) {
        this.speed = 2.5;
      } else {
        this.speed = 3.0;
      }

      const dx = this.aiTarget.x - this.x;
      const dy = this.aiTarget.y - this.y;
      const targetAngle = Math.atan2(dy, dx);
      
      let diff = targetAngle - this.angle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.angle += Math.sign(diff) * Math.min(Math.abs(diff), 0.05);

      this.vx = Math.cos(this.angle) * this.speed;
      this.vy = Math.sin(this.angle) * this.speed;
      this.x += this.vx;
      this.y += this.vy;

      if (Math.hypot(dx, dy) < 60 || this.aiTimer <= 0) {
        this.aiTimer = rngRange(150, 300);
        const directions = [
          { x: CONFIG.BLOCK_SIZE, y: 0 },
          { x: -CONFIG.BLOCK_SIZE, y: 0 },
          { x: 0, y: CONFIG.BLOCK_SIZE },
          { x: 0, y: -CONFIG.BLOCK_SIZE }
        ];
        const dir = rngChoice(directions);
        this.aiTarget = {
          x: Math.max(500, Math.min(CONFIG.WORLD_WIDTH - 500, this.x + dir.x)),
          y: Math.max(400, Math.min(CONFIG.WORLD_HEIGHT - 400, this.y + dir.y))
        };
      }
    }

    this.x = Math.max(450, Math.min(CONFIG.WORLD_WIDTH - 450, this.x));
    this.y = Math.max(300, Math.min(CONFIG.WORLD_HEIGHT - 300, this.y));
  }

  checkCollisions() {
    const buildings = getBuildings();
    for (const b of buildings) {
      if (this.x + 18 > b.x && this.x - 18 < b.x + b.w &&
          this.y + 18 > b.y && this.y - 18 < b.y + b.h) {
        this.speed *= -0.3;
        this.x -= this.vx * 1.5;
        this.y -= this.vy * 1.5;
      }
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Car shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.roundRect(-this.length / 2 + 4, -this.width / 2 + 4, this.length, this.width - 2, 8);
    ctx.fill();

    // Car body with rounded corners
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.roundRect(-this.length / 2, -this.width / 2, this.length, this.width, 10);
    ctx.fill();

    // Slightly darker hood & trunk shading
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.fillRect(-this.length / 2, -this.width / 2 + 2, 12, this.width - 4);
    ctx.fillRect(this.length / 2 - 12, -this.width / 2 + 2, 12, this.width - 4);

    // Lighter roof panel between windows
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.roundRect(-this.length / 4 - 2, -this.width / 2 + 4, this.length / 2 + 4, this.width - 8, 4);
    ctx.fill();

    // Windshield & Rear window bands
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(2, -this.width / 2 + 5, 10, this.width - 10);
    ctx.fillRect(-this.length / 2 + 8, -this.width / 2 + 6, 8, this.width - 12);

    // Headlights
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(this.length / 2 - 3, -this.width / 2 + 3, 3, 5);
    ctx.fillRect(this.length / 2 - 3, this.width / 2 - 8, 3, 5);

    // Taillights
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-this.length / 2, -this.width / 2 + 3, 3, 5);
    ctx.fillRect(-this.length / 2, this.width / 2 - 8, 3, 5);

    // Wheels (4 dark rectangles at corners)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-this.length / 3, -this.width / 2 - 3, 12, 5);
    ctx.fillRect(-this.length / 3, this.width / 2 - 2, 12, 5);
    ctx.fillRect(this.length / 4, -this.width / 2 - 3, 12, 5);
    ctx.fillRect(this.length / 4, this.width / 2 - 2, 12, 5);

    ctx.restore();
  }
}

let trafficCars = [];

export function spawnTraffic(count = 14) {
  trafficCars = [];
  const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ffffff', '#111827', '#ec4899'];
  
  for (let i = 0; i < count; i++) {
    const x = rngRange(600, CONFIG.WORLD_WIDTH - 600);
    const y = rngRange(400, CONFIG.WORLD_HEIGHT - 400);
    const color = rngChoice(colors);
    const car = new Car(x, y, color, false);
    trafficCars.push(car);
  }
}

export function getTrafficCars() {
  return trafficCars;
}

export function updateTraffic(input, dt) {
  for (const car of trafficCars) {
    car.update(input, dt);
  }
}

export function drawVehicles(ctx) {
  for (const car of trafficCars) {
    car.draw(ctx);
  }
}
