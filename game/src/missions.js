// Four-Mission Story Campaign for Courier Marina Vale and Objective Management

export const MISSIONS = [
  {
    id: 1,
    title: "The Marina Drop",
    giver: "Sienna Cruz",
    giverPos: { x: 500, y: 500 },
    introDialogue: [
      "Marina, I have a hot courier run for you.",
      "Pick up the crate near the west avenue and deliver it to the industrial docks before time runs out."
    ],
    outroDialogue: ["Clean run, Marina. Here's your cash cut."],
    type: 'delivery',
    pickup: { x: 1200, y: 800 },
    dropoff: { x: 3200, y: 3500 },
    timeLimit: 180, // seconds
    reward: 800
  },
  {
    id: 2,
    title: "Passenger Express",
    giver: "Sienna Cruz",
    giverPos: { x: 500, y: 500 },
    introDialogue: [
      "We've got a VIP needing a discreet ride from the grand hotel to the terminal.",
      "Drive them carefully and keep the police off our tail."
    ],
    outroDialogue: ["Thanks for the smooth ride, courier. Outstanding work."],
    type: 'passenger',
    pickup: { x: 2200, y: 1200 },
    dropoff: { x: 3500, y: 2200 },
    timeLimit: 200,
    reward: 1200
  },
  {
    id: 3,
    title: "Contraband Sweep",
    giver: "Sienna Cruz",
    giverPos: { x: 500, y: 500 },
    introDialogue: [
      "The syndicate dropped three stray packages across the city blocks.",
      "Collect all 3 packages while keeping wanted level active at 2 or higher!"
    ],
    outroDialogue: ["All packages secured. You handled the heat like a pro."],
    type: 'collect3',
    targets: [
      { x: 1000, y: 2000, collected: false },
      { x: 2500, y: 2500, collected: false },
      { x: 1500, y: 3200, collected: false }
    ],
    minWanted: 2,
    reward: 1500
  },
  {
    id: 4,
    title: "Final Getaway",
    giver: "Sienna Cruz",
    giverPos: { x: 500, y: 500 },
    introDialogue: [
      "This is your final run, Marina. Pick up the package at the old warehouse.",
      "As soon as you grab it, the cops will be all over you. Reach the marina hideout!"
    ],
    outroDialogue: ["You did it, Marina. Sunfall City story complete!"],
    type: 'getaway',
    pickup: { x: 3200, y: 800 },
    hideout: { x: 800, y: 3500 },
    reward: 3000
  }
];

export class MissionManager {
  constructor() {
    this.currentMissionIndex = 0;
    this.missionState = 'idle'; // 'idle', 'dialogue', 'active', 'outro', 'completed'
    this.dialogueIndex = 0;
    this.timeLeft = 0;
    this.subStep = 'pickup'; // 'pickup' or 'dropoff'
    this.storyComplete = false;
  }

  getCurrentMission() {
    if (this.currentMissionIndex >= MISSIONS.length) return null;
    return MISSIONS[this.currentMissionIndex];
  }

  startMissionDialogue() {
    const mission = this.getCurrentMission();
    if (!mission) return;
    this.missionState = 'dialogue';
    this.dialogueIndex = 0;
  }

  advanceDialogue(player) {
    const mission = this.getCurrentMission();
    if (!mission) return;

    if (this.missionState === 'dialogue') {
      this.dialogueIndex++;
      if (this.dialogueIndex >= mission.introDialogue.length) {
        this.missionState = 'active';
        this.timeLeft = mission.timeLimit || 300;
        this.subStep = 'pickup';
        if (mission.type === 'getaway') {
          player.wantedLevel = 3;
        }
      }
    } else if (this.missionState === 'outro') {
      this.dialogueIndex++;
      if (this.dialogueIndex >= mission.outroDialogue.length) {
        player.cash += mission.reward;
        this.currentMissionIndex++;
        this.missionState = 'idle';
        if (this.currentMissionIndex >= MISSIONS.length) {
          this.storyComplete = true;
        }
      }
    }
  }

  update(player, dt) {
    if (this.missionState !== 'active') return;

    const mission = this.getCurrentMission();
    if (!mission) return;

    if (mission.timeLimit) {
      this.timeLeft -= dt / 60;
      if (this.timeLeft <= 0) {
        // Mission failed / reset
        this.missionState = 'idle';
        return;
      }
    }

    if (mission.type === 'delivery') {
      if (this.subStep === 'pickup') {
        const dist = Math.hypot(player.x - mission.pickup.x, player.y - mission.pickup.y);
        if (dist < 60) {
          this.subStep = 'dropoff';
        }
      } else if (this.subStep === 'dropoff') {
        const dist = Math.hypot(player.x - mission.dropoff.x, player.y - mission.dropoff.y);
        if (dist < 60) {
          this.triggerOutro(mission);
        }
      }
    } else if (mission.type === 'passenger') {
      if (this.subStep === 'pickup') {
        const dist = Math.hypot(player.x - mission.pickup.x, player.y - mission.pickup.y);
        if (dist < 60 && player.inVehicle) {
          this.subStep = 'dropoff';
        }
      } else if (this.subStep === 'dropoff') {
        const dist = Math.hypot(player.x - mission.dropoff.x, player.y - mission.dropoff.y);
        if (dist < 60) {
          this.triggerOutro(mission);
        }
      }
    } else if (mission.type === 'collect3') {
      if (player.wantedLevel >= mission.minWanted) {
        for (const target of mission.targets) {
          if (!target.collected) {
            const dist = Math.hypot(player.x - target.x, player.y - target.y);
            if (dist < 50) {
              target.collected = true;
            }
          }
        }
        const allCollected = mission.targets.every(t => t.collected);
        if (allCollected) {
          this.triggerOutro(mission);
        }
      }
    } else if (mission.type === 'getaway') {
      if (this.subStep === 'pickup') {
        const dist = Math.hypot(player.x - mission.pickup.x, player.y - mission.pickup.y);
        if (dist < 60) {
          this.subStep = 'hideout';
          player.wantedLevel = 3;
        }
      } else if (this.subStep === 'hideout') {
        const dist = Math.hypot(player.x - mission.hideout.x, player.y - mission.hideout.y);
        if (dist < 60 && player.wantedLevel === 0) {
          this.triggerOutro(mission);
        }
      }
    }
  }

  triggerOutro(mission) {
    this.missionState = 'outro';
    this.dialogueIndex = 0;
  }

  drawMissionMarkers(ctx, player) {
    const mission = this.getCurrentMission();
    if (!mission || this.missionState !== 'active') {
      // Draw next mission giver marker at Cafe Palma (500, 500) if idle
      if (this.missionState === 'idle' && !this.storyComplete) {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(500, 500, 20 + Math.sin(Date.now() * 0.01) * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText("Cafe Palma (Mission)", 500, 500 - 30);
      }
      return;
    }

    let targetPos = null;
    if (mission.type === 'delivery') {
      targetPos = (this.subStep === 'pickup') ? mission.pickup : mission.dropoff;
    } else if (mission.type === 'passenger') {
      targetPos = (this.subStep === 'pickup') ? mission.pickup : mission.dropoff;
    } else if (mission.type === 'collect3') {
      for (const target of mission.targets) {
        if (!target.collected) {
          targetPos = target;
          break;
        }
      }
    } else if (mission.type === 'getaway') {
      targetPos = (this.subStep === 'pickup') ? mission.pickup : mission.hideout;
    }

    if (targetPos) {
      // Beacon column of light
      ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.beginPath();
      ctx.arc(targetPos.x, targetPos.y, 35, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(targetPos.x, targetPos.y, 15, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawDialogueBox(ctx) {
    if (this.missionState !== 'dialogue' && this.missionState !== 'outro') return;
    const mission = this.getCurrentMission();
    if (!mission) return;

    const vw = ctx.canvas.width;
    const vh = ctx.canvas.height;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.roundRect(vw / 2 - 350, vh - 180, 700, 120, 12);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${mission.giver} (${mission.title})`, vw / 2 - 320, vh - 145);

    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    const lines = (this.missionState === 'dialogue') ? mission.introDialogue : mission.outroDialogue;
    const currentLine = lines[this.dialogueIndex] || '';
    ctx.fillText(currentLine, vw / 2 - 320, vh - 110);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText("Press Enter or Click to Continue", vw / 2 + 320, vh - 75);
  }

  drawObjectiveText(ctx) {
    const vw = ctx.canvas.width;
    const mission = this.getCurrentMission();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.roundRect(vw / 2 - 200, 75, 400, 36, 8);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';

    if (this.storyComplete) {
      ctx.fillText("Sunfall City — Story Complete! Free Roam Unlocked", vw / 2, 98);
    } else if (mission && this.missionState === 'active') {
      const stepDesc = mission.type === 'collect3' ? 'Collect 3 Packages (Wanted 2+)' : (this.subStep === 'pickup' ? 'Go to Pickup' : 'Deliver to Destination');
      const timeStr = mission.timeLimit ? ` — ${Math.ceil(this.timeLeft)}s` : '';
      ctx.fillText(`${mission.title}: ${stepDesc}${timeStr}`, vw / 2, 98);
    } else {
      ctx.fillText("Go to Cafe Palma (Marina) for Next Mission", vw / 2, 98);
    }
  }
}
