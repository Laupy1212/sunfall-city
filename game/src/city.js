// Sunfall City - Procedural City Generation & World Map (Polished Visuals & Set Dressing)

import { CONFIG } from './config.js';
import { rngInt, rngChoice, rngRange } from './random.js';

let buildings = [];
let palmTrees = [];
let streetLamps = [];
let parkedCars = [];
let umbrellas = [];
let boats = [];
let initialized = false;

// Landmark locations for respawns and missions
export const LANDMARKS = {
  policeStation: { x: 1000, y: 1000, name: "Sunfall City Police Precinct" },
  hospital: { x: 3000, y: 1000, name: "Marina Memorial Hospital" },
  cafePalma: { x: 500, y: 500, name: "Cafe Palma" }
};

export function initCity() {
  if (initialized) return;
  initialized = true;
  buildings = [];
  palmTrees = [];
  streetLamps = [];
  parkedCars = [];
  umbrellas = [];
  boats = [];

  const cols = Math.floor(CONFIG.WORLD_WIDTH / CONFIG.BLOCK_SIZE);
  const rows = Math.floor(CONFIG.WORLD_HEIGHT / CONFIG.BLOCK_SIZE);

  // Beach umbrellas
  for (let i = 0; i < 8; i++) {
    umbrellas.push({
      x: rngRange(80, 240),
      y: rngRange(400, 3600),
      color: rngChoice(['#ef4444', '#3b82f6', '#f59e0b', '#10b981'])
    });
  }

  // Marina boats
  for (let i = 0; i < 4; i++) {
    boats.push({
      x: rngRange(60, 180),
      y: rngRange(3200, 3800),
      angle: rngRange(0, Math.PI * 2)
    });
  }

  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      const bx = c * CONFIG.BLOCK_SIZE + CONFIG.ROAD_WIDTH;
      const by = r * CONFIG.BLOCK_SIZE + CONFIG.ROAD_WIDTH;
      const bw = CONFIG.BLOCK_SIZE - CONFIG.ROAD_WIDTH;
      const bh = CONFIG.BLOCK_SIZE - CONFIG.ROAD_WIDTH;

      // Skip some blocks for parks
      if (c === 2 && r === 2) {
        // Park block
        palmTrees.push({ x: bx + 40, y: by + 40 });
        palmTrees.push({ x: bx + bw - 40, y: by + 40 });
        palmTrees.push({ x: bx + 40, y: by + bh - 40 });
        palmTrees.push({ x: bx + bw - 40, y: by + bh - 40 });
        continue;
      }

      if (c === 5 && r === 5) {
        // Second park / plaza
        palmTrees.push({ x: bx + 50, y: by + 50 });
        palmTrees.push({ x: bx + bw - 50, y: by + bh - 50 });
        continue;
      }

      // Building footprint with varied split or single
      const margin = 16;
      const bLeft = bx + margin;
      const bTop = by + margin;
      const bWidth = bw - margin * 2;
      const bHeight = bh - margin * 2;

      const height = rngInt(40, 130);
      const color = rngChoice([
        CONFIG.COLOR_BUILDING_WALL_1,
        CONFIG.COLOR_BUILDING_WALL_2,
        CONFIG.COLOR_BUILDING_WALL_3,
        CONFIG.COLOR_BUILDING_WALL_4
      ]);

      const roofDetailType = rngChoice(['ac', 'skylight', 'watertower', 'none']);

      buildings.push({
        x: bLeft,
        y: bTop,
        w: bWidth,
        h: bHeight,
        height,
        color,
        roofColor: rngChoice(['#94a3b8', '#64748b', '#475569', '#cbd5e1']),
        roofDetailType
      });

      // Street lamps around corners
      streetLamps.push({ x: bx - 10, y: by - 10 });
      streetLamps.push({ x: bx + bw + 10, y: by - 10 });

      // Parked cars at curbs (some blocks)
      if (Math.random() < 0.4) {
        parkedCars.push({
          x: bx - 12,
          y: by + bw / 2,
          angle: Math.PI / 2,
          color: rngChoice(['#ef4444', '#3b82f6', '#10b981', '#111827'])
        });
      }
    }
  }

  // Palm trees along coastal avenue sidewalk (x = 300)
  for (let y = 300; y < CONFIG.WORLD_HEIGHT - 300; y += 220) {
    palmTrees.push({ x: 312, y: y });
  }
}

export function getBuildings() {
  return buildings;
}

export function isRoad(x, y) {
  if (x < 300 || x > CONFIG.WORLD_WIDTH - 200 || y < 200 || y > CONFIG.WORLD_HEIGHT - 200) {
    return false;
  }
  const relX = x % CONFIG.BLOCK_SIZE;
  const relY = y % CONFIG.BLOCK_SIZE;
  return relX < CONFIG.ROAD_WIDTH || relY < CONFIG.ROAD_WIDTH;
}

export function nearestRoadPoint(px, py) {
  const cellSize = CONFIG.BLOCK_SIZE;
  const rx = Math.round(px / cellSize) * cellSize + CONFIG.ROAD_WIDTH / 2;
  const ry = Math.round(py / cellSize) * cellSize + CONFIG.ROAD_WIDTH / 2;
  return { x: rx, y: ry };
}

export function randomRoadPoint() {
  const c = rngInt(2, Math.floor(CONFIG.WORLD_WIDTH / CONFIG.BLOCK_SIZE) - 3);
  const r = rngInt(2, Math.floor(CONFIG.WORLD_HEIGHT / CONFIG.BLOCK_SIZE) - 3);
  return {
    x: c * CONFIG.BLOCK_SIZE + CONFIG.ROAD_WIDTH / 2,
    y: r * CONFIG.BLOCK_SIZE + CONFIG.ROAD_WIDTH / 2
  };
}

export function drawCity(ctx, camera) {
  initCity();
  const vw = ctx.canvas.width;
  const vh = ctx.canvas.height;

  // 1. Ocean (West edge x < 300, and overall world base)
  ctx.fillStyle = CONFIG.COLOR_WATER;
  ctx.fillRect(0, 0, CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT);

  // Subtle wave lines in ocean
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 2;
  for (let wx = 50; wx < 280; wx += 60) {
    for (let wy = 100; wy < CONFIG.WORLD_HEIGHT; wy += 120) {
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.quadraticCurveTo(wx + 20, wy - 10, wx + 40, wy);
      ctx.stroke();
    }
  }

  // 2. Beach along west side (x 300 to 450)
  ctx.fillStyle = CONFIG.COLOR_SAND;
  ctx.fillRect(300, 0, 180, CONFIG.WORLD_HEIGHT);

  // Beach umbrellas
  for (const umb of umbrellas) {
    ctx.fillStyle = umb.color;
    ctx.beginPath();
    ctx.arc(umb.x, umb.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#78350f';
    ctx.fillRect(umb.x - 1, umb.y, 2, 20);
  }

  // Marina Pier (Wooden dock structure at bottom-west)
  ctx.fillStyle = '#b45309';
  ctx.fillRect(200, 3200, 120, 400); // Pier base
  ctx.fillStyle = '#78350f';
  for (let py = 3220; py < 3580; py += 60) {
    ctx.fillRect(195, py, 130, 8);
  }

  // Moored boats at pier
  for (const boat of boats) {
    ctx.save();
    ctx.translate(boat.x, boat.y);
    ctx.rotate(boat.angle);
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(-20, -10, 40, 20, [8]);
    ctx.fill();
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(-8, -6, 16, 12);
    ctx.restore();
  }

  // 3. Road Asphalt
  ctx.fillStyle = CONFIG.COLOR_ROAD;
  ctx.fillRect(480, 200, CONFIG.WORLD_WIDTH - 680, CONFIG.WORLD_HEIGHT - 400);

  // Horizontal and vertical road grid lines (dashed center lanes)
  ctx.strokeStyle = CONFIG.COLOR_ROAD_LINE;
  ctx.lineWidth = 3;
  ctx.setLineDash([16, 16]);

  const cols = Math.floor(CONFIG.WORLD_WIDTH / CONFIG.BLOCK_SIZE);
  const rows = Math.floor(CONFIG.WORLD_HEIGHT / CONFIG.BLOCK_SIZE);

  // Draw road grid & center lines
  for (let r = 1; r < rows; r++) {
    const ry = r * CONFIG.BLOCK_SIZE;
    ctx.beginPath();
    ctx.moveTo(480, ry - CONFIG.ROAD_WIDTH / 2);
    ctx.lineTo(CONFIG.WORLD_WIDTH - 200, ry - CONFIG.ROAD_WIDTH / 2);
    ctx.stroke();
  }
  for (let c = 2; c < cols; c++) {
    const cx = c * CONFIG.BLOCK_SIZE;
    ctx.beginPath();
    ctx.moveTo(cx - CONFIG.ROAD_WIDTH / 2, 200);
    ctx.lineTo(cx - CONFIG.ROAD_WIDTH / 2, CONFIG.WORLD_HEIGHT - 200);
    ctx.stroke();
  }
  ctx.setLineDash([]); // reset

  // Crosswalk zebra stripes at intersections
  ctx.fillStyle = '#ffffff';
  for (let r = 1; r < rows; r++) {
    for (let c = 2; c < cols; c++) {
      const ix = c * CONFIG.BLOCK_SIZE;
      const iy = r * CONFIG.BLOCK_SIZE;
      ctx.fillRect(ix - CONFIG.ROAD_WIDTH / 2, iy - CONFIG.ROAD_WIDTH - 6, CONFIG.ROAD_WIDTH, 6);
      ctx.fillRect(ix - CONFIG.ROAD_WIDTH / 2, iy, CONFIG.ROAD_WIDTH, 6);
    }
  }

  // 4. Sidewalks & Blocks (Parks / Buildings)
  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      const bx = c * CONFIG.BLOCK_SIZE + CONFIG.ROAD_WIDTH;
      const by = r * CONFIG.BLOCK_SIZE + CONFIG.ROAD_WIDTH;
      const bw = CONFIG.BLOCK_SIZE - CONFIG.ROAD_WIDTH;
      const bh = CONFIG.BLOCK_SIZE - CONFIG.ROAD_WIDTH;

      if ((c === 2 && r === 2) || (c === 5 && r === 5)) {
        // Park
        ctx.fillStyle = CONFIG.COLOR_GRASS;
        ctx.fillRect(bx, by, bw, bh);

        // Stone park path cross
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(bx + bw / 2 - 15, by, 30, bh);
        ctx.fillRect(bx, by + bh / 2 - 15, bw, 30);
      } else {
        // Sidewalk concrete block border
        ctx.fillStyle = CONFIG.COLOR_SIDEWALK;
        ctx.fillRect(bx, by, bw, bh);
      }
    }
  }

  // 5. Buildings with Soft Shadow, Parapet Edge, and Roof Details
  for (const b of buildings) {
    if (camera && (b.x + b.w < camera.x - 150 || b.x > camera.x + vw + 150 ||
        b.y + b.h < camera.y - 150 || b.y > camera.y + vh + 150)) {
      continue;
    }

    // Soft South-East Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(b.x + 10, b.y + 10, b.w, b.h);

    // Building Wall
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);

    // Parapet Edge / Border
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.strokeRect(b.x, b.y, b.w, b.h);

    // Roof Top Offset (2.5D Effect)
    const offset = 14;
    ctx.fillStyle = b.roofColor;
    ctx.fillRect(b.x + offset, b.y + offset, b.w - offset * 2, b.h - offset * 2);

    // Rooftop Details
    if (b.roofDetailType === 'ac') {
      ctx.fillStyle = '#475569';
      ctx.fillRect(b.x + b.w / 2 - 12, b.y + b.h / 2 - 12, 24, 24);
    } else if (b.roofDetailType === 'skylight') {
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(b.x + b.w / 2 - 16, b.y + b.h / 2 - 10, 32, 20);
    } else if (b.roofDetailType === 'watertower') {
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(b.x + b.w / 2, b.y + b.h / 2, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 6. Set Dressing: Palm Trees (Trunk + Fronds)
  for (const pt of palmTrees) {
    ctx.fillStyle = '#15803d';
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
      ctx.beginPath();
      ctx.ellipse(pt.x + Math.cos(a) * 8, pt.y + Math.sin(a) * 8, 12, 6, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 7. Street Lamps at Corners
  for (const lamp of streetLamps) {
    ctx.fillStyle = '#64748b';
    ctx.fillRect(lamp.x - 2, lamp.y - 2, 4, 4);
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // 8. Parked Cars at Curbs (Polished)
  for (const pcar of parkedCars) {
    ctx.save();
    ctx.translate(pcar.x, pcar.y);
    ctx.rotate(pcar.angle);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.roundRect(-28, -14, 56, 26, 8);
    ctx.fill();
    ctx.fillStyle = pcar.color;
    ctx.beginPath();
    ctx.roundRect(-26, -12, 52, 24, 8);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-6, -8, 12, 16);
    // wheels
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-16, -15, 10, 4);
    ctx.fillRect(-16, 11, 10, 4);
    ctx.fillRect(6, -15, 10, 4);
    ctx.fillRect(6, 11, 10, 4);
    ctx.restore();
  }
}
