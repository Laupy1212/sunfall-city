// Automated Screenshot Rendering Staging for Documentation and Press Kits

import { CONFIG } from './config.js';
import { setSeed, rngRange, rngChoice, rngInt } from './random.js';
import { initCity, drawCity, isRoad, nearestRoadPoint, randomRoadPoint, getBuildings } from './city.js';
import { spawnTraffic, getTrafficCars, drawVehicles } from './vehicles.js';
import { spawnPedestrians, getPedestrians, drawPedestrians } from './pedestrians.js';
import { Player } from './player.js';
import { Camera } from './camera.js';
import { drawHUD, drawStartScreen, drawPauseOverlay } from './hud.js';
import { PoliceCar } from './police.js';
import { MissionManager } from './missions.js';

function getHorizontalCenterlines() {
  const lines = [];
  const rows = Math.floor(CONFIG.WORLD_HEIGHT / CONFIG.BLOCK_SIZE);
  for (let m = 1; m < rows; m++) {
    const y = m * CONFIG.BLOCK_SIZE + CONFIG.ROAD_WIDTH / 2;
    if (y >= 200 && y <= CONFIG.WORLD_HEIGHT - 200) {
      lines.push(y);
    }
  }
  return lines;
}

function getVerticalCenterlines() {
  const lines = [];
  const cols = Math.floor(CONFIG.WORLD_WIDTH / CONFIG.BLOCK_SIZE);
  for (let k = 2; k < cols; k++) {
    const x = k * CONFIG.BLOCK_SIZE + CONFIG.ROAD_WIDTH / 2;
    if (x >= 300 && x <= CONFIG.WORLD_WIDTH - 200) {
      lines.push(x);
    }
  }
  return lines;
}

function getCarCorners(x, y, angle, length = 54, width = 26) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const hl = length / 2;
  const hw = width / 2;
  return [
    { x: x + cos * hl - sin * hw, y: y + sin * hl + cos * hw },
    { x: x + cos * hl + sin * hw, y: y + sin * hl - cos * hw },
    { x: x - cos * hl - sin * hw, y: y - sin * hl + cos * hw },
    { x: x - cos * hl + sin * hw, y: y - sin * hl - cos * hw }
  ];
}

function areAllCornersOnRoad(x, y, angle, length = 54, width = 26) {
  const corners = getCarCorners(x, y, angle, length, width);
  for (const c of corners) {
    if (!isRoad(c.x, c.y)) {
      return false;
    }
  }
  return true;
}

function placeCarOnCenterline(car, prefX, prefY, prefAngle, placedCars = []) {
  const horizLines = getHorizontalCenterlines();
  const vertLines = getVerticalCenterlines();

  let isVertical = Math.abs(Math.sin(prefAngle)) > 0.5;

  const tryLine = (isVert, lineCoord, startCoord) => {
    const angle = isVert ? (Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2) : (Math.random() < 0.5 ? 0 : Math.PI);
    const steps = [0];
    for (let d = 10; d <= 200; d += 10) {
      steps.push(d);
      steps.push(-d);
    }

    for (const step of steps) {
      let x, y;
      if (isVert) {
        x = lineCoord;
        y = startCoord + step;
      } else {
        x = startCoord + step;
        y = lineCoord;
      }

      if (areAllCornersOnRoad(x, y, angle, 54, 26)) {
        let ok = true;
        for (const pc of placedCars) {
          const dist = Math.hypot(pc.x - x, pc.y - y);
          if (dist < 95) {
            ok = false;
            break;
          }
        }
        if (ok) {
          car.x = x;
          car.y = y;
          car.angle = angle;
          return true;
        }
      }
    }
    return false;
  };

  if (isVertical) {
    let bestX = vertLines.reduce((prev, curr) => Math.abs(curr - prefX) < Math.abs(prev - prefX) ? curr : prev, vertLines[0]);
    if (tryLine(true, bestX, prefY)) return true;
  } else {
    let bestY = horizLines.reduce((prev, curr) => Math.abs(curr - prefY) < Math.abs(prev - prefY) ? curr : prev, horizLines[0]);
    if (tryLine(false, bestY, prefX)) return true;
  }

  for (const vx of vertLines) {
    if (tryLine(true, vx, prefY)) return true;
  }
  for (const hy of horizLines) {
    if (tryLine(false, hy, prefX)) return true;
  }

  for (let i = 0; i < 50; i++) {
    const rp = randomRoadPoint();
    const isVert = Math.random() < 0.5;
    const angle = isVert ? Math.PI / 2 : 0;
    if (areAllCornersOnRoad(rp.x, rp.y, angle, 54, 26)) {
      car.x = rp.x;
      car.y = rp.y;
      car.angle = angle;
      return true;
    }
  }

  car.x = prefX;
  car.y = prefY;
  car.angle = prefAngle;
  return false;
}

function isInsideBuilding(x, y) {
  const buildings = getBuildings();
  for (const b of buildings) {
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
      return true;
    }
  }
  return false;
}

function isSidewalkPoint(x, y) {
  if (x < 300 || x > CONFIG.WORLD_WIDTH - 200 || y < 200 || y > CONFIG.WORLD_HEIGHT - 200) {
    return false;
  }
  if (isRoad(x, y)) return false;
  if (isInsideBuilding(x, y)) return false;
  return true;
}

function placePedestrians(peds, playerX, playerY) {
  const offsets = [
    {dx: 50, dy: -65}, {dx: -50, dy: -65},
    {dx: 70, dy: 65}, {dx: -70, dy: 65},
    {dx: 90, dy: 0}, {dx: -90, dy: 0}
  ];
  for (let i = 0; i < peds.length; i++) {
    let placed = false;
    const off = offsets[i % offsets.length];
    let tx = playerX + off.dx;
    let ty = playerY + off.dy;
    
    const subSteps = [{dx:0, dy:0}, {dx:20, dy:20}, {dx:-20, dy:-20}, {dx:40, dy:0}, {dx:-40, dy:0}, {dx:0, dy:40}, {dx:0, dy:-40}];
    for (const ss of subSteps) {
      const cx = tx + ss.dx;
      const cy = ty + ss.dy;
      if (isSidewalkPoint(cx, cy)) {
        peds[i].x = cx;
        peds[i].y = cy;
        placed = true;
        break;
      }
    }
    if (!placed) {
      for (let attempt = 0; attempt < 30; attempt++) {
        const rx = rngRange(playerX - 250, playerX + 250);
        const ry = rngRange(playerY - 250, playerY + 250);
        if (isSidewalkPoint(rx, ry)) {
          peds[i].x = rx;
          peds[i].y = ry;
          break;
        }
      }
    }
  }
}

export function handleScreenshotShot(ctx, queryParams) {
  const shot = queryParams.get('shot');
  if (!shot) return false;

  const seed = parseInt(queryParams.get('seed') ?? '1', 10);
  setSeed(seed);

  initCity();
  spawnTraffic(16);
  spawnPedestrians(20);

  const player = new Player(2000, 2000);
  const camera = new Camera();
  const missionManager = new MissionManager();

  if (shot === 'start') {
    camera.x = 300;
    camera.y = 1200;
    drawStartScreen(ctx, camera);
    return true;
  }

  if (shot === 'city') {
    const traffic = getTrafficCars();
    const placedCars = [];

    if (traffic.length > 0) {
      player.inVehicle = true;
      player.currentCar = traffic[0];
      placeCarOnCenterline(traffic[0], 550, 1500, 0, placedCars);
      traffic[0].isPlayerControlled = true;
      traffic[0].speed = 3;
      player.x = traffic[0].x;
      player.y = traffic[0].y;
      placedCars.push(traffic[0]);
    }

    for (let i = 1; i < 6; i++) {
      if (traffic[i]) {
        const prev = placedCars[placedCars.length - 1] || traffic[0];
        placeCarOnCenterline(traffic[i], prev.x + 120, prev.y, prev.angle, placedCars);
        traffic[i].speed = 2.5;
        placedCars.push(traffic[i]);
      }
    }

    for (const car of placedCars) {
      const valid = areAllCornersOnRoad(car.x, car.y, car.angle, 54, 26);
      console.log(`[city] Car at (${car.x.toFixed(1)}, ${car.y.toFixed(1)}), angle: ${car.angle.toFixed(2)}, corners-on-road: ${valid}`);
    }

    const peds = getPedestrians();
    placePedestrians(peds, player.x, player.y);

    camera.snapTo(player, ctx.canvas.width, ctx.canvas.height);

    if (typeof window !== 'undefined') {
      window.__debugInfo = {
        scene: 'city',
        playerX: player.x,
        playerY: player.y,
        carX: player.currentCar ? player.currentCar.x : null,
        carY: player.currentCar ? player.currentCar.y : null,
        cameraX: camera.x,
        cameraY: camera.y,
        cameraZoom: camera.zoom,
        viewWidth: ctx.canvas.width,
        viewHeight: ctx.canvas.height
      };
    }

    ctx.save();
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);
    drawCity(ctx, camera);
    drawPedestrians(ctx);
    drawVehicles(ctx);
    ctx.restore();

    drawHUD(ctx, player, traffic, missionManager);
    return true;
  }

  if (shot === 'chase') {
    const traffic = getTrafficCars();
    const placedCars = [];

    if (traffic.length > 0) {
      player.inVehicle = true;
      player.currentCar = traffic[0];
      player.wantedLevel = 3;
      placeCarOnCenterline(traffic[0], 1200, 1800, 0, placedCars);
      traffic[0].isPlayerControlled = true;
      traffic[0].speed = 7;
      player.x = traffic[0].x;
      player.y = traffic[0].y;
      placedCars.push(traffic[0]);
    }

    if (traffic[1]) {
      placeCarOnCenterline(traffic[1], player.x + 180, player.y, player.angle, placedCars);
      placedCars.push(traffic[1]);
    }
    if (traffic[2]) {
      placeCarOnCenterline(traffic[2], player.x + 280, player.y, player.angle, placedCars);
      placedCars.push(traffic[2]);
    }

    const pcar1 = new PoliceCar(0, 0);
    const pcar2 = new PoliceCar(0, 0);
    pcar1.angle = player.angle;
    pcar2.angle = player.angle;
    pcar1.x = player.x - Math.cos(player.angle) * 70;
    pcar1.y = player.y - Math.sin(player.angle) * 70;
    pcar2.x = player.x - Math.cos(player.angle) * 140;
    pcar2.y = player.y - Math.sin(player.angle) * 140;
    pcar1.speed = 7.2;
    pcar2.speed = 7.2;

    if (!areAllCornersOnRoad(pcar1.x, pcar1.y, pcar1.angle)) {
      pcar1.x = player.x - Math.cos(player.angle) * 75;
      pcar1.y = player.y - Math.sin(player.angle) * 75;
    }
    if (!areAllCornersOnRoad(pcar2.x, pcar2.y, pcar2.angle)) {
      pcar2.x = player.x - Math.cos(player.angle) * 150;
      pcar2.y = player.y - Math.sin(player.angle) * 150;
    }

    for (const car of placedCars) {
      const valid = areAllCornersOnRoad(car.x, car.y, car.angle, 54, 26);
      console.log(`[chase] Car at (${car.x.toFixed(1)}, ${car.y.toFixed(1)}), angle: ${car.angle.toFixed(2)}, corners-on-road: ${valid}`);
    }
    console.log(`[chase] PoliceCar1 at (${pcar1.x.toFixed(1)}, ${pcar1.y.toFixed(1)}), angle: ${pcar1.angle.toFixed(2)}, corners-on-road: ${areAllCornersOnRoad(pcar1.x, pcar1.y, pcar1.angle, 54, 26)}`);
    console.log(`[chase] PoliceCar2 at (${pcar2.x.toFixed(1)}, ${pcar2.y.toFixed(1)}), angle: ${pcar2.angle.toFixed(2)}, corners-on-road: ${areAllCornersOnRoad(pcar2.x, pcar2.y, pcar2.angle, 54, 26)}`);

    const peds = getPedestrians();
    placePedestrians(peds, player.x, player.y);

    camera.snapTo(player, ctx.canvas.width, ctx.canvas.height);

    if (typeof window !== 'undefined') {
      window.__debugInfo = {
        scene: 'chase',
        playerX: player.x,
        playerY: player.y,
        carX: player.currentCar ? player.currentCar.x : null,
        carY: player.currentCar ? player.currentCar.y : null,
        cameraX: camera.x,
        cameraY: camera.y,
        cameraZoom: camera.zoom,
        viewWidth: ctx.canvas.width,
        viewHeight: ctx.canvas.height
      };
    }

    ctx.save();
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);
    drawCity(ctx, camera);
    drawPedestrians(ctx);
    drawVehicles(ctx);
    pcar1.draw(ctx);
    pcar2.draw(ctx);
    ctx.restore();

    drawHUD(ctx, player, traffic, missionManager);
    return true;
  }

  if (shot === 'mission') {
    const traffic = getTrafficCars();
    const placedCars = [];

    if (traffic.length > 0) {
      player.inVehicle = true;
      player.currentCar = traffic[0];
      placeCarOnCenterline(traffic[0], 900, 1000, 0, placedCars);
      traffic[0].isPlayerControlled = true;
      traffic[0].speed = 2;
      player.x = traffic[0].x;
      player.y = traffic[0].y;
      placedCars.push(traffic[0]);
    }

    missionManager.currentMissionIndex = 0;
    missionManager.missionState = 'active';
    missionManager.timeLeft = 165;

    const mission = missionManager.getCurrentMission();
    if (mission) {
      const targetDist = 400;
      let tx = player.x + Math.cos(player.angle) * targetDist;
      let ty = player.y + Math.sin(player.angle) * targetDist;
      if (!isRoad(tx, ty)) {
        if (Math.abs(Math.sin(player.angle)) > 0.5) {
          ty = player.y + (Math.sin(player.angle) > 0 ? targetDist : -targetDist);
        } else {
          tx = player.x + (Math.cos(player.angle) > 0 ? targetDist : -targetDist);
        }
      }
      mission.pickup = { x: tx, y: ty };
    }

    for (const car of placedCars) {
      const valid = areAllCornersOnRoad(car.x, car.y, car.angle, 54, 26);
      console.log(`[mission] Car at (${car.x.toFixed(1)}, ${car.y.toFixed(1)}), angle: ${car.angle.toFixed(2)}, corners-on-road: ${valid}`);
    }

    const peds = getPedestrians();
    placePedestrians(peds, player.x, player.y);

    camera.snapTo(player, ctx.canvas.width, ctx.canvas.height);

    ctx.save();
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);
    drawCity(ctx, camera);
    drawPedestrians(ctx);
    drawVehicles(ctx);
    missionManager.drawMissionMarkers(ctx, player);
    ctx.restore();

    drawHUD(ctx, player, traffic, missionManager);
    return true;
  }

  if (shot === 'end' || shot === 'play') {
    drawPauseOverlay(ctx);
    return true;
  }

  return false;
}
