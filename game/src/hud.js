// Sunfall City - HUD, Minimap & UI Screens (Polished Contrast & Start Screen)

import { CONFIG } from './config.js';
import { getBustMeter } from './police.js';
import { drawCity } from './city.js';

export function drawHUD(ctx, player, trafficCars, missionManager) {
  const vw = ctx.canvas.width;
  const vh = ctx.canvas.height;

  ctx.save();

  // Cash display (Top Right)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.beginPath();
  ctx.roundRect(vw - 220, 20, 200, 50, 8);
  ctx.fill();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`$${(player.cash ?? 1500).toLocaleString()}`, vw - 35, 53);

  // Health Bar & Status (Top Left)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.beginPath();
  ctx.roundRect(20, 20, 280, 80, 8);
  ctx.fill();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`${player.name} (${player.role})`, 35, 43);

  // Health Bar
  ctx.fillStyle = '#334155';
  ctx.fillRect(35, 53, 240, 12);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(35, 53, (player.health / player.maxHealth) * 240, 12);

  // Vehicle Status
  ctx.fillStyle = '#38bdf8';
  ctx.font = '12px monospace';
  const statusText = player.inVehicle ? "🚗 Driving Vehicle" : "🚶 On Foot (E to Enter Car, F to Punch)";
  ctx.fillText(statusText, 35, 84);

  // Wanted Stars (Top Center)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.beginPath();
  ctx.roundRect(vw / 2 - 110, 20, 220, 44, 8);
  ctx.fill();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = '20px monospace';
  ctx.textAlign = 'center';
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = (i < player.wantedLevel) ? '#fbbf24' : 'rgba(251, 191, 36, 0.25)';
    ctx.fillText('★', vw / 2 - 50 + i * 25, 48);
  }

  // Bust Meter if being busted
  const bust = getBustMeter();
  if (bust > 0) {
    ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
    ctx.beginPath();
    ctx.roundRect(vw / 2 - 120, 120, 240, 32, 6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`BUSTED! (${Math.round(bust)}%)`, vw / 2, 141);
  }

  // Mission Objective Text & Dialogue
  if (missionManager) {
    missionManager.drawObjectiveText(ctx);
    missionManager.drawDialogueBox(ctx);
  }

  // MINIMAP (Bottom Right)
  const mapSize = 170;
  const mapX = vw - mapSize - 20;
  const mapY = vh - mapSize - 20;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
  ctx.beginPath();
  ctx.roundRect(mapX, mapY, mapSize, mapSize, 12);
  ctx.fill();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(mapX, mapY, mapSize, mapSize, 12);
  ctx.clip();

  ctx.translate(mapX, mapY);
  const scaleX = mapSize / CONFIG.WORLD_WIDTH;
  const scaleY = mapSize / CONFIG.WORLD_HEIGHT;
  ctx.scale(scaleX, scaleY);

  // Water on west
  ctx.fillStyle = '#0891b2';
  ctx.fillRect(0, 0, 300, CONFIG.WORLD_HEIGHT);

  // Road grid and blocks
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(300, 0, CONFIG.WORLD_WIDTH - 300, CONFIG.WORLD_HEIGHT);

  const cols = Math.floor(CONFIG.WORLD_WIDTH / CONFIG.BLOCK_SIZE);
  const rows = Math.floor(CONFIG.WORLD_HEIGHT / CONFIG.BLOCK_SIZE);
  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      const bx = c * CONFIG.BLOCK_SIZE + CONFIG.ROAD_WIDTH;
      const by = r * CONFIG.BLOCK_SIZE + CONFIG.ROAD_WIDTH;
      const bw = CONFIG.BLOCK_SIZE - CONFIG.ROAD_WIDTH;
      const bh = CONFIG.BLOCK_SIZE - CONFIG.ROAD_WIDTH;
      ctx.fillStyle = '#334155';
      ctx.fillRect(bx, by, bw, bh);
    }
  }

  // Traffic cars as tiny light dots
  if (trafficCars) {
    ctx.fillStyle = '#38bdf8';
    for (const car of trafficCars) {
      ctx.fillRect(car.x - 25, car.y - 25, 50, 50);
    }
  }

  // Active mission target as yellow blip
  if (missionManager && missionManager.missionState === 'active') {
    const mission = missionManager.getCurrentMission();
    if (mission) {
      let targetPos = null;
      if (mission.type === 'delivery' || mission.type === 'passenger') {
        targetPos = missionManager.subStep === 'pickup' ? mission.pickup : mission.dropoff;
      } else if (mission.type === 'collect3') {
        for (const t of mission.targets) {
          if (!t.collected) { targetPos = t; break; }
        }
      } else if (mission.type === 'getaway') {
        targetPos = missionManager.subStep === 'pickup' ? mission.pickup : mission.hideout;
      }
      if (targetPos) {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(targetPos.x, targetPos.y, 90, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Player as white dot / arrow
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(player.x, player.y, 60, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  ctx.restore();
}

export function drawStartScreen(ctx, camera) {
  const vw = ctx.canvas.width;
  const vh = ctx.canvas.height;

  // Render city behind start screen
  if (drawCity && camera) {
    ctx.save();
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);
    drawCity(ctx, camera);
    ctx.restore();
  } else {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, vw, vh);
  }

  // Golden hour warm translucent overlay
  ctx.fillStyle = 'rgba(217, 119, 6, 0.28)';
  ctx.fillRect(0, 0, vw, vh);

  // Vignette overlay
  const grad = ctx.createRadialGradient(vw / 2, vh / 2, 200, vw / 2, vh / 2, vw);
  grad.addColorStop(0, 'rgba(15, 23, 42, 0.25)');
  grad.addColorStop(1, 'rgba(15, 23, 42, 0.88)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, vw, vh);

  // Title
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 64px monospace';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = 14;
  ctx.fillText("SUNFALL CITY", vw / 2, vh / 2 - 110);

  // Subtitle / One-line story
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'italic 18px monospace';
  ctx.fillText("“Marina Vale left the cartel behind for Sunfall City, but the debt collector always catches up.”", vw / 2, vh / 2 - 50);

  // Prompt
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px monospace';
  ctx.fillText("Click or Press Enter to Begin Epic", vw / 2, vh / 2 + 15);
  ctx.shadowBlur = 0;

  // Controls List
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '14px monospace';
  ctx.fillText("Controls: WASD / Arrows to Move & Drive | E to Enter/Exit Car | F to Punch | H for Horn | P to Pause", vw / 2, vh / 2 + 80);
}

export function drawPauseOverlay(ctx) {
  const vw = ctx.canvas.width;
  const vh = ctx.canvas.height;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.beginPath();
  ctx.roundRect(0, 0, vw, vh, 0);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px monospace';
  ctx.textAlign = 'center';
  ctx.fillText("GAME PAUSED", vw / 2, vh / 2 - 20);

  ctx.font = '18px monospace';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText("Press P or Esc to Resume", vw / 2, vh / 2 + 35);
}
