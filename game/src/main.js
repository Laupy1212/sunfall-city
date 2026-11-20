// Game Entry Point, Lifecycle Management, and Core Event Loop

import { CONFIG } from './config.js';
import { setSeed } from './random.js';
import { initCity, drawCity } from './city.js';
import { spawnTraffic, getTrafficCars, updateTraffic, drawVehicles } from './vehicles.js';
import { spawnPedestrians, updatePedestrians, drawPedestrians, getPedestrians } from './pedestrians.js';
import { Player } from './player.js';
import { Camera } from './camera.js';
import { drawHUD, drawStartScreen, drawPauseOverlay } from './hud.js';
import { initAudio, updateEngineSound, playHorn, playUIClick, playPunchSound } from './audio.js';
import { handleScreenshotShot } from './shots.js';
import { CombatSystem } from './combat.js';
import { updatePolice, drawPolice, clearPolice } from './police.js';
import { MissionManager } from './missions.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Input management
const input = {
  keys: {},
  keysJustPressed: {}
};

window.addEventListener('keydown', (e) => {
  if (!input.keys[e.code]) {
    input.keysJustPressed[e.code] = true;
  }
  input.keys[e.code] = true;

  if (e.code === 'KeyH' && player.inVehicle) {
    playHorn();
  }
  if (e.code === 'KeyF') {
    if (combatSystem.punch(player, getPedestrians(), [], (val) => {
      player.wantedLevel = Math.min(5, player.wantedLevel + val);
    })) {
      playPunchSound();
    }
  }
  if (e.code === 'Enter' || e.code === 'Space') {
    if (missionManager.missionState === 'dialogue' || missionManager.missionState === 'outro') {
      missionManager.advanceDialogue(player);
      playUIClick();
    } else if (missionManager.missionState === 'idle' && Math.hypot(player.x - 500, player.y - 500) < 80) {
      missionManager.startMissionDialogue();
      playUIClick();
    }
  }
});

window.addEventListener('keyup', (e) => {
  input.keys[e.code] = false;
});

// Game States: 'start', 'playing', 'paused'
let gameState = 'start';

// Initialize world entities
setSeed(Date.now() % 10000);
initCity();
spawnTraffic(18);
spawnPedestrians(28);

const player = new Player(2000, 2000);
const camera = new Camera();
const combatSystem = new CombatSystem();
const missionManager = new MissionManager();

// Load save if exists
try {
  const saved = localStorage.getItem('sunfall-city-save');
  if (saved) {
    const data = JSON.parse(saved);
    if (data.cash !== undefined) player.cash = data.cash;
    if (data.x !== undefined) player.x = data.x;
    if (data.y !== undefined) player.y = data.y;
    if (data.missionIndex !== undefined) missionManager.currentMissionIndex = data.missionIndex;
  }
} catch (e) {}

// Autosave every 30 seconds
setInterval(() => {
  try {
    localStorage.setItem('sunfall-city-save', JSON.stringify({
      cash: player.cash,
      x: player.x,
      y: player.y,
      missionIndex: missionManager.currentMissionIndex
    }));
  } catch (e) {}
}, 30000);

// Check screenshot staging query params
const queryParams = new URLSearchParams(window.location.search);
if (queryParams.has('shot')) {
  handleScreenshotShot(ctx, queryParams);
  throw new Error('Screenshot shot rendered successfully');
}

// Start interaction listener
window.addEventListener('pointerdown', () => {
  if (gameState === 'start') {
    initAudio();
    playUIClick();
    gameState = 'playing';
  } else if (missionManager.missionState === 'dialogue' || missionManager.missionState === 'outro') {
    missionManager.advanceDialogue(player);
    playUIClick();
  }
});

window.addEventListener('keydown', (e) => {
  if (gameState === 'start' && (e.code === 'Enter' || e.code === 'Space')) {
    initAudio();
    playUIClick();
    gameState = 'playing';
  }
  if (e.code === 'KeyP' || e.code === 'Escape') {
    if (gameState === 'playing') {
      gameState = 'paused';
      playUIClick();
    } else if (gameState === 'paused') {
      gameState = 'playing';
      playUIClick();
    }
  }
});

// Respawns
function handleBusted() {
  player.x = 1000; // Police station
  player.y = 1000;
  player.wantedLevel = 0;
  player.cash = Math.max(0, player.cash - 500);
  if (player.inVehicle && player.currentCar) {
    player.inVehicle = false;
    player.currentCar.isPlayerControlled = false;
    player.currentCar = null;
  }
  clearPolice();
}

function handleWasted() {
  player.x = 3000; // Hospital
  player.y = 1000;
  player.health = 100;
  player.wantedLevel = 0;
  player.cash = Math.max(0, player.cash - 200);
  if (player.inVehicle && player.currentCar) {
    player.inVehicle = false;
    player.currentCar.isPlayerControlled = false;
    player.currentCar = null;
  }
  clearPolice();
}

// Main Game Loop
let lastTime = performance.now();

function gameLoop(time) {
  const dt = (time - lastTime) / 16.66;
  lastTime = time;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameState === 'start') {
    camera.x = 300;
    camera.y = 1200 + Math.sin(time * 0.0005) * 100;
    drawStartScreen(ctx, camera);
  } else if (gameState === 'playing') {
    // Update entities
    const traffic = getTrafficCars();
    const peds = getPedestrians();

    player.update(input, traffic, dt);
    updateTraffic(input, dt);
    updatePedestrians(player, traffic, dt, (val) => {
      player.wantedLevel = Math.min(5, player.wantedLevel + val);
    });
    updatePolice(player, traffic, dt, handleBusted, handleWasted);
    combatSystem.update(dt);
    missionManager.update(player, dt);
    camera.update(player, canvas.width, canvas.height);

    // Audio update
    const isDriving = player.inVehicle && player.currentCar;
    const speed = isDriving ? player.currentCar.speed : 0;
    updateEngineSound(isDriving, speed);

    // Render world
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    drawCity(ctx, camera);
    drawPedestrians(ctx);
    drawVehicles(ctx);
    drawPolice(ctx);
    missionManager.drawMissionMarkers(ctx, player);
    player.draw(ctx);
    combatSystem.drawPunch(ctx, player);
    ctx.restore();

    // Render HUD
    drawHUD(ctx, player, traffic, missionManager);
  } else if (gameState === 'paused') {
    // Render world behind pause
    const traffic = getTrafficCars();
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    drawCity(ctx, camera);
    drawPedestrians(ctx);
    drawVehicles(ctx);
    drawPolice(ctx);
    player.draw(ctx);
    ctx.restore();
    drawHUD(ctx, player, traffic, missionManager);

    drawPauseOverlay(ctx);
  }

  // Clear just-pressed inputs for next frame
  for (const key in input.keysJustPressed) {
    input.keysJustPressed[key] = false;
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
