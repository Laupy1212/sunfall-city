// Sunfall City - Police System, Wanted Level, Pursuit & Busted/Wasted Flows

import { CONFIG } from './config.js';
import { rngRange, rngChoice } from './random.js';
import { getBuildings } from './city.js';

export class PoliceCar {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.speed = 0;
    this.maxSpeed = CONFIG.CAR_MAX_SPEED * 1.05;
    this.width = 36;
    this.length = 64;
    this.flashTimer = 0;
  }

  update(targetX, targetY, dt) {
    this.flashTimer += dt * 0.25;
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const targetAngle = Math.atan2(dy, dx);

    let diff = targetAngle - this.angle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.angle += Math.sign(diff) * Math.min(Math.abs(diff), 0.07);

    this.speed = Math.min(this.maxSpeed, this.speed + 0.3);
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;
    this.x += this.vx;
    this.y += this.vy;

    this.x = Math.max(450, Math.min(CONFIG.WORLD_WIDTH - 450, this.x));
    this.y = Math.max(300, Math.min(CONFIG.WORLD_HEIGHT - 300, this.y));
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.roundRect(-this.length / 2 + 4, -this.width / 2 + 4, this.length, this.width - 2, 8);
    ctx.fill();

    // Police White & Teal Livery with rounded corners
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(-this.length / 2, -this.width / 2, this.length, this.width, 10);
    ctx.fill();

    ctx.fillStyle = '#0d9488';
    ctx.fillRect(-12, -this.width / 2, 24, this.width);

    // Lighter roof panel
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.roundRect(-this.length / 4 - 2, -this.width / 2 + 4, this.length / 2 + 4, this.width - 8, 4);
    ctx.fill();

    // Windshield & Rear window
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(2, -this.width / 2 + 5, 10, this.width - 10);
    ctx.fillRect(-this.length / 2 + 8, -this.width / 2 + 6, 8, this.width - 12);

    // Wheels
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-this.length / 3, -this.width / 2 - 3, 12, 5);
    ctx.fillRect(-this.length / 3, this.width / 2 - 2, 12, 5);
    ctx.fillRect(this.length / 4, -this.width / 2 - 3, 12, 5);
    ctx.fillRect(this.length / 4, this.width / 2 - 2, 12, 5);

    // Flashing light bar (red/blue alternating)
    const flashing = Math.sin(this.flashTimer * 20) > 0;
    ctx.fillStyle = flashing ? '#ef4444' : '#3b82f6';
    ctx.fillRect(-6, -10, 12, 20);

    ctx.restore();
  }
}

export class PoliceOfficer {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
  }

  update(targetX, targetY, dt) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 20) {
      this.x += (dx / dist) * 2.2;
      this.y += (dy / dist) * 2.2;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(0, -2, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

let policeCars = [];
let policeOfficers = [];
let bustMeter = 0;
let decayTimer = 0;

export function updatePolice(player, trafficCars, dt, onBusted, onWasted) {
  if (player.wantedLevel <= 0) {
    policeCars = [];
    policeOfficers = [];
    bustMeter = 0;
    decayTimer += dt;
    return;
  }

  decayTimer = 0;

  const targetCount = player.wantedLevel * 2;
  if (policeCars.length < targetCount && Math.random() < 0.05) {
    const spawnDist = 600;
    const angle = rngRange(0, Math.PI * 2);
    const sx = player.x + Math.cos(angle) * spawnDist;
    const sy = player.y + Math.sin(angle) * spawnDist;
    policeCars.push(new PoliceCar(Math.max(500, Math.min(CONFIG.WORLD_WIDTH - 500, sx)), Math.max(400, Math.min(CONFIG.WORLD_HEIGHT - 400, sy))));
  }

  for (const pcar of policeCars) {
    pcar.update(player.x, player.y, dt);
  }

  if (!player.inVehicle && policeOfficers.length < player.wantedLevel && Math.random() < 0.03) {
    policeOfficers.push(new PoliceOfficer(player.x + rngRange(-300, 300), player.y + rngRange(-300, 300)));
  }

  for (const officer of policeOfficers) {
    officer.update(player.x, player.y, dt);
  }

  let closePoliceCount = 0;
  for (const pcar of policeCars) {
    if (Math.hypot(pcar.x - player.x, pcar.y - player.y) < 140) {
      closePoliceCount++;
    }
  }
  for (const off of policeOfficers) {
    if (Math.hypot(off.x - player.x, off.y - player.y) < 70) {
      closePoliceCount++;
    }
  }

  const speedMag = player.inVehicle && player.currentCar ? Math.hypot(player.currentCar.vx, player.currentCar.vy) : 0;
  if (closePoliceCount > 0 && speedMag < 1.5) {
    bustMeter += dt * 1.5;
    if (bustMeter >= 100) {
      bustMeter = 0;
      if (onBusted) onBusted();
    }
  } else {
    bustMeter = Math.max(0, bustMeter - dt * 0.8);
  }

  if (player.health <= 0) {
    if (onWasted) onWasted();
  }
}

export function drawPolice(ctx) {
  for (const pcar of policeCars) {
    pcar.draw(ctx);
  }
  for (const off of policeOfficers) {
    off.draw(ctx);
  }
}

export function getBustMeter() {
  return bustMeter;
}

export function clearPolice() {
  policeCars = [];
  policeOfficers = [];
  bustMeter = 0;
}
